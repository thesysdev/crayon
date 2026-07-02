import type { PromptOptions } from "@openuidev/react-lang";
import { openuiAdditionalRules, openuiExamples, openuiLibrary } from "@openuidev/react-ui/genui-lib";

export { openuiLibrary as library };

// pi drives a real coding agent with read/bash/edit/write tools over a real
// workspace, so we deliberately omit the demo "generate realistic/plausible data"
// stance that openuiPromptOptions carries — data must come from the agent's tools,
// not be invented. (issue #698)
export const promptOptions: PromptOptions = {
  examples: openuiExamples,
  additionalRules: openuiAdditionalRules,
};
