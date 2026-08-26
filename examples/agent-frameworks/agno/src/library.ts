import { openuiChatLibrary, openuiChatPromptOptions } from "@openuidev/react-ui/genui-lib";

export const library = openuiChatLibrary;

export const promptOptions = {
  ...openuiChatPromptOptions,
  additionalRules: [
    ...(openuiChatPromptOptions.additionalRules ?? []),
    "Use FollowUpBlock at the end of the Card when two useful next actions would help the user.",
    "For a submit form, mark requested fields required and use one primary Button whose Action contains @ToAssistant.",
  ],
};
