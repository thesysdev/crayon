import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const typeDocConfig = {
  sidebar: {
    autoConfiguration: false,
  },

  parametersFormat: "htmlTable",
  interfacePropertiesFormat: "htmlTable",
  classPropertiesFormat: "htmlTable",
  propertyMembersFormat: "htmlTable",
  typeDeclarationFormat: "htmlTable",
  typeDeclarationVisibility: "compact",
  useCodeBlocks: true,
  hidePageHeader: true,
  hidePageTitle: true,
  expandObjects: true,
  expandParameters: true,

  // typedoc options
  plugin: ["typedoc-plugin-markdown"],
};

const config: Config = {
  title: "CrayonAI",
  tagline: "Generative UI SDK",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://crayonai.org",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "thesysdev",
  projectName: "crayonai",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/thesysdev/crayon/tree/main/docs",
          sidebarCollapsible: false,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    image: "img/social-card.png",
    navbar: {
      title: "CrayonAI",
      logo: {
        alt: "CrayonAI Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          type: "docSidebar",
          sidebarId: "referenceSidebar",
          position: "left",
          label: "Reference",
        },
        {
          href: "https://github.com/thesysdev/crayon",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://www.thesys.dev",
          label: "Thesys",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Docs",
              to: "/docs",
            },
            {
              label: "JS Reference",
              to: "/docs/reference/js",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Discord",
              href: "https://discord.gg/Pbv5PsqUSv",
            },
            {
              label: "X",
              href: "https://x.com/thesysdev",
            },
          ],
        },
        {
          title: "Socials",
          items: [
            {
              label: "Linkedin",
              href: "https://www.linkedin.com/company/thesysdev/",
            },
            {
              label: "GitHub",
              href: "https://github.com/thesysdev/crayon",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} <a href="https://www.thesys.dev">Thesys, Inc.</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
  plugins: [
    [
      "docusaurus-plugin-typedoc",
      {
        id: "react-core",
        entryPoints: ["../frontend-sdk/packages/react-core/src/index.ts"],
        tsconfig: "../frontend-sdk/tsconfig.json",
        out: "./docs/reference/js/react-core",
        ...typeDocConfig,
      },
    ],

    [
      "docusaurus-plugin-typedoc",
      {
        id: "react-ui",
        entryPoints: ["../frontend-sdk/packages/react-ui/src/index.ts"],
        tsconfig: "../frontend-sdk/tsconfig.json",
        out: "./docs/reference/js/react-ui",
        ...typeDocConfig,
      },
    ],
  ],
};

export default config;
