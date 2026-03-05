"use client";

import { useState } from "react";
import {
  Code2,
  Zap,
  Shield,
  Waves,
  ArrowRight,
  BarChart3,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Button } from "@/components/button";
import {
  CodeBlock,
  SimpleCard,
  Separator,
  InlineButton,
  FeatureCard,
  FeatureCards,
} from "@/components/overview-components";
import Link from "next/link";

const steps = [
  {
    title: "Define Library",
    description: "Create your component library with Zod schemas and generate the system prompt",
    code: `import { defineComponent, createLibrary } from '@openuidev/lang-react';
import { z } from 'zod';

const MyCard = defineComponent({
  name: 'MyCard',
  description: 'Displays a titled content card.',
  props: z.object({
    title: z.string(),
  }),
  component: ({ props }) => <div>{props.title}</div>,
});

export const myLibrary = createLibrary({
  components: [MyCard, ...otherComponents],
});

export const systemPrompt = myLibrary.prompt(); // Generated system prompt
`,
  },
  {
    title: "LLM Generates OpenUI Syntax",
    description: "LLM outputs token-efficient, line-oriented syntax",
    code: `root = Card([header, emailField, passwordField, signInButton])
header = CardHeader("Welcome Back", "Continue your journey")
emailField = FormControl("Email", Input("email", "Enter your email", "email"))
passwordField = FormControl("Password", Input("password", "Enter password", "password"))
signInButton = Button("Sign In", "action:signIn", "primary")
`,
  },
];

export default function OpenUILangOverview() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-3 py-8 font-sans text-slate-900 sm:px-4 sm:py-12 lg:px-8 dark:text-slate-100">
      {/* Introduction */}
      <div className="mb-12 sm:mb-20">
        <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div>
            <h1 className="mb-1 text-3xl font-bold sm:mb-2 sm:text-4xl">OpenUI Lang</h1>
            <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
              A line-oriented language designed for streaming, token efficiency, and type safety
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-slate-600 sm:mb-8 sm:text-base dark:text-slate-400">
          An alternative to{" "}
          <Link
            href="https://json-render.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Vercel JSON renderer
          </Link>{" "}
          and{" "}
          <Link
            href="https://a2ui.org/"
            target="_blank"
            rel="noopener noreferrer"
            className=" underline hover:no-underline"
          >
            A2UI
          </Link>{" "}
          that uses ~40% fewer tokens than equivalent JSON structures. Define your component library
          with Zod schemas and parse LLM responses into renderable components.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            href="/docs/openui-lang/quickstart"
            text="Build with Default Library"
            variant="primary"
          />
          <Button
            href="/docs/openui-lang/defining-components"
            text="Define Component Library"
            variant="secondary"
          />
        </div>
      </div>

      <Separator className="my-8 sm:my-16" />

      {/* Key Features */}
      <div className="mb-12 sm:mb-20">
        <h2 className="mb-6 text-2xl font-bold sm:mb-8 sm:text-3xl">Key Features</h2>

        <FeatureCards>
          <FeatureCard
            icon={<Waves />}
            title="Streaming Native"
            description="Line-oriented syntax means the UI renders line-by-line. No waiting for valid JSON closing braces."
          />
          <FeatureCard
            icon={<Zap />}
            title="Token Efficient"
            description="Uses ~40% fewer tokens than equivalent JSON structures, significantly reducing inference cost and latency."
          />
          <FeatureCard
            icon={<Shield />}
            title="Hallucination Resistant"
            description="Strictly typed against your Zod schemas. If the generated code does not match your definition, it does not render."
          />
        </FeatureCards>
      </div>

      <Separator className="my-8 sm:my-16" />

      {/* Comparison */}
      <div className="mb-12 sm:mb-20">
        <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">JSON vs OpenUI Lang</h2>
        <p className="mb-6 text-sm text-slate-600 sm:mb-8 sm:text-base dark:text-slate-400">
          Compare the same UI component in both formats
        </p>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold sm:text-lg">JSON Format</h3>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                ~154 tokens
              </span>
            </div>
            <CodeBlock
              codeBlockClassName="h-100 overflow-y-auto"
              code={`{
  "type": "Card",
  "props": {
    "title": "Welcome Back",
    "description": "Continue your journey"
  },
  "children": [
    {
      "type": "Input",
      "props": {
        "label": "Email",
        "placeholder": "Enter your email",
        "type": "email"
      }
    },
    {
      "type": "Input",
      "props": {
        "label": "Password",
        "placeholder": "Enter password",
        "type": "password"
      }
    },
    {
      "type": "Button",
      "props": {
        "label": "Sign In",
        "variant": "primary"
      }
    }
  ]
}`}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold sm:text-lg">OpenUI Lang</h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                ~86 tokens
              </span>
            </div>
            <CodeBlock
              codeBlockClassName="h-100 overflow-y-auto"
              code={`root = Card([header, emailField, passwordField, signInButton])\nheader = CardHeader(\"Welcome Back\", \"Continue your journey\")\nemailField = FormControl(\"Email\", Input(\"email\", \"Enter your email\", \"email\"))\npasswordField = FormControl(\"Password\", Input(\"password\", \"Enter password\", \"password\"))\nsignInButton = Button(\"Sign In\", \"action:signIn\", \"primary\")\n`}
            />
          </div>
        </div>
      </div>

      <Separator className="my-8 sm:my-16" />

      {/* How It Works */}
      <div className="mb-12 sm:mb-20">
        <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">How It Works</h2>
        <p className="mb-6 text-sm text-slate-600 sm:mb-8 sm:text-base dark:text-slate-400">
          Click through each step to see the complete workflow
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeStep === index
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {index + 1}. {step.title}
            </button>
          ))}
        </div>

        <SimpleCard className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-fd-muted dark:bg-fd-muted">
                <span className="text-sm font-semibold text-fd-foreground">{activeStep + 1}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold sm:text-lg">{steps[activeStep].title}</h3>
                <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                  {steps[activeStep].description}
                </p>
              </div>
            </div>
          </div>

          <CodeBlock code={steps[activeStep].code} />

          <div className="mt-4 flex justify-between">
            <InlineButton
              variant="outline"
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
            >
              Previous
            </InlineButton>
            <InlineButton
              onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
              disabled={activeStep === steps.length - 1}
            >
              Next Step <ArrowRight className="ml-2 size-3" />
            </InlineButton>
          </div>
        </SimpleCard>
      </div>

      <Separator className="my-8 sm:my-16" />

      {/* Use Cases */}
      <div className="mb-12 sm:mb-20">
        <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl">Use Cases</h2>
        <p className="mb-6 text-sm text-slate-600 sm:mb-8 sm:text-base dark:text-slate-400">
          Real-world applications where OpenUI Lang excels
        </p>

        <FeatureCards>
          <FeatureCard
            icon={<BarChart3 />}
            title="Analytics Dashboards"
            description="Generate complex data visualizations and metric cards from natural language queries."
          />
          <FeatureCard
            icon={<MessageSquare />}
            title="AI Chat Interfaces"
            description="Stream UI components in real-time as the LLM generates responses."
          />
          <FeatureCard
            icon={<FileText />}
            title="Dynamic Forms"
            description="Build adaptive forms that change based on user input or context."
          />
        </FeatureCards>
      </div>
    </div>
  );
}
