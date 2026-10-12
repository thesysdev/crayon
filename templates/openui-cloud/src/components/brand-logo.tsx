type BrandProps = { mode: "light" | "dark" };

// "OpenUI" wordmark on its own, no mascot. Used in the expanded sidebar.
export function BrandWordmark({ mode }: BrandProps) {
  return (
    <div className="openui-agent-sidebar-header__agent-name brand-wordmark">
      <img
        src={mode === "dark" ? "/brand-wordmark-text-dark.svg" : "/brand-wordmark-text.svg"}
        alt="OpenUI"
      />
    </div>
  );
}
