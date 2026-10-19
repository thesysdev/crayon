import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";

const { rewrite: rewriteLLM } = rewritePath("/docs{/*path}", "/llms.mdx/docs{/*path}");

export default function proxy(request: NextRequest) {
  if (isMarkdownPreferred(request)) {
    const markdownPath = rewriteLLM(request.nextUrl.pathname);

    if (markdownPath) {
      return NextResponse.rewrite(new URL(markdownPath, request.nextUrl));
    }
  }

  return NextResponse.next();
}
