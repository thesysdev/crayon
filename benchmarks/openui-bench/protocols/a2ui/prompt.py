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
_EXAMPLE_DASHBOARD = """<a2ui-json>
{
  "version": "v0.9",
  "createSurface": {
    "surfaceId": "main",
    "catalogId": "thesys.dev:c1-openui"
  }
}
</a2ui-json>

<a2ui-json>
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "component": "Card",
        "children": [
          "header",
          "status",
          "alert",
          "kpis",
          "trend",
          "actions"
        ]
      },
      {
        "id": "header",
        "component": "CardHeader",
        "title": "Revenue Overview",
        "subtitle": "Last 30 days"
      },
      {
        "id": "status",
        "component": "Badge",
        "text": "On track",
        "variant": "secondary"
      },
      {
        "id": "alert",
        "component": "Alert",
        "title": "Refund spike",
        "description": "Refunds rose 14% week over week",
        "variant": "warning"
      },
      {
        "id": "kpis",
        "component": "Table",
        "columns": [
          "kpiName",
          "kpiValue"
        ]
      },
      {
        "id": "kpiName",
        "component": "Col",
        "label": "Metric",
        "data": [
          "Revenue",
          "Orders",
          "Refunds"
        ]
      },
      {
        "id": "kpiValue",
        "component": "Col",
        "label": "Value",
        "data": [
          "$128,400",
          "1,982",
          "$3,120"
        ]
      },
      {
        "id": "trend",
        "component": "LineChart",
        "labels": [
          "W1",
          "W2",
          "W3",
          "W4"
        ],
        "series": [
          "revSeries"
        ],
        "variant": "natural",
        "xLabel": "Week",
        "yLabel": "USD"
      },
      {
        "id": "revSeries",
        "component": "Series",
        "category": "Revenue",
        "values": [
          24100,
          30800,
          34600,
          38900
        ]
      },
      {
        "id": "actions",
        "component": "Buttons",
        "buttons": [
          "exportBtn",
          "shareBtn"
        ]
      },
      {
        "id": "exportBtn",
        "component": "Button",
        "label": "Export CSV"
      },
      {
        "id": "shareBtn",
        "component": "Button",
        "label": "Share report",
        "variant": "secondary"
      }
    ]
  }
}
</a2ui-json>"""

_EXAMPLE_FORM = """<a2ui-json>
{
  "version": "v0.9",
  "createSurface": {
    "surfaceId": "main",
    "catalogId": "thesys.dev:c1-openui"
  }
}
</a2ui-json>

<a2ui-json>
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "component": "Card",
        "children": [
          "intro",
          "form"
        ]
      },
      {
        "id": "intro",
        "component": "CardHeader",
        "title": "Book a demo",
        "subtitle": "Tell us about your team"
      },
      {
        "id": "form",
        "component": "Form",
        "name": "demo-request",
        "buttons": "formButtons",
        "fields": [
          "nameField",
          "emailField",
          "sizeField",
          "planField"
        ]
      },
      {
        "id": "nameField",
        "component": "FormControl",
        "label": "Full name",
        "input": "nameInput"
      },
      {
        "id": "nameInput",
        "component": "Input",
        "name": "name",
        "placeholder": "Jane Smith"
      },
      {
        "id": "emailField",
        "component": "FormControl",
        "label": "Work email",
        "input": "emailInput",
        "hint": "We only use this to reply"
      },
      {
        "id": "emailInput",
        "component": "Input",
        "name": "email",
        "placeholder": "jane@company.com",
        "type": "email"
      },
      {
        "id": "sizeField",
        "component": "FormControl",
        "label": "Team size",
        "input": "sizeSelect"
      },
      {
        "id": "sizeSelect",
        "component": "Select",
        "name": "team_size",
        "items": [
          "sizeS",
          "sizeM",
          "sizeL"
        ],
        "placeholder": "Choose a range"
      },
      {
        "id": "sizeS",
        "component": "SelectItem",
        "value": "1-10",
        "label": "1-10 people"
      },
      {
        "id": "sizeM",
        "component": "SelectItem",
        "value": "11-50",
        "label": "11-50 people"
      },
      {
        "id": "sizeL",
        "component": "SelectItem",
        "value": "51+",
        "label": "51+ people"
      },
      {
        "id": "planField",
        "component": "FormControl",
        "label": "Interested plan",
        "input": "planRadio"
      },
      {
        "id": "planRadio",
        "component": "RadioGroup",
        "name": "plan",
        "items": [
          "planCloud",
          "planSelf"
        ]
      },
      {
        "id": "planCloud",
        "component": "RadioItem",
        "label": "Cloud",
        "description": "Managed by us",
        "value": "cloud"
      },
      {
        "id": "planSelf",
        "component": "RadioItem",
        "label": "Self-hosted",
        "description": "Runs in your infra",
        "value": "self"
      },
      {
        "id": "formButtons",
        "component": "Buttons",
        "buttons": [
          "submitBtn",
          "cancelBtn"
        ]
      },
      {
        "id": "submitBtn",
        "component": "Button",
        "label": "Request demo",
        "variant": "primary"
      },
      {
        "id": "cancelBtn",
        "component": "Button",
        "label": "Cancel",
        "variant": "tertiary"
      }
    ]
  }
}
</a2ui-json>"""

ROLE_DESCRIPTION = (
    "You are a UI generating assistant."
    + "\n\nTwo complete worked examples of correct output follow."
    + "\n\nExample (dashboard):\n" + _EXAMPLE_DASHBOARD
    + "\n\nExample (form):\n" + _EXAMPLE_FORM
)


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
