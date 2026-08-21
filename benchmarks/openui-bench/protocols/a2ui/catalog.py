#!/usr/bin/env python
"""Benchmark component catalog for the A2UI protocol.

Declares the 70 benchmark components and compiles them into an A2UI v0.9
custom component catalog with the official A2UI agent SDK.

Usage:
  python catalog.py
Writes:
  catalog-a2ui.json     the A2UI v0.9 custom catalog
  catalog-surface.json  the plain-data component surface (cross-protocol diff)
"""

import json
import os

from a2ui.basic_catalog.provider import BundledCatalogProvider
from a2ui.schema.constants import (
    CATALOG_COMPONENTS_KEY,
    CATALOG_ID_KEY,
    VERSION_0_9,
)

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG_PATH = os.path.join(HERE, "catalog-a2ui.json")
SURFACE_PATH = os.path.join(HERE, "catalog-surface.json")

# CATALOG_ID, CATALOG_TITLE and CATALOG_DESCRIPTION are serialized into the
# generated system prompt: changing them changes the prompt the models see and
# invalidates every raw generated against it. The strings predate the public
# 70-component catalog (the id and the "73-component Thesys C1" wording carry
# over from an earlier internal build) and are kept verbatim for that reason;
# they are labels only, never scored on.
CATALOG_ID = "thesys.dev:c1-openui"
# Local SDK handle for this catalog. Never sent to a model, never scored on.
CATALOG_NAME = "openui"
CATALOG_TITLE = "Thesys C1 OpenUI catalog (A2UI v0.9 custom catalog)"
CATALOG_DESCRIPTION = (
    "The 73-component Thesys C1 catalog expressed as an A2UI v0.9"
    " custom component catalog."
)

# Refs stay relative, as the official custom-catalog structure requires.
COMMON_TYPES = "common_types.json"
COMPONENT_ID_REF = f"{COMMON_TYPES}#/$defs/ComponentId"
CHILD_LIST_REF = f"{COMMON_TYPES}#/$defs/ChildList"
COMPONENT_COMMON_REF = f"{COMMON_TYPES}#/$defs/ComponentCommon"
CATALOG_COMPONENT_COMMON_REF = "#/$defs/CatalogComponentCommon"

CHILDREN_PROP = "children"
COMPONENT_KEY = "component"


def _prop(name, t, enum=None, req=False):
    meta = {"t": t}
    if enum is not None:
        meta["enum"] = list(enum)
    if req:
        meta["req"] = True
    return [name, meta]


def string(name, enum=None, req=False):
    return _prop(name, "string", enum=enum, req=req)


def number(name, req=False):
    return _prop(name, "number", req=req)


def boolean(name, req=False):
    return _prop(name, "boolean", req=req)


def array(name, req=False):
    """A data array of literal JSON values (chart series data, table cells)."""
    return _prop(name, "array", req=req)


def ref(name, req=False):
    """A single component ID."""
    return _prop(name, "ref", req=req)


def refs(name, req=False):
    """A list of component IDs. Named `children`, it is the A2UI child list."""
    return _prop(name, "refs", req=req)


def component(name, desc, *props):
    return name, {"desc": desc, "props": list(props)}


COMPONENTS = [
    component(
        'Card',
        'Styled container. variant: "card" (default, elevated) | "sunk" (recessed) | "clear" (transparent). Always full width. Accepts all Stack flex params (default: di',
        refs('children', req=True),
        string('variant', enum=['card', 'sunk', 'clear']),
        string('direction', enum=['row', 'column']),
        string('gap', enum=['none', 'xs', 's', 'm', 'l', 'xl', '2xl']),
        string('align', enum=['start', 'center', 'end', 'stretch', 'baseline']),
        string('justify', enum=['start', 'center', 'end', 'between', 'around', 'evenly']),
        boolean('wrap'),
    ),
    component(
        'TextContent',
        'Text block. Supports markdown. Optional size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
        string('text', req=True),
        string('size', enum=['small', 'default', 'large', 'small-heavy', 'large-heavy']),
    ),
    component(
        'MarkDownRenderer',
        'Renders markdown text with optional container variant',
        string('textMarkdown', req=True),
        string('variant', enum=['clear', 'card', 'sunk']),
    ),
    component(
        'CardHeader',
        'Header with optional title and subtitle',
        string('title'),
        string('subtitle'),
    ),
    component(
        'Callout',
        'Callout banner. Optional visible is a reactive $boolean — auto-dismisses after 3s by setting $visible to false.',
        string('variant', enum=['info', 'warning', 'error', 'success', 'neutral'], req=True),
        string('title', req=True),
        string('description', req=True),
    ),
    component(
        'TextCallout',
        'Text callout with variant, title, and description',
        string('variant', enum=['neutral', 'info', 'warning', 'success', 'danger']),
        string('title'),
        string('description'),
    ),
    component(
        'CodeBlock',
        'Syntax-highlighted code block',
        string('language', req=True),
        string('codeString', req=True),
    ),
    component(
        'Image',
        'Image with alt text and optional URL',
        string('alt', req=True),
        string('src'),
    ),
    component(
        'ImageBlock',
        'Image block with loading state',
        string('src', req=True),
        string('alt'),
    ),
    component(
        'ImageGallery',
        'Gallery grid of images with modal preview',
        array('images', req=True),
    ),
    component(
        'Separator',
        'Visual divider between content sections',
        string('orientation', enum=['horizontal', 'vertical']),
        boolean('decorative'),
    ),
    component(
        'HorizontalBarChart',
        'Horizontal bars; prefer when category labels are long or for ranked lists',
        array('labels', req=True),
        refs('series', req=True),
        string('variant', enum=['grouped', 'stacked']),
        string('xLabel'),
        string('yLabel'),
    ),
    component(
        'Series',
        'One data series',
        string('category', req=True),
        array('values', req=True),
    ),
    component(
        'RadarChart',
        'Spider/web chart; use for comparing multiple variables across one or more entities',
        array('labels', req=True),
        refs('series', req=True),
    ),
    component(
        'PieChart',
        'Circular slices; use plucked arrays: PieChart(data.categories, data.values)',
        array('labels', req=True),
        array('values', req=True),
        string('variant', enum=['pie', 'donut']),
        string('appearance', enum=['circular', 'semiCircular']),
    ),
    component(
        'RadialChart',
        'Radial bars; use plucked arrays: RadialChart(data.categories, data.values)',
        array('labels', req=True),
        array('values', req=True),
    ),
    component(
        'SingleStackedBarChart',
        'Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)',
        array('labels', req=True),
        array('values', req=True),
    ),
    component(
        'ScatterChart',
        'X/Y scatter plot; use for correlations, distributions, and clustering',
        refs('datasets', req=True),
        string('xLabel'),
        string('yLabel'),
    ),
    component(
        'ScatterSeries',
        'Named dataset',
        string('name', req=True),
        refs('points', req=True),
    ),
    component(
        'Point',
        'Data point with numeric coordinates',
        number('x', req=True),
        number('y', req=True),
        number('z'),
    ),
    component(
        'AreaChart',
        'Filled area under lines; use for cumulative totals or volume trends over time',
        array('labels', req=True),
        refs('series', req=True),
        string('variant', enum=['linear', 'natural', 'step']),
        string('xLabel'),
        string('yLabel'),
    ),
    component(
        'BarChart',
        'Vertical bars; use for comparing values across categories with one or more series',
        array('labels', req=True),
        refs('series', req=True),
        string('variant', enum=['grouped', 'stacked']),
        string('xLabel'),
        string('yLabel'),
    ),
    component(
        'LineChart',
        'Lines over categories; use for trends and continuous data over time',
        array('labels', req=True),
        refs('series', req=True),
        string('variant', enum=['linear', 'natural', 'step']),
        string('xLabel'),
        string('yLabel'),
    ),
    component(
        'Table',
        'Data table — column-oriented. Each Col holds its own data array.',
        refs('columns', req=True),
    ),
    component(
        'Col',
        'Column definition — holds label + data array',
        string('label', req=True),
        array('data', req=True),
        string('type', enum=['string', 'number', 'action']),
    ),
    component(
        'TagBlock',
        'tags is an array of strings',
        array('tags', req=True),
    ),
    component(
        'Form',
        'Form container with fields and explicit action buttons',
        string('name', req=True),
        ref('buttons', req=True),
        refs('fields', req=True),
    ),
    component(
        'Buttons',
        'Group of Button components. direction: "row" (default) | "column".',
        refs('buttons', req=True),
        string('direction', enum=['row', 'column']),
    ),
    component(
        'Button',
        'Clickable button',
        string('label', req=True),
        array('action'),
        string('variant', enum=['primary', 'secondary', 'tertiary']),
        string('type', enum=['normal', 'destructive']),
        string('size', enum=['extra-small', 'small', 'medium', 'large']),
    ),
    component(
        'FormControl',
        'Field with label, input component, and optional hint text',
        string('label', req=True),
        ref('input', req=True),
        string('hint'),
    ),
    component(
        'Input',
        'Input',
        string('name', req=True),
        string('placeholder'),
        string('type', enum=['text', 'email', 'password', 'number', 'url']),
        array('rules'),
        string('value'),
    ),
    component(
        'TextArea',
        'TextArea',
        string('name', req=True),
        string('placeholder'),
        number('rows'),
        array('rules'),
        string('value'),
    ),
    component(
        'Select',
        'Select',
        string('name', req=True),
        refs('items', req=True),
        string('placeholder'),
        array('rules'),
        string('value'),
        string('size', enum=['small', 'medium', 'large']),
    ),
    component(
        'SelectItem',
        'Option for Select',
        string('value', req=True),
        string('label', req=True),
    ),
    component(
        'DatePicker',
        'DatePicker',
        string('name', req=True),
        string('mode', enum=['single', 'range']),
        array('rules'),
        array('value'),
    ),
    component(
        'Slider',
        'Numeric slider input; supports continuous and discrete (stepped) variants',
        string('name', req=True),
        string('variant', enum=['continuous', 'discrete'], req=True),
        number('min', req=True),
        number('max', req=True),
        number('step'),
        array('defaultValue'),
        string('label'),
        array('rules'),
        array('value'),
    ),
    component(
        'CheckBoxGroup',
        'CheckBoxGroup',
        string('name', req=True),
        refs('items', req=True),
        array('rules'),
        array('value'),
    ),
    component(
        'CheckBoxItem',
        'CheckBoxItem',
        string('label', req=True),
        string('description', req=True),
        string('name', req=True),
        boolean('defaultChecked'),
    ),
    component(
        'RadioGroup',
        'RadioGroup',
        string('name', req=True),
        refs('items', req=True),
        string('defaultValue'),
        array('rules'),
        string('value'),
    ),
    component(
        'RadioItem',
        'RadioItem',
        string('label', req=True),
        string('description', req=True),
        string('value', req=True),
    ),
    component(
        'Steps',
        'Step-by-step guide',
        refs('items', req=True),
    ),
    component(
        'StepsItem',
        'title and details text for one step',
        string('title', req=True),
        string('details', req=True),
    ),
    component(
        'Tabs',
        'Tabbed container',
        refs('items', req=True),
    ),
    component(
        'TabItem',
        'value is unique id, trigger is tab label, content is array of components',
        string('value', req=True),
        string('trigger', req=True),
        refs('content', req=True),
    ),
    component(
        'Carousel',
        'Horizontal scrollable carousel',
        array('children', req=True),
        string('variant', enum=['card', 'sunk']),
    ),
    component(
        'Slice',
        'One slice with label and numeric value',
        string('category', req=True),
        number('value', req=True),
    ),
    component(
        'Label',
        'Text label',
        string('text', req=True),
    ),
    component(
        'SwitchGroup',
        'Group of switch toggles',
        string('name', req=True),
        refs('items', req=True),
        string('variant', enum=['clear', 'card', 'sunk']),
        array('value'),
    ),
    component(
        'SwitchItem',
        'Individual switch toggle',
        string('label'),
        string('description'),
        string('name', req=True),
        boolean('defaultChecked'),
    ),
    component(
        'Accordion',
        'Collapsible sections',
        refs('items', req=True),
    ),
    component(
        'AccordionItem',
        'value is unique id, trigger is section title',
        string('value', req=True),
        string('trigger', req=True),
        refs('content', req=True),
    ),
    component(
        'Tag',
        'Styled tag/badge with optional icon and variant',
        string('text', req=True),
        string('icon'),
        string('size', enum=['sm', 'md', 'lg']),
        string('variant', enum=['neutral', 'info', 'success', 'warning', 'danger']),
    ),
    component(
        'FollowUpBlock',
        'List of clickable follow-up suggestions placed at the end of a response',
        refs('items', req=True),
    ),
    component(
        'FollowUpItem',
        'Clickable follow-up suggestion; when clicked, sends text as user message',
        string('text', req=True),
    ),
    component(
        'ListBlock',
        'A list of items with number or image indicators',
        refs('items', req=True),
        string('variant', enum=['number', 'image']),
    ),
    component(
        'ListItem',
        'List row with a title, optional subtitle and image',
        string('title', req=True),
        string('subtitle'),
        array('image'),
        string('actionLabel'),
    ),
    component(
        'SectionBlock',
        'Collapsible accordion sections; use SectionItem for each section',
        refs('sections', req=True),
        boolean('isFoldable'),
    ),
    component(
        'SectionItem',
        'Section with a label and collapsible content, used inside SectionBlock',
        string('value', req=True),
        string('trigger', req=True),
        refs('content', req=True),
    ),
    component(
        'Alert',
        'Alert banner with icon, title, and description',
        string('title', req=True),
        string('description', req=True),
        string('variant', enum=['default', 'destructive', 'info', 'success', 'warning']),
    ),
    component(
        'Avatar',
        'Avatar image with a text fallback',
        string('src'),
        string('alt'),
        string('fallback', req=True),
    ),
    component(
        'Badge',
        'Small status or category badge',
        string('text', req=True),
        string('variant', enum=['default', 'secondary', 'destructive', 'outline', 'ghost', 'link']),
    ),
    component(
        'Progress',
        'Progress bar with an optional label',
        number('value', req=True),
        string('label'),
    ),
    component(
        'PaginationBlock',
        'Page navigation for long result sets',
        number('currentPage', req=True),
        number('totalPages', req=True),
    ),
    component(
        'CalendarBlock',
        'Inline calendar',
        string('mode', enum=['single', 'multiple', 'range']),
        string('defaultMonth'),
        number('numberOfMonths'),
        string('captionLayout', enum=['label', 'dropdown']),
    ),
    component(
        'DialogBlock',
        'Button that opens a modal dialog with content',
        string('triggerLabel', req=True),
        string('title', req=True),
        string('description'),
        refs('content'),
        string('triggerVariant', enum=['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']),
    ),
    component(
        'DrawerBlock',
        'Button that opens a slide-out drawer with content',
        string('triggerLabel', req=True),
        string('title', req=True),
        string('description'),
        refs('content'),
    ),
    component(
        'AlertDialogBlock',
        'Button that opens a confirm/cancel dialog',
        string('triggerLabel', req=True),
        string('title', req=True),
        string('description', req=True),
        string('confirmLabel'),
        string('cancelLabel'),
        string('triggerVariant', enum=['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']),
    ),
    component(
        'Heading',
        'Standalone heading',
        string('text', req=True),
        string('level', enum=['h1', 'h2', 'h3', 'h4']),
    ),
    component(
        'Blockquote',
        'Quoted text with an optional citation',
        string('text', req=True),
        string('cite'),
    ),
    component(
        'InlineCode',
        'Inline code span',
        string('code', req=True),
    ),
]


SURFACE = dict(COMPONENTS)


def prop_schema(prop_name, meta):
    """Maps one declared prop to its JSON-schema form."""
    t = meta["t"]
    if t == "ref":
        return {
            "$ref": COMPONENT_ID_REF,
            "description": "The ID of the referenced child component.",
        }
    if t == "refs":
        if prop_name == CHILDREN_PROP:
            return {
                "$ref": CHILD_LIST_REF,
                "description": (
                    "Defines the children. Children cannot be defined inline,"
                    " they must be referred to by ID."
                ),
            }
        return {
            "type": "array",
            "items": {"$ref": COMPONENT_ID_REF},
            "description": "A static list of child component IDs.",
        }
    if t == "string":
        schema = {"type": "string"}
        if "enum" in meta:
            schema["enum"] = list(meta["enum"])
        return schema
    if t == "number":
        return {"type": "number"}
    if t == "boolean":
        return {"type": "boolean"}
    if t == "array":
        return {"type": "array", "description": "A data array (literal JSON values)."}
    raise ValueError(f"Unknown prop type: {t!r} for prop {prop_name!r}")


def component_schema(name, spec):
    """Wraps one declared component in the official per-component structure."""
    properties = {COMPONENT_KEY: {"const": name}}
    required = [COMPONENT_KEY]
    for prop_name, meta in spec["props"]:
        properties[prop_name] = prop_schema(prop_name, meta)
        if meta.get("req"):
            required.append(prop_name)
    return {
        "type": "object",
        "allOf": [
            {"$ref": COMPONENT_COMMON_REF},
            {"$ref": CATALOG_COMPONENT_COMMON_REF},
            {
                "type": "object",
                "description": spec["desc"],
                "properties": properties,
                "required": required,
            },
        ],
        "unevaluatedProperties": False,
    }


def build_catalog():
    # $defs.CatalogComponentCommon and $defs.theme come from the SDK's own
    # bundled v0.9 basic catalog rather than being hand-written.
    basic = BundledCatalogProvider(VERSION_0_9).load()

    components = {name: component_schema(name, spec) for name, spec in COMPONENTS}
    any_component = {
        "oneOf": [{"$ref": f"#/components/{name}"} for name in components],
        "discriminator": {"propertyName": COMPONENT_KEY},
    }

    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": CATALOG_TITLE,
        "description": CATALOG_DESCRIPTION,
        CATALOG_ID_KEY: CATALOG_ID,
        CATALOG_COMPONENTS_KEY: components,
        "$defs": {
            "CatalogComponentCommon": basic["$defs"]["CatalogComponentCommon"],
            "theme": basic["$defs"]["theme"],
            "anyComponent": any_component,
        },
    }


def write_catalog():
    catalog = build_catalog()
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
    return CATALOG_PATH


def write_surface():
    with open(SURFACE_PATH, "w", encoding="utf-8") as f:
        json.dump(SURFACE, f, indent=1, ensure_ascii=False)
    return SURFACE_PATH


def main():
    write_catalog()
    print(f"wrote {CATALOG_PATH} ({len(COMPONENTS)} components)")
    write_surface()
    print(f"wrote {SURFACE_PATH}")


if __name__ == "__main__":
    main()
