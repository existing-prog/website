import { test, expect, type Page } from "@playwright/test";

async function completeBrief(page: Page) {
  await page.goto("en/");
  await page.getByRole("button", { name: "Start a business website project" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your idea" })
    .fill("A professional website for my small independent business.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Your name", { exact: true }).fill("Alex Taylor");
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

test("unconfigured delivery keeps the email fallback without sending data", async ({
  page,
}) => {
  test.skip(Boolean(process.env.TEST_DIRECT_DELIVERY));
  let requests = 0;
  await page.route("https://formspree.io/**", (route) => {
    requests++;
    return route.abort();
  });
  await completeBrief(page);
  await expect(page.getByRole("link", { name: "Email project request" })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await expect(page.getByRole("button", { name: "Send project request" })).toHaveCount(0);
  expect(requests).toBe(0);
});

test.describe("configured delivery with intercepted requests only", () => {
  test.skip(
    !process.env.TEST_DIRECT_DELIVERY,
    "Run against the configured test build; no real message is sent.",
  );
  test("only a confirmed provider response produces success, and duplicate sends are disabled", async ({
    page,
  }) => {
    let requests = 0;
    await page.route("https://formspree.io/f/**", async (route) => {
      requests++;
      const data = route.request().postDataJSON();
      expect(data.email).toBe("alex@example.com");
      expect(data.message).toContain("A professional website");
      await route.fulfill({ json: { ok: true } });
    });
    await completeBrief(page);
    await page
      .getByRole("button", { name: "Save draft on this device", exact: true })
      .click();
    await page.evaluate(() => {
      const key = "lb-project-drafts-v1";
      const drafts = JSON.parse(localStorage.getItem(key)!);
      drafts.push({ ...drafts[0], id: "another-draft", company: "Another project" });
      localStorage.setItem(key, JSON.stringify(drafts));
      window.dispatchEvent(new StorageEvent("storage", { key }));
    });
    await page.getByRole("button", { name: "Send project request", exact: true }).click();
    await expect(page.locator(".request-delivery")).toHaveAttribute(
      "data-status",
      "sent",
    );
    await expect(
      page.getByRole("button", { name: "Request submitted", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Saved on this device", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Save draft on this device", exact: true }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
    await page
      .getByRole("button", { name: "Go to my project desk", exact: true })
      .click();
    await expect(page.locator(".draft-card")).toHaveCount(1);
    await expect(page.locator(".draft-card")).toContainText("Another project");
    await page.reload();
    await expect(page.locator(".draft-card")).toHaveCount(1);
    expect(requests).toBe(1);
  });
  test("rejected and interrupted requests retain the brief and offer email fallback", async ({
    page,
  }) => {
    let requests = 0;
    await page.route("https://formspree.io/f/**", async (route) => {
      requests++;
      if (requests === 1)
        await route.fulfill({ status: 422, json: { errors: [{ message: "Rejected" }] } });
      else await route.abort("failed");
    });
    await completeBrief(page);
    await page
      .getByRole("button", { name: "Save draft on this device", exact: true })
      .click();
    const send = page.getByRole("button", { name: "Send project request", exact: true });
    for (let attempt = 0; attempt < 2; attempt++) {
      await send.click();
      await expect(page.locator(".request-delivery")).toHaveAttribute(
        "data-status",
        "error",
      );
      await expect(page.locator(".review-brief")).toContainText("A professional website");
      await expect(
        page.getByRole("link", { name: "Email project request" }),
      ).toHaveAttribute("href", /^mailto:/);
      await expect(send).toBeEnabled();
      expect(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem("lb-project-drafts-v1")!).length,
        ),
      ).toBe(1);
    }
    expect(requests).toBe(2);
  });
  test("a storage cleanup failure keeps the accepted state and explains the remaining copy", async ({
    page,
  }) => {
    await page.route("https://formspree.io/f/**", (route) =>
      route.fulfill({ json: { ok: true } }),
    );
    await completeBrief(page);
    await page
      .getByRole("button", { name: "Save draft on this device", exact: true })
      .click();
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "lb-project-drafts-v1")
          throw new DOMException("Unavailable", "QuotaExceededError");
        original.call(this, key, value);
      };
    });
    await page.getByRole("button", { name: "Send project request", exact: true }).click();
    await expect(page.locator(".request-delivery")).toHaveAttribute(
      "data-status",
      "sent",
    );
    await expect(page.getByRole("alert")).toContainText(
      "could not remove its saved copy",
    );
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("lb-project-drafts-v1")!).length,
      ),
    ).toBe(1);
    await expect(
      page.getByRole("button", { name: "Request submitted", exact: true }),
    ).toBeDisabled();
  });
});
