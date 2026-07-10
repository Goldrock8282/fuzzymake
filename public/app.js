const $ = (sel) => document.querySelector(sel);

const state = { fileId: null, jobId: null };

const dropzone = $('#dropzone');
const fileInput = $('#file-input');
const errorBox = $('#error-box');

function showError(msg) {
  errorBox.textContent = '⚠️ ' + msg;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
}

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

// --- Motor uygunluğu -------------------------------------------------------
async function loadEngines() {
  try {
    const res = await fetch('/api/engines');
    const engines = await res.json();
    if (!engines.ai.available) {
      const aiOption = $('#ai-option');
      aiOption.classList.add('disabled');
      aiOption.querySelector('input').disabled = true;
      const note = $('#ai-note');
      note.textContent = engines.ai.reason;
      note.hidden = false;
    }
  } catch {
    /* motor bilgisi alınamazsa varsayılan (hızlı) modla devam */
  }
}
loadEngines();

// --- Yükleme ---------------------------------------------------------------
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) uploadFile(fileInput.files[0]);
});

async function uploadFile(file) {
  clearError();
  const status = $('#upload-status');
  status.hidden = false;
  status.textContent = '"' + file.name + '" yükleniyor…';

  const form = new FormData();
  form.append('video', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');

    state.fileId = data.fileId;
    status.textContent = '✅ "' + file.name + '" yüklendi.';
    renderFileInfo(data.info);
    $('#step-settings').hidden = false;
    $('#step-settings').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    status.hidden = true;
    showError(err.message);
  }
}

function renderFileInfo(info) {
  const grid = $('#file-info');
  grid.innerHTML = '';
  const cells = [
    ['Çözünürlük', info.width + '×' + info.height],
    ['Süre', fmtDuration(info.duration)],
    ['FPS', info.fps],
    ['Kodek', info.codec],
    ['Ses', info.hasAudio ? 'Var' : 'Yok'],
  ];
  for (const [label, value] of cells) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = '<div class="label"></div><div class="value"></div>';
    cell.querySelector('.label').textContent = label;
    cell.querySelector('.value').textContent = value;
    grid.appendChild(cell);
  }
  grid.hidden = false;
}

// --- İş başlatma ve ilerleme -------------------------------------------------
$('#btn-start').addEventListener('click', async () => {
  clearError();
  const body = {
    fileId: state.fileId,
    scale: Number(document.querySelector('input[name="scale"]:checked').value),
    denoise: $('#opt-denoise').checked,
    sharpen: $('#opt-sharpen').checked,
    engine: document.querySelector('input[name="engine"]:checked').value,
  };
  try {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'İş başlatılamadı');
    state.jobId = data.jobId;
    $('#step-progress').hidden = false;
    $('#step-progress').scrollIntoView({ behavior: 'smooth' });
    pollJob();
  } catch (err) {
    showError(err.message);
  }
});

async function pollJob() {
  try {
    const res = await fetch('/api/jobs/' + state.jobId);
    const job = await res.json();
    if (!res.ok) throw new Error(job.error || 'Durum alınamadı');

    $('#progress-bar').style.width = job.progress + '%';
    $('#progress-text').textContent = job.stage + ' — %' + Math.round(job.progress);

    if (job.state === 'done') {
      showResult(job);
      return;
    }
    if (job.state === 'error') {
      showError('İşlem başarısız: ' + job.error);
      return;
    }
    setTimeout(pollJob, 800);
  } catch (err) {
    showError(err.message);
  }
}

function showResult(job) {
  $('#res-before').textContent = job.input.width + '×' + job.input.height;
  $('#res-after').textContent = job.output
    ? job.output.width + '×' + job.output.height
    : 'bilinmiyor';
  $('#video-before').src = job.originalUrl;
  $('#video-after').src = job.previewUrl;
  $('#btn-download').href = job.downloadUrl;
  $('#step-result').hidden = false;
  $('#step-result').scrollIntoView({ behavior: 'smooth' });
}

$('#btn-restart').addEventListener('click', () => window.location.reload());
