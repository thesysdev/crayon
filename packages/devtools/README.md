# @openuidev/devtools

Diagnostics and helpers for OpenUI applications. The package is the home f
or future development-time affordances.

## Layers

Every layer is exported on its own, so an app can take exactly the piece it
needs:

| Export                          | Kind           | Use it when                                                                   |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| `observeLLM(llm, observer)`     | plain function | you want request/error callbacks outside React (logging, metrics, custom UIs) |
| `useLLMObserver(llm, observer)` | hook           | you want those callbacks wired to a component's lifecycle                     |
| `OpenUICreditsModal`            | component      | you want the drop-in: observe + state + modal in one line                     |

## Usage (the drop-in)

```tsx
import dynamic from "next/dynamic";

const OpenUICreditsModal =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@openuidev/devtools").then((m) => m.OpenUICreditsModal), {
        ssr: false,
      })
    : null;

// … inside the page, next to <AgentInterface llm={llm} …>:
{
  OpenUICreditsModal ? <OpenUICreditsModal llm={llm} /> : null;
}
```

When a request fails with HTTP 429, the modal opens and offers the billing
console; the next request resets it. While open it hides AgentInterface's
inline thread error so the failure isn't shown twice (opt out with
`hideThreadError={false}`).
