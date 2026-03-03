"use client";

import "@openuidev/react-ui/styles/index.css";

import {
  Button,
  Callout,
  Card,
  CardHeader,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tag,
  ThemeProvider,
} from "@openuidev/react-ui";

function ComponentShowcase({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <CardHeader title={label} />

      <Button variant="primary">Primary Action</Button>

      <Input placeholder="Type something here…" />

      <Select defaultValue="opt1">
        <SelectTrigger>
          <SelectValue placeholder="Pick an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt1">Option One</SelectItem>
          <SelectItem value="opt2">Option Two</SelectItem>
          <SelectItem value="opt3">Option Three</SelectItem>
        </SelectContent>
      </Select>

      <Card>
        <CardHeader title="Card Title" subtitle="Subtitle text here" />
        <div style={{ padding: "0 16px 16px" }}>Card body content goes here.</div>
      </Card>

      <Callout
        variant="info"
        title="Information"
        description="This is an informational callout to test semantic colors."
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag text="Neutral" />
        <Tag text="Info" variant="info" />
        <Tag text="Success" variant="success" />
        <Tag text="Warning" variant="warning" />
        <Tag text="Danger" variant="danger" />
      </div>
    </div>
  );
}

function SectionDivider() {
  return <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "32px 0" }} />;
}

export default function ThemeTestPage() {
  return (
    <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>ThemeProvider Test Page</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Visual verification of ThemeProvider scoping, fallbacks, and nesting.
      </p>

      {/* Section 1: No ThemeProvider */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
          1. No ThemeProvider (CSS fallback test)
        </h2>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
          Components render with zero wrapping. CSS var() fallbacks should apply.
        </p>
        <ComponentShowcase label="Unwrapped components" />
      </section>

      <SectionDivider />

      {/* Section 2: Light ThemeProvider */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>2. Light ThemeProvider</h2>
        <ThemeProvider mode="light">
          <ComponentShowcase label="mode=light" />
        </ThemeProvider>
      </section>

      <SectionDivider />

      {/* Section 3: Dark ThemeProvider */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>3. Dark ThemeProvider</h2>
        <ThemeProvider mode="dark" cssSelector=".openui-theme-dark">
          <div
            style={{ background: "#1a1a1a", padding: 24, borderRadius: 12 }}
            className="openui-theme-dark"
          >
            <ComponentShowcase label="mode=dark" />
          </div>
        </ThemeProvider>
      </section>

      <SectionDivider />

      {/* Section 4: Nested Scoping */}

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
          4. Nested Scoping (light outer, dark inner)
        </h2>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 12 }}>
          Inner dark scope must not leak into the outer light scope.
        </p>
        <ThemeProvider mode="light">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <ComponentShowcase label="Outer — light" />
            </div>
            <ThemeProvider mode="dark">
              <div
                style={{
                  flex: 1,
                  minWidth: 300,
                  background: "#1a1a1a",
                  padding: 24,
                  borderRadius: 12,
                }}
              >
                <ComponentShowcase label="Inner — dark (nested)" />
              </div>
            </ThemeProvider>
          </div>
        </ThemeProvider>
      </section>
    </div>
  );
}
