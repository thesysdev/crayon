import { fileURLToPath } from "node:url";
import { mockAgentOSPlugin } from "./src/mock-agentos";

const fromRoot = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const agnoTarget = process.env["AGNO_API_URL"];

export default {
  define: {
    __AGNO_BACKEND_MODE__: JSON.stringify(agnoTarget ? "real" : "mock"),
  },
  resolve: {
    alias: [
      {
        find: /^@openuidev\/agno$/,
        replacement: fromRoot("packages/agno/src/index.ts"),
      },
      {
        find: /^@openuidev\/react-headless$/,
        replacement: fromRoot("packages/react-headless/dist/index.mjs"),
      },
      {
        find: /^@openuidev\/react-ui$/,
        replacement: fromRoot("packages/react-ui/dist/index.mjs"),
      },
      {
        find: /^@openuidev\/react-ui\/genui-lib$/,
        replacement: fromRoot("packages/react-ui/dist/genui-lib/index.mjs"),
      },
      {
        find: /^@openuidev\/react-ui\/layered\/styles\/index.css$/,
        replacement: fromRoot("packages/react-ui/dist/layered/styles/index.css"),
      },
      {
        find: /^react$/,
        replacement: fromRoot("packages/react-ui/node_modules/react/index.js"),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: fromRoot("packages/react-ui/node_modules/react/jsx-runtime.js"),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: fromRoot("packages/react-ui/node_modules/react/jsx-dev-runtime.js"),
      },
      {
        find: /^react-dom\/client$/,
        replacement: fromRoot("packages/react-ui/node_modules/react-dom/client.js"),
      },
    ],
  },
  plugins: agnoTarget ? [] : [mockAgentOSPlugin()],
  server: {
    host: "127.0.0.1",
    port: 4173,
    ...(agnoTarget
      ? {
          proxy: {
            "/agui": agnoTarget,
            "/sessions": agnoTarget,
            "/status": agnoTarget,
          },
        }
      : {}),
  },
};
