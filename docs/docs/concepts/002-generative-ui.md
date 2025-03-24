# Generative UI

:::note Prerequisites
This guide assumes familiarity with LLMs and tool calling. If you are not familiar with these concepts, please refer to the [OpenAI guide](https://platform.openai.com/docs/guides/function-calling).
:::

One of the key features of Crayon is the ability to power Generative UI interfaces beyond simple pre-defined chat interfaces. Crayon allows you to build fully generative UI interfaces
that are powered by an LLM rather than being pre-defined by the developer.

## What is Generative UI?
Generative UI refers to user interfaces that are dynamically generated and adapted by AI models in real-time. Unlike traditional static interfaces, generative UI can create, modify, and arrange UI components based on user interactions and context. This enables more flexible and personalized user experiences that can evolve based on user needs.

## How does it work?
While Crayon is fairly agnostic to the implementation details, one way to implement Generative UI is by using response templates and
asking the LLM to generate a UI component by choosing a template from a set of templates.

For example, let's assume we are building a personal finance assistant. It would typically have a set of tools that can:
- Read your past transactions
- Check your current balance
- Track your upcoming bills
- And more

This data is then fed back into the LLM response which generates a readable text response for the user. <br />
Rather than asking the LLM to generate a text response, we can ask it
to generate structured outputs passing it a schema of the possible
outputs - the name of the template and the arguments it takes.

## How to use it?
See the [Generative UI guide](/docs/guides/generative-ui) for more information.
