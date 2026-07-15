// react-lang's Library type (Library<ComponentRenderer>) is what <Renderer>
// accepts; lang-core's default Library<unknown> is not assignable to it.
import type { Library } from "@openuidev/react-lang";
import { openuiChatLibrary, openuiLibrary } from "@openuidev/react-ui/genui-lib";

// DOCS-PORT DIVERGENCE: the standalone paste app also offers
// @openuidev/thesys's chatLibrary. It is excluded here because Turbopack
// (and SWC minification) miscompile the thesys 0.2.1 dist into chunks with
// duplicate identifiers ("Identifier 'o' has already been declared"),
// which breaks the whole docs client bundle at parse time. The standalone
// app works around it by building with webpack + Terser; the docs build
// pipeline is not this branch's to change. Re-add the preset once thesys
// ships a dist that survives scope hoisting.

export type LibraryId = "openui" | "chat";

export interface LibraryEntry {
  id: LibraryId;
  label: string;
  library: Library;
}

export const LIBRARIES: LibraryEntry[] = [
  { id: "openui", label: "openui", library: openuiLibrary as Library },
  { id: "chat", label: "openui chat", library: openuiChatLibrary as Library },
];

export function getLibrary(id: LibraryId): LibraryEntry {
  return LIBRARIES.find((l) => l.id === id) ?? LIBRARIES[0];
}

// toJSONSchema() walks every component's zod schema — do it once per library.
const schemaCache = new Map<LibraryId, unknown>();

export function getSchema(id: LibraryId): unknown {
  let schema = schemaCache.get(id);
  if (!schema) {
    schema = getLibrary(id).library.toJSONSchema();
    schemaCache.set(id, schema);
  }
  return schema;
}

export function getRootName(id: LibraryId): string | undefined {
  return getLibrary(id).library.root;
}

export function getComponentNames(id: LibraryId): string[] {
  return Object.keys(getLibrary(id).library.components);
}
