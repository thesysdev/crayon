#!/usr/bin/env python
"""Scores one raw model output against the A2UI catalog with official SDK code.

Official entry points: DirectJsonParser.unwrap (tag extraction),
payload_fixer.parse_and_fix (JSON healing), A2uiCatalog.validator.validate
(full payload validation), CatalogSchemaValidator.validate_components
(per-component schemas), extract_component_ref_fields +
get_component_references (reference extraction). Reachability is set/graph
arithmetic over the officially extracted references.

Usage:
  python score.py <raw.txt>   prints one JSON object to stdout
"""

import json
import os
import sys

from a2ui.core import A2uiParseError
from a2ui.core.schema.constants import ROOT_ID
from a2ui.core.validating.catalog_schema_validator import CatalogSchemaValidator
from a2ui.core.validating.integrity_checker import get_component_references
from a2ui.inference_formats.direct_json import DirectJsonFormat
from a2ui.parser.payload_fixer import parse_and_fix
from a2ui.schema.catalog import CatalogConfig
from a2ui.schema.constants import VERSION_0_9
from a2ui.validation.validator import extract_component_ref_fields

from catalog import CATALOG_NAME, CATALOG_PATH

CATALOG = CATALOG_PATH

MESSAGE_COMPONENT_KEYS = ("createSurface", "updateComponents")


def collect_components(messages):
    """Collects component dicts from the message keys the SDK itself walks."""
    components = []
    for m in messages:
        if not isinstance(m, dict):
            continue
        for key in MESSAGE_COMPONENT_KEYS:
            sub = m.get(key)
            if isinstance(sub, dict) and isinstance(sub.get("components"), list):
                components.extend(c for c in sub["components"] if isinstance(c, dict))
    return components


def score(raw, catalog_path=CATALOG):
    result = {
        "parse_ok": False,
        "messages_parsed": 0,
        "components_total": 0,
        "component_ids": [],
        "root_present": False,
        "invalid_components": [],
        "unknown_component_types": [],
        "dangling_refs": [],
        "orphaned_ids": [],
        "errors": [],
    }

    fmt = DirectJsonFormat(
        VERSION_0_9,
        catalogs=[
            CatalogConfig.from_path(name=CATALOG_NAME, catalog_path=catalog_path)
        ],
    )
    parser = fmt.parser
    catalog = fmt.get_selected_catalog()

    try:
        parts = parser.unwrap(raw)
    except A2uiParseError as e:
        result["errors"].append(f"unwrap: {e}")
        return result

    messages = []
    parse_ok = True
    for part in parts:
        if part.a2ui_raw is None:
            continue
        try:
            messages.extend(parse_and_fix(part.a2ui_raw))
        except A2uiParseError as e:
            parse_ok = False
            result["errors"].append(f"parse: {e}")
    result["parse_ok"] = parse_ok and bool(messages)
    result["messages_parsed"] = len(messages)
    # Verbatim officially parsed messages, consumed by the renderer gate.
    result["messages"] = messages

    components = collect_components(messages)
    component_ids = [c["id"] for c in components if isinstance(c.get("id"), str)]
    result["components_total"] = len(components)
    result["component_ids"] = component_ids
    result["root_present"] = ROOT_ID in component_ids

    if messages:
        try:
            catalog.validator.validate(messages)
        except Exception as e:
            result["errors"].append(f"validate: {e}")

    schema_validator = CatalogSchemaValidator(
        catalog.core_catalog, catalog.common_types_schema
    )
    known_types = set(catalog.core_catalog.components.keys())
    unknown_types = []
    for comp in components:
        ctype = comp.get("component")
        cid = comp.get("id")
        if not isinstance(ctype, str):
            result["invalid_components"].append(
                {"id": cid, "error": "missing or non-string 'component' field"}
            )
            continue
        if ctype not in known_types:
            if ctype not in unknown_types:
                unknown_types.append(ctype)
            continue
        try:
            schema_validator.validate_components([comp])
        except Exception as e:
            result["invalid_components"].append({"id": cid, "error": str(e)})
    result["unknown_component_types"] = unknown_types

    ref_fields = extract_component_ref_fields(catalog)
    id_set = set(component_ids)
    adjacency = {}
    referenced = set()
    for comp in components:
        cid = comp.get("id")
        refs = [rid for rid, _field in get_component_references(comp, ref_fields)]
        referenced.update(refs)
        if isinstance(cid, str):
            adjacency.setdefault(cid, []).extend(refs)
    result["dangling_refs"] = sorted(referenced - id_set)

    reachable = set()
    stack = [ROOT_ID] if ROOT_ID in id_set else []
    while stack:
        node = stack.pop()
        if node in reachable:
            continue
        reachable.add(node)
        stack.extend(r for r in adjacency.get(node, []) if r in id_set)
    result["orphaned_ids"] = sorted(id_set - reachable)

    return result


def main():
    if len(sys.argv) != 2:
        print(f"usage: {sys.argv[0]} <raw.txt>", file=sys.stderr)
        sys.exit(2)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        raw = f.read()
    print(json.dumps(score(raw), indent=2))


if __name__ == "__main__":
    main()
