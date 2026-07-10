const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { ffmpegPath } = require('./ffmpeg');

// Yüksek Kalite (AI) mod: Real-ESRGAN ile kare kare süper çözünürlük.
// realesrgan-ncnn-vulkan binary'si gerektirir (Vulkan destekli GPU önerilir).
// Binary REALESRGAN_PATH ortam değişkeniyle ya da PATH üzerinden bulunur;
// yoksa bu mod arayüzde devre dışı gösterilir.

function findBinary() {
  const candidates = [
    process.env.REALESRGAN_PATH,
    'realesrgan-ncnn-vulkan',
  ].filter(Boolean);
  for (const bin of candidates) {
    try {
      const res = spawnSync(bin, ['-h'], { timeout: 5000 });
      if (!res.error) return bin;
    } catch {
      /* sıradakine bak */
    }
  }
  return null;
}

const binaryPath = findBinary();

function available() {
  return binaryPath !== null;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ['-y', ...args]);
    let stderrTail = '';
    proc.stderr.on('data', (c) => (stderrTail = (stderrTail + c).slice(-4000)));
    proc.on('error', reject);
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error('ffmpeg hatası: ' + stderrTail.slice(-500)))
    );
  });
}

async function run({ inputPath, outputPath, options, fps, hasAudio, onProgress, onStage }) {
  if (!available()) {
    throw new Error(
      'Real-ESRGAN bu sunucuda kurulu değil. GPU\'lu bir sunucuda realesrgan-ncnn-vulkan ' +
        'kurup REALESRGAN_PATH ortam değişkenini ayarlayın.'
    );
  }
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upscale-ai-'));
  const framesIn = path.join(workDir, 'in');
  const framesOut = path.join(workDir, 'out');
  fs.mkdirSync(framesIn);
  fs.mkdirSync(framesOut);

  try {
    onStage('Kareler çıkarılıyor');
    await runFfmpeg(['-i', inputPath, path.join(framesIn, 'f%08d.png')]);
    const frames = fs.readdirSync(framesIn);
    if (frames.length === 0) throw new Error('Videodan kare çıkarılamadı');

    onStage('AI ile kareler büyütülüyor');
    await new Promise((resolve, reject) => {
      const proc = spawn(binaryPath, [
        '-i', framesIn,
        '-o', framesOut,
        '-s', String(options.scale),
        '-n', 'realesr-animevideov3',
        '-f', 'png',
      ]);
      const timer = setInterval(() => {
        const done = fs.readdirSync(framesOut).length;
        onProgress(Math.min(99, (done / frames.length) * 90) + 5);
      }, 1000);
      proc.on('error', (e) => { clearInterval(timer); reject(e); });
      proc.on('close', (code) => {
        clearInterval(timer);
        code === 0 ? resolve() : reject(new Error('Real-ESRGAN hata koduyla çıktı: ' + code));
      });
    });

    onStage('Video yeniden birleştiriliyor');
    const assembleArgs = [
      '-framerate', String(fps || 25),
      '-i', path.join(framesOut, 'f%08d.png'),
      ...(hasAudio ? ['-i', inputPath, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '160k'] : []),
      '-c:v', 'libx264',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outputPath,
    ];
    await runFfmpeg(assembleArgs);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

module.exports = { run, available };
