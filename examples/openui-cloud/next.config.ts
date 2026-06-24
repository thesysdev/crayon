import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    // Pin the Turbopack root to the openui monorepo root so it follows the
    // symlinked workspace deps (@openuidev/react-ui, react-lang, lang-core,
    // react-headless) that @openuidev/thesys imports — these live in
    // openui/packages/* and are otherwise treated as outside the inferred root.
    root: path.resolve(process.cwd(), "../.."),
    resolveAlias: {
      // @openuidev/thesys's icon wrapper imports lucide-react dynamic-icon
      // subpaths that the installed lucide-react no longer ships; alias them to
      // an empty stub so the bundle compiles (dynamic icons fall back to defaults).
      "lucide-react/dynamic": "./stubs/lucide-dynamic.mjs",
      "lucide-react/dynamicIconImports.mjs": "./stubs/lucide-dynamic.mjs",
      // @openuidev/thesys-server is linked cross-repo and Turbopack won't follow
      // a symlink to a target outside the workspace root, so its built entry is
      // vendored in-repo (vendor/c1-server) and aliased here.
      "@openuidev/thesys-server": "./vendor/c1-server/index.mjs",
    },
  },
};

export default nextConfig;
