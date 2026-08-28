"use client";

import type {
  GrokBuildInteraction,
  GrokBuildInteractionResponse,
  GrokBuildQuestion,
} from "@/lib/grok-build-interactions";
import { useEffect, useRef, useState, type RefObject } from "react";

interface GrokBuildInteractionDialogProps {
  error?: string;
  interaction: GrokBuildInteraction;
  onRespond: (response: GrokBuildInteractionResponse) => Promise<void>;
  submitting: boolean;
}

type DialogPropsWithRef = GrokBuildInteractionDialogProps & {
  dialogRef: RefObject<HTMLDivElement | null>;
};

function QuestionDialog({
  dialogRef,
  error,
  interaction,
  onRespond,
  submitting,
}: DialogPropsWithRef & {
  interaction: Extract<GrokBuildInteraction, { kind: "question" }>;
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const setSelected = (question: GrokBuildQuestion, label: string, checked: boolean) => {
    setAnswers((current) => {
      if (!question.multiSelect) {
        return { ...current, [question.question]: checked ? [label] : [] };
      }
      const selected = current[question.question] ?? [];
      const next = checked
        ? [...selected.filter((item) => item !== label), label]
        : selected.filter((item) => item !== label);
      return { ...current, [question.question]: next };
    });
    if (!question.multiSelect) {
      setNotes((current) => ({ ...current, [question.question]: "" }));
    }
  };

  const setOther = (question: GrokBuildQuestion, value: string) => {
    setNotes((current) => ({ ...current, [question.question]: value }));
    setAnswers((current) => {
      const selected = current[question.question] ?? [];
      const withoutOther = selected.filter((item) => item !== "Other");
      return {
        ...current,
        [question.question]: value.trim()
          ? question.multiSelect
            ? [...withoutOther, "Other"]
            : ["Other"]
          : question.multiSelect
            ? withoutOther
            : [],
      };
    });
  };

  const toggleOther = (question: GrokBuildQuestion, checked: boolean) => {
    if (!checked) {
      setNotes((current) => ({ ...current, [question.question]: "" }));
      setAnswers((current) => ({
        ...current,
        [question.question]: (current[question.question] ?? []).filter((item) => item !== "Other"),
      }));
      return;
    }
    setAnswers((current) => {
      const selected = current[question.question] ?? [];
      return {
        ...current,
        [question.question]: question.multiSelect
          ? [...selected.filter((item) => item !== "Other"), "Other"]
          : ["Other"],
      };
    });
  };

  const submittedValues = (question: GrokBuildQuestion): string[] => {
    const selected = answers[question.question] ?? [];
    const optionLabels = selected.filter((item) => item !== "Other");
    const hasOther = selected.includes("Other") && Boolean(notes[question.question]?.trim());
    if (question.multiSelect) return [...optionLabels, ...(hasOther ? ["Other"] : [])];
    if (optionLabels.length > 0) return optionLabels.slice(0, 1);
    return hasOther ? ["Other"] : [];
  };

  const partialAnswers = Object.fromEntries(
    interaction.questions.flatMap((question) => {
      const selected = submittedValues(question);
      return selected.length > 0 ? [[question.question, selected.join(", ")]] : [];
    }),
  );
  const hasAnswer = Object.keys(partialAnswers).length > 0;

  const submitAnswers = () => {
    const submittedAnswers = Object.fromEntries(
      interaction.questions.flatMap((question) => {
        const selected = submittedValues(question);
        return selected.length > 0 ? [[question.question, selected]] : [];
      }),
    );
    const annotations = Object.fromEntries(
      interaction.questions.flatMap((question) => {
        const selected = answers[question.question] ?? [];
        const note = notes[question.question]?.trim();
        return selected.includes("Other") && note ? [[question.question, { notes: note }]] : [];
      }),
    );
    return onRespond({
      outcome: "accepted",
      answers: submittedAnswers,
      ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    });
  };

  return (
    <div
      className="grok-interaction-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grok-question-title"
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="grok-interaction-heading">
        <div>
          <p className="grok-interaction-eyebrow">Grok Build needs your input</p>
          <h2 id="grok-question-title">Answer a few questions</h2>
        </div>
        <button
          className="grok-interaction-close"
          type="button"
          disabled={submitting}
          onClick={() => void onRespond({ outcome: "cancelled" })}
          aria-label="Dismiss questions"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="grok-question-list">
        {interaction.questions.map((question, questionIndex) => {
          const selected = answers[question.question] ?? [];
          const preview =
            !question.multiSelect && selected[0] !== "Other"
              ? question.options.find((option) => option.label === selected[0])?.preview
              : undefined;
          return (
            <fieldset className="grok-question" key={`${question.question}-${questionIndex}`}>
              <legend>
                <span>{question.question}</span>
                <small>
                  Question {questionIndex + 1} of {interaction.questions.length}
                  {question.multiSelect ? " · Select all that apply" : " · Select one"}
                </small>
              </legend>
              <div className="grok-question-options">
                {question.options.map((option) => {
                  const inputId = `grok-question-${questionIndex}-${option.label}`;
                  return (
                    <label className="grok-question-option" htmlFor={inputId} key={option.label}>
                      <input
                        id={inputId}
                        type={question.multiSelect ? "checkbox" : "radio"}
                        name={`grok-question-${questionIndex}`}
                        checked={selected.includes(option.label)}
                        disabled={submitting}
                        onChange={(event) =>
                          setSelected(question, option.label, event.target.checked)
                        }
                      />
                      <span>
                        <strong>{option.label}</strong>
                        {option.description ? <small>{option.description}</small> : null}
                      </span>
                    </label>
                  );
                })}
                <div className="grok-question-option grok-question-other">
                  <label
                    className="grok-question-other-choice"
                    htmlFor={`grok-question-${questionIndex}-other`}
                  >
                    <input
                      id={`grok-question-${questionIndex}-other`}
                      type={question.multiSelect ? "checkbox" : "radio"}
                      name={`grok-question-${questionIndex}`}
                      checked={selected.includes("Other")}
                      disabled={submitting}
                      onChange={(event) => toggleOther(question, event.target.checked)}
                    />
                    <strong>Other</strong>
                  </label>
                  <input
                    className="grok-question-other-input"
                    type="text"
                    value={notes[question.question] ?? ""}
                    disabled={submitting}
                    onChange={(event) => setOther(question, event.target.value)}
                    placeholder="Type a custom answer"
                    aria-label={`Other answer for ${question.question}`}
                  />
                </div>
              </div>
              {preview ? (
                <div className="grok-question-preview">
                  <span>Selected option preview</span>
                  <pre>{preview}</pre>
                </div>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {error ? (
        <p className="grok-interaction-error" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className={`grok-interaction-actions${
          interaction.mode === "plan" ? " grok-question-plan-actions" : ""
        }`}
      >
        {interaction.mode === "plan" ? (
          <>
            <button
              className="grok-button-secondary"
              type="button"
              disabled={submitting}
              onClick={() =>
                void onRespond({ outcome: "chat_about_this", partial_answers: partialAnswers })
              }
            >
              Chat about this
            </button>
            <button
              className="grok-button-secondary"
              type="button"
              disabled={submitting}
              onClick={() =>
                void onRespond({ outcome: "skip_interview", partial_answers: partialAnswers })
              }
            >
              Skip interview
            </button>
          </>
        ) : null}
        <button
          className="grok-button-primary grok-question-submit"
          type="button"
          disabled={submitting || !hasAnswer}
          onClick={() => void submitAnswers()}
        >
          {submitting ? "Submitting…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function PlanDialog({
  dialogRef,
  error,
  interaction,
  onRespond,
  submitting,
}: DialogPropsWithRef & {
  interaction: Extract<GrokBuildInteraction, { kind: "plan" }>;
}) {
  const [feedback, setFeedback] = useState("");

  return (
    <div
      className="grok-interaction-card grok-plan-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grok-plan-title"
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="grok-interaction-heading">
        <div>
          <p className="grok-interaction-eyebrow">Plan ready for review</p>
          <h2 id="grok-plan-title">Approve or revise Grok&apos;s plan</h2>
        </div>
        <button
          className="grok-interaction-close"
          type="button"
          disabled={submitting}
          onClick={() => void onRespond({ outcome: "abandoned" })}
          aria-label="Abandon plan"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <section className="grok-plan-document" aria-label="Proposed plan">
        <div className="grok-plan-document-heading">
          <span>Proposed plan</span>
          <small>Review before Grok continues</small>
        </div>
        <pre className="grok-plan-content">
          {interaction.planContent?.trim() || "Grok Build did not provide plan content."}
        </pre>
      </section>
      <label className="grok-plan-feedback">
        <span>Requested changes</span>
        <textarea
          value={feedback}
          disabled={submitting}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Describe what Grok should change in the plan…"
          rows={3}
        />
      </label>

      {error ? (
        <p className="grok-interaction-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grok-interaction-actions grok-plan-actions">
        <button
          className="grok-button-secondary"
          type="button"
          disabled={submitting}
          onClick={() => void onRespond({ outcome: "abandoned" })}
        >
          Abandon
        </button>
        <button
          className="grok-button-secondary"
          type="button"
          disabled={submitting || !feedback.trim()}
          onClick={() => void onRespond({ outcome: "cancelled", feedback: feedback.trim() })}
        >
          Request changes
        </button>
        <button
          className="grok-button-primary"
          type="button"
          disabled={submitting}
          onClick={() => void onRespond({ outcome: "approved" })}
        >
          {submitting ? "Submitting…" : "Approve plan"}
        </button>
      </div>
    </div>
  );
}

export function GrokBuildInteractionDialog(props: GrokBuildInteractionDialogProps) {
  const { interaction, onRespond, submitting } = props;
  const dialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(submitting);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submittingRef.current) {
        void onRespond(
          interaction.kind === "question" ? { outcome: "cancelled" } : { outcome: "abandoned" },
        );
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [interaction.kind, onRespond]);

  const dismiss = () =>
    onRespond(
      interaction.kind === "question" ? { outcome: "cancelled" } : { outcome: "abandoned" },
    );

  return (
    <div
      className="grok-interaction-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) void dismiss();
      }}
    >
      {interaction.kind === "question" ? (
        <QuestionDialog {...props} dialogRef={dialogRef} interaction={interaction} />
      ) : (
        <PlanDialog {...props} dialogRef={dialogRef} interaction={interaction} />
      )}
    </div>
  );
}
