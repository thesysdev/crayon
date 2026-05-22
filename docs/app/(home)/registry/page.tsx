import {
  BadgeCheck,
  Bot,
  Boxes,
  Code2,
  ExternalLink,
  Github,
  MonitorSmartphone,
  Package,
  PlugZap,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import { PillLink } from "../components/Button/Button";
import { Footer } from "../sections/Footer/Footer";
import styles from "./page.module.css";

type RegistryStatus = "Official" | "Community";

interface RegistryLink {
  label: string;
  href: string;
  external?: boolean;
}

interface RegistryItem {
  name: string;
  description: string;
  type: string;
  status: RegistryStatus;
  accent: "blue" | "green" | "purple" | "orange" | "slate";
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  links: RegistryLink[];
}

const registryItems: RegistryItem[] = [
  {
    name: "OpenUI Forge",
    description:
      "A coding-assistant toolkit for generating and wiring OpenUI integrations across common AI stacks.",
    type: "Tool",
    status: "Community",
    accent: "purple",
    icon: Wrench,
    links: [{ label: "GitHub", href: "https://github.com/OthmanAdi/openui-forge", external: true }],
  },
  {
    name: "Open WebUI Plugin",
    description: "Bring OpenUI-rendered interactive responses into Open WebUI chat workflows.",
    type: "Plugin",
    status: "Community",
    accent: "blue",
    icon: PlugZap,
    links: [
      { label: "GitHub", href: "https://github.com/thesysdev/openwebui-plugin", external: true },
      {
        label: "Guide",
        href: "https://openwebui.com/posts/generative_ui_plugin_for_open_webui_6c017d62",
        external: true,
      },
      { label: "Open WebUI", href: "https://openwebui.com", external: true },
    ],
  },
  {
    name: "Ollama Integration",
    description:
      "Use OpenUI with local Ollama models through an OpenAI-compatible route or an Open WebUI workflow.",
    type: "Provider",
    status: "Community",
    accent: "green",
    icon: Bot,
    links: [
      { label: "Providers", href: "/docs/chat/providers" },
      {
        label: "Article",
        href: "https://dev.to/shogun444/i-tested-openui-with-ollama-models-heres-what-actually-worked-45m7",
        external: true,
      },
      { label: "Ollama", href: "https://ollama.com", external: true },
    ],
  },
  {
    name: "Genui VS Code Extension",
    description:
      "Preview `.openui` files live in VS Code and Open VSX-compatible editors while agents write OpenUI Lang.",
    type: "Extension",
    status: "Community",
    accent: "blue",
    icon: Code2,
    links: [
      {
        label: "VS Code",
        href: "https://marketplace.visualstudio.com/items?itemName=Ginaphi.generative-ui",
        external: true,
      },
      {
        label: "Open VSX",
        href: "https://open-vsx.org/extension/ginaphi/generative-ui",
        external: true,
      },
    ],
  },
  {
    name: "OpenClaw OS Plugin",
    description: "Use OpenUI inside OpenClaw OS through the external OpenClaw plugin package.",
    type: "Plugin",
    status: "Official",
    accent: "orange",
    icon: Sparkles,
    links: [
      { label: "Website", href: "/openclaw-os" },
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openclaw-os/tree/main/packages/claw-plugin",
        external: true,
      },
    ],
  },
  {
    name: "OpenUI Plotly",
    description:
      "Scaffold a Next.js generative UI chat with typed Plotly chart components for data-heavy responses.",
    type: "Package",
    status: "Community",
    accent: "purple",
    icon: Package,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/vishxrad/openui-plotly",
        external: true,
      },
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@vishxrad/openui-plotly?activeTab=readme",
        external: true,
      },
    ],
  },
  {
    name: "Vue Lang",
    description: "Define OpenUI component libraries and render OpenUI Lang responses in Vue 3.",
    type: "Framework",
    status: "Official",
    accent: "green",
    icon: Code2,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui/tree/main/packages/vue-lang",
        external: true,
      },
      { label: "npm", href: "https://www.npmjs.com/package/@openuidev/vue-lang", external: true },
    ],
  },
  {
    name: "Svelte Lang",
    description: "Define OpenUI component libraries and render OpenUI Lang responses in Svelte 5.",
    type: "Framework",
    status: "Official",
    accent: "orange",
    icon: Code2,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui/tree/main/packages/svelte-lang",
        external: true,
      },
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@openuidev/svelte-lang",
        external: true,
      },
    ],
  },
  {
    name: "React Native Example",
    description: "A mobile chat example showing OpenUI rendered in a React Native application.",
    type: "Example",
    status: "Official",
    accent: "slate",
    icon: MonitorSmartphone,
    links: [
      { label: "Docs", href: "/docs/openui-lang/examples/react-native" },
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui/tree/main/examples/openui-react-native",
        external: true,
      },
    ],
  },
];

const highlights = [
  {
    label: "Community contributions",
    value: registryItems.filter((item) => item.status === "Community").length.toString(),
    icon: Users,
  },
  { label: "Projects", value: registryItems.length.toString(), icon: Boxes },
  {
    label: "Official projects",
    value: registryItems.filter((item) => item.status === "Official").length.toString(),
    icon: BadgeCheck,
  },
];

export const metadata: Metadata = {
  title: "OpenUI Registry",
  description: "Plugins, packages, tools, templates, and integrations built around OpenUI.",
  alternates: { canonical: "/registry" },
  openGraph: {
    title: "OpenUI Registry",
    description:
      "Discover plugins, packages, tools, templates, and integrations built around OpenUI.",
    url: "/registry",
    type: "website",
  },
  twitter: {
    title: "OpenUI Registry",
    description:
      "Discover plugins, packages, tools, templates, and integrations built around OpenUI.",
    card: "summary_large_image",
  },
};

function ExternalIndicator({ external }: { external?: boolean }) {
  if (!external) return null;
  return <ExternalLink className={styles.linkIcon} strokeWidth={1.8} aria-hidden="true" />;
}

function LinkIcon({ label }: { label: string }) {
  if (label === "GitHub") {
    return <Github className={styles.linkIcon} strokeWidth={1.8} aria-hidden="true" />;
  }

  return <ExternalIndicator external />;
}

export default function RegistryPage() {
  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>OpenUI registry</div>
            <h1 className={styles.title}>OpenUI Registry</h1>
            <p className={styles.subtitle}>
              A curated registry of official and community projects that extend OpenUI across
              plugins, framework packages, local-model workflows, editor tools, and starter
              examples.
            </p>
            <div className={styles.heroActions}>
              <PillLink
                className={styles.primaryAction}
                href="https://github.com/thesysdev/openui/issues"
                external
              >
                Submit a project
                <ExternalLink className={styles.actionIcon} strokeWidth={1.8} aria-hidden="true" />
              </PillLink>
            </div>
          </div>

          <div className={styles.heroPanel} aria-label="Registry summary">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div className={styles.metricTile} key={item.label}>
                  <Icon className={styles.metricIcon} strokeWidth={1.8} aria-hidden="true" />
                  <span className={styles.metricValue}>{item.value}</span>
                  <span className={styles.metricLabel}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.directorySection} id="directory">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Directory</p>
            <h2 className={styles.sectionTitle}>Featured projects</h2>
          </div>
          <p className={styles.sectionDescription}>
            A curated starting point for projects that extend OpenUI beyond the core SDK.
          </p>
        </div>

        <div className={styles.grid}>
          {registryItems.map((item) => {
            const Icon = item.icon;

            return (
              <article className={styles.card} data-accent={item.accent} key={item.name}>
                <div className={styles.cardTop}>
                  <div className={styles.iconFrame}>
                    <Icon className={styles.cardIcon} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className={styles.tags}>
                    <span className={styles.statusTag} data-status={item.status}>
                      {item.status}
                    </span>
                    <span className={styles.typeTag}>{item.type}</span>
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
                <div className={styles.cardLinks}>
                  {item.links.map((link) => (
                    <a
                      className={styles.cardLink}
                      href={link.href}
                      key={`${item.name}-${link.label}`}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {link.label === "GitHub" ? (
                        <LinkIcon label={link.label} />
                      ) : (
                        <ExternalIndicator external={link.external} />
                      )}
                      {link.label}
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.submitSection}>
        <div className={styles.submitCopy}>
          <p className={styles.sectionKicker}>Contribute</p>
          <h2 className={styles.sectionTitle}>Add your project</h2>
          <p className={styles.sectionDescription}>
            Open an issue or PR with the package link, a short description, install steps,
            maintainer contact, license, and whether it is official, community-maintained, or
            experimental.
          </p>
        </div>
        <PillLink
          className={styles.primaryAction}
          href="https://github.com/thesysdev/openui/issues"
          external
        >
          Submit a project
          <ExternalLink className={styles.actionIcon} strokeWidth={1.8} aria-hidden="true" />
        </PillLink>
      </section>

      <Footer />
    </main>
  );
}
