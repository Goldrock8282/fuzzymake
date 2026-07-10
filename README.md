# 🎞️ Video Upscale (fuzzymake)

Eski, düşük çözünürlüklü videoları büyütüp netleştiren web uygulaması. Tüm işlem sunucuda yerel olarak yapılır; videolar dış servislere gönderilmez.

## Özellikler

- **Sürükle-bırak yükleme** — mp4, avi, mov, mkv, webm, mpg vb. (500 MB'a kadar)
- **2x / 4x büyütme**
- **Gürültü azaltma** (`hqdn3d`) — eski kayıtlardaki gren için, ölçeklemeden önce uygulanır
- **Keskinleştirme** (`unsharp`) — ölçeklemeden sonra uygulanır
- **İki mod:**
  - ⚡ **Hızlı** — ffmpeg Lanczos ölçekleme; CPU'da hızlı çalışır
  - ✨ **Yüksek Kalite (AI)** — Real-ESRGAN ile kare kare süper çözünürlük (aşağıya bakın)
- Canlı ilerleme çubuğu, orijinal ↔ sonuç yan yana karşılaştırma, indirme

## Kurulum ve çalıştırma

```bash
npm install
npm start          # http://localhost:3000
```

ffmpeg/ffprobe binary'leri npm paketleriyle gelir; sisteme ayrıca kurulum gerekmez.

## Yüksek Kalite (AI) modunu etkinleştirme

AI modu [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) gerektirir ve Vulkan destekli bir GPU'da çalışması önerilir:

1. `realesrgan-ncnn-vulkan` binary'sini indirin (Real-ESRGAN sürüm sayfasından).
2. Binary'yi `PATH`'e ekleyin **veya** `REALESRGAN_PATH=/yol/realesrgan-ncnn-vulkan` ortam değişkenini ayarlayın.
3. Sunucuyu yeniden başlatın — arayüzde "Yüksek Kalite (Real-ESRGAN AI)" seçeneği aktifleşir.

Binary bulunamazsa uygulama sorunsuz çalışmaya devam eder; AI seçeneği arayüzde nedeniyle birlikte devre dışı gösterilir.

## Test

```bash
npm run make-test-video   # 160×120 düşük çözünürlüklü test videosu üretir
npm install --no-save playwright   # tarayıcı testi için (bir kez)
npm test                  # sunucu + gerçek tarayıcıyla uçtan uca test
```

Test; yükleme → ayar → işleme → indirme akışını gerçek Chromium ile yürütür, çıktının çözünürlüğünü/süresini/sesini ffprobe ile doğrular ve `test/screenshots/` altına ekran görüntüleri bırakır.

## Mimari

```
server.js            Express: statik dosyalar + REST API
lib/ffmpeg.js        ffmpeg/ffprobe yolları + metadata okuma
lib/jobs.js          Bellek-içi iş kuyruğu (sıralı işleme, ilerleme takibi)
lib/engine-fast.js   Hızlı mod: hqdn3d → lanczos scale → unsharp → libx264
lib/engine-ai.js     AI mod: kare çıkar → Real-ESRGAN → yeniden birleştir
public/              Arayüz (vanilla HTML/CSS/JS, Türkçe)
```

### API

| Rota | Açıklama |
|---|---|
| `POST /api/upload` | Video yükler, metadata döner |
| `POST /api/jobs` | İş başlatır `{fileId, scale, denoise, sharpen, engine}` |
| `GET /api/jobs/:id` | Durum/ilerleme |
| `GET /api/engines` | Mod uygunluğu (AI kurulu mu) |
| `GET /api/download/:id` | Sonucu indirir |
