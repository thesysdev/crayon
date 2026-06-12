# OpenUI3D Chat Prototype

This example streams OpenUI Lang from Claude into a React Three Fiber renderer.

## Setup

Create `examples/three-chat/.env.local`:

```bash
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
```

`ANTHROPIC_MODEL` is optional. The default is Anthropic's Claude API ID for Sonnet 4.6.

## Run

```bash
pnpm --filter three-chat build
pnpm --filter three-chat start
```

Then open the printed localhost URL and ask for a 3D scene, shader-like material, physics pile, falling letters, or map environment.

`next dev` currently mis-infers the workspace root in this checkout because there is also a `/Users/jason/yarn.lock`. The production server path above avoids that watcher/root issue.
