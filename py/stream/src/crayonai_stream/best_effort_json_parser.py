from typing import Any, Optional


def invariant(condition: bool, message: Optional[str] = None):
    if not condition:
        raise ValueError(message or "Invariant violation")


def parse(text: str) -> Any:
    """
    Parse a prefix of a valid JSON string into a dictionary.

    This function assumes the input is always a prefix of a valid JSON object.
    It will complete any unfinished JSON structure by adding missing closing braces
    and brackets.

    Args:
        text (str): A string that is a prefix of a valid JSON object

    Returns:
        dict: The parsed JSON object

    Example:
        >>> parse('{"key": ["val')
        {'key': ['val']}
    """
    if not text or text.isspace():
        return {}

    # Track both braces and brackets
    stack = []
    in_string = False
    escape_next = False

    for char in text:
        if char == "\\":
            escape_next = not escape_next
            continue

        if char == '"' and not escape_next:
            in_string = not in_string
        elif not in_string:
            if char in "{[":
                stack.append(char)
            elif char == "}":
                invariant(stack[-1] == "{")
                stack.pop()
            elif char == "]":
                invariant(stack[-1] == "[")
                stack.pop()

        escape_next = False

    # Complete the JSON by adding missing closing quotes and braces/brackets
    completed_json = text
    if in_string:
        completed_json += '"'

    for char in reversed(stack):
        if char == "{":
            completed_json += "}"
        elif char == "[":
            completed_json += "]"

    import json

    return json.loads(completed_json)
