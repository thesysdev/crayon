"""
Helpers for converting Pydantic models to JSON schemas and creating template response formats.
"""

from typing import List, Literal, Optional, TypedDict

from pydantic import BaseModel

# JSON schema for a simple text based response.
# This should be used as the default/fallback response type when using structured outputs.
TextResponseSchema = {
    "type": "object",
    "description": "Use this as a fallback when no other response template is applicable",
    "properties": {
        "type": {"const": "text"},
        "text": {
            "type": "string",
            "description": "plaintext message to be displayed to the user",
        },
    },
    "required": ["type", "text"],
    "additionalProperties": False,
}


def pydantic_to_template_schema(
    schema: type[BaseModel], name: str, description: Optional[str] = None
) -> dict:
    """
    Convert a Pydantic model to a template schema.
    Equivalent to zodToTemplateSchema in TypeScript.

    Args:
        schema: A Pydantic model class
        name: The template name
        description: Optional description of the template

    Returns:
        A JSON schema dictionary for the template
    """
    return {
        "type": "object",
        "description": description,
        "properties": {
            "type": {
                "const": "template",
            },
            "name": {"const": name},
            "templateProps": schema.model_json_schema(),
        },
        "required": ["name", "templateProps", "type"],
        "additionalProperties": False,
    }


class TemplateDefinition(TypedDict):
    """Type definition for template parameters."""

    schema: type[BaseModel]
    name: str
    description: Optional[str]


def templates_to_response_format(*templates: TemplateDefinition) -> dict:
    """
    Convert multiple templates to a response format schema.
    Equivalent to templatesToResponseFormat in TypeScript.

    Args:
        *templates: Variable number of TemplateDefinition objects

    Returns:
        A dictionary containing the JSON schema configuration
    """
    templates_json_schema = {
        "type": "object",
        "properties": {
            "response": {
                "type": "array",
                "items": {
                    "oneOf": [
                        TextResponseSchema,
                        *[
                            pydantic_to_template_schema(
                                template["schema"],
                                template["name"],
                                template.get("description"),
                            )
                            for template in templates
                        ],
                    ],
                },
            },
        },
        "required": ["response"],
        "additionalProperties": False,
    }

    return {
        "type": "json_schema",
        "json_schema": {
            "name": "json_schema",
            "schema": templates_json_schema,
        },
    }
