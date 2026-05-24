export interface ComposePreviewCard {
  id: string;
  title: string;
  description: string;
}

export interface ComposeStep {
  id: string;
  title: string;
  description: string;
  previewCards: ComposePreviewCard[];
}

export interface ComposeExample {
  id: string;
  title: string;
  description: string;
  summary: string;
  steps: ComposeStep[];
}

export const COMPOSE_EXAMPLES: ComposeExample[] = [
  {
    id: "response-composition",
    title: "How do we compose",
    description: "Simple lesson to showcase how we compose a response.",
    summary: "Start from structure, then shape tone, evidence, and final delivery.",
    steps: [
      {
        id: "compose-step-1",
        title: "A basic text response",
        description: "Create a short, direct baseline answer before adding structure.",
        previewCards: [
          {
            id: "compose-step-1-option-1",
            title: "Example 1",
            description: "One-sentence answer with no formatting.",
          },
          {
            id: "compose-step-1-option-2",
            title: "Example 2",
            description: "Two-sentence answer with a clear action.",
          },
          {
            id: "compose-step-1-option-3",
            title: "Example 3",
            description: "Concise answer with one key caveat.",
          },
        ],
      },
      {
        id: "compose-step-2",
        title: "Layer a simple structure",
        description: "Split the response into clear parts for readability.",
        previewCards: [
          {
            id: "compose-step-2-option-1",
            title: "Example 1",
            description: "Lead with outcome, then add quick rationale.",
          },
          {
            id: "compose-step-2-option-2",
            title: "Example 2",
            description: "Use short bullets to separate ideas.",
          },
          {
            id: "compose-step-2-option-3",
            title: "Example 3",
            description: "Sectioned response with next-step guidance.",
          },
        ],
      },
      {
        id: "compose-step-3",
        title: "Adjust depth by audience",
        description: "Tune detail level for beginner, teammate, or expert readers.",
        previewCards: [
          {
            id: "compose-step-3-option-1",
            title: "Example 1",
            description: "Beginner-friendly response with plain language.",
          },
          {
            id: "compose-step-3-option-2",
            title: "Example 2",
            description: "Team update with implementation specifics.",
          },
          {
            id: "compose-step-3-option-3",
            title: "Example 3",
            description: "Expert brief with trade-offs and assumptions.",
          },
        ],
      },
      {
        id: "compose-step-4",
        title: "Add grounding signals",
        description: "Attach clear references and confidence boundaries.",
        previewCards: [
          {
            id: "compose-step-4-option-1",
            title: "Example 1",
            description: "Reference source file and summarize facts.",
          },
          {
            id: "compose-step-4-option-2",
            title: "Example 2",
            description: "Call out what is inferred versus confirmed.",
          },
          {
            id: "compose-step-4-option-3",
            title: "Example 3",
            description: "State any missing context before concluding.",
          },
        ],
      },
      {
        id: "compose-step-5",
        title: "Finish with action",
        description: "Close with practical next steps for the user.",
        previewCards: [
          {
            id: "compose-step-5-option-1",
            title: "Example 1",
            description: "Offer one recommended follow-up action.",
          },
          {
            id: "compose-step-5-option-2",
            title: "Example 2",
            description: "Provide a short validation checklist.",
          },
          {
            id: "compose-step-5-option-3",
            title: "Example 3",
            description: "Suggest optional refinements if needed.",
          },
        ],
      },
    ],
  },
  {
    id: "prompt-control",
    title: "Control by prompts",
    description: "Simple lesson to demonstrate how prompt shape changes output.",
    summary: "Compare prompt variants to guide formatting, specificity, and behavior.",
    steps: [
      {
        id: "prompt-step-1",
        title: "Start with intent",
        description: "Define what the response should accomplish.",
        previewCards: [
          {
            id: "prompt-step-1-option-1",
            title: "Example 1",
            description: "Prompt focused on explanation clarity.",
          },
          {
            id: "prompt-step-1-option-2",
            title: "Example 2",
            description: "Prompt focused on implementation speed.",
          },
        ],
      },
      {
        id: "prompt-step-2",
        title: "Constrain output shape",
        description: "Specify format, ordering, and response size limits.",
        previewCards: [
          {
            id: "prompt-step-2-option-1",
            title: "Example 1",
            description: "Bulleted response with strict sections.",
          },
          {
            id: "prompt-step-2-option-2",
            title: "Example 2",
            description: "Short answer followed by actionable details.",
          },
        ],
      },
      {
        id: "prompt-step-3",
        title: "Set tone and depth",
        description: "Guide how concise or detailed the response should be.",
        previewCards: [
          {
            id: "prompt-step-3-option-1",
            title: "Example 1",
            description: "Friendly teammate tone with compact details.",
          },
          {
            id: "prompt-step-3-option-2",
            title: "Example 2",
            description: "Technical deep-dive for experienced audience.",
          },
        ],
      },
    ],
  },
];

export const getComposeExampleById = (exampleId: string): ComposeExample | undefined =>
  COMPOSE_EXAMPLES.find((example) => example.id === exampleId);

export const getNextComposeExampleId = (exampleId: string): string | undefined => {
  const index = COMPOSE_EXAMPLES.findIndex((example) => example.id === exampleId);
  if (index < 0 || index >= COMPOSE_EXAMPLES.length - 1) {
    return undefined;
  }
  return COMPOSE_EXAMPLES[index + 1].id;
};
