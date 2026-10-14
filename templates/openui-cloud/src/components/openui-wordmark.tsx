type OpenUIWordmarkProps = { mode: "light" | "dark" };

// "OpenUI" wordmark on its own, no mascot. Used in the expanded sidebar.
export function OpenUIWordmark({ mode }: OpenUIWordmarkProps) {
  return (
    <div className="openui-agent-sidebar-header__agent-name">
      <img
        src={mode === "dark" ? "/openui-wordmark-dark.svg" : "/openui-wordmark.svg"}
        alt="OpenUI"
      />
    </div>
  );
}
