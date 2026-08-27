import * as Observability from "@openuidev/observability-cloud";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Render events reach the Thesys reliability dashboard
// (console.thesys.dev/reliability) only when a client API key is configured.
const thesysClientApiKey = import.meta.env.VITE_THESYS_CLIENT_API_KEY;
if (thesysClientApiKey) {
  Observability.init({ apiKey: thesysClientApiKey });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
