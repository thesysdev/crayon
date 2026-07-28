import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import path from "node:path";

const themes = ["light", "dark"] as const;
const screenshotStyles = path.join(__dirname, "screenshot.css");

for (const theme of themes) {
  test(`demos page is visually correct in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem("theme", selectedTheme);
    }, theme);

    await page.goto("/demos");

    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByRole("heading", { level: 1, name: "What do you want to build?" }),
    ).toBeVisible();

    const accessibility = await new AxeBuilder({ page }).include(".app-body").analyze();
    expect(accessibility.violations, `${theme} theme accessibility violations`).toEqual([]);

    await expect(page.locator(".app-body")).toHaveScreenshot(`demos-${theme}.png`, {
      stylePath: screenshotStyles,
    });
  });
}
