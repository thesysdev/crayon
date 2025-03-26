import { JSONValue } from "@crayonai/stream";

/**
 * @inline
 */
type Common = {
  /** The unique identifier of the message */
  id: string;
  /** Whether the message should be visually hidden from the user on the UI */
  isVisuallyHidden?: boolean;
};

/**
 * A type that represents a message sent by the user
 *
 * @category Types
 */
export type UserMessage = Common & {
  role: "user";
} & {
  type: "prompt";
  /** The message content as a string */
  message?: string;
  /** Additional data associated with the message */
  context?: JSONValue[];
};

/**
 * A type that represents a message sent by the assistant / agent
 *
 * @category Types
 */
export type AssistantMessage = Common & {
  role: "assistant";
  /** Additional data associated with the message */
  context?: JSONValue[];
  /** The message content, either in a text format or a template (with the name of the response template and the props of the component that renders the template) */
  message?: (
    | {
        type: "text";
        text: string;
      }
    | {
        type: "template";
        /** The name of the response template to be rendered */
        name: string;
        /** The props to be passed to the component that renders the response template with the given name */
        templateProps: any;
      }
  )[];
};

/**
 * Represents a message in a {@link Thread}. See {@link UserMessage} and {@link AssistantMessage} for more information.
 *
 * @category Types
 */
export type Message = UserMessage | AssistantMessage;

/**
 * Contains all of the information required to create a message. Usually passed to the {@link ThreadManager}'s `processMessage` method.
 *
 * @category Types
 * @useDeclaredType @inline
 */
export type CreateMessage = Omit<UserMessage, "id">;
