const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const { probe } = require('./lib/ffmpeg');
const jobs = require('./lib/jobs');
const engineAi = require('./lib/engine-ai');

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const ALLOWED_EXT = new Set(['.mp4', '.avi', '.mov', '.mkv', '.webm', '.mpg', '.mpeg', '.wmv', '.flv', '.3gp']);
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

// Yüklenen dosya adları sunucuda üretilir; kullanıcı girdisi yola karışmaz.
const uploads = new Map(); // fileId -> { path, info, originalName }

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(8).toString('hex') + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) return cb(new Error('Desteklenmeyen dosya türü: ' + ext));
    cb(null, true);
  },
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/engines', (req, res) => {
  res.json({
    fast: { available: true },
    ai: {
      available: engineAi.available(),
      reason: engineAi.available()
        ? null
        : 'Real-ESRGAN bu sunucuda kurulu değil (GPU gerektirir)',
    },
  });
});

app.post('/api/upload', (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya alınamadı' });
    try {
      const info = await probe(req.file.path);
      const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
      uploads.set(fileId, {
        path: req.file.path,
        info,
        originalName: req.file.originalname,
      });
      res.json({ fileId, info, originalName: req.file.originalname });
    } catch (e) {
      fs.unlink(req.file.path, () => {});
      res.status(400).json({ error: e.message });
    }
  });
});

app.post('/api/jobs', (req, res) => {
  const { fileId, scale, denoise, sharpen, engine } = req.body || {};
  const uploaded = uploads.get(fileId);
  if (!uploaded) return res.status(404).json({ error: 'Yüklenmiş dosya bulunamadı' });
  if (![2, 4].includes(scale)) return res.status(400).json({ error: 'Ölçek 2 veya 4 olmalı' });
  if (!['fast', 'ai'].includes(engine)) return res.status(400).json({ error: 'Geçersiz mod' });
  if (engine === 'ai' && !engineAi.available()) {
    return res.status(400).json({ error: 'Yüksek Kalite (AI) modu bu sunucuda kullanılamıyor' });
  }

  const outputPath = path.join(OUTPUT_DIR, crypto.randomBytes(8).toString('hex') + '.mp4');
  const job = jobs.create({
    inputPath: uploaded.path,
    outputPath,
    options: { scale, denoise: Boolean(denoise), sharpen: Boolean(sharpen), engine },
    info: uploaded.info,
    originalName: uploaded.originalName,
  });
  res.json({ jobId: job.id });
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'İş bulunamadı' });
  const body = {
    id: job.id,
    state: job.state,
    stage: job.stage,
    progress: job.progress,
    error: job.error,
    input: job.info,
  };
  if (job.state === 'done') {
    if (!job.outputInfo) {
      try {
        job.outputInfo = await probe(job.outputPath);
      } catch {
        job.outputInfo = null;
      }
    }
    body.output = job.outputInfo;
    body.downloadUrl = '/api/download/' + job.id;
    body.previewUrl = '/api/preview/' + job.id;
    body.originalUrl = '/api/original/' + job.id;
  }
  res.json(body);
});

function sendJobFile(req, res, which) {
  const job = jobs.get(req.params.id);
  if (!job || job.state !== 'done') return res.status(404).json({ error: 'Hazır çıktı yok' });
  const filePath = which === 'input' ? job.inputPath : job.outputPath;
  if (which === 'output' && req.path.startsWith('/api/download')) {
    const base = path.basename(job.originalName || 'video', path.extname(job.originalName || ''));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${base.replace(/[^\w.-]/g, '_')}_upscaled_${job.options.scale}x.mp4"`
    );
  }
  res.sendFile(filePath);
}

app.get('/api/download/:id', (req, res) => sendJobFile(req, res, 'output'));
app.get('/api/preview/:id', (req, res) => sendJobFile(req, res, 'output'));
app.get('/api/original/:id', (req, res) => sendJobFile(req, res, 'input'));

app.listen(PORT, () => {
  console.log(`Video Upscale çalışıyor: http://localhost:${PORT}`);
  console.log(`AI modu: ${engineAi.available() ? 'kullanılabilir' : 'kullanılamıyor (Real-ESRGAN yok)'}`);
});
