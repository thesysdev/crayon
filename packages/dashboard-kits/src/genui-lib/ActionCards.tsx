"use client";

import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod/v4";
import { passed, type Action } from "../core/schemas";
import { Pending } from "./Pending";

// Recommended actions a person approves or dismisses. Deciding only writes to
// the card's own log: a kit shows what it would do, the host app does it.

const KIND_LABEL = {
  task: "Task",
  audience: "Flag audience",
  experiment: "Experiment",
  change: "Change",
} as const;

function ActionList({ actions }: { actions: Action[] }) {
  const [decided, setDecided] = useState<Record<string, "approved" | "dismissed">>({});
  const [log, setLog] = useState<string[]>([]);
  const decide = (action: Action, choice: "approved" | "dismissed") => {
    setDecided((d) => ({ ...d, [action.id]: choice }));
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setLog((l) => [
      choice === "approved" && action.effect
        ? `${time} · Approved: ${action.effect}`
        : `${time} · ${choice === "approved" ? "Approved" : "Dismissed"}: ${action.title}`,
      ...l,
    ]);
  };
  return (
    <div className="kit-actions">
      <ul className="kit-actions__list">
        {actions.map((a) => {
          const state = decided[a.id];
          return (
            <li key={a.id} className={`kit-action${state ? ` kit-action--${state}` : ""}`}>
              <div className="kit-action__body">
                <span className="kit-action__title">
                  {a.kind && (
                    <span className={`kit-action__kind kit-action__kind--${a.kind}`}>
                      {KIND_LABEL[a.kind]}
                    </span>
                  )}
                  {a.title}
                </span>
                <span className="kit-action__detail">{a.detail}</span>
                <span className="kit-action__meta">
                  <span className="kit-action__impact">{a.impactText}</span>
                  <span className="kit-muted">
                    {a.owner} · {a.effort} effort
                  </span>
                </span>
              </div>
              <div className="kit-action__buttons">
                {state ? (
                  <span className="kit-action__done">
                    {state === "approved" ? "Approved" : "Dismissed"}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="kit-action__approve"
                      onClick={() => decide(a, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="kit-action__dismiss"
                      onClick={() => decide(a, "dismissed")}
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="kit-actions__log" aria-live="polite">
        <span className="kit-actions__log-title">Action log</span>
        {log.length === 0 ? (
          <span className="kit-muted">
            Nothing approved yet. This demo only records the decision; nothing is sent.
          </span>
        ) : (
          <ul>
            {log.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const ActionCards = defineComponent({
  name: "ActionCards",
  description:
    "Recommended actions to approve or dismiss, each with why, its expected effect, owner, and effort, and a log of decisions (the demo sends nothing): ActionCards(actions.actions).",
  props: z.object({
    actions: z.array(passed("An action from get_actions")).default([]),
  }),
  component: ({ props }) => {
    const actions = (props.actions ?? []) as unknown as Action[];
    if (actions.length === 0)
      return <Pending kind="cards" rows={3} empty="Nothing needs a decision." />;
    return <ActionList actions={actions} />;
  },
});
