const { execFile } = require('child_process');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// ffprobe ile video meta bilgisini okur: çözünürlük, süre, fps, ses akışı.
function probe(filePath) {
  return new Promise((resolve, reject) => {
    execFile(
      ffprobePath,
      ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', filePath],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return reject(new Error('Video okunamadı: ' + err.message));
        let data;
        try {
          data = JSON.parse(stdout);
        } catch (e) {
          return reject(new Error('ffprobe çıktısı çözümlenemedi'));
        }
        const video = (data.streams || []).find((s) => s.codec_type === 'video');
        if (!video) return reject(new Error('Dosyada video akışı bulunamadı'));
        const audio = (data.streams || []).find((s) => s.codec_type === 'audio');

        let fps = 0;
        if (video.avg_frame_rate && video.avg_frame_rate !== '0/0') {
          const [n, d] = video.avg_frame_rate.split('/').map(Number);
          if (d) fps = n / d;
        }
        resolve({
          width: video.width,
          height: video.height,
          duration: parseFloat(data.format?.duration || video.duration || 0),
          fps: Math.round(fps * 100) / 100,
          codec: video.codec_name,
          hasAudio: Boolean(audio),
        });
      }
    );
  });
}

module.exports = { ffmpegPath, ffprobePath, probe };
