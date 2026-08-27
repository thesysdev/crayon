import { deployToVercel } from "./vercel";
import {
  DEFAULT_DEPLOY_TARGET,
  DEPLOY_TARGETS,
  type DeployTarget,
  type DeployTargetOptions,
} from "../deploy/types";

export { DEFAULT_DEPLOY_TARGET, DEPLOY_TARGETS, type DeployTarget, type DeployTargetOptions };
export { deployToVercel };

/** Dispatch to a platform adapter. Add branches as new targets land. */
export async function deployToTarget(
  target: DeployTarget,
  opts: DeployTargetOptions,
): Promise<void> {
  switch (target) {
    case "vercel":
      return deployToVercel(opts);
    default: {
      const _exhaustive: never = target;
      throw new Error(`Unsupported deploy target: ${_exhaustive}`);
    }
  }
}
