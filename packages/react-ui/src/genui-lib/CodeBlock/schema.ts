import { z } from "zod";

export const CodeBlockSchema = z.object({
  language: z.string(),
  codeString: z.string(),
});
