import {
  ContextUpdate,
  MessageUpdate,
  ResponseTemplate,
  ResponseTemplatePropsChunk,
  SSEType,
  TextChunk,
} from "@crayonai/stream";
import { createParser } from "eventsource-parser";
import invariant from "tiny-invariant";
import { AssistantMessage } from "../types";

/**
 * @inline
 */
interface Parameters {
  response: Response;
  /** A function that creates a new assistant message in the thread */
  createMessage: (message: AssistantMessage) => void;
  /** A function that updates an existing assistant message in the thread */
  updateMessage: (message: AssistantMessage) => void;
  /** A function that deletes an assistant message from the thread */
  deleteMessage: (messageId: string) => void;
}

/**
 * @category Utilities
 */
export const processStreamedMessage = async ({
  response,
  createMessage,
  updateMessage,
  deleteMessage,
}: Parameters): Promise<AssistantMessage | void> => {
  const stream = response.body?.getReader();
  if (!stream) {
    throw new Error("No stream");
  }

  let isMessagePushed = false;
  let messageId: string = crypto.randomUUID();
  let previousMessageId = messageId;
  let finalMessage: AssistantMessage | undefined = undefined;

  const onMessageUpdate = (message: AssistantMessage) => {
    finalMessage = message;
    if (messageId !== message.id) {
      previousMessageId = messageId;
      messageId = message.id;
      deleteMessage(previousMessageId);
      createMessage(message);
      return;
    }

    if (!isMessagePushed) {
      createMessage(message);
    } else {
      updateMessage(message);
    }
    isMessagePushed = true;
  };

  let messageContent: NonNullable<AssistantMessage["message"]> = [];
  let messageContext: NonNullable<AssistantMessage["context"]> = [];

  const parser = createParser({
    onEvent: (event) => {
      const lastMessageContent = messageContent[messageContent.length - 1];
      const isLastMessageContentString = lastMessageContent?.type === "text";

      switch (event.event) {
        case SSEType.TextDelta: {
          const textChunk = TextChunk.fromSSEData(event.data);
          if (isLastMessageContentString) {
            messageContent.pop();
            messageContent = messageContent.concat({
              type: "text",
              text: lastMessageContent.text + textChunk.chunk,
            });
          } else {
            messageContent = messageContent.concat({
              type: "text",
              text: textChunk.chunk,
            });
          }
          break;
        }
        case SSEType.ResponseTemplate: {
          const responseTemplate = ResponseTemplate.fromSSEData(event.data);
          messageContent = messageContent.concat({
            type: "template",
            name: responseTemplate.name,
            templateProps: responseTemplate.templateProps,
          });
          break;
        }
        case SSEType.ResponseTemplatePropsChunk: {
          const responseTemplateProps = ResponseTemplatePropsChunk.fromSSEData(event.data);
          invariant(lastMessageContent?.type === "template", "response template expected");
          messageContent.pop();
          messageContent = messageContent.concat({
            type: "template",
            name: lastMessageContent.name,
            templateProps: {
              ...(lastMessageContent.templateProps || {}),
              content:
                (lastMessageContent.templateProps?.content || "") + responseTemplateProps.chunk,
            },
          });
          break;
        }
        case SSEType.ContextAppend: {
          const ctxUpdate = ContextUpdate.fromSSEData(event.data);
          messageContext = messageContext.concat(ctxUpdate.contextItem);
          break;
        }
        case SSEType.MessageUpdate: {
          const messageUpdate = MessageUpdate.fromSSEData(event.data);
          messageId = messageUpdate.id;
          break;
        }
        default: {
          console.warn(`Unknown event type: ${event.event}`);
          break;
        }
      }

      onMessageUpdate({
        id: messageId,
        role: "assistant",
        message: messageContent,
        context: messageContext,
      });
    },
  });

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await stream.read();

    parser.feed(decoder.decode(value, { stream: !done }));

    if (done) {
      parser.reset({ consume: true });
      break;
    }
  }

  return finalMessage;
};
