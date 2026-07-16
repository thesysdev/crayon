import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { useNitro } from "@nuxt/kit";

// WORKAROUND: Nuxt 3.21.x has a bug where dev server fails with
// "Vite Node IPC socket path not configured" when ssr: false.
// This workaround bypasses the vite-node manifest fetch by providing
// a direct file reference. See: https://github.com/nuxt/nuxt/issues/34957
// This can be removed once Nuxt is upgraded to 3.21.9+ where the bug is fixed.

export default defineNuxtConfig({
  compatibilityDate: "2025-03-01",
  ssr: false,
  modules: [
    function spaDevManifestWorkaround(_options, nuxt) {
      nuxt.hook("vite:extendConfig", (_config, context) => {
        if (!nuxt.options.dev || nuxt.options.ssr || !context.isClient) {
          return;
        }

        const nitro = useNitro();
        const clientManifestPath = pathToFileURL(
          resolve(nuxt.options.buildDir, "dist/server/client.manifest.mjs"),
        ).href;

        nitro.options.virtual ||= {};
        nitro.options._config.virtual ||= {};

        for (const virtual of [nitro.options.virtual, nitro.options._config.virtual]) {
          virtual["#build/dist/server/server.mjs"] = "export default () => {}";
          virtual["#build/dist/server/client.manifest.mjs"] =
            `export { default } from ${JSON.stringify(clientManifestPath)}`;
        }
      });
    },
  ],
  css: ["~/assets/app.css"],
  nitro: {
    externals: {
      inline: ["@openuidev/lang-core", "@openuidev/vue-lang"],
    },
  },
  vite: {
    optimizeDeps: {
      include: ["@openuidev/vue-lang"],
    },
  },
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  },
});