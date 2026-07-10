const { spawn } = require('child_process');
const { ffmpegPath } = require('./ffmpeg');

// Hızlı mod: ffmpeg ile lanczos ölçekleme + isteğe bağlı gürültü azaltma ve
// keskinleştirme. Gürültü azaltma ölçeklemeden ÖNCE uygulanır ki eski
// videolardaki grenler büyütülmesin; keskinleştirme ölçeklemeden sonra gelir.
function buildFilter({ scale, denoise, sharpen }) {
  const chain = [];
  if (denoise) chain.push('hqdn3d=3:2:6:4');
  chain.push(`scale=iw*${scale}:ih*${scale}:flags=lanczos`);
  if (sharpen) chain.push('unsharp=5:5:0.8:5:5:0.4');
  return chain.join(',');
}

function run({ inputPath, outputPath, options, durationSec, hasAudio, onProgress }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', buildFilter(options),
      '-c:v', 'libx264',
      '-crf', '18',
      '-preset', 'medium',
      '-pix_fmt', 'yuv420p',
      ...(hasAudio ? ['-c:a', 'aac', '-b:a', '160k'] : ['-an']),
      '-movflags', '+faststart',
      '-progress', 'pipe:1',
      '-nostats',
      outputPath,
    ];

    const proc = spawn(ffmpegPath, args);
    let stderrTail = '';

    proc.stdout.on('data', (chunk) => {
      // -progress çıktısı "out_time_ms=1234567" satırları içerir (mikrosaniye).
      const match = String(chunk).match(/out_time_ms=(\d+)/);
      if (match && durationSec > 0) {
        const pct = Math.min(99, (Number(match[1]) / 1e6 / durationSec) * 100);
        onProgress(pct);
      }
    });
    proc.stderr.on('data', (chunk) => {
      stderrTail = (stderrTail + chunk).slice(-4000);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('ffmpeg hata koduyla çıktı (' + code + '): ' + stderrTail.slice(-500)));
    });
  });
}

module.exports = { run, buildFilter };
