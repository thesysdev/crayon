from typing import List, Literal, Union

from pydantic import BaseModel, ConfigDict


class CrayonMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    message: Union[str, List[dict]]

    model_config = ConfigDict(extra="allow")  # Allow extra fields
