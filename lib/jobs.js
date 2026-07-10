const crypto = require('crypto');
const engineFast = require('./engine-fast');
const engineAi = require('./engine-ai');

// Bellek-içi iş kuyruğu: işler sırayla işlenir, durumları polling ile okunur.
const jobs = new Map();
const queue = [];
let running = false;

function create({ inputPath, outputPath, options, info, originalName }) {
  const id = crypto.randomBytes(8).toString('hex');
  const job = {
    id,
    state: 'queued', // queued | processing | done | error
    stage: 'Sırada bekliyor',
    progress: 0,
    inputPath,
    outputPath,
    options,
    info,
    originalName,
    error: null,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  queue.push(job);
  processNext();
  return job;
}

function get(id) {
  return jobs.get(id);
}

async function processNext() {
  if (running) return;
  const job = queue.shift();
  if (!job) return;
  running = true;

  job.state = 'processing';
  job.stage = 'İşleniyor';
  const onProgress = (pct) => (job.progress = Math.round(pct * 10) / 10);
  const onStage = (stage) => (job.stage = stage);

  try {
    const engine = job.options.engine === 'ai' ? engineAi : engineFast;
    await engine.run({
      inputPath: job.inputPath,
      outputPath: job.outputPath,
      options: job.options,
      durationSec: job.info.duration,
      fps: job.info.fps,
      hasAudio: job.info.hasAudio,
      onProgress,
      onStage,
    });
    job.progress = 100;
    job.state = 'done';
    job.stage = 'Tamamlandı';
  } catch (err) {
    job.state = 'error';
    job.stage = 'Hata';
    job.error = err.message;
  } finally {
    running = false;
    processNext();
  }
}

module.exports = { create, get };
