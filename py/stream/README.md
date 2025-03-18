# CrayonAI Stream

Python package for JSON Schema helpers and streaming utilities used in CrayonAI applications.

## Installation

```bash
pip install crayonai_stream
```

## Usage

### JSON Schema Helpers

Convert Pydantic models to template schemas:

```python
from crayonai_stream import pydantic_to_template_schema
from pydantic import BaseModel

class MyTemplate(BaseModel):
    name: str
    value: int

schema = pydantic_to_template_schema(MyTemplate, "my_template", "A sample template")
```

Create response formats with multiple templates:

```python
from crayonai_stream import templates_to_response_format, TemplateDefinition

response_format = templates_to_response_format(
    TemplateDefinition(
        schema=MyTemplate,
        name="my_template",
        description="A sample template"
    )
)
```

## Development

Install development dependencies:

```bash
pip install -e ".[dev]"
```

Run all checks (useful for CI):

```bash
make ci
```
