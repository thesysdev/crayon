from typing import Iterator, Union

from crayonai_stream import Error, ResponseTemplate, TextChunk
from crayonai_stream.best_effort_json_parser import parse


def crayon_stream(
    stream: Iterator[str],
) -> Iterator[str]:
    streamed_text = ""
    previously_streamed_text = ""
    has_pending_template = False

    def finish() -> Union[str, None]:
        nonlocal streamed_text, has_pending_template
        parsed = parse(streamed_text)
        response_list = parsed.get("response", [])
        last_content = response_list[-1] if response_list else None

        if has_pending_template and last_content and last_content.get("type") != "text":
            name = last_content.get("name")
            if not name:
                raise ValueError("name is required in ResponseTemplate")
            template_props = last_content.get("templateProps", {})
            return ResponseTemplate(
                name=name, templateProps=template_props
            ).toSSEString()
        return None

    for text in stream:
        streamed_text += text
        try:
            parsed = parse(streamed_text)
        except Exception:
            # In case best-effort JSON parser fails, we just ignore the error
            # and continue to parse the next chunk.
            continue
        response_list = parsed.get("response", [])
        new_content = response_list[-1] if response_list else None

        if not new_content:
            continue

        if new_content.get("type") == "text":
            remaining_responses = response_list[:-1]
            prev_content = remaining_responses[-1] if remaining_responses else None
            new_text = new_content.get("text", "")

            if (
                has_pending_template
                and prev_content
                and prev_content.get("type") != "text"
            ):
                name = prev_content.get("name")
                if not name:
                    raise ValueError("name is required in ResponseTemplate")
                template_props = prev_content.get("templateProps", {})
                yield ResponseTemplate(
                    name=name, templateProps=template_props
                ).toSSEString()
                has_pending_template = False

            text_content = new_text[len(previously_streamed_text) :]

            if text_content:
                yield TextChunk(chunk=text_content).toSSEString()

            previously_streamed_text = new_text
        else:
            has_pending_template = True
            previously_streamed_text = ""

    # After the stream is finished, we need to finalize the template if it's pending
    template = finish()
    if template:
        yield template
