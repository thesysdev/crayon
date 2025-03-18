import json
from typing import Union

from openai.types.chat import (
    ChatCompletionAssistantMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionUserMessageParam,
)

from crayonai_stream.crayon_message import CrayonMessage


def _message_content(msg: CrayonMessage) -> str:
    if msg.role == "user":
        assert isinstance(msg.message, str), "User messages must be strings"
        return msg.message
    else:
        assert isinstance(msg.message, list), "Assistant messages must be lists"
        return json.dumps({"response": msg.message}, ensure_ascii=False)


def toOpenAIMessage(
    msg: CrayonMessage,
) -> Union[
    ChatCompletionUserMessageParam,
    ChatCompletionAssistantMessageParam,
    ChatCompletionSystemMessageParam,
]:
    if msg.role == "user":
        return ChatCompletionUserMessageParam(
            role="user",
            content=_message_content(msg),
        )
    elif msg.role == "assistant":
        return ChatCompletionAssistantMessageParam(
            role="assistant",
            content=_message_content(msg),
        )
    raise ValueError(f"Invalid role: {msg.role}")
