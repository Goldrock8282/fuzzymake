let panelEl = null;
let isInjected = false;

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'İngilizce' },
  { code: 'de', name: 'Almanca' },
  { code: 'fr', name: 'Fransızca' },
  { code: 'es', name: 'İspanyolca' },
  { code: 'it', name: 'İtalyanca' },
  { code: 'pt', name: 'Portekizce' },
  { code: 'ru', name: 'Rusça' },
  { code: 'ja', name: 'Japonca' },
  { code: 'ko', name: 'Korece' },
  { code: 'zh', name: 'Çince (Basitleştirilmiş)' },
  { code: 'ar', name: 'Arapça' },
  { code: 'hi', name: 'Hintçe' },
  { code: 'nl', name: 'Hollandaca' },
  { code: 'pl', name: 'Lehçe' },
  { code: 'sv', name: 'İsveççe' },
];

function getYouTubeStudioFields() {
  const titleEl =
    document.querySelector('#title-textarea #textbox') ||
    document.querySelector('ytcp-social-suggestion-input #textbox') ||
    document.querySelector('[placeholder*="itle"] #textbox') ||
    document.querySelector('#title #textbox');

  const descEl =
    document.querySelector('#description-textarea #textbox') ||
    document.querySelector('[placeholder*="escription"] #textbox') ||
    document.querySelector('#description #textbox');

  return { titleEl, descEl };
}

function setFieldValue(el, value) {
  if (!el) return;
  el.focus();
  el.innerText = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.id = 'yt-multi-translate-panel';
  panel.innerHTML = `
    <div class="ytmt-header">
      <span class="ytmt-title">🌍 Çoklu Dil Çevirici</span>
      <button class="ytmt-close" id="ytmt-close">✕</button>
    </div>
    <div class="ytmt-body">
      <div class="ytmt-section">
        <label class="ytmt-label">Çeviri Motoru</label>
        <div class="ytmt-engine-row">
          <label class="ytmt-radio-label">
            <input type="radio" name="engine" value="libre" checked> LibreTranslate (Ücretsiz)
          </label>
          <label class="ytmt-radio-label">
            <input type="radio" name="engine" value="google"> Google Translate API
          </label>
        </div>
        <div id="ytmt-api-key-row" class="ytmt-hidden">
          <input id="ytmt-api-key" class="ytmt-input" type="password" placeholder="Google API Key giriniz...">
        </div>
      </div>
      <div class="ytmt-section">
        <label class="ytmt-label">Kaynak Metin</label>
        <div class="ytmt-source-row">
          <button class="ytmt-btn ytmt-btn-secondary" id="ytmt-read-fields">Sayfadan Oku</button>
        </div>
        <input id="ytmt-source-title" class="ytmt-input" type="text" placeholder="Başlık...">
        <textarea id="ytmt-source-desc" class="ytmt-textarea" placeholder="Açıklama..."></textarea>
      </div>
      <div class="ytmt-section">
        <label class="ytmt-label">Hedef Diller</label>
        <div class="ytmt-lang-grid" id="ytmt-lang-grid">
          ${LANGUAGES.map(
            (l) => `
            <label class="ytmt-lang-item">
              <input type="checkbox" value="${l.code}" class="ytmt-lang-check"> ${l.name}
            </label>`
          ).join('')}
        </div>
        <div class="ytmt-lang-actions">
          <button class="ytmt-btn ytmt-btn-ghost" id="ytmt-select-all">Tümünü Seç</button>
          <button class="ytmt-btn ytmt-btn-ghost" id="ytmt-deselect-all">Temizle</button>
        </div>
      </div>
      <button class="ytmt-btn ytmt-btn-primary" id="ytmt-translate-btn">Çevir</button>
      <div id="ytmt-progress" class="ytmt-hidden">
        <div class="ytmt-progress-bar"><div class="ytmt-progress-fill" id="ytmt-progress-fill"></div></div>
        <span id="ytmt-progress-text">Çevriliyor...</span>
      </div>
      <div id="ytmt-results" class="ytmt-hidden">
        <div class="ytmt-section">
          <label class="ytmt-label">Çeviri Sonuçları</label>
          <div id="ytmt-result-list"></div>
          <div id="ytmt-error-box" class="ytmt-error-box ytmt-hidden"></div>
        </div>
      </div>
    </div>
  `;
  return panel;
}

function showProgress(show) {
  const el = document.getElementById('ytmt-progress');
  if (el) el.classList.toggle('ytmt-hidden', !show);
}

function setProgress(pct, text) {
  const fill = document.getElementById('ytmt-progress-fill');
  const label = document.getElementById('ytmt-progress-text');
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = text;
}

function renderResults(translations, errors) {
  const resultsEl = document.getElementById('ytmt-results');
  const listEl = document.getElementById('ytmt-result-list');
  const errorBox = document.getElementById('ytmt-error-box');
  if (!resultsEl || !listEl) return;

  listEl.innerHTML = '';
  resultsEl.classList.remove('ytmt-hidden');

  Object.entries(translations).forEach(([lang, fields]) => {
    const langInfo = LANGUAGES.find((l) => l.code === lang) || { name: lang };
    const card = document.createElement('div');
    card.className = 'ytmt-result-card';
    card.innerHTML = `
      <div class="ytmt-result-header">
        <strong>${langInfo.name}</strong>
        <span class="ytmt-result-code">${lang.toUpperCase()}</span>
      </div>
      ${
        fields.title !== undefined
          ? `<div class="ytmt-result-field">
          <span class="ytmt-field-label">Başlık:</span>
          <span class="ytmt-field-value">${escapeHtml(fields.title)}</span>
        </div>`
          : ''
      }
      ${
        fields.description !== undefined
          ? `<div class="ytmt-result-field">
          <span class="ytmt-field-label">Açıklama:</span>
          <span class="ytmt-field-value ytmt-desc-preview">${escapeHtml(fields.description)}</span>
        </div>`
          : ''
      }
      <button class="ytmt-btn ytmt-btn-apply" data-lang="${lang}">Bu Dile Geç &amp; Uygula</button>
    `;
    listEl.appendChild(card);
  });

  if (errors && errors.length > 0) {
    errorBox.classList.remove('ytmt-hidden');
    errorBox.innerHTML = `<strong>Hatalar:</strong><br>${errors.map(escapeHtml).join('<br>')}`;
  } else {
    errorBox.classList.add('ytmt-hidden');
  }

  listEl.querySelectorAll('.ytmt-btn-apply').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      applyTranslation(lang, translations[lang]);
    });
  });
}

function applyTranslation(lang, fields) {
  const { titleEl, descEl } = getYouTubeStudioFields();
  if (fields.title && titleEl) setFieldValue(titleEl, fields.title);
  if (fields.description && descEl) setFieldValue(descEl, fields.description);
  showToast(`${lang.toUpperCase()} çevirisi uygulandı!`);
}

function showToast(msg) {
  let toast = document.getElementById('ytmt-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ytmt-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'ytmt-toast ytmt-toast-show';
  setTimeout(() => toast.classList.remove('ytmt-toast-show'), 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSelectedLanguages() {
  return Array.from(document.querySelectorAll('.ytmt-lang-check:checked')).map((el) => el.value);
}

function injectPanel() {
  if (isInjected && document.getElementById('yt-multi-translate-panel')) return;

  panelEl = buildPanel();
  document.body.appendChild(panelEl);
  isInjected = true;

  document.getElementById('ytmt-close').addEventListener('click', () => {
    panelEl.classList.add('ytmt-hidden');
  });

  document.getElementById('ytmt-read-fields').addEventListener('click', () => {
    const { titleEl, descEl } = getYouTubeStudioFields();
    const titleInput = document.getElementById('ytmt-source-title');
    const descInput = document.getElementById('ytmt-source-desc');
    if (titleEl && titleInput) titleInput.value = titleEl.innerText.trim();
    if (descEl && descInput) descInput.value = descEl.innerText.trim();
    showToast('Alanlar okundu!');
  });

  document.getElementById('ytmt-select-all').addEventListener('click', () => {
    document.querySelectorAll('.ytmt-lang-check').forEach((cb) => (cb.checked = true));
  });

  document.getElementById('ytmt-deselect-all').addEventListener('click', () => {
    document.querySelectorAll('.ytmt-lang-check').forEach((cb) => (cb.checked = false));
  });

  document.querySelectorAll('input[name="engine"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const keyRow = document.getElementById('ytmt-api-key-row');
      keyRow.classList.toggle('ytmt-hidden', radio.value !== 'google');
    });
  });

  document.getElementById('ytmt-translate-btn').addEventListener('click', async () => {
    const title = document.getElementById('ytmt-source-title').value.trim();
    const description = document.getElementById('ytmt-source-desc').value.trim();
    const languages = getSelectedLanguages();
    const engineVal = document.querySelector('input[name="engine"]:checked')?.value;
    const apiKey =
      engineVal === 'google' ? document.getElementById('ytmt-api-key').value.trim() : '';

    if (!title && !description) {
      showToast('Lütfen en az bir metin girin!');
      return;
    }
    if (languages.length === 0) {
      showToast('Lütfen en az bir dil seçin!');
      return;
    }

    const texts = [];
    if (title) texts.push({ field: 'title', text: title });
    if (description) texts.push({ field: 'description', text: description });

    showProgress(true);
    setProgress(10, 'Çeviri isteği gönderiliyor...');

    document.getElementById('ytmt-results')?.classList.add('ytmt-hidden');

    let interval = setInterval(() => {
      const fill = document.getElementById('ytmt-progress-fill');
      if (!fill) return;
      const cur = parseFloat(fill.style.width) || 10;
      if (cur < 85) setProgress(cur + 5, 'Çevriliyor...');
    }, 500);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_BATCH',
        texts,
        languages,
        apiKey,
      });
      clearInterval(interval);
      setProgress(100, 'Tamamlandı!');
      setTimeout(() => showProgress(false), 800);
      renderResults(response.translations, response.errors);
    } catch (err) {
      clearInterval(interval);
      showProgress(false);
      showToast('Hata: ' + (err.message || 'Bilinmeyen hata'));
    }
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_PANEL') {
    injectPanel();
    const panel = document.getElementById('yt-multi-translate-panel');
    if (panel) panel.classList.toggle('ytmt-hidden');
  }
});

const observer = new MutationObserver(() => {
  if (
    window.location.href.includes('/video/') &&
    document.querySelector('#title-textarea, #description-textarea')
  ) {
    injectPanel();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
