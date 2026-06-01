const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const btnOpen = document.getElementById('btn-open');
const apiKeyInput = document.getElementById('api-key-input');
const btnSave = document.getElementById('btn-save');
const saveMsg = document.getElementById('save-msg');

chrome.storage.local.get(['apiKey'], (result) => {
  if (result.apiKey) apiKeyInput.value = result.apiKey;
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  const isStudio = tab?.url?.includes('studio.youtube.com');
  if (isStudio) {
    statusDot.className = 'status-dot active';
    statusText.textContent = 'YouTube Studio algılandı ✓';
  } else {
    statusDot.className = 'status-dot inactive';
    statusText.textContent = 'YouTube Studio\'ya gidin';
    btnOpen.disabled = true;
  }
});

btnOpen.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_PANEL' });
    } catch {
      // Content script henüz yüklenmemiş, scripti enjekte et
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
      await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_PANEL' });
    }
    window.close();
  });
});

btnSave.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  chrome.storage.local.set({ apiKey: key }, () => {
    saveMsg.textContent = key ? 'API key kaydedildi!' : 'API key temizlendi.';
    setTimeout(() => (saveMsg.textContent = ''), 2000);
  });
});
