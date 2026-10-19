import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { caseRedirects } from "./redirects.mjs";

const { rewrite: rewriteLLM } = rewritePath("/docs{/*path}", "/llms.mdx/docs{/*path}");

export default function proxy(request: NextRequest) {
  const caseRedirect = caseRedirects[request.nextUrl.pathname];
  if (caseRedirect) {
    return NextResponse.redirect(new URL(caseRedirect, request.nextUrl), 308);
  }

  if (isMarkdownPreferred(request)) {
    const markdownPath = rewriteLLM(request.nextUrl.pathname);

    if (markdownPath) {
      return NextResponse.rewrite(new URL(markdownPath, request.nextUrl));
    }
  }

  return NextResponse.next();
}
