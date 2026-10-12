import { uiSans, displaySerif } from "../fonts/app-fonts";

// The design system uses one face, the display serif, from the app-wide loader in
// src/fonts/app-fonts.ts, which exposes it as --font-display; --ds-font-serif reads that.
// The system pins it to wght 380 through --ds-font-variation (see tokens.ts).

/** Put on any wrapper to make the display serif available to the `--ds-font-*` tokens inside it,
 *  and the UI sans as --font-ui for interface controls (inputs and buttons). */
export const dsFontVariables = `${displaySerif.variable} ${uiSans.variable}`;
