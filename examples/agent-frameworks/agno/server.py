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


@tool(external_execution=True, external_execution_silent=True)
def prompt_openui(ui: str, fallback_markdown: str) -> str:
    """Render an OpenUI form or choice and wait for the user to submit it."""
    return fallback_markdown


def agent_instructions(run_context=None) -> list[str]:
    """Stream rich OpenUI to the AG-UI client and Markdown elsewhere."""
    dependencies = getattr(run_context, "dependencies", None) or {}
    if dependencies.get("openui_client") is True:
        return [
            "Use get_quarterly_revenue for stored revenue questions.",
            OPENUI_PROMPT_PATH.read_text(encoding="utf-8"),
            (
                "For every complete visual answer, stream the OpenUI Lang as the assistant text "
                "inside exactly one Markdown code fence labeled openui. The first bytes must be "
                "```openui followed by a newline, and the final bytes must be a newline followed "
                "by ```. Put root first inside the fence. Do not add prose before or after it. "
                "This wrapper rule intentionally overrides any earlier instruction that forbids "
                "Markdown fences. Use prompt_openui only when the user "
                "must submit a form or choice before the run can continue. For prompt_openui, set "
                "ui to raw OpenUI Lang without fences and fallback_markdown to a concise Markdown "
                "description for AgentOS. After the prompt resumes, return the next complete visual "
                "answer as fenced assistant text."
            ),
        ]

    return [
        "Use get_quarterly_revenue for stored revenue questions.",
        "Respond in normal text or Markdown. Do not call prompt_openui.",
    ]


agent = Agent(
    id="openui-assistant",
    name="Agno × OpenUI Assistant",
    model=OpenAIResponses(id=getenv("OPENAI_MODEL", "gpt-5.5")),
    db=SqliteDb(id="agno-openui", db_file="tmp/agno_openui.db"),
    tools=[get_quarterly_revenue, prompt_openui],
    instructions=agent_instructions,
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
