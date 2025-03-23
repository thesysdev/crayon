from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel

from crayonai_stream.sse import encode_json_sse, encode_sse

JSONValue = Union[str, int, float, bool, Dict[str, Any], List[Any], None]


class SSEType(str, Enum):
    TextDelta = "text"
    ResponseTemplate = "tpl"
    ResponseTemplatePropsChunk = "tpl_props_chunk"
    ContextAppend = "context_append"
    MessageUpdate = "message_update"
    Error = "error"


class Chunk(BaseModel, ABC):
    @abstractmethod
    def toSSEString(self) -> str:
        pass


class TextChunk(Chunk):
    chunk: str

    def toSSEString(self) -> str:
        return encode_sse(SSEType.TextDelta.value, self.chunk)


class ResponseTemplate(Chunk):
    name: str
    templateProps: Optional[dict] = None

    def toSSEString(self) -> str:
        data = {"name": self.name, "templateProps": self.templateProps}
        return encode_json_sse(SSEType.ResponseTemplate.value, data)


class ResponseTemplatePropsChunk(Chunk):
    chunk: str

    def toSSEString(self) -> str:
        return encode_sse(SSEType.ResponseTemplatePropsChunk.value, self.chunk)


class ContextUpdate(Chunk):
    contextItem: JSONValue

    def toSSEString(self) -> str:
        return encode_json_sse(SSEType.ContextAppend.value, self.contextItem)


class MessageUpdate(Chunk):
    id: str

    def toSSEString(self) -> str:
        return encode_json_sse(SSEType.MessageUpdate.value, {"id": self.id})


class Error(Chunk):
    error: str

    def toSSEString(self) -> str:
        return encode_sse(SSEType.Error.value, self.error)
