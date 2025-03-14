import { JSONValue } from "@crayonai/stream";

/**
 * @inline
 */
type Common = {
  id: string;
  isVisuallyHidden?: boolean;
};

/**
 * @category Types
 */
export type UserMessage = Common & {
  role: "user";
} & {
  type: "prompt";
  message?: string;
  context?: JSONValue[];
};

/**
 * @category Types
 */
export type AssistantMessage = Common & {
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

/**
 * See {@link UserMessage} and {@link AssistantMessage} for more information.
 *
 * @category Types
 */
export type Message = UserMessage | AssistantMessage;

/**
 * Represents a message being created, with an optional ID
 * @extends Omit<Message, "id">
 *
 * @category Types
 */
export type CreateMessage = Omit<UserMessage, "id">;
