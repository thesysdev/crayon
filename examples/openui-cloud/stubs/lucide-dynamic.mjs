// Build shim for the example. The installed `lucide-react` version no longer
// ships the dynamic-icon subpaths ('lucide-react/dynamic' and
// 'lucide-react/dynamicIconImports.mjs') that @openuidev/thesys's icon wrapper
// imports. next.config aliases those specifiers to this empty stub so the
// bundle compiles; dynamic icons fall back to their defaults.
export const dynamicIconImports = {};
export default {};
