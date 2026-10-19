import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { ArrowUpRight } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import { Children, Fragment, isValidElement, type ComponentProps, type ReactNode } from "react";
import styles from "./page.module.css";

/*
 * Components for content/integrations/<slug>.mdx. A guide is an optional
 * <Example> and a <Steps> list; inside each, prose goes in the text column and
 * code fences go beside it.
 */

/** The docs' code block, shown in full rather than in a 600px scroll box. */
function GuidePre(props: ComponentProps<"pre">) {
  return (
    <CodeBlock {...props} viewportProps={{ className: "max-h-none" }}>
      <Pre>{props.children}</Pre>
    </CodeBlock>
  );
}

/** A code fence. MDX wraps each one in a fragment around the `pre`. */
function isCode(node: ReactNode): boolean {
  if (!isValidElement<{ children?: ReactNode }>(node)) return false;
  if (node.type === GuidePre) return true;
  return node.type === Fragment && Children.toArray(node.props.children).some(isCode);
}

/** Separates code fences from the prose around them. */
function splitCode(children: ReactNode) {
  const text: ReactNode[] = [];
  const code: ReactNode[] = [];
  Children.forEach(children, (child) => (isCode(child) ? code : text).push(child));
  return { text, code };
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={styles.stepCodeSource} href={href} rel="noopener noreferrer" target="_blank">
      {children}
      <ArrowUpRight size={13} aria-hidden="true" />
    </a>
  );
}

/**
 * A runnable example beside a screenshot of it answering `prompt`. Children are
 * the description and a code fence with the commands that run it, shown under the
 * screenshot. `image` is a path in public/ without the `-light.webp` / `-dark.webp`
 * suffix.
 */
function Example({
  prompt,
  image,
  width,
  height,
  alt,
  href,
  children,
}: {
  prompt: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  href: string;
  children: ReactNode;
}) {
  const { text, code } = splitCode(children);

  return (
    <section className={styles.exampleSection} aria-labelledby="integration-example">
      <h2 id="integration-example">Example</h2>
      <div className={styles.exampleLayout}>
        <div className={styles.exampleText}>
          {text}
          <div>
            <p className={styles.exampleLabel}>Prompt</p>
            <blockquote className={styles.examplePrompt}>{prompt}</blockquote>
          </div>
          <ExternalLink href={href}>Open the example on GitHub</ExternalLink>
        </div>

        <div className={styles.exampleMedia}>
          <div className={styles.exampleShot}>
            {(["light", "dark"] as const).map((mode) => (
              <Image
                key={mode}
                className={mode === "light" ? styles.exampleShotLight : styles.exampleShotDark}
                src={`${image}-${mode}.webp`}
                width={width}
                height={height}
                alt={alt}
                sizes="(min-width: 1024px) 48rem, 100vw"
              />
            ))}
          </div>
          {/* Under the screenshot, where the commands have room to fit on one line. */}
          {code.length ? (
            <div>
              <p className={styles.exampleLabel}>Run it</p>
              {code}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return (
    <section className={styles.stepsSection}>
      <h2>Integration steps</h2>
      <ol className={styles.flowList}>{children}</ol>
    </section>
  );
}

/** One step: its text, and its code with a link to the complete `source` file. */
function Step({
  title,
  source,
  children,
}: {
  title: string;
  source?: string;
  children: ReactNode;
}) {
  const { text, code } = splitCode(children);

  return (
    <li>
      <div className={styles.flowText}>
        <span className={styles.flowNumber} aria-hidden="true" />
        <div>
          <h3>{title}</h3>
          {text}
        </div>
      </div>
      {code.length ? (
        <div className={styles.stepCode}>
          {code}
          {source ? <ExternalLink href={source}>View the full file</ExternalLink> : null}
        </div>
      ) : null}
    </li>
  );
}

export const guideComponents: MDXComponents = {
  ...defaultMdxComponents,
  pre: GuidePre,
  Example,
  Steps,
  Step,
};
