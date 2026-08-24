"""Serve an Agno Agent through AgentOS while OpenUI owns the browser UI."""

from os import getenv
from pathlib import Path

from agno.agent import Agent
from agno.db.sqlite import SqliteDb
from agno.models.openai import OpenAIResponses
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI
from agno.tools import tool

EXAMPLE_ROOT = Path(__file__).resolve().parent
OPENUI_PROMPT_PATH = EXAMPLE_ROOT / "src" / "generated" / "system-prompt.txt"

if not OPENUI_PROMPT_PATH.is_file():
    raise RuntimeError(
        "OpenUI system prompt is missing. Run `pnpm generate:prompt` in "
        "examples/agent-frameworks/agno."
    )


@tool
def get_quarterly_revenue() -> dict:
    """Return quarterly revenue in thousands of US dollars."""
    return {
        "currency": "USD",
        "unit": "thousands",
        "quarters": [
            {"quarter": "Q1", "revenue": 120},
            {"quarter": "Q2", "revenue": 180},
            {"quarter": "Q3", "revenue": 150},
            {"quarter": "Q4", "revenue": 240},
        ],
    }


agent = Agent(
    id="openui-assistant",
    name="Agno × OpenUI Assistant",
    model=OpenAIResponses(id=getenv("OPENAI_MODEL", "gpt-5.5")),
    db=SqliteDb(id="agno-openui", db_file="tmp/agno_openui.db"),
    tools=[get_quarterly_revenue],
    instructions=[
        "Use get_quarterly_revenue for stored revenue questions.",
        "Return only valid OpenUI Lang without Markdown fences.",
        OPENUI_PROMPT_PATH.read_text(encoding="utf-8"),
    ],
    add_history_to_context=True,
    num_history_runs=10,
)

agent_os = AgentOS(
    id="agno-openui-os",
    description="AgentOS owns the agent runtime; OpenUI owns the user interface.",
    agents=[agent],
    interfaces=[AGUI(agent=agent)],
)
app = agent_os.get_app()

if __name__ == "__main__":
    agent_os.serve(app=app)
