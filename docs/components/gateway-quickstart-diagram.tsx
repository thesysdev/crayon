import { AppWindow, Blocks, Bot, FileCode, Server, Sparkles } from "lucide-react";
import { Arrow, DiagramFrame, Label, Node } from "./diagram-kit";

/** gateway/generate-openui-lang: one request from the app, through Gateway, and back as a UI. */
export function GatewayQuickstartDiagram() {
  const m = "gateway-quickstart";
  return (
    <DiagramFrame
      id={m}
      title="Generating OpenUI Lang through OpenUI Gateway"
      description="Your component library is exported once with the OpenUI CLI as a library specification. Your app sends the user's request to your server, which adds a system prompt generated from the specification and calls OpenUI Gateway. Gateway sends the request to a model provider and retries another provider if one is unavailable. It checks the OpenUI Lang the model writes against your library and corrects eligible errors while it streams. Your server streams the corrected OpenUI Lang back to your app, where the Renderer shows the interface with your components."
      width={1020}
      height={450}
      minWidth={640}
    >
      <Node
        x={10}
        y={30}
        width={230}
        height={210}
        icon={AppWindow}
        title="Your app"
        lines={["The Renderer shows", "the UI as it streams"]}
      />
      <Node
        x={395}
        y={30}
        width={230}
        height={210}
        icon={Server}
        title="Your server"
        lines={["Adds the system", "prompt made from", "the library spec"]}
      />
      <Node
        x={780}
        y={30}
        width={230}
        height={210}
        icon={Sparkles}
        title="OpenUI Gateway"
        lines={["Retries providers", "Corrects OpenUI Lang", "as it streams"]}
        highlight
      />

      <Arrow marker={m} x1={244} y1={110} x2={389} y2={110} />
      <Label x={317} y={98}>
        Request
      </Label>
      <Arrow marker={m} x1={391} y1={160} x2={246} y2={160} />
      <Label x={317} y={182}>
        Stream
      </Label>

      <Arrow marker={m} x1={629} y1={110} x2={774} y2={110} />
      <Label x={702} y={98}>
        Prompt
      </Label>
      <Arrow marker={m} x1={776} y1={160} x2={631} y2={160} />
      <Label x={702} y={182}>
        OpenUI Lang
      </Label>

      {/* Gateway and the model provider it routes to. */}
      <Node
        x={780}
        y={320}
        width={230}
        height={120}
        icon={Bot}
        title="Model providers"
        lines={["OpenAI, Anthropic, …"]}
      />
      <Arrow marker={m} x1={860} y1={244} x2={860} y2={314} />
      <Label x={848} y={284} anchor="end">
        Request
      </Label>
      <Arrow marker={m} x1={930} y1={316} x2={930} y2={246} />
      <Label x={942} y={284} anchor="start">
        Output
      </Label>

      {/* Set up once: the library the Renderer uses, exported as the spec the server reads. */}
      <Node
        x={10}
        y={320}
        width={230}
        height={120}
        icon={Blocks}
        title="Component library"
        lines={["Your components"]}
      />
      <Node
        x={395}
        y={320}
        width={230}
        height={120}
        icon={FileCode}
        title="Library spec"
        lines={["openui.spec.json"]}
      />
      <Arrow marker={m} x1={244} y1={380} x2={389} y2={380} dashed />
      <Label x={317} y={368}>
        CLI
      </Label>
      <Arrow marker={m} x1={125} y1={316} x2={125} y2={246} dashed />
      <Arrow marker={m} x1={510} y1={316} x2={510} y2={246} dashed />
    </DiagramFrame>
  );
}
