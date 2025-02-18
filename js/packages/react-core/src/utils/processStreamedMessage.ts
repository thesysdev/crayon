import { AssistantMessage } from "../types";

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

  const chunks: string[] = [];
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await stream.read();

    if (!value?.length && !done) {
      continue;
    }

    if (done) {
      break;
    }

    chunks.push(decoder.decode(value));

    const concatenatedChunks = chunks.join("");
    const completedMessageParts = concatenatedChunks.substring(
      0,
      concatenatedChunks.lastIndexOf("\n"),
    );

    const messageContent: AssistantMessage["message"] = [];
    const messageContext: AssistantMessage["context"] = [];

    for (let chunk of completedMessageParts.split("\n")) {
      chunk = chunk.replaceAll('\\"', '"').replaceAll("\\n", "\n");

      if (!chunk) {
        continue;
      }

      const firstSeparatorIndex = chunk.indexOf(":");
      if (firstSeparatorIndex === -1) {
        throw new Error("Invalid format");
      }

      const chunkType = chunk.substring(0, firstSeparatorIndex);
      const content = chunk.substring(firstSeparatorIndex + 1);
      const lastMessageContent = messageContent[messageContent.length - 1];
      const isLastMessageContentString = lastMessageContent?.type === "text";
      const messageContentLength = messageContent.length;

      switch (chunkType) {
        case "0": {
          if (isLastMessageContentString) {
            messageContent[messageContentLength - 1] = {
              type: "text",
              text: lastMessageContent.text + content,
            };
          } else {
            messageContent.push({
              type: "text",
              text: content,
            });
          }
          break;
        }
        case "1": {
          messageContent.push(JSON.parse(content));
          break;
        }
        case "8": {
          messageContext.push(JSON.parse(content));
          break;
        }
        case "9": {
          messageId = content;
          break;
        }
      }

      onMessageUpdate({
        id: messageId,
        role: "assistant",
        message: messageContent,
        context: messageContext,
      });
    }
  }
};
