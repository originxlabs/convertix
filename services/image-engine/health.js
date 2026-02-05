export async function checkPlaywright() {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    await browser.close();
    return true;
  } catch {
    
    return false;
  }
}

