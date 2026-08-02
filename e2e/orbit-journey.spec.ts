import { expect, test } from "@playwright/test";

import { assistantStatus, chooseAssistant, sendMessage } from "./helpers";

test("Ava reacts through the complete persisted chat journey", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Desktop journey");

  await chooseAssistant(page, "Ava");
  await sendMessage(page, "Introduce yourself");

  await expect(assistantStatus(page)).toContainText("Ava is thinking");
  await expect(assistantStatus(page)).toContainText("Ava is responding");
  await expect(assistantStatus(page)).toContainText("Ava finished responding");
  await expect(page.getByText("Here is your Orbit response.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Work with Ava" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Message from You" }).getByText("Introduce yourself", { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Message from Ava" }).getByText("Here is your Orbit response.", { exact: true })).toBeVisible();
});

test("reduced motion is exposed as an effective workspace policy", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Desktop journey");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await chooseAssistant(page);
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("switch", { name: "Reduce motion" }).check();
  await page.getByRole("button", { name: "Close settings" }).click();

  await expect(page.getByRole("main", { name: "Orbit workspace" })).toHaveAttribute("data-motion", "reduced");
});
