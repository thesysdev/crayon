import json
from typing import Iterator

from openai import Stream
from openai._streaming import Stream
from openai.types.chat import ChatCompletionChunk

from crayonai_stream import crayon_stream


def _openai_crayon_stream(
    stream: Stream[ChatCompletionChunk],
) -> Iterator[str]:
    for chunk in stream:
        text = chunk.choices[0].delta.content
        if text is not None:
            yield text


def openai_crayon_stream(
    stream: Stream[ChatCompletionChunk],
) -> Iterator[str]:
    return crayon_stream(_openai_crayon_stream(stream))
