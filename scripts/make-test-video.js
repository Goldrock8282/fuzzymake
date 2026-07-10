// Eski/düşük çözünürlüklü bir videoyu taklit eden test dosyası üretir:
// 160x120, 5 saniye, gürültü eklenmiş görüntü + sinüs tonu ses.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ffmpegPath } = require('../lib/ffmpeg');

const outDir = path.join(__dirname, '..', 'test', 'fixtures');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'old-video-160x120.mp4');

execFileSync(ffmpegPath, [
  '-y',
  '-f', 'lavfi', '-i', 'testsrc=size=160x120:rate=15:duration=5',
  '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
  '-vf', 'noise=alls=12:allf=t',
  '-c:v', 'libx264', '-crf', '28', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '96k',
  '-shortest',
  outPath,
], { stdio: 'inherit' });

console.log('Test videosu hazır:', outPath);
