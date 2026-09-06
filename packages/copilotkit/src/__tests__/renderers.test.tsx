// @vitest-environment jsdom

import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenUIPresent, OpenUIPrompt } from "../renderers";

const { addMessage, runAgent, agent } = vi.hoisted(() => {
  const addMessage = vi.fn();
  const runAgent = vi.fn(() => Promise.resolve());
  const agent = { addMessage, isRunning: false };
  return { addMessage, runAgent, agent };
});

vi.mock("@copilotkit/react-core/v2", () => ({
  useAgent: () => ({ agent, isReady: true }),
  useCopilotKit: () => ({ copilotkit: { runAgent } }),
}));

const FORM = `root = Card([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary")])`;

const MALFORMED = "root = MissingComponent([])";

const FOLLOW_UPS = `root = Card([followUps])
followUps = FollowUpBlock([first, second])
first = FollowUpItem("Tell me more")
second = FollowUpItem("Show another example")`;

const CLICKABLE_LIST = `root = Card([list])
list = ListBlock([item])
item = ListItem("Compare regions", "See the regional breakdown", null, "Explore", Action([@ToAssistant("Compare regions")]))`;

const OPEN_URL = `root = Card([buttons])
buttons = Buttons([Button("Open docs", Action([@OpenUrl("https://openui.com/docs")]), "primary")])`;

type PromptProps = ComponentProps<typeof OpenUIPrompt>;
type PresentProps = ComponentProps<typeof OpenUIPresent>;

const makePromptProps = (overrides: Partial<PromptProps> = {}): PromptProps =>
  ({
    name: "prompt_openui",
    description: "Prompt with OpenUI",
    toolCallId: "openui-prompt-call",
    args: { ui: FORM },
    status: "executing",
    result: undefined,
    respond: vi.fn(() => Promise.resolve()),
    ...overrides,
  }) as PromptProps;

const makePresentProps = (overrides: Partial<PresentProps> = {}): PresentProps =>
  ({
    name: "present_openui",
    toolCallId: "openui-present-call",
    args: { ui: FOLLOW_UPS },
    status: "complete",
    result: JSON.stringify({ displayed: true }),
    ...overrides,
  }) as PresentProps;

const setInputValue = (input: HTMLInputElement, value: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("OpenUIPresent", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    addMessage.mockReset();
    runAgent.mockReset();
    runAgent.mockResolvedValue(undefined);
    agent.isRunning = false;
    vi.stubGlobal("crypto", { randomUUID: () => "openui-message-id" });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    container.remove();
  });

  it("starts exactly one agent turn when a follow-up is clicked", async () => {
    let finishRun: (() => void) | undefined;
    runAgent.mockReturnValueOnce(new Promise<void>((resolve) => (finishRun = resolve)));

    await act(async () => {
      root.render(<OpenUIPresent {...makePresentProps()} />);
    });

    const followUp = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Tell me more",
    );
    expect(followUp).toBeDefined();

    await act(async () => {
      followUp!.click();
      followUp!.click();
    });

    expect(addMessage).toHaveBeenCalledOnce();
    expect(addMessage).toHaveBeenCalledWith({
      id: "openui-message-id",
      role: "user",
      content: "Tell me more",
    });
    expect(runAgent).toHaveBeenCalledOnce();
    expect(runAgent).toHaveBeenCalledWith({ agent });

    await act(async () => finishRun?.());
  });

  it("starts a new agent turn from a clickable list item", async () => {
    await act(async () => {
      root.render(<OpenUIPresent {...makePresentProps({ args: { ui: CLICKABLE_LIST } })} />);
    });

    const item = Array.from(container.querySelectorAll<HTMLElement>('[role="button"]')).find(
      (element) => element.textContent?.includes("Compare regions"),
    );
    expect(item).toBeDefined();

    await act(async () => item!.click());

    expect(addMessage).toHaveBeenCalledOnce();
    expect(runAgent).toHaveBeenCalledOnce();
  });

  it("opens URL actions in a new isolated tab", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    await act(async () => {
      root.render(<OpenUIPresent {...makePresentProps({ args: { ui: OPEN_URL } })} />);
    });

    const button = Array.from(container.querySelectorAll("button")).find(
      (item) => item.textContent === "Open docs",
    );
    expect(button).toBeDefined();

    await act(async () => button!.click());

    expect(open).toHaveBeenCalledWith("https://openui.com/docs", "_blank", "noopener,noreferrer");
  });
});

describe("OpenUIPrompt", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  const renderPrompt = async (props: PromptProps) => {
    await act(async () => root.render(<OpenUIPrompt {...props} />));
  };

  it("provides OpenUI theme tokens by default", async () => {
    await renderPrompt(makePromptProps());

    expect(document.head.querySelector("style[data-openui-theme]")).not.toBeNull();
  });

  it("can defer theming to a host provider", async () => {
    await renderPrompt(makePromptProps({ disableThemeProvider: true }));

    expect(document.head.querySelector("style[data-openui-theme]")).toBeNull();
  });

  it("submits once and restores completed form state", async () => {
    const respond = vi.fn(() => Promise.resolve());
    await renderPrompt(makePromptProps({ respond }));

    const name = container.querySelector<HTMLInputElement>('input[name="name"]');
    const email = container.querySelector<HTMLInputElement>('input[name="email"]');
    const submit = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Submit",
    );

    expect(name).not.toBeNull();
    expect(email).not.toBeNull();
    expect(submit).toBeDefined();

    await act(async () => {
      setInputValue(name!, "Ada Lovelace");
      setInputValue(email!, "ada@example.com");
    });
    await act(async () => {
      submit!.click();
      submit!.click();
    });

    expect(respond).toHaveBeenCalledOnce();
    const submitted = respond.mock.calls[0]![0];
    expect(submitted).toMatchObject({ message: "Submit", formName: "contact" });
    expect(submitted.formState).toBeDefined();

    await renderPrompt(
      makePromptProps({
        status: "complete",
        result: JSON.stringify(submitted),
        respond: undefined,
      }),
    );

    expect(container.querySelector<HTMLInputElement>('input[name="name"]')?.value).toBe(
      "Ada Lovelace",
    );
    expect(container.querySelector<HTMLInputElement>('input[name="email"]')?.value).toBe(
      "ada@example.com",
    );
  });

  it("waits until streaming ends before showing parser errors", async () => {
    await renderPrompt(
      makePromptProps({
        args: { ui: MALFORMED },
        status: "inProgress",
        respond: undefined,
      }),
    );

    expect(container.querySelector('[role="alert"]')).toBeNull();

    await renderPrompt(
      makePromptProps({
        args: { ui: MALFORMED },
        status: "complete",
        result: "{}",
        respond: undefined,
      }),
    );

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "OpenUI could not render this response.",
    );

    await renderPrompt(makePromptProps());
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
