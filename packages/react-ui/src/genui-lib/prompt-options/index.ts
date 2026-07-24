import type { PromptOptions } from "@openuidev/react-lang";

// Server-safe prompt data for the OpenUI component library.

// ── Examples ──

export const openuiExamples: string[] = [
  `Example 1 — Table (column-oriented):

root = Stack([title, tbl])
title = TextContent("Top Languages", "large-heavy")
tbl = Table([Col("Language", langs), Col("Users (M)", users), Col("Year", years)])
langs = ["Python", "JavaScript", "Java", "TypeScript", "Go"]
users = [15.7, 14.2, 12.1, 8.5, 5.2]
years = [1991, 1995, 1995, 2012, 2009]`,

  `Example 2 — Bar chart:

root = Stack([title, chart])
title = TextContent("Q4 Revenue", "large-heavy")
chart = BarChart(labels, [s1, s2], "grouped")
labels = ["Oct", "Nov", "Dec"]
s1 = Series("Product A", [120, 150, 180])
s2 = Series("Product B", [90, 110, 140])`,

  `Example 3 — Form with validation:

root = Stack([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, countryField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
countryField = FormControl("Country", Select("country", countryOpts, "Select...", { required: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
countryOpts = [SelectItem("us", "United States"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")]
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary"), Button("Cancel", Action([@ToAssistant("Cancel")]), "secondary")])`,

  `Example 4 — Tabs with mixed content:

root = Stack([title, tabs])
title = TextContent("React vs Vue", "large-heavy")
tabs = Tabs([tabReact, tabVue])
tabReact = TabItem("react", "React", reactContent)
tabVue = TabItem("vue", "Vue", vueContent)
reactContent = [TextContent("React is a library by Meta for building UIs."), Callout("info", "Note", "React uses JSX syntax.")]
vueContent = [TextContent("Vue is a progressive framework by Evan You."), Callout("success", "Tip", "Vue has a gentle learning curve.")]`,
];

export const openuiAdditionalRules: string[] = [
  'For grid-like layouts, use Stack with direction "row" and wrap=true. Avoid justify="between" unless you specifically want large gutters.',
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).",
  "Never nest Form inside Form.",
  'Use @Reset($var1, $var2) after form submit to restore defaults — not @Set($var, "")',
  "Multi-query refresh: Action([@Run(mutation), @Run(query1), @Run(query2), @Reset(...)])",
  "$variables are reactive: changing via Select or @Set re-evaluates all Queries and expressions referencing them",
  "Use existing components (Tabs, Accordion, Modal) before inventing ternary show/hide patterns",
];

export const openuiPromptOptions: PromptOptions = {
  examples: openuiExamples,
  additionalRules: openuiAdditionalRules,
};

// OpenUI Chat Library

export const openuiChatExamples: string[] = [
  `Example 1 — Table with follow-ups:

root = Card([title, tbl, followUps])
title = TextContent("Top Languages", "large-heavy")
tbl = Table([Col("Language", langs), Col("Users (M)", users), Col("Year", years)])
langs = ["Python", "JavaScript", "Java"]
users = [15.7, 14.2, 12.1]
years = [1991, 1995, 1995]
followUps = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Tell me more about Python")
fu2 = FollowUpItem("Show me a JavaScript comparison")`,

  `Example 2 — Clickable list:

root = Card([title, list])
title = TextContent("Choose a topic", "large-heavy")
list = ListBlock([item1, item2, item3])
item1 = ListItem("Getting started", "New to the platform? Start here.")
item2 = ListItem("Advanced features", "Deep dives into powerful capabilities.")
item3 = ListItem("Troubleshooting", "Common issues and how to fix them.")`,

  `Example 3 — Image carousel with consistent slides + follow-ups:

root = Card([header, carousel, followups])
header = CardHeader("Featured Destinations", "Discover highlights and best time to visit")
carousel = Carousel([[t1, img1, d1, tags1], [t2, img2, d2, tags2], [t3, img3, d3, tags3]], "card")
t1 = TextContent("Paris, France", "large-heavy")
img1 = ImageBlock("https://picsum.photos/seed/paris/800/500", "Eiffel Tower at night")
d1 = TextContent("City of light — best Apr–Jun and Sep–Oct.", "default")
tags1 = TagBlock(["Landmark", "City Break", "Culture"])
t2 = TextContent("Kyoto, Japan", "large-heavy")
img2 = ImageBlock("https://picsum.photos/seed/kyoto/800/500", "Bamboo grove in Arashiyama")
d2 = TextContent("Temples and bamboo groves — best Mar–Apr and Nov.", "default")
tags2 = TagBlock(["Temples", "Autumn", "Culture"])
t3 = TextContent("Machu Picchu, Peru", "large-heavy")
img3 = ImageBlock("https://picsum.photos/seed/machupicchu/800/500", "Inca citadel in the clouds")
d3 = TextContent("High-altitude Inca citadel — best May–Sep.", "default")
tags3 = TagBlock(["Andes", "Hike", "UNESCO"])
followups = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Show me only beach destinations")
fu2 = FollowUpItem("Turn this into a comparison table")`,

  `Example 4 — Form with validation:

root = Card([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary")])`,
];

export const openuiChatAdditionalRules: string[] = [
  "Every response is a single Card(children) — children stack vertically automatically. No layout params are needed on Card.",
  "Card is the only layout container. Do NOT use Stack. Use Tabs to switch between sections, Carousel for horizontal scroll.",
  "Use FollowUpBlock at the END of a Card to suggest what the user can do or ask next.",
  "Use ListBlock when presenting a set of options or steps the user can click to select.",
  "Use SectionBlock to group long responses into collapsible sections — good for reports, FAQs, and structured content.",
  "Use SectionItem inside SectionBlock: each item needs a unique value id, a trigger (header label), and a content array.",
  "Carousel takes an array of slides, where each slide is an array of content: carousel = Carousel([[t1, img1], [t2, img2]])",
  "IMPORTANT: Every slide in a Carousel must use the same component structure in the same order — e.g. all slides: [title, image, description, tags].",
  "For image carousels, always use real accessible URLs like https://picsum.photos/seed/KEYWORD/800/500. Never hallucinate or invent image URLs.",
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).",
  "Never nest Form inside Form.",
];

export const openuiChatPromptOptions: PromptOptions = {
  examples: openuiChatExamples,
  additionalRules: openuiChatAdditionalRules,
};
