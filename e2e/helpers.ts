import { expect, type Page } from "@playwright/test";

export async function chooseAssistant(page: Page, name: "Alex" | "Ava" = "Ava") {
  await page.goto("/");
  const selectionHeading = page.getByRole("heading", { name: "Choose your AI coworker" });
  const workspace = page.getByRole("main", { name: "Orbit workspace" });
  await expect(selectionHeading.or(workspace).first()).toBeVisible();
  if (await selectionHeading.isVisible()) {
    await page.getByRole("button", { name: `Select ${name}` }).click();
    await page.getByRole("button", { name: /enter workspace/i }).click();
  }
  await expect(workspace).toBeVisible();
}

export async function sendMessage(page: Page, content: string) {
  await page.getByRole("textbox", { name: "Message Orbit" }).fill(content);
  await page.getByRole("button", { name: "Send message" }).click();
}

export function assistantStatus(page: Page) {
  return page.locator(".chat-workspace__header").getByRole("status");
}
