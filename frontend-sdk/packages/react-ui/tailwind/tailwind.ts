import plugin from "tailwindcss/plugin";
import { getComponentsDependencies } from "./utils";

interface CrayonPluginOptions {
  components?: (
    | "Accordion"
    | "Button"
    | "Card"
    | "Carousel"
    | "CheckBoxGroup"
    | "CheckBoxItem"
    | "FollowUpBlock"
    | "FollowUpItem"
    | "Footer"
    | "FormControl"
    | "Header"
    | "IconButton"
    | "Image"
    | "Input"
    | "ListBlock"
    | "ListItem"
    | "RadioGroup"
    | "RadioItem"
    | "Select"
    | "Shell"
    | "Slider"
    | "SwitchGroup"
    | "SwitchItem"
    | "Table"
    | "Tabs"
    | "Tag"
    | "TagBlock"
    | "TextArea"
    | "TextContent"
    | "fullscreen"
  )[];
}

const crayonPlugin = plugin.withOptions<CrayonPluginOptions>(
  ({ components }) =>
    async ({ addComponents }) => {
      const includeAllComponents = new Set<string>(["Shell"]);
      const includeAll =
        components?.some((component) => includeAllComponents.has(component)) ||
        !components;
      const dependencies = await getComponentsDependencies(components ?? []);

      const componentsToAdd = Array.from(
        new Set([...(components ?? []), ...dependencies]),
      );

      if (includeAll || componentsToAdd.includes("Accordion")) {
        addComponents({
          ".crayon-accordion": {
            boxSizing: "border-box",
            borderRadius: "6px",
            boxShadow: "var(--shadow-m)",
            border: "1px solid var(--strokes-default)",
          },
          ".crayon-accordion-item": {
            boxSizing: "border-box",
            overflow: "hidden",
            borderBottom: "1px solid var(--strokes-default)",
          },
          ".crayon-accordion-item-card .crayon-accordion-content-wrapper": {
            padding: "var(--spacing-l)",
            gap: "var(--spacing-l)",
          },
          ".crayon-accordion-item-sunk .crayon-accordion-trigger": {
            backgroundColor: "var(--sunk-fills)",
          },
          ".crayon-accordion-item-sunk .crayon-accordion-content": {
            backgroundColor: "var(--sunk-fills)",
          },
          ".crayon-accordion-item-sunk .crayon-accordion-content-wrapper": {
            padding: "var(--spacing-l)",
            gap: "var(--spacing-l)",
          },
          ".crayon-accordion-item:first-child": {
            marginTop: "0",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
          },
          ".crayon-accordion-item:last-child": {
            borderBottomLeftRadius: "4px",
            borderBottomRightRadius: "4px",
            borderBottom: "none",
          },
          ".crayon-accordion-item:focus-within": {
            position: "relative",
            zIndex: "1",
          },
          ".crayon-accordion-header": {
            display: "flex",
            marginBlockStart: "0",
            marginBlockEnd: "0",
            marginInlineStart: "0",
            marginInlineEnd: "0",
          },
          ".crayon-accordion-trigger": {
            border: "none",
            boxSizing: "border-box",
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
            backgroundColor: "rgba(0,0,0,0)",
            padding: "var(--spacing-xs)",
            width: "100%",
            flex: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--primary-text)",
            boxShadow: "var(--shadow-m)",
          },
          ".crayon-accordion-trigger-content": {
            display: "flex",
            alignItems: "center",
            color: "var(--primary-text)",
            gap: "var(--spacing-xs)",
          },
          ".crayon-accordion-trigger-content svg": {
            height: "14px",
            width: "14px",
          },
          ".crayon-accordion-trigger-icon": {
            color: "var(--primary-text)",
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
            height: "14px",
            width: "14px",
            transition: "transform 300ms cubic-bezier(0.87, 0, 0.13, 1)",
          },
          ".crayon-accordion-trigger[data-state=open] .crayon-accordion-trigger-icon":
            { transform: "rotate(180deg)" },
          ".crayon-accordion-content": {
            overflow: "hidden",
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
          },
          ".crayon-accordion-content[data-state=open]": {
            animation: "slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)",
          },
          ".crayon-accordion-content[data-state=closed]": {
            animation: "slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)",
          },
          ".crayon-accordion-content-wrapper": {
            boxSizing: "border-box",
            padding: "var(--spacing-l)",
            gap: "var(--spacing-l)",
          },
          "@keyframes slideDown": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "@keyframes slideUp": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Button")) {
        addComponents({
          ".crayon-button-base": {
            boxSizing: "border-box",
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
            padding: "var(--spacing-m)",
            borderRadius: "var(--rounded-m)",
            border: "1px solid rgba(0,0,0,0)",
            cursor: "pointer",
            transition: "all .2s ease",
            display: "flex",
            gap: "var(--spacing-2xs)",
            alignItems: "center",
          },
          ".crayon-button-base-primary": {
            backgroundColor: "var(--brand-el-fills)",
            color: "var(--brand-text)",
          },
          ".crayon-button-base-primary:hover": {
            backgroundColor: "var(--brand-el-hover-fills)",
          },
          ".crayon-button-base-primary:disabled": {
            opacity: "0.5",
            cursor: "not-allowed",
          },
          ".crayon-button-base-secondary": {
            backgroundColor: "var(--container-fills)",
            color: "var(--primary-text)",
            borderColor: "var(--strokes-default)",
          },
          ".crayon-button-base-secondary:hover": {
            backgroundColor: "var(--container-hover-fills)",
          },
          ".crayon-button-base-secondary:disabled": {
            color: "var(--disabled-text)",
            borderColor: "var(--disabled-text)",
            cursor: "not-allowed",
          },
          ".crayon-button-base-tertiary": {
            backgroundColor: "rgba(0,0,0,0)",
            color: "var(--primary-text)",
          },
          ".crayon-button-base-tertiary:hover": {
            backgroundColor: "var(--container-hover-fills)",
          },
          ".crayon-button-base-tertiary:disabled": {
            color: "var(--disabled-text)",
            cursor: "not-allowed",
          },
          ".crayon-button-base-small": {
            padding: "var(--spacing-2xs) var(--spacing-xs)",
          },
          ".crayon-button-base-medium": {
            padding: "var(--spacing-xs) var(--spacing-m)",
          },
          ".crayon-button-base-large": {
            padding: "var(--spacing-s) var(--spacing-m)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Card")) {
        addComponents({
          ".crayon-card": {
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-l)",
            border: "1px solid rgba(0,0,0,0)",
            boxSizing: "border-box",
            color: "var(--primary-text)",
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
          },
          ".crayon-card-card": {
            padding: "var(--spacing-l)",
            borderRadius: "var(--rounded-3xl)",
            borderColor: "var(--strokes-default)",
            backgroundColor: "var(--container-fills)",
            boxShadow: "none",
          },
          ".crayon-card-clear": {
            padding: "0px var(--spacing-l)",
            borderRadius: "var(--rounded-3xl)",
            backgroundColor: "rgba(0,0,0,0)",
            boxShadow: "none",
          },
          ".crayon-card-sunk": {
            padding: "var(--spacing-l)",
            borderRadius: "var(--rounded-3xl)",
            backgroundColor: "var(--sunk-fills)",
            borderColor: "var(--strokes-default)",
            boxShadow: "var(--shadow-m)",
          },
          ".crayon-card-standard": { width: "80%" },
          ".crayon-card-full": { width: "100%" },
        });
      }

      if (includeAll || componentsToAdd.includes("Carousel")) {
        addComponents({
          ".crayon-carousel": { position: "relative", display: "flex" },
          ".crayon-carousel-content": {
            position: "relative",
            display: "flex",
            width: "100%",
            gap: "var(--spacing-xl)",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            msOverflowX: "hidden",
            scrollbarWidth: "none",
          },
          ".crayon-carousel-content::-webkit-scrollbar": { display: "none" },
          ".crayon-carousel-content>*": {
            boxSizing: "border-box",
            scrollSnapAlign: "start",
          },
          ".crayon-carousel-item": {
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-s)",
            minWidth: "200px",
            maxWidth: "200px",
            borderRadius: "var(--rounded-m)",
            padding: "var(--spacing-m)",
            border: "1px solid var(--strokes-default)",
          },
          ".crayon-carousel-button": {
            position: "absolute",
            top: "50%",
            zIndex: "10",
            transform: "translateY(-50%)",
          },
          ".crayon-carousel-button-left": { left: "0" },
          ".crayon-carousel-button-right": { right: "0" },
        });
      }

      if (includeAll || componentsToAdd.includes("CheckBoxGroup")) {
        addComponents({
          ".crayon-checkbox-group": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-2xs)",
            border: "1px solid",
            borderRadius: "var(--rounded-m)",
          },
          ".crayon-checkbox-group-clear": {
            borderColor: "rgba(0,0,0,0)",
            backgroundColor: "rgba(0,0,0,0)",
            padding: "var(--spacing-0)",
          },
          ".crayon-checkbox-group-card": {
            borderColor: "var(--strokes-default)",
            padding: "var(--spacing-l)",
          },
          ".crayon-checkbox-group-sunk": {
            borderColor: "var(--strokes-default)",
            backgroundColor: "var(--sunk-fills)",
            padding: "var(--spacing-l)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("CheckBoxItem")) {
        addComponents({
          ".crayon-checkbox-item-container": {
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-2xs)",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
            paddingTop: "var(--spacing-3xs)",
            paddingBottom: "var(--spacing-3xs)",
            paddingLeft: "var(--spacing-0)",
            paddingRight: "var(--spacing-2xs)",
          },
          ".crayon-checkbox-item-root": {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "14px",
            height: "14px",
            borderRadius: "2px",
            border: "1px solid var(--stocks-interactive-el)",
            backgroundColor: "var(--container-fills)",
            cursor: "pointer",
          },
          ".crayon-checkbox-item-root:not(:disabled):hover": {
            borderColor: "var(--stocks-interactive-el-hover)",
          },
          ".crayon-checkbox-item-root:disabled": {
            cursor: "not-allowed",
            color: "var(--disabled-text)",
          },
          ".crayon-checkbox-item-indicator": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          ".crayon-checkbox-item-label": { flex: "1" },
          ".crayon-checkbox-item-label:disabled": {
            color: "var(--disabled-text)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("FollowUpBlock")) {
        addComponents({
          ".crayon-follow-up-block": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-3xs)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("FollowUpItem")) {
        addComponents({
          ".crayon-follow-up-item": {
            padding: { "0": "0", "1": "var(--spacing-xs) var(--spacing-s)" },
            border: "0",
            background: "rgba(0,0,0,0)",
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
            boxSizing: "border-box",
            borderBottom: "1px solid var(--strokes-default)",
            backgroundColor: "rgba(0,0,0,0)",
            gap: "var(--spacing-xs)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            cursor: "pointer",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Footer")) {
        addComponents({
          ".crayon-footer": {
            display: "flex",
            width: "100%",
            gap: "var(--spacing-m)",
            boxSizing: "border-box",
          },
          ".crayon-footer-horizontal": {
            flexDirection: "row",
            flexWrap: "wrap",
          },
          ".crayon-footer-vertical": { flexDirection: "column" },
        });
      }

      if (includeAll || componentsToAdd.includes("FormControl")) {
        addComponents({
          ".crayon-form-control": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xs)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Header")) {
        addComponents({
          ".crayon-header": {
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-2xs)",
            overflowWrap: "break-word",
          },
          ".crayon-header-top": {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
          ".crayon-header-top-left": {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "var(--spacing-s)",
            color: "var(--primary-text)",
            font: "var(--font-title)",
            letterSpacing: "var(--font-title-letter-spacing)",
          },
          ".crayon-header-top-right": {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "var(--spacing-2xs)",
          },
          ".crayon-header-bottom": {
            color: "var(--secondary-text)",
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("IconButton")) {
        addComponents({
          ".crayon-icon-button": {
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(0,0,0,0)",
            gap: "var(--spacing-xs)",
            cursor: "pointer",
            transition: "all .2s ease",
          },
          ".crayon-icon-button:disabled": {
            opacity: "0.5",
            cursor: "not-allowed",
          },
          ".crayon-icon-button-primary": {
            backgroundColor: "var(--brand-el-fills)",
            borderColor: "var(--strokes-default)",
            color: "var(--brand-text)",
          },
          ".crayon-icon-button-secondary": {
            borderColor: "var(--strokes-default)",
            color: "var(--primary-text)",
          },
          ".crayon-icon-button-tertiary": {
            backgroundColor: "rgba(0,0,0,0)",
            borderColor: "rgba(0,0,0,0)",
            color: "var(--primary-text)",
          },
          ".crayon-icon-button-extra-small": {
            width: "20px",
            height: "20px",
            boxShadow: "var(--shadow-s)",
          },
          ".crayon-icon-button-extra-small svg": {
            height: "14px",
            width: "14px",
          },
          ".crayon-icon-button-small": {
            width: "28px",
            height: "28px",
            boxShadow: "var(--shadow-s)",
          },
          ".crayon-icon-button-small svg": { height: "14px", width: "14px" },
          ".crayon-icon-button-medium": {
            width: "32px",
            height: "32px",
            boxShadow: "var(--shadow-m)",
          },
          ".crayon-icon-button-medium svg": { height: "16px", width: "16px" },
          ".crayon-icon-button-large": {
            width: "36px",
            height: "36px",
            minWidth: "36px",
            minHeight: "36px",
            fontSize: "16px",
            boxShadow: "var(--shadow-l)",
          },
          ".crayon-icon-button-large svg": { height: "16px", width: "16px" },
          ".crayon-icon-button-square": { borderRadius: "var(--rounded-s)" },
          ".crayon-icon-button-circle": { borderRadius: "var(--rounded-full)" },
        });
      }

      if (includeAll || componentsToAdd.includes("Image")) {
        addComponents({
          ".image": {
            display: "flex",
            boxSizing: "border-box",
            maxWidth: "100%",
            height: "auto",
            overflow: "clip",
            borderRadius: "var(--rounded-m)",
            border: "1px solid var(--strokes-default)",
            backgroundColor: "var(--container-fills)",
          },
          ".image-fit": { objectFit: "contain", width: "100%", height: "100%" },
          ".image-fill": { objectFit: "cover", width: "100%", height: "100%" },
        });
      }

      if (includeAll || componentsToAdd.includes("Input")) {
        addComponents({
          ".crayon-input": {
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
            border: "1px solid var(--strokes-default)",
            borderRadius: "var(--rounded-xs)",
            boxSizing: "border-box",
            width: "100%",
            gap: "var(--spacing-xs)",
          },
          ".crayon-input-small": {
            padding: "var(--spacing-2xs) var(--spacing-s)",
          },
          ".crayon-input-medium": {
            padding: "var(--spacing-xs) var(--spacing-s)",
          },
          ".crayon-input-large": { padding: "var(--spacing-s)" },
          ".crayon-input:focus": { outline: "none", borderColor: "#4800ff" },
          ".crayon-input:disabled": {
            backgroundColor: "var(--container-fills)",
            border: "1px solid var(--strokes-default)",
            cursor: "not-allowed",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("ListBlock")) {
        addComponents({
          ".crayon-list-block": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: "1px solid var(--strokes-default)",
            borderRadius: "var(--rounded-m)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("ListItem")) {
        addComponents({
          ".crayon-list-item": {
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--spacing-2xs)",
            borderBottom: "1px solid var(--strokes-default)",
            padding: "var(--spacing-s)",
            cursor: "pointer",
          },
          ".crayon-list-item:last-child": { borderBottom: "none" },
          ".crayon-list-item svg": { color: "var(--secondary-text)" },
          ".crayon-list-item .crayon-list-item-content": {
            boxSizing: "border-box",
            flex: "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
          },
          ".crayon-list-item .crayon-list-item-title": {
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
            color: "var(--primary-text)",
          },
          ".crayon-list-item .crayon-list-item-subtitle": {
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
            color: "var(--secondary-text)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("RadioGroup")) {
        addComponents({
          ".crayon-radio-group": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-2xs)",
            border: "1px solid",
            borderRadius: "var(--rounded-m)",
          },
          ".crayon-radio-group-clear": {
            borderColor: "rgba(0,0,0,0)",
            backgroundColor: "rgba(0,0,0,0)",
            padding: "var(--spacing-0)",
          },
          ".crayon-radio-group-card": {
            borderColor: "var(--strokes-default)",
            padding: "var(--spacing-l)",
          },
          ".crayon-radio-group-sunk": {
            borderColor: "var(--strokes-default)",
            backgroundColor: "var(--sunk-fills)",
            padding: "var(--spacing-l)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("RadioItem")) {
        addComponents({
          ".crayon-radio-item-container": {
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-2xs)",
            paddingTop: "var(--spacing-3xs)",
            paddingBottom: "var(--spacing-3xs)",
            paddingLeft: "var(--spacing-0)",
            paddingRight: "var(--spacing-2xs)",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
          },
          ".crayon-radio-item-root": {
            boxSizing: "border-box",
            borderRadius: "var(--rounded-full)",
            border: "none",
            height: "14px",
            width: "14px",
            cursor: "pointer",
            backgroundColor: "rgba(0,0,0,0)",
          },
          ".crayon-radio-item-root[data-state]": { position: "relative" },
          ".crayon-radio-item-root:disabled": {
            opacity: "0.5",
            cursor: "not-allowed",
          },
          ".crayon-radio-item-svg": {
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          },
          ".crayon-radio-item-root[data-state=unchecked] .crayon-radio-item-svg-path":
            { fill: "var(--container-fills)" },
          ".crayon-radio-item-root:hover:not(:disabled) .crayon-radio-item-root[data-state=unchecked] .crayon-radio-item-svg-path":
            { fill: "var(--container-fills)" },
          ".crayon-radio-item-root[data-state=checked] .crayon-radio-item-svg-path":
            { fill: "var(--container-fills)" },
          ".crayon-radio-item-root[data-state=unchecked] .crayon-radio-item-svg-border":
            { stroke: "var(--stocks-interactive-el)" },
          ".crayon-radio-item-root[data-state=checked] .crayon-radio-item-svg-border":
            { stroke: "var(--stocks-interactive-el-hover)" },
          ".crayon-radio-item-root[data-state=checked] .crayon-radio-item-svg-inner":
            { fill: "var(--brand-el-fills)" },
          ".crayon-radio-item-root[data-state=unchecked] .crayon-radio-item-svg-inner":
            { fill: "var(--container-fills)" },
          ".crayon-radio-item-root[data-state=unchecked]:hover:not(:disabled) .crayon-radio-item-svg-inner":
            { fill: "var(--strokes-default)" },
        });
      }

      if (includeAll || componentsToAdd.includes("Select")) {
        addComponents({
          ".crayon-select-trigger": {
            boxSizing: "border-box",
            backgroundColor: "var(--background-fills)",
            color: "var(--primary-text)",
            font: "var(--font-label)",
            letterSpacing: "var(--font-label-letter-spacing)",
            border: "1px solid var(--strokes-default)",
            outline: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between",
          },
          ".crayon-select-trigger:hover": {
            background: "var(--container-hover-fills)",
            borderColor: "var(--stocks-interactive-el)",
            color: "var(--secondary-text)",
          },
          ".crayon-select-trigger:disabled": {
            backgroundColor: "var(--sunk-fills)",
            color: "var(--disabled-text)",
            borderColor: "var(--disabled-text)",
            cursor: "not-allowed",
          },
          ".crayon-select-trigger[data-state=open]": {
            borderColor: "var(--stocks-interactive-el)",
            backgroundColor: "var(--background-fills)",
          },
          ".crayon-select-trigger[data-placeholder]": {
            color: "var(--disabled-text)",
          },
          ".crayon-select-trigger-sm": {
            padding: "var(--spacing-2xs) var(--spacing-s)",
            borderRadius: "var(--rounded-2xs)",
          },
          ".crayon-select-trigger-md": {
            padding: "var(--spacing-xs) var(--spacing-s)",
            borderRadius: "var(--rounded-xs)",
          },
          ".crayon-select-trigger-lg": {
            padding: "var(--spacing-s)",
            borderRadius: "var(--rounded-s)",
          },
          ".crayon-select-trigger-icon": { height: "16px", width: "16px" },
          ".crayon-select-content": {
            boxSizing: "border-box",
            position: "relative",
            zIndex: "50",
            maxHeight: "380px",
            minWidth: "var(--radix-select-trigger-width)",
            overflow: "hidden",
            borderRadius: "var(--rounded-m)",
            backgroundColor: "var(--background-fills)",
            boxShadow: "var(--shadow-m)",
          },
          ".crayon-select-viewport": {
            boxSizing: "border-box",
            padding: "4px",
          },
          ".crayon-select-viewport[data-position=popper]": { width: "100%" },
          ".crayon-select-label": {
            boxSizing: "border-box",
            padding: "var(--spacing-xs) var(--spacing-s)",
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
          },
          ".crayon-select-item": {
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
            cursor: "default",
            userSelect: "none",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "var(--rounded-s)",
            paddingTop: "6px",
            paddingBottom: "6px",
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
            color: "var(--primary-text)",
            outline: "0",
          },
          ".crayon-select-item--with-tick": {
            paddingLeft: "var(--spacing-xs)",
            paddingRight: "var(--spacing-xl)",
          },
          ".crayon-select-item--without-tick": {
            paddingLeft: "var(--spacing-xs)",
            paddingRight: "var(--spacing-xl)",
          },
          ".crayon-select-item[data-disabled]": {
            pointerEvents: "none",
            opacity: "0.5",
          },
          ".crayon-select-item:focus": {
            backgroundColor: "var(--sunk-fills)",
            outline: "1px solid",
            outlineOffset: "-1px",
          },
          ".crayon-select-item[data-state=checked]": {
            backgroundColor: "var(--sunk-fills)",
            outline: "1px solid",
            outlineOffset: "-1px",
          },
          ".crayon-select-item-check-wrapper": {
            position: "absolute",
            right: "8px",
            height: "14px",
            width: "14px",
          },
          ".crayon-select-item-check-icon": {
            height: "16px",
            width: "16px",
            color: "#f0f8ff",
          },
          ".crayon-select-item-text": {
            flex: "1",
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
            color: "var(--disabled-text)",
          },
          ".crayon-select-item-value": { color: "var(--secondary-text)" },
          ".crayon-select-separator": {
            boxSizing: "border-box",
            margin: "4px -4px",
            height: "1px",
            borderTop: "1px solid",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Shell")) {
        addComponents({
          ".crayon-shell-mobile-header": { display: "none" },
          ".crayon-shell-container--mobile .crayon-shell-mobile-header": {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--spacing-m) var(--spacing-l)",
            backgroundColor: "var(--container-fills)",
          },
          ".crayon-shell-mobile-header-logo-container": {
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-m)",
            font: "var(--font-title-medium)",
            letterSpacing: "var(--font-title-medium-letter-spacing)",
          },
          ".crayon-shell-mobile-header-logo": {
            width: "32px",
            height: "32px",
            borderRadius: "var(--rounded-m)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Slider")) {
        addComponents({
          ".slider-root": {
            position: "relative",
            display: "flex",
            height: "20px",
            width: "100%",
            minWidth: "100px",
            maxWidth: "100%",
            touchAction: "none",
            userSelect: "none",
            alignItems: "center",
          },
          ".slider-track": {
            position: "relative",
            height: "6px",
            flexGrow: "1",
            borderRadius: "var(--rounded-full)",
            backgroundColor: "var(--sunk-fills)",
          },
          ".slider-range": {
            position: "absolute",
            height: "100%",
            borderRadius: "var(--rounded-full)",
            backgroundColor: "var(--brand-el-fills)",
          },
          ".slider-thumb": { outline: "none" },
          ".slider-thumb-handle": {
            display: "block",
            width: "16px",
            height: "16px",
            borderRadius: "var(--rounded-3xs)",
            outline: "1px solid var(--strokes-default)",
            backgroundColor: "var(--container-fills)",
            overflow: "hidden",
            boxShadow: "var(--shadow-s)",
          },
          ".slider-thumb-handle-inner": {
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--container-fills)",
            transition: "background-color .2s",
          },
          ".slider-thumb-handle-inner:hover": {
            backgroundColor: "var(--container-hover-fills)",
          },
          ".slider-thumb-handle-inner-dot": {
            width: "4px",
            height: "4px",
            borderRadius: "var(--rounded-full)",
            backgroundColor: "var(--brand-el-fills)",
          },
          ".slider-thumb-value": {
            font: "var(--font-label-small)",
            letterSpacing: "var(--font-label-small-letter-spacing)",
            position: "absolute",
            top: "-30px",
            left: "50%",
            borderRadius: "var(--rounded-2xs)",
            transform: "translateX(-50%)",
            backgroundColor: "var(--container-fills)",
            color: "var(--primary-text)",
            padding: "var(--spacing-2xs) var(--spacing-3xs)",
            boxShadow: "var(--shadow-m)",
            opacity: "0",
            transition: "opacity .2s",
          },
          ".slider-thumb-handle:hover .slider-thumb-value,.slider-thumb-handle:focus .slider-thumb-value":
            { opacity: "1" },
          ".slider-dots-dot": {
            position: "absolute",
            top: "1px",
            width: "4px",
            height: "4px",
            borderRadius: "var(--rounded-full)",
            backgroundColor: "var(--container-fills)",
            transform: "translateX(-50%)",
          },
          ".slider--disabled": { opacity: "0.5", pointerEvents: "none" },
        });
      }

      if (includeAll || componentsToAdd.includes("SwitchGroup")) {
        addComponents({
          ".crayon-switch-group": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-2xs)",
            border: "1px solid",
            borderRadius: "var(--rounded-m)",
          },
          ".crayon-switch-group-clear": {
            borderColor: "rgba(0,0,0,0)",
            backgroundColor: "rgba(0,0,0,0)",
            padding: "var(--spacing-0)",
          },
          ".crayon-switch-group-card": {
            borderColor: "var(--strokes-default)",
            padding: "var(--spacing-l)",
          },
          ".crayon-switch-group-sunk": {
            borderColor: "var(--strokes-default)",
            backgroundColor: "var(--sunk-fills)",
            padding: "var(--spacing-l)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("SwitchItem")) {
        addComponents({
          ".crayon-switch-item-container": {
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-2xs)",
            maxWidth: "100%",
            width: "100%",
            overflow: "hidden",
            paddingTop: "var(--spacing-3xs)",
            paddingBottom: "var(--spacing-3xs)",
            paddingLeft: "var(--spacing-0)",
            paddingRight: "var(--spacing-xs)",
          },
          ".crayon-switch-item-root": {
            position: "relative",
            display: "inline-block",
            height: "15px",
            width: "24px",
            cursor: "pointer",
            borderRadius: "var(--rounded-full)",
            padding: "var(--spacing-3xs)",
            border: "1px solid var(--strokes-default)",
            backgroundColor: "var(--background-fills)",
            transitionProperty: "background-color",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            transitionDuration: "150ms",
          },
          ".crayon-switch-item-root:not([data-disabled],[data-state=checked]):hover":
            { backgroundColor: "var(--sunk-fills)" },
          ".crayon-switch-item-root[data-state=checked]": {
            backgroundColor: "var(--brand-el-fills)",
          },
          ".crayon-switch-item-root[data-disabled]": {
            opacity: "0.5",
            cursor: "not-allowed",
          },
          ".crayon-switch-item-thumb": {
            position: "absolute",
            display: "block",
            height: "10px",
            width: "10px",
            borderRadius: "var(--rounded-full)",
            border: "1px solid var(--strokes-default)",
            backgroundColor: "var(--container-fills)",
            transform: "translateY(-50%) translateX(-1px)",
            transitionProperty: "transform",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            transitionDuration: "150ms",
            boxShadow: "var(--shadow-s)",
          },
          ".crayon-switch-item-thumb[data-state=checked]": {
            transform: "translateY(-50%) translateX(7.5px)",
            borderColor: "var(--stocks-interactive-el)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Table")) {
        addComponents({
          ".crayon-table-container": {
            position: "relative",
            width: "100%",
            overflow: "auto",
          },
          ".crayon-table": {
            font: "var(--font-label-heavy)",
            letterSpacing: "var(--font-label-heavy-letter-spacing)",
            width: "100%",
            captionSide: "bottom",
            borderCollapse: "collapse",
            border: "1px solid var(--strokes-default)",
          },
          ".crayon-table-header tr": {
            borderBottom: "1px solid var(--strokes-default)",
            borderTop: "1px solid var(--strokes-default)",
            backgroundColor: "var(--sunk-fills)",
          },
          ".crayon-table-header tr td": {
            borderLeft: "1px solid var(--strokes-default)",
          },
          ".crayon-table-body tr:last-child": {
            borderBottom: "1px solid var(--strokes-default)",
          },
          ".crayon-table-footer": {
            borderTop: "1px solid var(--strokes-default)",
          },
          ".crayon-table-footer>tr:last-child": { borderBottom: "0" },
          ".crayon-table-cell,.crayon-table-head": {
            padding: "var(--spacing-m)",
            border: "1px solid var(--strokes-default)",
          },
          ".crayon-table-head": { backgroundColor: "var(--sunk-fills)" },
          ".crayon-table-head .crayon-table-head-label": {
            font: "var(--font-label-heavy)",
            letterSpacing: "var(--font-label-heavy-letter-spacing)",
            color: "var(--primary-text)",
            display: "inline-flex",
            flexGrow: "1",
            justifyContent: "center",
          },
          ".crayon-table-head .crayon-table-head-content": {
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-2xs)",
          },
          ".crayon-table-caption": {
            font: "var(--font-label-heavy)",
            letterSpacing: "var(--font-label-heavy-letter-spacing)",
            color: "var(--primary-text)",
            marginTop: "var(--spacing-m)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Tabs")) {
        addComponents({
          ".crayon-tabs": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-m)",
          },
          ".crayon-tabs-clear .crayon-tabs-content": {
            padding: "var(--spacing-3xs) var(--spacing-xs)",
            border: "rgba(0,0,0,0)",
          },
          ".crayon-tabs-card .crayon-tabs-content": {
            padding: "var(--spacing-l)",
            border: "1px solid var(--strokes-default)",
          },
          ".crayon-tabs-sunk .crayon-tabs-content": {
            padding: "var(--spacing-l)",
            border: "1px solid var(--strokes-default)",
            backgroundColor: "var(--sunk-fills)",
          },
          ".crayon-tabs-list": {
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            gap: "var(--spacing-s)",
            border: "1px solid var(--strokes-default)",
            padding: "var(--spacing-2xs)",
            borderRadius: "var(--rounded-s)",
            backgroundColor: "rgba(0,0,0,0)",
          },
          ".crayon-tabs-trigger": {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-3xs)",
            boxSizing: "border-box",
            padding: "var(--spacing-2xs) var(--spacing-3xs)",
            border: "1px solid rgba(0,0,0,0)",
            borderRadius: "var(--rounded-xs)",
            width: "100%",
            backgroundColor: "var(--container-fills)",
            font: "var(--font-label)",
            letterSpacing: "var(--font-label-letter-spacing)",
          },
          ".crayon-tabs-trigger[data-state=active]": {
            backgroundColor: "var(--background-fills)",
            borderColor: "var(--strokes-default)",
          },
          ".crayon-tabs-trigger svg": { width: "14px", height: "14px" },
          ".crayon-tabs-content": {
            boxSizing: "border-box",
            padding: "var(--spacing-l)",
            border: "1px solid rgba(0,0,0,0)",
            borderRadius: "var(--rounded-m)",
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
          },
          ".crayon-tabs-content-inner": {
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-l)",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("Tag")) {
        addComponents({
          ".crayon-tag": {
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            maxWidth: "100%",
            height: "auto",
            border: "1px solid var(--strokes-default)",
            borderRadius: "var(--rounded-xs)",
            padding: "var(--spacing-3xs) var(--spacing-2xs)",
            background: "var(--sunk-fills)",
            font: "var(--font-body)",
            letterSpacing: "var(--font-body-letter-spacing)",
          },
          ".crayon-tag-icon": {
            display: "flex",
            alignItems: "center",
            marginRight: "var(--spacing-3xs)",
          },
          ".crayon-tag-text": { overflow: "hidden" },
        });
      }

      if (includeAll || componentsToAdd.includes("TagBlock")) {
        addComponents({
          ".crayon-tag-block": {
            boxSizing: "border-box",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-xs)",
            maxWidth: "100%",
          },
        });
      }

      if (includeAll || componentsToAdd.includes("TextArea")) {
        addComponents({
          ".crayon-textarea": {
            boxSizing: "border-box",
            width: "100%",
            border: "1px solid var(--strokes-default)",
            borderRadius: "var(--rounded-s)",
            padding: "var(--spacing-xs) var(--spacing-s)",
            gap: "var(--spacing-xs)",
            backgroundColor: "var(--container-fills)",
            color: "var(--primary-text)",
            outline: "none",
            resize: "none",
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
          },
          ".crayon-textarea:disabled": { cursor: "not-allowed" },
        });
      }

      if (includeAll || componentsToAdd.includes("TextContent")) {
        addComponents({
          ".text-content": {
            boxSizing: "border-box",
            font: "var(--font-primary)",
            letterSpacing: "var(--font-primary-letter-spacing)",
            border: "1px solid",
          },
          ".text-content-sunk": {
            padding: "var(--spacing-m)",
            background: "var(--sunk-fills)",
            borderRadius: "var(--rounded-m)",
            borderColor: "var(--strokes-default)",
          },
          ".text-content-card": {
            padding: "var(--spacing-m)",
            borderRadius: "var(--rounded-m)",
            borderColor: "var(--strokes-default)",
          },
          ".text-content-clear": { borderColor: "rgba(0,0,0,0)" },
        });
      }

      if (includeAll || componentsToAdd.includes("fullscreen")) {
        addComponents({
          ".cui-fullscreen-container": {
            height: "100vh",
            width: "100vw",
            padding: "1rem",
            display: "flex",
            gap: "1rem",
          },
          ".cui-fullscreen-sidebar": {
            width: "264px",
            height: "100%",
            borderWidth: "1px",
            borderColor: "rgba(0, 0, 0, 0.06)",
            flexShrink: "0",
            padding: ".67rem",
            borderRadius: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: ".5rem",
            backgroundColor: "rgb(255, 255, 255)",
            whiteSpace: "nowrap",
            overflow: "hidden",
          },
          ".cui-fullscreen-sidebar.cui-fullscreen-sidebar-closed": {
            width: "109px",
            height: "min-content",
          },
          ".cui-fullscreen-sidebar.cui-fullscreen-sidebar-closed>*": {
            display: "none",
          },
          ".cui-fullscreen-sidebar.cui-fullscreen-sidebar-closed .cui-fullscreen-sidebar-header":
            { display: "flex", width: "max-content" },
          ".cui-fullscreen-sidebar.cui-fullscreen-sidebar-closed .cui-fullscreen-sidebar-title":
            { display: "none" },
          ".cui-fullscreen-sidebar-header": {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: ".5rem",
          },
          ".cui-fullscreen-sidebar-header-title-icon": {
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
          },
          ".cui-fullscreen-sidebar-logo": {
            height: "1.5rem",
            width: "1.5rem",
            marginRight: ".5rem",
          },
          ".cui-fullscreen-sidebar-title": {
            fontSize: "1.15rem",
            fontWeight: "400",
            fontStyle: "normal",
            lineHeight: "1.5rem",
            color: "rgb(0, 0, 0)",
          },
          ".cui-fullscreen-sidebar-header-button": {
            display: "flex",
            alignItems: "center",
            borderRadius: ".5rem",
            padding: ".66rem",
            border: "1px solid rgba(0, 0, 0, 0.06)",
          },
          ".cui-fullscreen-search-input": {
            display: "flex",
            alignItems: "center",
            gap: ".25rem",
            padding: ".375rem .5rem",
            borderRadius: ".5rem",
            border: "1px solid rgba(0, 0, 0, 0.04)",
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
          ".cui-fullscreen-search-input-input": {
            flexGrow: "1",
            outline: "none",
            border: "none",
            backgroundColor: "transparent",
            fontSize: ".875rem",
            fontStyle: "normal",
            fontWeight: "400",
            lineHeight: "1.25rem",
          },
          ".cui-fullscreen-new-chat-button": {
            width: "100%",
            padding: ".5rem 1rem",
            borderRadius: ".66rem",
            backgroundColor: "rgb(0, 0, 0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "left",
            gap: ".5rem",
            color: "rgb(255, 255, 255)",
          },
          ".cui-fullscreen-new-chat-button:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
          },
          ".cui-fullscreen-thread-button": {
            width: "100%",
            padding: "8px",
            textAlign: "left",
            borderRadius: "10px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
            flexShrink: "0",
          },
          ".cui-fullscreen-thread-button-selected": {
            backgroundColor: "rgb(243, 244, 246)",
            outline: "1px solid rgba(0, 0, 0, 0.06)",
          },
          ".cui-fullscreen-thread-button-disabled": {
            width: "100%",
            padding: "8px",
            textAlign: "left",
            borderRadius: "10px",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
            flexShrink: "0",
            color: "rgba(0, 0, 0, 0.4)",
          },
          ".cui-fullscreen-thread-list": {
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          },
          ".cui-fullscreen-thread-list-group": {
            display: "flex",
            paddingLeft: "6px",
            color: "rgba(0, 0, 0, 0.4)",
          },
          ".cui-fullscreen-thread-container": {
            flexGrow: "1",
            flexShrink: "1",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            maxWidth: "800px",
            margin: "0 auto",
          },
          ".cui-fullscreen-scroll-area": {
            flexGrow: "1",
            flexShrink: "1",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          },
          ".cui-fullscreen-messages": {
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1rem",
          },
          ".cui-fullscreen-message": {
            padding: "1rem",
            borderRadius: ".375rem",
          },
          ".cui-fullscreen-message-user": {
            backgroundColor: "rgb(219, 234, 254)",
            marginLeft: "2rem",
          },
          ".cui-fullscreen-message-assistant": {
            backgroundColor: "rgb(243, 244, 246)",
            marginRight: "2rem",
          },
          ".cui-fullscreen-composer": {
            display: "flex",
            alignItems: "center",
            gap: ".67rem",
            padding: ".67rem",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            borderRadius: "1rem",
            overflow: "hidden",
          },
          ".cui-fullscreen-composer-input": {
            flexGrow: "1",
            padding: "0",
            resize: "none",
            height: "1.5em",
            outline: "none",
            overflow: "hidden",
            color: "rgb(0, 0, 0)",
          },
          ".cui-fullscreen-composer-button": {
            padding: "1rem",
            backgroundColor: "rgb(0, 0, 0)",
            color: "white",
            borderRadius: "1rem",
            border: "rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        });
      }
    },
);

export default crayonPlugin;
