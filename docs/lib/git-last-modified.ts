import { execFileSync } from "node:child_process";

function git(args: string[]): string {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const isShallowClone = git(["rev-parse", "--is-shallow-repository"]) === "true";

/**
 * Date of the last commit touching `paths`. Undefined when git is unavailable or the commit
 * is the cut-off point of a shallow clone, whose date is not the file's real last change.
 */
export function getGitLastModified(...paths: string[]): Date | undefined {
  const [date, parents] = git(["log", "-1", "--format=%cI|%P", "--", ...paths]).split("|");
  if (!date || (isShallowClone && !parents)) return undefined;
  return new Date(date);
}
