import { fileURLToPath } from "node:url";

export default {
  resolve: {
    alias: {
      "@openuidev/react-headless": fileURLToPath(
        new URL("../react-headless/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
  },
};
