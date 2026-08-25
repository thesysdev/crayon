const chartResponse = `root = Card([title, chart, followups])
title = TextContent("Quarterly revenue from an Agno tool", "large-heavy")
chart = BarChart(labels, [revenue], "grouped")
labels = ["Q1", "Q2", "Q3", "Q4"]
revenue = Series("Revenue ($K)", [120, 180, 150, 240])
followups = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Compare the first and second half")
fu2 = FollowUpItem("Show quarter-over-quarter growth")`;

const formResponse = `root = Card([header, form])
header = CardHeader("Project Estimate", "AgentOS will receive the submitted values as the next turn")
form = Form("project_estimate", buttons, [nameField, sizeField, notesField])
nameField = FormControl("Project Name", Input("project_name", "Enter project name", "text", { required: true }))
sizeField = FormControl("Team Size", Input("team_size", "Enter team size", "number", { required: true, numeric: true, min: 1 }))
notesField = FormControl("Notes", TextArea("notes", "Add notes", 4, { required: true }))
buttons = Buttons([submit])
submit = Button("Submit to AgentOS", Action([@ToAssistant("Submit project estimate form")]), "primary")`;

const formFallback = `## Project estimate

Open this session in the OpenUI client to submit the project name, team size, and notes form.`;

function submissionResponse(toolResult: string): string {
  let projectName = "Project";
  let teamSize = "—";
  let notes = "—";

  try {
    const payload = JSON.parse(toolResult) as { formState?: Record<string, unknown> };
    const state = payload.formState;
    const form = (state as Record<string, unknown> | undefined)?.["project_estimate"] as
      Record<string, { value?: unknown }> | undefined;
    projectName = String(form?.["project_name"]?.value ?? projectName);
    teamSize = String(form?.["team_size"]?.value ?? teamSize);
    notes = String(form?.["notes"]?.value ?? notes);
  } catch {
    // The acknowledgement still renders when a custom client omits OpenUI context.
  }

  return `root = Card([header, project, team, note, status])
header = CardHeader("Project estimate received", "The structured values completed the round trip through the AgentOS boundary")
project = TextContent(${JSON.stringify(`Project: ${projectName}`)})
team = TextContent(${JSON.stringify(`Team size: ${teamSize}`)})
note = TextContent(${JSON.stringify(`Notes: ${notes}`)})
status = Callout("success", "Handled by AgentOS", "OpenUI collected and rendered the data; AgentOS now owns the next action.")`;
}

function fenceOpenUI(openui: string): string {
  return `\`\`\`openui\n${openui}\n\`\`\``;
}

function textEvents(messageId: string, content: string): Array<Record<string, unknown>> {
  const chunks = content.match(/[\s\S]{1,24}/g) ?? [];
  return [
    { type: "TEXT_MESSAGE_START", messageId, role: "assistant" },
    ...chunks.map((delta) => ({ type: "TEXT_MESSAGE_CONTENT", messageId, delta })),
    { type: "TEXT_MESSAGE_END", messageId },
  ];
}

interface MockSession {
  session_id: string;
  session_name: string;
  created_at: string;
  updated_at: string;
  chat_history: Array<Record<string, unknown>>;
}

const sessions = new Map<string, MockSession>();
const pendingPrompts = new Map<string, { toolCallId: string }>();

function readBody(request: import("node:http").IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response: import("node:http").ServerResponse, value: unknown, status = 200) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(value));
}

function sessionFromBody(body: Record<string, unknown>): MockSession {
  const now = new Date().toISOString();
  return {
    session_id: crypto.randomUUID(),
    session_name:
      typeof body["session_name"] === "string" ? body["session_name"] : "New conversation",
    created_at: now,
    updated_at: now,
    chat_history: [],
  };
}

async function writeEvents(
  response: import("node:http").ServerResponse,
  events: Array<Record<string, unknown>>,
) {
  for (const event of events) {
    response.write(`data: ${JSON.stringify(event)}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 55));
  }
  response.end();
}

async function handleAgui(
  request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse,
) {
  const body = await readBody(request);
  const threadId = typeof body["threadId"] === "string" ? body["threadId"] : crypto.randomUUID();
  const runId = typeof body["runId"] === "string" ? body["runId"] : crypto.randomUUID();
  const messages = Array.isArray(body["messages"]) ? body["messages"] : [];
  const lastMessage = messages.at(-1) as Record<string, unknown> | undefined;
  const lastUserMessage = [...messages]
    .reverse()
    .find(
      (message): message is Record<string, unknown> =>
        typeof message === "object" && message !== null && message["role"] === "user",
    );
  const prompt = typeof lastUserMessage?.["content"] === "string" ? lastUserMessage["content"] : "";
  const pendingPrompt = pendingPrompts.get(threadId);
  const isSubmission =
    lastMessage?.["role"] === "tool" &&
    typeof lastMessage["toolCallId"] === "string" &&
    lastMessage["toolCallId"] === pendingPrompt?.toolCallId;
  const submission =
    isSubmission && typeof lastMessage?.["content"] === "string" ? lastMessage["content"] : "";
  const isForm = !isSubmission && /form|estimate|structured input/i.test(prompt);
  const isChart = !isSubmission && !isForm;
  const openui = isSubmission
    ? submissionResponse(submission)
    : isForm
      ? formResponse
      : chartResponse;
  const now = new Date().toISOString();
  const session =
    sessions.get(threadId) ??
    ({
      session_id: threadId,
      session_name: prompt.slice(0, 80) || "New conversation",
      created_at: now,
      updated_at: now,
      chat_history: [],
    } satisfies MockSession);

  if (isSubmission && pendingPrompt) {
    session.chat_history.push({
      role: "tool",
      tool_call_id: pendingPrompt.toolCallId,
      content: submission,
    });
    pendingPrompts.delete(threadId);
  } else if (prompt) {
    session.chat_history.push({ role: "user", content: prompt });
  }
  session.updated_at = now;
  sessions.set(threadId, session);

  response.statusCode = 200;
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");

  const events: Array<Record<string, unknown>> = [
    { type: "RUN_STARTED", threadId, runId },
    { type: "STATE_SNAPSHOT", snapshot: { source: "AgentOS" } },
  ];

  const parentMessageId = crypto.randomUUID();
  events.push(
    { type: "TEXT_MESSAGE_START", messageId: parentMessageId, role: "assistant" },
    { type: "TEXT_MESSAGE_END", messageId: parentMessageId },
  );

  if (isForm) {
    const toolCallId = crypto.randomUUID();
    pendingPrompts.set(threadId, { toolCallId });
    events.push(
      {
        type: "TOOL_CALL_START",
        toolCallId,
        toolCallName: "prompt_openui",
        parentMessageId,
      },
      {
        type: "TOOL_CALL_ARGS",
        toolCallId,
        delta: JSON.stringify({ ui: openui, fallback_markdown: formFallback }),
      },
      { type: "TOOL_CALL_END", toolCallId },
    );
    session.chat_history.push({
      role: "assistant",
      content: "",
      tool_calls: [
        {
          id: toolCallId,
          name: "prompt_openui",
          args: { ui: openui, fallback_markdown: formFallback },
        },
      ],
    });
  } else {
    if (isChart) {
      const toolCallId = crypto.randomUUID();
      const revenue = { quarters: [120, 180, 150, 240], unit: "USD thousands" };
      events.push(
        {
          type: "TOOL_CALL_START",
          toolCallId,
          toolCallName: "get_quarterly_revenue",
          parentMessageId,
        },
        { type: "TOOL_CALL_ARGS", toolCallId, delta: "{}" },
        { type: "TOOL_CALL_END", toolCallId },
        {
          type: "TOOL_CALL_RESULT",
          toolCallId,
          messageId: toolCallId,
          role: "tool",
          content: JSON.stringify(revenue),
        },
      );
      session.chat_history.push({
        role: "assistant",
        content: "",
        tool_calls: [{ id: toolCallId, name: "get_quarterly_revenue", args: {} }],
      });
      session.chat_history.push({ role: "tool", tool_call_id: toolCallId, content: revenue });
    }

    const answerMessageId = crypto.randomUUID();
    const fencedOpenUI = fenceOpenUI(openui);
    events.push(...textEvents(answerMessageId, fencedOpenUI));
    session.chat_history.push({ role: "assistant", content: fencedOpenUI });
  }

  events.push(
    { type: "STATE_SNAPSHOT", snapshot: { source: "AgentOS", completed: true } },
    { type: "RUN_FINISHED", threadId, runId },
  );

  await writeEvents(response, events);
}

export function mockAgentOSPlugin() {
  return {
    name: "mock-agentos",
    configureServer(server: { middlewares: { use: (handler: Function) => void } }) {
      server.middlewares.use(
        async (
          request: import("node:http").IncomingMessage,
          response: import("node:http").ServerResponse,
          next: () => void,
        ) => {
          const url = new URL(request.url ?? "/", "http://localhost");

          if (url.pathname === "/agui" && request.method === "POST") {
            await handleAgui(request, response);
            return;
          }

          if (url.pathname === "/status") {
            sendJson(response, { status: "ok", interface: "AG-UI", source: "mock AgentOS" });
            return;
          }

          if (url.pathname === "/sessions" && request.method === "GET") {
            sendJson(response, {
              data: [...sessions.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
              meta: { page: 1, limit: 20, total_pages: 1, total_count: sessions.size },
            });
            return;
          }

          if (url.pathname === "/sessions" && request.method === "POST") {
            const session = sessionFromBody(await readBody(request));
            sessions.set(session.session_id, session);
            sendJson(response, session, 201);
            return;
          }

          const renameMatch = url.pathname.match(/^\/sessions\/([^/]+)\/rename$/);
          if (renameMatch && request.method === "POST") {
            const session = sessions.get(decodeURIComponent(renameMatch[1]!));
            if (!session) {
              sendJson(response, { detail: "Session not found" }, 404);
              return;
            }
            const body = await readBody(request);
            if (typeof body["session_name"] === "string")
              session.session_name = body["session_name"];
            session.updated_at = new Date().toISOString();
            sendJson(response, session);
            return;
          }

          const sessionMatch = url.pathname.match(/^\/sessions\/([^/]+)$/);
          if (sessionMatch) {
            const sessionId = decodeURIComponent(sessionMatch[1]!);
            const session = sessions.get(sessionId);
            if (!session) {
              sendJson(response, { detail: "Session not found" }, 404);
              return;
            }
            if (request.method === "DELETE") {
              sessions.delete(sessionId);
              response.statusCode = 204;
              response.end();
              return;
            }
            sendJson(response, session);
            return;
          }

          next();
        },
      );
    },
  };
}
