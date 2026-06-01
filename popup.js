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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_PANEL' });
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
