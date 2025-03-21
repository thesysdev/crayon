import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const typeDocConfig = {
  sidebar: { pretty: true },

  indexFormat: "htmlTable",
  parametersFormat: "list",
  interfacePropertiesFormat: "htmlTable",
  classPropertiesFormat: "htmlTable",
  propertyMembersFormat: "htmlTable",
  typeDeclarationFormat: "list",
  typeDeclarationVisibility: "compact",
  useCodeBlocks: true,
  hidePageHeader: true,
  hidePageTitle: true,
  expandObjects: true,
  expandParameters: true,
  mergeReadme: true,
  formatWithPrettier: true,
  watch: process.env.TYPEDOC_WATCH,

  // typedoc options
  plugin: [
    "typedoc-plugin-markdown",
    "./custom/plugins/inject-custom-docs.mjs",
  ],
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

  headTags: [
    {
      tagName: "script",
      attributes: {},
      innerHTML: `
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D', {
            api_host: 'https://dgoeivjus9jfp.cloudfront.net',
            ui_host: 'https://us.posthog.com',
            person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
        })`,
    },
  ],
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
          href: "https://crayonai.org/ui/",
          label: "UI",
          position: "left",
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
              to: "/docs/reference/js/react-core",
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
      theme: prismThemes.nightOwlLight,
      darkTheme: prismThemes.nightOwl,
    },
  } satisfies Preset.ThemeConfig,
  plugins: [
    [
      "docusaurus-plugin-typedoc",
      {
        id: "react-core",
        entryPoints: ["../js/packages/react-core/src/index.ts"],
        tsconfig: "../js/packages/react-core/tsconfig.json",
        out: "./docs/reference/js/react-core",
        ...typeDocConfig,
      },
    ],
  ],
};

export default config;
