import { test, expect } from "@playwright/test";
for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440, 1920]) {
  test(`layout fits ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("heading", { name: /Your business.*Impossible/ }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
    await expect(page.locator(".service-ribbon")).toHaveCount(0);
    await expect(page.locator(".project-card")).toHaveCount(3);
    await expect(page.locator(".service-budget")).toHaveText([
      "€600–€1,200",
      "€1,200–€2,400",
      "€45 / hour",
    ]);
    await page
      .getByRole("button", { name: "Start a project", exact: true })
      .first()
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
  await page.goto("en/");
  await page.getByRole("button", { name: "Start a business website project" }).click();
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
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.com");
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
  await expect(page.locator(".review-budget strong")).toHaveText("€1,200–€2,400");
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
  await expect(page.getByRole("button", { name: "Continue project" })).toBeFocused();
  await page.getByRole("button", { name: "Delete the draft Studio Taylor" }).click();
  await expect(page.locator(".draft-card")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".empty-desk")).toBeVisible();
});
test("mobile menu, filters, preview switching, and Escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("en/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.getByRole("link", { name: "Project desk", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page.getByRole("navigation")).toBeHidden();
  await page.getByRole("button", { name: "Portfolios", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Frontend & performance" }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByRole("button", { name: "All work", exact: true }).click();
  await page.getByRole("button", { name: "Preview Kasa", exact: true }).click();
  await expect(page.locator(".window-bottom h2")).toHaveText("Kasa");
  await page
    .getByRole("button", { name: "Start a project", exact: true })
    .first()
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start a project", exact: true }).first(),
  ).toBeFocused();
});
test("corrupt local drafts fail safely and reduced motion is respected", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("en/");
  await page.evaluate(() =>
    localStorage.setItem(
      "lb-project-drafts-v1",
      '[{"service":"website","id":"x","updatedAt":"invalid"}]',
    ),
  );
  await page.goto("en/desk/");
  await expect(page.locator(".empty-desk")).toBeVisible();
  await page.getByRole("link", { name: "Lucas Berdy home", exact: true }).first().click();
  expect(
    await page
      .locator(".glass-halo span")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});

test("storage failure never claims a draft was saved", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("en/");
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
          brief: "A portfolio for my independent design work and creative projects.",
        },
      ]),
    );
  });
  await page.reload();
  await page.goto("en/desk/");
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
  await expect(page.getByRole("button", { name: "Download brief" })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`offer hierarchy and accessible project cards at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("en/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".hero-copy > p")).toHaveText(
      "I design and build websites for independent businesses and professionals.",
    );
    await expect(page.locator(".hero-actions .button")).toHaveAccessibleName(
      "Start a project",
    );
    expect(await page.locator("#top").evaluate((e) => e.nextElementSibling?.id)).toBe(
      "work",
    );
    await expect(
      page.locator(".hero-overline,.stage-label,.stage-caption,.hero-bottom"),
    ).toHaveCount(0);
    for (const name of ["Samantha Ramsey", "Kasa", "Nina Carducci"])
      await expect(
        page
          .locator(".project-card")
          .filter({ has: page.getByRole("heading", { name, exact: true }) }),
      ).toHaveAccessibleName(name);
    await expect(page.locator("#project-samantha-description")).toContainText(
      "I designed and developed",
    );
    for (const button of await page.locator(".preview-controls button").all()) {
      const r = await button.boundingBox();
      expect(r!.width).toBeGreaterThanOrEqual(44);
      expect(r!.height).toBeGreaterThanOrEqual(44);
    }
    const result = await page.locator("#project-samantha-description").evaluate((e) => {
      const style = getComputedStyle(e);
      let parent: Element | null = e;
      let bg = "";
      while (parent) {
        bg = getComputedStyle(parent).backgroundColor;
        if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") break;
        parent = parent.parentElement;
      }
      const luminance = (c: string) => {
        const rgb = c
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const a = luminance(style.color),
        b = luminance(bg);
      return {
        font: parseFloat(style.fontSize),
        contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
    expect(result.font).toBeGreaterThanOrEqual(14);
    expect(result.contrast).toBeGreaterThanOrEqual(4.5);
    for (const selector of [
      ".project-card .project-details p",
      ".pricing-disclaimer",
      ".service-card-bottom small",
    ])
      for (const node of await page.locator(selector).all())
        expect(
          await node.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
        ).toBeGreaterThanOrEqual(14);
  });
}

test("desktop project sequence follows scroll and preselects the right services", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/");
  const story = page.locator(".project-stories");
  await expect(story).toHaveAttribute("data-enhanced", "true");
  const cases = [
    ["samantha", "Samantha Ramsey", "Portfolio"],
    ["kasa", "Kasa", "Business website"],
    ["nina", "Nina Carducci", "Website care"],
  ];
  for (const [id, name, service] of cases) {
    await page
      .locator(`#chapter-${id}`)
      .evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(story).toHaveAttribute("data-active", id);
    await expect(page.locator(`.story-stage [data-scene="${id}"]`)).toBeVisible();
    await page
      .getByRole("button", {
        name: `Start a project like ${name}`,
        exact: true,
      })
      .click();
    await expect(page.locator(".service-option.chosen strong")).toHaveText(service);
    await page.getByRole("button", { name: "Close project planner" }).click();
  }
  await page.getByRole("button", { name: "Show Samantha Ramsey", exact: true }).click();
  await expect(story).toHaveAttribute("data-active", "samantha");
  await page.getByRole("button", { name: "Frontend & performance", exact: true }).click();
  await expect(page.locator(".project-chapter")).toHaveCount(2);
  await expect(story).toHaveAttribute("data-active", "kasa");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(story).toHaveAttribute("data-enhanced", "false");
  await expect(page.locator(".story-stage")).toBeHidden();
});

test("phone project animations remain inline and allow skipping to services", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("en/");
  await expect(page.locator(".project-stories")).toHaveAttribute(
    "data-enhanced",
    "false",
  );
  for (const id of ["samantha", "kasa", "nina"]) {
    const chapter = page.locator(`#chapter-${id}`);
    await chapter.evaluate((e) =>
      e.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    await expect(chapter.locator(".chapter-visual")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  }
  await page.getByRole("link", { name: "Skip to services", exact: true }).click();
  await expect(page.locator("#services")).toBeInViewport();
});

test("reduced motion shows every project without a sticky animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("en/");
  await expect(page.locator(".project-stories")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await expect(page.locator(".project-stories")).toHaveAttribute(
    "data-enhanced",
    "false",
  );
  await expect(page.locator(".story-stage")).toBeHidden();
  for (const id of ["samantha", "kasa", "nina"]) {
    const visual = page.locator(`#chapter-${id} .chapter-visual`);
    await expect(visual).toBeVisible();
    await expect(visual.locator(".story-browser")).toHaveCount(1);
    await expect(visual.locator(".story-browser")).toHaveCSS("opacity", "1");
  }
  await page
    .getByRole("button", {
      name: "Start a project like Nina Carducci",
      exact: true,
    })
    .click();
  await expect(page.locator(".service-option.chosen strong")).toHaveText("Website care");
});
