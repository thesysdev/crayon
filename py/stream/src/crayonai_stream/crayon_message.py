from typing import List, Literal, Union

from pydantic import BaseModel


class CrayonMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    message: Union[str, List[dict]]

    class Config:
        extra = "allow"  # Allow extra fields
