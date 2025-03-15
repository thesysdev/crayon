import { JSONValue } from "@crayonai/stream";

type common = {
  id: string;
  isVisuallyHidden?: boolean;
};

export type UserMessage = common & {
  role: "user";
} & {
  type: "prompt";
  message?: string;
  context?: JSONValue[];
};

export type AssistantMessage = common & {
  role: "assistant";
  context?: JSONValue[];
  message?: (
    | {
        type: "text";
        text: string;
      }
    | {
        type: "template";
        name: string;
        templateProps: any;
      }
  )[];
};

export type Message = UserMessage | AssistantMessage;

/**
 * Represents a message being created, with an optional ID
 * @extends Omit<Message, "id">
 */
export type CreateMessage = Omit<UserMessage, "id">;
