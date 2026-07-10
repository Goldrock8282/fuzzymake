// Uçtan uca test: sunucuyu başlatır, gerçek tarayıcıyla (Chromium) siteyi
// kullanır — video yükler, ayar seçer, işlemi başlatır, sonucu doğrular.
// Çalıştırma: npm test  (önce `npm run make-test-video` gerekir)
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fixture = path.join(root, 'test', 'fixtures', 'old-video-160x120.mp4');
const shotsDir = path.join(root, 'test', 'screenshots');
mkdirSync(shotsDir, { recursive: true });

const PORT = 3456;
const BASE = `http://localhost:${PORT}`;

let failed = 0;
function check(name, cond, detail = '') {
  const ok = Boolean(cond);
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
}

function probe(file) {
  const out = execFileSync(ffprobePath, [
    '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file,
  ]);
  const data = JSON.parse(out);
  const v = data.streams.find((s) => s.codec_type === 'video');
  const a = data.streams.find((s) => s.codec_type === 'audio');
  return {
    width: v.width,
    height: v.height,
    duration: parseFloat(data.format.duration),
    hasAudio: Boolean(a),
  };
}

if (!existsSync(fixture)) {
  console.error('Önce test videosunu üretin: npm run make-test-video');
  process.exit(1);
}

// --- Sunucuyu başlat --------------------------------------------------------
const server = spawn('node', [path.join(root, 'server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Sunucu açılmadı')), 15000);
  server.stdout.on('data', (c) => {
    if (String(c).includes('çalışıyor')) { clearTimeout(timer); resolve(); }
  });
  server.on('exit', () => reject(new Error('Sunucu erken kapandı')));
});
console.log('Sunucu hazır:', BASE);

let browser;
try {
  // Ortamda önceden kurulu Chromium'u kullan (varsa); yoksa Playwright'ınkini.
  const preinstalled = '/opt/pw-browsers/chromium';
  browser = await chromium.launch(
    existsSync(preinstalled) ? { executablePath: preinstalled } : {}
  );
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1) Sayfa açılışı
  await page.goto(BASE);
  check('Sayfa yüklendi', (await page.title()).includes('Video Upscale'));
  await page.screenshot({ path: path.join(shotsDir, '1-anasayfa.png') });

  // 2) AI modu bu sunucuda devre dışı görünmeli (zarif düşüş)
  const aiDisabled = await page.locator('#ai-option input').isDisabled();
  const aiNote = await page.locator('#ai-note').textContent();
  check('AI modu devre dışı ve açıklama görünüyor', aiDisabled && aiNote.includes('Real-ESRGAN'), aiNote.trim());

  // 3) Video yükleme
  await page.setInputFiles('#file-input', fixture);
  await page.waitForSelector('#step-settings:not([hidden])', { timeout: 15000 });
  const infoText = await page.locator('#file-info').textContent();
  check('Yükleme sonrası bilgiler doğru', infoText.includes('160×120'), '160×120 gösterildi');
  await page.screenshot({ path: path.join(shotsDir, '2-yukleme-ve-ayarlar.png') });

  // 4) 2x + gürültü azaltma + keskinleştirme, Hızlı mod → başlat
  await page.check('input[name="scale"][value="2"]');
  await page.click('#btn-start');
  await page.waitForSelector('#step-progress:not([hidden])');
  await page.screenshot({ path: path.join(shotsDir, '3-islem-suruyor.png') });

  // 5) Tamamlanmayı bekle
  await page.waitForSelector('#step-result:not([hidden])', { timeout: 120000 });
  const resAfter = await page.locator('#res-after').textContent();
  check('Arayüz 2x sonucu 320×240 gösteriyor', resAfter.trim() === '320×240', resAfter.trim());
  await page.screenshot({ path: path.join(shotsDir, '4-sonuc.png'), fullPage: true });

  // 6) Çıktıyı indir ve ffprobe ile doğrula
  const downloadUrl = await page.locator('#btn-download').getAttribute('href');
  const res = await fetch(BASE + downloadUrl);
  check('İndirme yanıtı 200', res.status === 200);
  const outFile = path.join(shotsDir, '..', 'fixtures', 'output-2x.mp4');
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outFile, buf);

  const inputInfo = probe(fixture);
  const outputInfo = probe(outFile);
  check('Çıktı çözünürlüğü 2x (320×240)', outputInfo.width === 320 && outputInfo.height === 240,
    `${outputInfo.width}×${outputInfo.height}`);
  check('Süre korundu (±0.5 sn)', Math.abs(outputInfo.duration - inputInfo.duration) < 0.5,
    `girdi ${inputInfo.duration.toFixed(2)}s, çıktı ${outputInfo.duration.toFixed(2)}s`);
  check('Ses akışı korundu', outputInfo.hasAudio === inputInfo.hasAudio);

  // 7) 4x'i API üzerinden hızlı doğrula
  const form = new FormData();
  const { readFileSync } = await import('node:fs');
  form.append('video', new Blob([readFileSync(fixture)], { type: 'video/mp4' }), 'old.mp4');
  const up = await (await fetch(BASE + '/api/upload', { method: 'POST', body: form })).json();
  const jobRes = await (await fetch(BASE + '/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: up.fileId, scale: 4, denoise: true, sharpen: true, engine: 'fast' }),
  })).json();
  let job4;
  for (let i = 0; i < 240; i++) {
    job4 = await (await fetch(BASE + '/api/jobs/' + jobRes.jobId)).json();
    if (job4.state === 'done' || job4.state === 'error') break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  check('4x iş tamamlandı', job4.state === 'done', job4.error || '');
  check('4x çıktı 640×480', job4.output && job4.output.width === 640 && job4.output.height === 480,
    job4.output ? `${job4.output.width}×${job4.output.height}` : 'çıktı yok');

  // 8) AI modu API'de reddedilmeli (bu sunucuda motor yok)
  const aiRes = await fetch(BASE + '/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: up.fileId, scale: 2, denoise: false, sharpen: false, engine: 'ai' }),
  });
  check('AI modu isteği 400 ile reddedildi', aiRes.status === 400);
} finally {
  if (browser) await browser.close();
  server.kill();
}

console.log(failed === 0 ? '\nTÜM TESTLER GEÇTİ' : `\n${failed} TEST BAŞARISIZ`);
process.exit(failed === 0 ? 0 : 1);
