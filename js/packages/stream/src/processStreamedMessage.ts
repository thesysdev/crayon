import { AssistantMessage } from "@crayonai/react-core/src/types";
import { createParser } from "eventsource-parser";
import invariant from "tiny-invariant";
import { SSEType } from "./types";

export const processStreamedMessage = async ({
  response,
  createMessage,
  updateMessage,
  deleteMessage,
}: {
  response: Response;
  createMessage: (message: AssistantMessage) => void;
  updateMessage: (message: AssistantMessage) => void;
  deleteMessage: (messageId: string) => void;
}) => {
  const stream = response.body?.getReader();
  if (!stream) {
    throw new Error("No stream");
  }

  let isMessagePushed = false;
  let messageId: string = crypto.randomUUID();
  let previousMessageId = messageId;

  const onMessageUpdate = (message: AssistantMessage) => {
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
          if (isLastMessageContentString) {
            messageContent.pop();
            messageContent = messageContent.concat({
              type: "text",
              text: lastMessageContent.text + event.data,
            });
          } else {
            messageContent = messageContent.concat({
              type: "text",
              text: event.data,
            });
          }
          break;
        }
        case SSEType.ResponseTemplate: {
          messageContent = messageContent.concat(JSON.parse(event.data));
          break;
        }
        case SSEType.ResponseTemplatePropsStream: {
          invariant(lastMessageContent?.type === "template", "response template expected");
          messageContent.pop();
          messageContent = messageContent.concat({
            type: "template",
            name: lastMessageContent.name,
            templateProps: {
              ...(lastMessageContent.templateProps || {}),
              content: (lastMessageContent.templateProps?.content || "") + event.data,
            },
          });
          break;
        }
        case SSEType.ContextUpdate: {
          messageContext = messageContext.concat(JSON.parse(event.data));
          break;
        }
        case SSEType.MessageIdUpdate: {
          messageId = event.data;
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
};
