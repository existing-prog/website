import { test, expect } from "@playwright/test";

test("native planner options have explicit contrasting text and backgrounds", async ({
  page,
}) => {
  await page.goto("en/");
  await page.getByRole("button", { name: "Start a business website project" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const select = page.getByLabel("How many pages?");
  await expect(select.locator("option").first()).toHaveCSS("color", "rgb(23, 34, 52)");
  await expect(select.locator("option").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await select.selectOption("2–5 pages");
  await expect(select).toHaveValue("2–5 pages");
});
