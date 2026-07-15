import { root } from "@lynx-js/react";
import "@lynx-js/react/debug";

import { App } from "./App.js";

root.render(<App />);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept();
}
