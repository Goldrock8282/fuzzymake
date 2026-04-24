const $ = (id) => document.getElementById(id);

const ideaEl = $("idea");
const promptEl = $("prompt");
const enhanceBtn = $("enhance-btn");
const generateBtn = $("generate-btn");
const statusEl = $("status");
const resultCard = $("result-card");
const resultImage = $("result-image");
const revisedEl = $("revised-prompt");
const downloadLink = $("download-link");

function setStatus(msg, { loading = false, error = false } = {}) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("loading", loading);
  statusEl.classList.toggle("error", error);
}

function setBusy(busy) {
  enhanceBtn.disabled = busy;
  generateBtn.disabled = busy;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

enhanceBtn.addEventListener("click", async () => {
  const idea = ideaEl.value.trim();
  if (!idea) {
    setStatus("Önce bir fikir yaz.", { error: true });
    return;
  }
  setBusy(true);
  setStatus("Claude zenginleştiriyor", { loading: true });
  try {
    const { prompt } = await postJSON("/api/enhance", { idea });
    promptEl.value = prompt;
    setStatus("Hazır. İstersen promptu düzenleyip 'Görseli üret' e bas.");
  } catch (e) {
    setStatus(e.message, { error: true });
  } finally {
    setBusy(false);
  }
});

generateBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim() || ideaEl.value.trim();
  if (!prompt) {
    setStatus("Prompt veya fikir alanı boş olamaz.", { error: true });
    return;
  }
  setBusy(true);
  setStatus("DALL·E 3 üretiyor (15-30sn)", { loading: true });
  resultCard.classList.add("hidden");
  try {
    const { url, revised_prompt } = await postJSON("/api/generate", { prompt });
    resultImage.src = url;
    resultImage.alt = prompt.slice(0, 120);
    revisedEl.textContent = revised_prompt || "(yok)";
    downloadLink.href = url;
    resultCard.classList.remove("hidden");
    setStatus("Tamam.");
  } catch (e) {
    setStatus(e.message, { error: true });
  } finally {
    setBusy(false);
  }
});
