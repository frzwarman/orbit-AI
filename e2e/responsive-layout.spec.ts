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
