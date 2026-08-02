import { expect, test } from "@playwright/test";

import { chooseAssistant, sendMessage } from "./helpers";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile journey");
  await chooseAssistant(page);
});

test("mobile history and composer remain usable as the viewport changes", async ({ page }) => {
  const conversationsButton = page.getByRole("button", { name: "Open conversations" });
  const settingsButton = page.getByRole("button", { name: "Open settings" });
  const composer = page.getByRole("textbox", { name: "Message Orbit" });

  for (const control of [conversationsButton, settingsButton]) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  await sendMessage(page, "Mobile history check");
  await expect(page.getByText("Here is your Orbit response.")).toBeVisible();
  await conversationsButton.click();
  await expect(page.getByRole("dialog", { name: "Conversation drawer" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Mobile history check / })).toBeVisible();
  await page.getByRole("button", { name: "Close conversations" }).click();

  await page.setViewportSize({ width: 390, height: 620 });
  await expect(composer).toBeVisible();
  await expect(composer).toBeInViewport();
});

test("a stopped response keeps its partial output", async ({ page }) => {
  await sendMessage(page, "Stream a response");
  await expect(page.getByText("Here is", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Stop response" }).click();

  await expect(page.getByText("Response stopped before completion.")).toBeVisible();
  await expect(page.getByText("Here is", { exact: true })).toBeVisible();
});

test("3D can be disabled persistently without affecting chat", async ({ page }) => {
  await page.getByRole("button", { name: "Toggle assistant preview" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("switch", { name: "Enable 3D" }).uncheck();
  await page.getByRole("button", { name: "Close settings" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.reload();
  await expect(page.locator("canvas")).toHaveCount(0);
  await sendMessage(page, "Chat without 3D");
  await expect(page.getByText("Here is your Orbit response.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Message Orbit" })).toBeVisible();
});
