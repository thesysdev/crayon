import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Pi coding-agent SDK is a heavy Node-only chain: it spawns bash, reads
  // the filesystem, loads native terminal helpers via dynamic require, uses
  // `import.meta`, and reads its own prompt/skill/theme files from disk. It must
  // run as a real Node module at runtime, never bundled.
  //
  // `serverExternalPackages` alone does NOT externalize these because they are
  // symlinked workspace packages whose realpath is outside `node_modules`, so
  // Next's externalization heuristic skips them. We force it with a webpack
  // `externals` matcher keyed on the import string (symlink-agnostic), which is
  // why this app builds with `--webpack` (see package.json scripts).
  serverExternalPackages: ["@earendil-works/pi-coding-agent"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externalize = (
        { context, request }: { context?: string; request?: string },
        callback: (err?: null, result?: string) => void,
      ) => {
        if (request && /^@earendil-works\/pi-coding-agent(\/|$)/.test(request)) {
          // ESM-only package (no `require` export), loaded via native dynamic
          // import() at runtime — keep it as an `import` external. Its sibling
          // @earendil-works/pi-* packages are resolved by Node at runtime (the
          // bundler never sees them once this entry point is external).
          return callback(null, `import ${request}`);
        }
        // The chat route computes the OpenUI system prompt server-side from
        // genui-lib. That module imports React hooks without a "use client"
        // directive, which Next's route-handler (react-server) graph rejects at
        // build time even though the route only calls the pure
        // `openuiLibrary.prompt()`, never a renderer. Loading it as a runtime
        // external skips that bundler check. Scoped to imports issued from the
        // API routes so the page's SSR graph still bundles genui-lib against
        // Next's own React copy.
        if (
          request === "@openuidev/react-ui/genui-lib" &&
          context &&
          /[\\/]src[\\/]app[\\/]api[\\/]/.test(context)
        ) {
          return callback(null, `import ${request}`);
        }
        return callback();
      };
      config.externals = Array.isArray(config.externals)
        ? [externalize, ...config.externals]
        : [externalize];
    }
    return config;
  },
};

export default nextConfig;
