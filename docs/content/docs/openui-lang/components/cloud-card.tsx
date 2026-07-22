import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CloudCardProps {
  title: string;
  description: string;
  cta: string;
  href?: string;
}

export function CloudCard({
  title,
  description,
  cta,
  href = "/docs/agent/getting-started/openui-cloud",
}: CloudCardProps) {
  return (
    <Link
      href={href}
      className="group relative mb-8 block overflow-hidden rounded-xl border border-blue-300/70 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 no-underline shadow-sm transition hover:border-blue-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-blue-500/30 dark:from-blue-950/50 dark:via-slate-950 dark:to-violet-950/40 dark:hover:border-blue-400/60"
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
        <span>OpenUI</span>
        <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
          Cloud
        </span>
      </div>

      <h2 className="m-0! text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mb-4 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
        {cta}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
