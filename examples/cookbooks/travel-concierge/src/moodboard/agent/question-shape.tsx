"use client";

import { useLayoutEffect, useRef } from "react";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type RecordProps,
  T,
  type TLBaseShape,
  useEditor,
} from "tldraw";
import { QuestionCard } from "./question-cards";
import type { Question } from "./questions";

// A question from the trip agent, placed on the canvas as a live card the traveller answers in
// place. Unlike board pieces, it takes pointer events, so its calendar, steppers, and fields work
// without double-clicking. The studio removes it once it's answered.

export type QuestionProps = {
  w: number;
  h: number;
  /** The ask_* tool call this card answers. */
  askId: string;
  /** The Question, as JSON. */
  question: string;
  sent: boolean;
};

declare module "tldraw" {
  interface TLGlobalShapePropsMap {
    question: QuestionProps;
  }
}

export type QuestionShape = TLBaseShape<"question", QuestionProps>;

// The studio registers where answers go. Cards call answer() with the value the model receives
// and a short summary for people.
type Answer = (askId: string, value: unknown, summary: string) => void;
let onAnswer: Answer = () => {};
export const setAnswerHandler = (handler: Answer) => {
  onAnswer = handler;
};

export const questionWidth = (question: Question) => (question.type === "dates" ? 760 : 600);

export class QuestionShapeUtil extends BaseBoxShapeUtil<QuestionShape> {
  static override type = "question" as const;
  static override props: RecordProps<QuestionShape> = {
    w: T.number,
    h: T.number,
    askId: T.string,
    question: T.string,
    sent: T.boolean,
  };

  getDefaultProps(): QuestionProps {
    return { w: 600, h: 320, askId: "", question: "{}", sent: false };
  }

  override canResize() {
    return false;
  }
  override hideResizeHandles() {
    return true;
  }
  override hideRotateHandle() {
    return true;
  }
  override hideSelectionBoundsBg() {
    return true;
  }
  override hideSelectionBoundsFg() {
    return true;
  }
  getIndicatorPath() {
    return undefined;
  }

  component(shape: QuestionShape) {
    return <QuestionView shape={shape} />;
  }
}

function QuestionView({ shape }: { shape: QuestionShape }) {
  const editor = useEditor();
  const content = useRef<HTMLDivElement>(null);
  const question = JSON.parse(shape.props.question) as Question;

  // Fit the shape's height to the card, as the calendar or suggestions change size.
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    const fit = () => {
      if (!element.offsetParent || element.offsetHeight < 8) return;
      const h = Math.ceil(element.offsetHeight);
      const current = editor.getShape<QuestionShape>(shape.id);
      if (!current || Math.abs(current.props.h - h) < 2) return;
      editor.run(() => editor.updateShape({ id: shape.id, type: "question", props: { h } }), {
        history: "ignore",
      });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();
    return () => observer.disconnect();
  }, [editor, shape.id]);

  return (
    <HTMLContainer style={{ width: shape.props.w, pointerEvents: "all" }}>
      <div
        ref={content}
        className={`mb-ask${shape.props.sent ? " is-sent" : ""}`}
        // Keep clicks, drags, and wheel scrolls inside the card away from the canvas.
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <p className="mb-smallcaps mb-ask__kicker">Your planner asks</p>
        <h2 className="mb-ask__question">{question.question}</h2>
        <QuestionCard
          question={question}
          disabled={shape.props.sent}
          answer={(value, summary) => {
            if (shape.props.sent) return;
            editor.updateShape({ id: shape.id, type: "question", props: { sent: true } });
            onAnswer(shape.props.askId, value, summary);
          }}
        />
        <button
          type="button"
          className="mb-ask__skip"
          disabled={shape.props.sent}
          onClick={() => {
            editor.updateShape({ id: shape.id, type: "question", props: { sent: true } });
            onAnswer(shape.props.askId, { skipped: true }, "Skip this one");
          }}
        >
          Skip, you decide
        </button>
      </div>
    </HTMLContainer>
  );
}
