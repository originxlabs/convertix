import { chromium } from "playwright";

export async function checkPlaywright() {
  try {
    const browser = await chromium.launch();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}
