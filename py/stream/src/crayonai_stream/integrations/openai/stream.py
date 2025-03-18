import json
from typing import Iterator

from openai import Stream
from openai._streaming import Stream
from openai.types.chat import ChatCompletionChunk

from crayonai_stream import Error, ResponseTemplate, TextChunk


# TODO: Implement actual streaming.
def crayon_stream(
    stream: Stream[ChatCompletionChunk],
) -> Iterator[str]:
    streamed_text = ""
    try:
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text is not None:
                streamed_text += text
        parsed = json.loads(streamed_text)
        for item in parsed["response"]:
            if item["type"] == "text":
                yield TextChunk(chunk=item["text"]).toSSEString()
            elif item["type"] == "template":
                yield ResponseTemplate(
                    name=item["name"], templateProps=item["templateProps"]
                ).toSSEString()
    except Exception as e:
        yield Error(error=str(e)).toSSEString()
