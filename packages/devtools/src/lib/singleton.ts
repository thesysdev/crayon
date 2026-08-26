import { useEffect, useState } from "react";

/**
 * Cross-instance (and cross-bundle-copy) registry that elects a single
 * OpenUIDevtools instance to actually render. Keyed on globalThis via
 * Symbol.for so duplicate copies of this module (ESM/CJS dual builds,
 * multiple package versions) still share one registry.
 *
 * Election rule: manually mounted instances outrank auto-mounted ones
 * (react-lang's Renderer auto-mounts a widget; a host that renders
 * <OpenUIDevtools /> itself — possibly with custom props — should win).
 * Ties break by mount order. When the owner unmounts, the next candidate
 * takes over.
 */

interface Claimant {
  auto: boolean;
  notify: (isOwner: boolean) => void;
}

interface Registry {
  claimants: Claimant[];
}

const REGISTRY_KEY = Symbol.for("openui.devtools.singleton");

function getRegistry(): Registry {
  const store = globalThis as { [REGISTRY_KEY]?: Registry };
  return (store[REGISTRY_KEY] ??= { claimants: [] });
}

function electOwner(registry: Registry): void {
  const winner = registry.claimants.find((c) => !c.auto) ?? registry.claimants[0];
  for (const claimant of registry.claimants) claimant.notify(claimant === winner);
}

/**
 * Returns true only for the elected OpenUIDevtools instance; all others
 * should render nothing.
 */
export function useDevtoolsSingleton(auto: boolean): boolean {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const registry = getRegistry();
    const claimant: Claimant = { auto, notify: setIsOwner };
    registry.claimants.push(claimant);
    electOwner(registry);
    return () => {
      const index = registry.claimants.indexOf(claimant);
      if (index !== -1) registry.claimants.splice(index, 1);
      electOwner(registry);
    };
  }, [auto]);

  return isOwner;
}
