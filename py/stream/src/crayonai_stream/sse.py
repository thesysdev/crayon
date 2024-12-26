import json


def encode_sse(event: str, data: str) -> str:
    """
    Encode data as a Server-Sent Events (SSE) message.
    Similar to the eventsource-encoder package in TypeScript.

    Args:
        event: The event type
        data: The data to send

    Returns:
        A properly formatted SSE message string
    """
    message = []
    if event:
        message.append(f"event: {event}")

    # Split data by newlines and prefix each line with "data: "
    for line in data.split("\n"):
        message.append(f"data: {line}")

    # End with double newline as per SSE spec
    message.append("")
    message.append("")

    return "\n".join(message)


def encode_json_sse(event: str, data: object) -> str:
    """
    Encode JSON data as a Server-Sent Events (SSE) message.

    Args:
        event: The event type
        data: The data to encode as JSON

    Returns:
        A properly formatted SSE message string with JSON data
    """
    return encode_sse(event, json.dumps(data))
