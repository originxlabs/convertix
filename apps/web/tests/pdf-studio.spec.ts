import { test, expect } from "@playwright/test";

test("PDF Studio tool grid renders and each tool route loads", async ({ page }) => {
  await page.goto("/x-pdf", { waitUntil: "domcontentloaded" });

  const heading = page.getByRole("heading", { name: /professional pdf workflows/i });
  await expect(heading).toBeVisible();

  const cards = page.locator("[data-tool-card]");
  const cardCount = await cards.count();
  expect(cardCount).toBeGreaterThan(0);

  const badgeCount = await cards.locator(".tool-badge").count();
  expect(badgeCount).toBeGreaterThan(0);

  const hrefs = await cards.evaluateAll((nodes) =>
    nodes
      .map((node) => node.closest("a")?.getAttribute("href"))
      .filter((href): href is string => Boolean(href))
  );

  for (const href of hrefs) {
    await page.goto(href, { waitUntil: "domcontentloaded" });
    const pageHeading = page.getByRole("heading").first();
    await expect(pageHeading).toBeVisible();
  }
});
