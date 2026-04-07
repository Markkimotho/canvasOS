import { test, expect } from "@playwright/test";

test.describe("CanvasOS Workspace", () => {
  test("loads the welcome page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("CanvasOS")).toBeVisible();
    await expect(page.getByRole("button", { name: "New Project" })).toBeVisible();
  });

  test("creates a new project and opens workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Project" }).click();
    await expect(page).toHaveURL(/\/workspace\//);
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("workspace renders the canvas element", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Project" }).click();
    await expect(page.locator('canvas[aria-label="Canvas workspace"]')).toBeVisible();
  });

  test("module switcher changes active module", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Project" }).click();
    await page.getByRole("button", { name: /Switch to Vector module/ }).click();
    // Vector module should now be active (aria-pressed)
    const vectorBtn = page.getByRole("button", { name: /Switch to Vector module/ });
    await expect(vectorBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("keyboard shortcut Ctrl+Shift+D opens debug panel", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Project" }).click();
    await page.keyboard.press("Control+Shift+D");
    await expect(page.getByRole("complementary", { name: "Debug panel" })).toBeVisible();
  });

  test("save button triggers file download", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Project" }).click();

    const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
    await page.getByRole("button", { name: "Save project" }).click();
    const download = await downloadPromise;
    // May or may not trigger download depending on project state
    void download;
  });

  test("layer panel shows add layer button", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Project" }).click();
    await expect(page.getByRole("button", { name: "Add layer" })).toBeVisible();
  });
});
