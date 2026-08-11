import { expect, test } from "@playwright/test";

const STORAGE_KEY = "devtools-thanks-shown";
const SHOW_DELAY_MS = 6000;
const AUTO_DISMISS_MS = 10000;

test.describe("thank-you toast", () => {
  test("appears top center as a rectangle, then auto-dismisses after 10s", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText(/Thanks for using DataFormatter/)).toBeHidden();

    await page.waitForTimeout(SHOW_DELAY_MS + 700);
    const toast = page.getByRole("status").filter({ hasText: /Thanks for using/ });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("bookmark this tool");

    const box = await toast.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    expect(box!.x + box!.width / 2).toBeCloseTo((viewport!.width ?? 0) / 2, 0);
    expect(box!.y).toBeLessThan((viewport!.height ?? 0) / 3);

    // It is a wide rectangle, not a small centered dialog.
    expect(box!.width).toBeGreaterThan(300);

    await page.waitForTimeout(AUTO_DISMISS_MS + 700);
    await expect(toast).toBeHidden();

    // Dismissal happened automatically — the flag is persisted so it never returns.
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe("1");
  });

  test("Got it dismisses immediately and persists for future visits", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(SHOW_DELAY_MS + 700);
    const toast = page.getByRole("status").filter({ hasText: /Thanks for using/ });
    await expect(toast).toBeVisible();

    await page.getByRole("button", { name: "Got it" }).click();
    await expect(toast).toBeHidden();

    await page.reload();
    await page.waitForTimeout(SHOW_DELAY_MS + 700);
    await expect(page.getByText(/Thanks for using DataFormatter/)).toBeHidden();
  });
});