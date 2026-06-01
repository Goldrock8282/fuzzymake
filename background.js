const LIBRE_TRANSLATE_ENDPOINTS = [
  'https://translate.argosopentech.com/translate',
  'https://translate.terraprint.co/translate',
  'https://libretranslate.com/translate',
];

async function translateText(text, targetLang, apiKey) {
  if (!text || !text.trim()) return '';
  if (apiKey) return translateWithGoogle(text, targetLang, apiKey);
  return translateWithLibre(text, targetLang);
}

async function translateWithGoogle(text, targetLang, apiKey) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: targetLang, format: 'text' }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google API hatası: ${response.status}`);
  }
  const data = await response.json();
  return data.data.translations[0].translatedText;
}

async function translateWithLibre(text, targetLang) {
  let lastError;
  for (const endpoint of LIBRE_TRANSLATE_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'auto', target: targetLang, format: 'text' }),
      });
      const raw = await response.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Sunucu geçersiz yanıt döndürdü (${endpoint})`);
      }
      if (!response.ok || data.error) throw new Error(data.error || `HTTP ${response.status}`);
      return data.translatedText;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Tüm ücretsiz sunucular başarısız: ${lastError?.message}`);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'TRANSLATE_BATCH') {
    return false;
  }

  const { texts, languages, apiKey } = message;

  const tasks = languages.flatMap((lang) =>
    texts.map((item) => ({ lang, field: item.field, text: item.text }))
  );

  Promise.allSettled(
    tasks.map((task) =>
      translateText(task.text, task.lang, apiKey).then((translated) => ({
        lang: task.lang,
        field: task.field,
        translated,
        original: task.text,
      }))
    )
  ).then((results) => {
    const translations = {};
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { lang, field, translated } = result.value;
        if (!translations[lang]) translations[lang] = {};
        translations[lang][field] = translated;
      }
    });
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Bilinmeyen hata');
    sendResponse({ translations, errors });
  });

  return true;
});
