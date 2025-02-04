type JSONValue =
  | string
  | number
  | boolean
  | {
      [value: string]: JSONValue;
    }
  | JSONValue[]
  | null;

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
    | string
    | {
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
export type CreateMessage = Omit<Message, "id">;
