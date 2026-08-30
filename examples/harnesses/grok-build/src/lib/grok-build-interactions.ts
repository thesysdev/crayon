const ASK_USER_METHOD = "x.ai/ask_user_question";
const EXIT_PLAN_METHOD = "x.ai/exit_plan_mode";
const DEFAULT_INTERACTION_TIMEOUT_MS = 30 * 60 * 1000;

type UnknownRecord = Record<string, unknown>;

export interface GrokBuildQuestionOption {
  description: string;
  label: string;
  preview?: string;
}

export interface GrokBuildQuestion {
  multiSelect: boolean;
  options: GrokBuildQuestionOption[];
  question: string;
}

interface GrokBuildInteractionBase {
  createdAt: number;
  id: string;
  sessionId: string;
  toolCallId: string;
}

export interface GrokBuildQuestionInteraction extends GrokBuildInteractionBase {
  kind: "question";
  mode: "default" | "plan";
  questions: GrokBuildQuestion[];
}

export interface GrokBuildPlanInteraction extends GrokBuildInteractionBase {
  kind: "plan";
  planContent?: string;
}

export type GrokBuildInteraction = GrokBuildQuestionInteraction | GrokBuildPlanInteraction;
type GrokBuildInteractionDraft =
  | Omit<GrokBuildQuestionInteraction, "createdAt" | "id">
  | Omit<GrokBuildPlanInteraction, "createdAt" | "id">;

export interface GrokBuildQuestionAnnotation {
  notes?: string;
  preview?: string;
}

export type GrokBuildQuestionResponse =
  | {
      annotations?: Record<string, GrokBuildQuestionAnnotation>;
      answers: Record<string, string[]>;
      outcome: "accepted";
    }
  | { outcome: "chat_about_this"; partial_answers?: Record<string, string> }
  | { outcome: "skip_interview"; partial_answers?: Record<string, string> }
  | { outcome: "cancelled" };

export type GrokBuildPlanResponse =
  { outcome: "approved" } | { outcome: "cancelled"; feedback?: string } | { outcome: "abandoned" };

export type GrokBuildInteractionResponse = GrokBuildQuestionResponse | GrokBuildPlanResponse;

interface PendingInteraction {
  interaction: GrokBuildInteraction;
  resolve: (response: UnknownRecord) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface InteractionWaiter {
  afterInteractionId?: string;
  onAbort?: () => void;
  resolve: (interaction: GrokBuildInteraction | undefined) => void;
  signal?: AbortSignal;
  timer: ReturnType<typeof setTimeout>;
}

function recordValue(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Grok Build interaction is missing ${field}.`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function unwrapExtensionRequest(
  method: string,
  params: UnknownRecord,
): { method: string; params: UnknownRecord } {
  const wrappedMethod = typeof params.method === "string" ? params.method : undefined;
  const wrappedParams = recordValue(params.params);
  if (wrappedMethod && wrappedParams) {
    return { method: wrappedMethod.replace(/^_/, ""), params: wrappedParams };
  }
  return { method: method.replace(/^_/, ""), params };
}

function parseQuestion(value: unknown): GrokBuildQuestion | undefined {
  const record = recordValue(value);
  if (!record || typeof record.question !== "string" || !record.question.trim()) return undefined;

  const options = Array.isArray(record.options)
    ? record.options.flatMap((candidate): GrokBuildQuestionOption[] => {
        const option = recordValue(candidate);
        if (!option || typeof option.label !== "string" || !option.label.trim()) return [];
        return [
          {
            label: option.label,
            description: typeof option.description === "string" ? option.description : "",
            ...(optionalString(option.preview) ? { preview: optionalString(option.preview) } : {}),
          },
        ];
      })
    : [];

  if (options.length === 0) return undefined;
  return {
    question: record.question,
    options,
    multiSelect: record.multiSelect === true || record.multi_select === true,
  };
}

export function parseGrokBuildInteraction(
  method: string,
  params: UnknownRecord,
): GrokBuildInteractionDraft | undefined {
  const unwrapped = unwrapExtensionRequest(method, params);
  if (unwrapped.method !== ASK_USER_METHOD && unwrapped.method !== EXIT_PLAN_METHOD) {
    return undefined;
  }

  const sessionId = requiredString(unwrapped.params.sessionId, "sessionId");
  const toolCallId = requiredString(unwrapped.params.toolCallId, "toolCallId");

  if (unwrapped.method === ASK_USER_METHOD) {
    const questions = Array.isArray(unwrapped.params.questions)
      ? unwrapped.params.questions.flatMap((value) => {
          const question = parseQuestion(value);
          return question ? [question] : [];
        })
      : [];
    if (questions.length === 0) {
      throw new Error("Grok Build ask-user request did not contain any valid questions.");
    }
    return {
      kind: "question",
      sessionId,
      toolCallId,
      questions,
      mode: unwrapped.params.mode === "plan" ? "plan" : "default",
    };
  }

  return {
    kind: "plan",
    sessionId,
    toolCallId,
    ...(optionalString(unwrapped.params.planContent)
      ? { planContent: optionalString(unwrapped.params.planContent) }
      : {}),
  };
}

function sanitizeStringMap(value: unknown, allowedKeys: Set<string>): Record<string, string> {
  const record = recordValue(value);
  if (!record) return {};
  return Object.fromEntries(
    Object.entries(record).flatMap(([key, candidate]) =>
      allowedKeys.has(key) && typeof candidate === "string" && candidate.trim()
        ? [[key, candidate]]
        : [],
    ),
  );
}

function sanitizeQuestionResponse(
  interaction: GrokBuildQuestionInteraction,
  value: unknown,
): UnknownRecord {
  const response = recordValue(value);
  if (!response) throw new Error("Invalid Grok Build question response.");
  const outcome = response.outcome;
  if (outcome === "cancelled") return { outcome };

  const questionNames = new Set(interaction.questions.map((question) => question.question));
  if (outcome === "chat_about_this" || outcome === "skip_interview") {
    if (interaction.mode !== "plan") {
      throw new Error(`${outcome} is only valid for a plan-mode question.`);
    }
    return {
      outcome,
      partial_answers: sanitizeStringMap(response.partial_answers, questionNames),
    };
  }

  if (outcome !== "accepted") throw new Error("Invalid Grok Build question response.");
  const submittedAnswers = recordValue(response.answers);
  const submittedAnnotations = recordValue(response.annotations);
  const answers: Record<string, string[]> = {};
  const annotations: Record<string, GrokBuildQuestionAnnotation> = {};

  for (const question of interaction.questions) {
    const submitted = submittedAnswers?.[question.question];
    const values = Array.isArray(submitted)
      ? submitted.filter((item): item is string => typeof item === "string")
      : typeof submitted === "string"
        ? [submitted]
        : [];
    const allowedLabels = new Set([...question.options.map((option) => option.label), "Other"]);
    const unique = [...new Set(values.filter((label) => allowedLabels.has(label)))];
    const submittedAnnotation = recordValue(submittedAnnotations?.[question.question]);
    const notes = unique.includes("Other") ? optionalString(submittedAnnotation?.notes) : undefined;
    const optionLabels = unique.filter((label) => label !== "Other");
    const selected = question.multiSelect
      ? optionLabels.length > 0
        ? optionLabels
        : notes
          ? ["Other"]
          : []
      : unique[0] === "Other"
        ? notes
          ? ["Other"]
          : []
        : unique.slice(0, 1);
    if (selected.length === 0) continue;
    answers[question.question] = selected;

    const preview =
      !question.multiSelect && selected[0] !== "Other"
        ? question.options.find((option) => option.label === selected[0])?.preview
        : undefined;
    if (preview || notes)
      annotations[question.question] = {
        ...(preview ? { preview } : {}),
        ...(notes ? { notes } : {}),
      };
  }

  if (Object.keys(answers).length === 0) {
    throw new Error("Answer at least one Grok Build question before submitting.");
  }
  return {
    outcome,
    answers,
    ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
  };
}

function sanitizePlanResponse(value: unknown): UnknownRecord {
  const response = recordValue(value);
  if (!response) throw new Error("Invalid Grok Build plan response.");
  const outcome = response.outcome;
  if (outcome === "approved" || outcome === "abandoned") return { outcome };
  if (outcome === "cancelled") {
    const feedback = optionalString(response.feedback);
    return { outcome, ...(feedback ? { feedback } : {}) };
  }
  throw new Error("Invalid Grok Build plan response.");
}

function fallbackResponse(interaction: GrokBuildInteraction): UnknownRecord {
  return interaction.kind === "question" ? { outcome: "cancelled" } : { outcome: "abandoned" };
}

export class GrokBuildInteractionBroker {
  private readonly pendingById = new Map<string, PendingInteraction>();
  private readonly pendingIdBySession = new Map<string, string>();
  private readonly waitersBySession = new Map<string, Set<InteractionWaiter>>();

  constructor(private readonly timeoutMs = DEFAULT_INTERACTION_TIMEOUT_MS) {}

  current(sessionId: string): GrokBuildInteraction | undefined {
    const id = this.pendingIdBySession.get(sessionId);
    return id ? this.pendingById.get(id)?.interaction : undefined;
  }

  waitForChange(
    sessionId: string,
    afterInteractionId?: string,
    options: { signal?: AbortSignal; timeoutMs?: number } = {},
  ): Promise<GrokBuildInteraction | undefined> {
    const current = this.current(sessionId);
    if (current?.id !== afterInteractionId || (afterInteractionId && !current)) {
      return Promise.resolve(current);
    }
    if (options.signal?.aborted) return Promise.resolve(current);

    return new Promise((resolve) => {
      const waiter = {} as InteractionWaiter;
      const settle = (interaction: GrokBuildInteraction | undefined) => {
        clearTimeout(waiter.timer);
        if (waiter.signal && waiter.onAbort) {
          waiter.signal.removeEventListener("abort", waiter.onAbort);
        }
        const waiters = this.waitersBySession.get(sessionId);
        waiters?.delete(waiter);
        if (waiters?.size === 0) this.waitersBySession.delete(sessionId);
        resolve(interaction);
      };
      waiter.afterInteractionId = afterInteractionId;
      waiter.resolve = resolve;
      waiter.signal = options.signal;
      waiter.onAbort = () => settle(this.current(sessionId));
      waiter.timer = setTimeout(
        () => settle(this.current(sessionId)),
        options.timeoutMs ?? 25_000,
      );
      (waiter.timer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.();
      this.waitersBySession.set(
        sessionId,
        (this.waitersBySession.get(sessionId) ?? new Set()).add(waiter),
      );
      options.signal?.addEventListener("abort", waiter.onAbort, { once: true });
    });
  }

  request(method: string, params: UnknownRecord): Promise<UnknownRecord> | undefined {
    const parsed = parseGrokBuildInteraction(method, params);
    if (!parsed) return undefined;
    this.cancelSession(parsed.sessionId);

    const interaction: GrokBuildInteraction = {
      ...parsed,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    } as GrokBuildInteraction;

    return new Promise<UnknownRecord>((resolve) => {
      const timer = setTimeout(
        () => this.settle(interaction.id, fallbackResponse(interaction)),
        this.timeoutMs,
      );
      (timer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.();
      this.pendingById.set(interaction.id, { interaction, resolve, timer });
      this.pendingIdBySession.set(interaction.sessionId, interaction.id);
      this.notifyWaiters(interaction.sessionId);
    });
  }

  respond(sessionId: string, interactionId: string, value: unknown): boolean {
    const pending = this.pendingById.get(interactionId);
    if (!pending || pending.interaction.sessionId !== sessionId) return false;
    const response =
      pending.interaction.kind === "question"
        ? sanitizeQuestionResponse(pending.interaction, value)
        : sanitizePlanResponse(value);
    this.settle(interactionId, response);
    return true;
  }

  cancelSession(sessionId: string): void {
    const id = this.pendingIdBySession.get(sessionId);
    const pending = id ? this.pendingById.get(id) : undefined;
    if (pending) this.settle(pending.interaction.id, fallbackResponse(pending.interaction));
  }

  cancelAll(): void {
    for (const pending of [...this.pendingById.values()]) {
      this.settle(pending.interaction.id, fallbackResponse(pending.interaction));
    }
  }

  private settle(interactionId: string, response: UnknownRecord): void {
    const pending = this.pendingById.get(interactionId);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pendingById.delete(interactionId);
    if (this.pendingIdBySession.get(pending.interaction.sessionId) === interactionId) {
      this.pendingIdBySession.delete(pending.interaction.sessionId);
    }
    pending.resolve(response);
    this.notifyWaiters(pending.interaction.sessionId);
  }

  private notifyWaiters(sessionId: string): void {
    const current = this.current(sessionId);
    for (const waiter of [...(this.waitersBySession.get(sessionId) ?? [])]) {
      if (current?.id !== waiter.afterInteractionId || (waiter.afterInteractionId && !current)) {
        clearTimeout(waiter.timer);
        if (waiter.signal && waiter.onAbort) {
          waiter.signal.removeEventListener("abort", waiter.onAbort);
        }
        this.waitersBySession.get(sessionId)?.delete(waiter);
        waiter.resolve(current);
      }
    }
    if (this.waitersBySession.get(sessionId)?.size === 0) {
      this.waitersBySession.delete(sessionId);
    }
  }
}

const globalStore = globalThis as unknown as {
  __openuiGrokBuildInteractions?: GrokBuildInteractionBroker;
};

function broker(): GrokBuildInteractionBroker {
  const existing = globalStore.__openuiGrokBuildInteractions;
  if (existing && typeof existing.waitForChange === "function") return existing;
  existing?.cancelAll();
  const created = new GrokBuildInteractionBroker();
  globalStore.__openuiGrokBuildInteractions = created;
  return created;
}

export function requestGrokBuildInteraction(
  method: string,
  params: UnknownRecord,
): Promise<UnknownRecord> | undefined {
  return broker().request(method, params);
}

export function getGrokBuildInteraction(sessionId: string): GrokBuildInteraction | undefined {
  return broker().current(sessionId);
}

export function waitForGrokBuildInteractionChange(
  sessionId: string,
  afterInteractionId?: string,
  signal?: AbortSignal,
): Promise<GrokBuildInteraction | undefined> {
  return broker().waitForChange(sessionId, afterInteractionId, { signal });
}

export function respondToGrokBuildInteraction(
  sessionId: string,
  interactionId: string,
  response: unknown,
): boolean {
  return broker().respond(sessionId, interactionId, response);
}

export function cancelGrokBuildInteractions(sessionId: string): void {
  broker().cancelSession(sessionId);
}

export function cancelAllGrokBuildInteractions(): void {
  broker().cancelAll();
}
