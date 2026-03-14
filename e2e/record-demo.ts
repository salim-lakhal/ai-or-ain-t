import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = path.resolve(__dirname, '../node_modules/ffmpeg-static/ffmpeg');

async function recordDemo() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: {
      dir: path.resolve(__dirname, '../assets'),
      size: { width: 390, height: 844 },
    },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Onboarding
  await page.waitForTimeout(1500);
  await page.click('text=Next');
  await page.waitForTimeout(1000);
  await page.click('text=Next');
  await page.waitForTimeout(1000);
  await page.click('text=Start Swiping');
  await page.waitForTimeout(2000);

  // Swipe left (AI)
  const card = page.locator('[class*="cursor-grab"]');
  const box = await card.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 300, box.y + box.height / 2, { steps: 20 });
    await page.mouse.up();
  }
  await page.waitForTimeout(2000);

  // Dismiss feedback
  await page.click('text=Next Video');
  await page.waitForTimeout(2000);

  // Swipe right (Real)
  const card2 = page.locator('[class*="cursor-grab"]');
  const box2 = await card2.boundingBox();
  if (box2) {
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await page.mouse.down();
    await page.mouse.move(box2.x + box2.width + 300, box2.y + box2.height / 2, { steps: 20 });
    await page.mouse.up();
  }
  await page.waitForTimeout(2000);

  await page.close();
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (videoPath) {
    console.log(`Recording saved: ${videoPath}`);

    // Convert to GIF
    const gifPath = path.resolve(__dirname, '../assets/demo.gif');
    execSync(
      `"${FFMPEG}" -y -i "${videoPath}" -vf "fps=6,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" -loop 0 "${gifPath}"`,
    );
    console.log(`GIF saved: ${gifPath}`);

    // Convert to MP4 for release
    const mp4Path = path.resolve(__dirname, '../assets/demo.mp4');
    execSync(
      `"${FFMPEG}" -y -i "${videoPath}" -c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p "${mp4Path}"`,
    );
    console.log(`MP4 saved: ${mp4Path}`);
  }
}

recordDemo().catch(console.error);
