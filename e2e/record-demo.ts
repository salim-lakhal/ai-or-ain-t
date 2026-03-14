import { chromium } from '@playwright/test';
import { execSync, spawn, ChildProcess } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FFMPEG = path.resolve(ROOT, 'node_modules/ffmpeg-static/ffmpeg');
const VITE_PORT = 5199;

const MOCK_VIDEOS = [
  {
    id: 'demo-1',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    label: 'real',
    description:
      'Natural movement of flowers in the wind is chaotic and hard for AI to replicate perfectly.',
  },
  {
    id: 'demo-2',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-286-large.mp4',
    label: 'ai',
    description:
      'AI generation often struggles with fluid dynamics, sometimes creating morphing shapes.',
  },
  {
    id: 'demo-3',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-white-cat-lying-among-the-grasses-seen-up-close-22732-large.mp4',
    label: 'real',
    description:
      'Animal fur is a high-detail texture. Real video maintains hair consistency across frames.',
  },
];

function startMockApi(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/api/health') {
        res.end(JSON.stringify({ status: 'ok', db: 'connected' }));
      } else if (req.url?.startsWith('/api/videos')) {
        res.end(JSON.stringify(MOCK_VIDEOS));
      } else if (req.url === '/api/swipes') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => res.end(JSON.stringify({ success: true })));
      } else if (req.url === '/api/seed') {
        res.end(JSON.stringify({ success: true, message: 'Seeded' }));
      } else {
        res.end(JSON.stringify({ message: 'Mock API' }));
      }
    });
    server.listen(3001, () => {
      console.log(`Mock API on :3001`);
      resolve(server);
    });
  });
}

function startVite(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vite', '--port', String(VITE_PORT), '--strictPort'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let started = false;
    proc.stdout?.on('data', (d: Buffer) => {
      if (!started && d.toString().includes('Local:')) {
        started = true;
        resolve(proc);
      }
    });
    proc.on('error', reject);
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(proc);
      }
    }, 20000);
  });
}

async function recordDemo() {
  const mockApi = await startMockApi();
  const viteProc = await startVite();
  await new Promise((r) => setTimeout(r, 2000));

  const browser = await chromium.launch({ headless: true });
  const assetsDir = path.resolve(ROOT, 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: assetsDir, size: { width: 390, height: 844 } },
  });

  const page = await context.newPage();
  await page.goto(`http://localhost:${VITE_PORT}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });

  // --- Onboarding (visible UI, spend time here) ---
  await page.waitForTimeout(2000);
  console.log('Step 1: Real or AI?');

  await page.click('text=Next');
  await page.waitForTimeout(2000);
  console.log('Step 2: How to Play');

  await page.click('text=Next');
  await page.waitForTimeout(2000);
  console.log('Step 3: Master the Skill');

  await page.click('text=Start Swiping');
  await page.waitForTimeout(1500);
  console.log('Game view');

  // --- Swipe using buttons (visible tap action) ---
  // Tap AI button
  console.log('Tapping AI button...');
  await page.click('button:has-text("AI")');
  await page.waitForTimeout(2500);

  // Feedback overlay should be visible
  console.log('Feedback shown, tapping Next Video...');
  try {
    await page.click('text=Next Video', { timeout: 5000 });
  } catch {
    console.log('No feedback overlay');
  }
  await page.waitForTimeout(1500);

  // Tap REAL button
  console.log('Tapping REAL button...');
  await page.click('button:has-text("REAL")');
  await page.waitForTimeout(2500);

  // Show feedback
  console.log('Second feedback shown');
  await page.waitForTimeout(1500);

  // Dismiss and show stats
  try {
    await page.click('text=Next Video', { timeout: 5000 });
  } catch {
    console.log('No feedback overlay');
  }
  await page.waitForTimeout(2000);

  // Close
  await page.close();
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  viteProc.kill('SIGTERM');
  mockApi.close();

  if (!videoPath) {
    console.error('No video recorded');
    process.exit(1);
  }

  console.log(`Webm: ${videoPath}`);

  // GIF
  const gifPath = path.resolve(assetsDir, 'demo.gif');
  console.log('Converting to GIF...');
  execSync(
    `"${FFMPEG}" -y -i "${videoPath}" -vf "fps=8,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" -loop 0 "${gifPath}"`,
  );
  const gifSize = (fs.statSync(gifPath).size / (1024 * 1024)).toFixed(1);
  console.log(`GIF: ${gifPath} (${gifSize} MB)`);

  // MP4
  const mp4Path = path.resolve(assetsDir, 'demo.mp4');
  console.log('Converting to MP4...');
  execSync(
    `"${FFMPEG}" -y -i "${videoPath}" -c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p "${mp4Path}"`,
  );
  const mp4Size = (fs.statSync(mp4Path).size / (1024 * 1024)).toFixed(1);
  console.log(`MP4: ${mp4Path} (${mp4Size} MB)`);

  fs.unlinkSync(videoPath);
  console.log('Done!');
}

recordDemo().catch((err) => {
  console.error('Recording failed:', err);
  process.exit(1);
});
