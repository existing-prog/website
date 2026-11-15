import { test, expect } from "@playwright/test";
for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440, 1920]) {
  test(`layout fits ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("heading", { name: /Your business.*Impossible/ }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      ribbon: document.querySelector(".service-ribbon")!.getBoundingClientRect()
        .height,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
    expect(dimensions.ribbon).toBeLessThanOrEqual(60);
    await expect(page.locator(".project-card")).toHaveCount(3);
    await expect(page.locator(".service-budget")).toHaveText([
      "€600–€1,200",
      "€1,200–€2,400",
      "€45 / hour",
    ]);
    await page
      .getByRole("button", { name: "Start a project", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const dialog = await page.getByRole("dialog").boundingBox();
    expect(dialog!.width).toBeLessThanOrEqual(width);
    expect(
      await page
        .locator(".builder-content")
        .evaluate((e) => e.scrollWidth - e.clientWidth),
    ).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Close project planner" }).click();
    expect(errors).toEqual([]);
  });
}
test("project request validates, saves, reloads, resumes and exports", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("");
  await page
    .getByRole("button", { name: "Start a business website project" })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tell me a little more." }),
  ).toBeVisible();
  await page.getByLabel("How many pages?").selectOption("2–5 pages");
  await page.getByLabel("Preferred timeline").selectOption("1–3 months");
  await page.getByLabel("Subtle animations").check();
  await page
    .getByRole("textbox", { name: "Your idea" })
    .fill(
      "A distinctive website for my independent design studio, with projects and enquiries.",
    );
  await page.getByLabel("Existing website").fill("https://example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Who’s behind the idea?" }),
  ).toBeVisible();
  await page.getByLabel("Your name", { exact: true }).fill("Alex Taylor");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("alex@example.com");
  await page.getByLabel("Business or project name").fill("Studio Taylor");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your next chapter, outlined." }),
  ).toBeVisible();
  const href = await page
    .getByRole("link", { name: "Email project request" })
    .getAttribute("href");
  expect(href).toContain("mailto:lucasberdy@gmail.com");
  expect(decodeURIComponent(href!)).toContain("Subtle animations");
  expect(decodeURIComponent(href!)).toContain("€1,200–€2,400");
  await expect(page.locator(".review-budget strong")).toHaveText(
    "€1,200–€2,400",
  );
  await expect(page.locator(".review-quote strong")).toHaveText(
    "Written quote to approve",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download brief" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("lucas-berdy-project-brief.txt");
  await page.getByRole("button", { name: "Save draft on this device" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.getByRole("button", { name: "Go to my project desk" }).click();
  await expect(page.locator(".draft-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Studio Taylor", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Studio Taylor", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue project" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Subtle animations")).toBeChecked();
  await expect(page.getByLabel("How many pages?")).toHaveValue("2–5 pages");
  await page.getByRole("button", { name: "Close project planner" }).click();
  await expect(
    page.getByRole("button", { name: "Continue project" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Delete Studio Taylor draft" })
    .click();
  await expect(page.locator(".draft-card")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".empty-desk")).toBeVisible();
});
test("mobile menu, filters, preview switching, and Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByRole("link", { name: "Project desk", exact: true }).click();
  await expect(page.locator(".empty-desk")).toBeVisible();
  await page.getByRole("link", { name: "Back to the services" }).click();
  await expect(page.locator("#services")).toBeInViewport();
  await page.getByRole("button", { name: "Portfolios", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Frontend & performance" }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByRole("button", { name: "All work", exact: true }).click();
  await page.getByRole("button", { name: "Preview Kasa", exact: true }).click();
  await expect(page.locator(".window-bottom h2")).toHaveText("Kasa");
  await page
    .getByRole("button", { name: "Start a project", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start a project", exact: true }),
  ).toBeFocused();
});
test("corrupt local drafts fail safely and reduced motion is respected", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("");
  await page.evaluate(() =>
    localStorage.setItem(
      "lb-project-drafts-v1",
      '[{"service":"website","id":"x","updatedAt":"invalid"}]',
    ),
  );
  await page.goto("#workspace");
  await expect(page.locator(".empty-desk")).toBeVisible();
  await page
    .getByRole("link", { name: "Lucas Berdy home", exact: true })
    .first()
    .click();
  expect(
    await page
      .locator(".stage-star")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});

test("storage failure never claims a draft was saved", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("");
  await page.evaluate(() => {
    localStorage.setItem(
      "lb-project-drafts-v1",
      JSON.stringify([
        {
          id: "storage-test",
          updatedAt: new Date().toISOString(),
          service: "portfolio",
          pages: "One page / small update",
          extras: [],
          name: "Alex",
          email: "alex@example.com",
          company: "Storage test",
          website: "",
          timeline: "Flexible",
          brief:
            "A portfolio for my independent design work and creative projects.",
        },
      ]),
    );
  });
  await page.reload();
  await page.goto("#workspace");
  await page.getByRole("button", { name: "Continue project" }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Save draft on this device" }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "Browser storage is unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Save draft on this device" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Saved on this device", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download brief" }),
  ).toBeVisible();
});
