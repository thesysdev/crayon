#!/usr/bin/env python
"""Generates the A2UI benchmark system prompt with the official SDK generator.

Usage:
  python prompt.py
Writes:
  catalog-a2ui.json  (rebuilt from catalog.py, the prompt's only input)
  system-prompt.txt  official DirectJsonFormat prompt, include_schema=True
"""

import os

from a2ui.inference_formats.direct_json import DirectJsonFormat
from a2ui.schema.catalog import CatalogConfig
from a2ui.schema.constants import VERSION_0_9

from catalog import CATALOG_NAME, CATALOG_PATH, write_catalog

HERE = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(HERE, "system-prompt.txt")

# ROLE_DESCRIPTION is a prompt input: changing it changes the prompt the models
# see and invalidates every raw generated against it.
ROLE_DESCRIPTION = "You are a UI generating assistant."


def build_format(catalog_path=CATALOG_PATH):
    return DirectJsonFormat(
        VERSION_0_9,
        catalogs=[
            CatalogConfig.from_path(name=CATALOG_NAME, catalog_path=catalog_path)
        ],
    )


def build_prompt(catalog_path=CATALOG_PATH):
    fmt = build_format(catalog_path)
    return fmt.prompt_generator.generate(
        role_description=ROLE_DESCRIPTION,
        include_schema=True,
    )


def main():
    write_catalog()
    prompt = build_prompt()
    with open(PROMPT_PATH, "w", encoding="utf-8") as f:
        f.write(prompt)
    print(f"wrote {PROMPT_PATH} ({len(prompt)} chars)")


if __name__ == "__main__":
    main()
