import { expect, test } from "@playwright/test";

import { chooseAssistant } from "./helpers";

test("tablet landscape keeps the composer inside the chat panel", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Desktop viewport coverage");
  await page.setViewportSize({ width: 1024, height: 768 });
  await chooseAssistant(page);

  const chatPanel = page.getByRole("region", { name: "Chat panel" });
  const composer = page.getByRole("textbox", { name: "Message Orbit" });

  await expect(composer).toBeVisible();
  await expect(composer).toBeInViewport();

  const [panelBox, composerBox] = await Promise.all([chatPanel.boundingBox(), composer.boundingBox()]);
  expect(panelBox).not.toBeNull();
  expect(composerBox).not.toBeNull();
  expect(composerBox!.y + composerBox!.height).toBeLessThanOrEqual(panelBox!.y + panelBox!.height);
});

test("a lost WebGL context shows a functional retry fallback", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Desktop WebGL coverage");
  await page.setViewportSize({ width: 1440, height: 900 });
  await chooseAssistant(page);
  const canvas = page.locator("canvas");
  const preview = page.getByTestId("workspace-canvas");
  await expect(canvas).toHaveCount(1);
  await expect(preview).toHaveAttribute("data-canvas-generation", "0");
  await expect(preview).toHaveAttribute("data-context-events-ready", "true", { timeout: 15_000 });

  await canvas.dispatchEvent("webglcontextlost", { cancelable: true });

  // The recovery overlay may be shorter than a loaded parallel worker's polling
  // interval. The generation is the stable signal that automatic recovery ran.
  await expect(preview).toHaveAttribute("data-canvas-generation", "1", { timeout: 10_000 });
  await expect(preview).toHaveAttribute("data-context-events-ready", "true", { timeout: 15_000 });
  await expect(page.getByRole("status", { name: "3D preview unavailable" })).toHaveCount(0, { timeout: 10_000 });
  await expect(canvas).toHaveCount(1);

  await canvas.dispatchEvent("webglcontextlost", { cancelable: true });
  await expect(page.getByRole("status", { name: "3D preview unavailable" })).toBeVisible();
  await canvas.dispatchEvent("webglcontextrestored");
  await expect(page.getByRole("status", { name: "3D preview unavailable" })).toHaveCount(0);

  await canvas.dispatchEvent("webglcontextlost", { cancelable: true });
  await page.getByRole("button", { name: "Retry 3D preview" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
});
