# fuzzymake

Kısa bir fikirden görsel üreten küçük bir web aracı. Akış:

1. Kullanıcı kısa bir fikir yazar (Türkçe, İngilizce, fark etmez).
2. **Claude (Opus 4.7)** fikri alır, görsel üretim modellerine uygun, zengin bir İngilizce prompt'a çevirir.
3. **OpenAI DALL·E 3** bu prompt'tan görseli üretir.
4. Sonuç web arayüzünde görüntülenir ve indirilebilir.

## Kurulum

```bash
# 1. Sanal ortam
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. Bağımlılıklar
pip install -r requirements.txt

# 3. API anahtarları
cp .env.example .env
# .env dosyasını aç ve ANTHROPIC_API_KEY + OPENAI_API_KEY değerlerini yaz
```

## Çalıştırma

```bash
python app.py
```

Tarayıcıda `http://localhost:5000` aç.

## Kullanım

- **Fikrin** alanına kısa bir açıklama yaz (ör. "dağ manzarasında yalnız bir kulübe, günbatımı").
- **✨ Claude ile zenginleştir** — fikri detaylı bir prompt'a dönüştürür. Prompt alanı düzenlenebilir.
- **🎨 Görseli üret** — DALL·E 3 ile görseli üretir (tipik 15–30 sn).
- Sonucu inceleyip **⬇️ İndir** ile kaydedebilirsin.

Prompt zenginleştirme adımını atlayıp doğrudan prompt alanına kendi İngilizce prompt'unu yazıp **Görseli üret** e de basabilirsin.

## Yapı

```
fuzzymake/
├── app.py                   # Flask uygulaması
├── src/
│   ├── prompt_enhancer.py   # Claude ile prompt zenginleştirme (prompt caching'li)
│   └── image_client.py      # OpenAI DALL·E 3 wrapper
├── templates/index.html
├── static/
│   ├── style.css
│   └── app.js
└── requirements.txt
```

## Notlar

- Claude Opus 4.7 kullanılıyor; sistem promptu 5 dakikalık ephemeral cache ile işaretlendi — arka arkaya zenginleştirme çağrıları cache okumasıyla ucuzluyor.
- DALL·E 3 görsel URL'si geçicidir (OpenAI ~1 saat sonra erişimi keser). Kalıcı saklamak istiyorsan üretim sonrası indir.
- Boyut/kalite ayarları `.env` üzerinden: `DALLE_SIZE` (1024x1024 / 1024x1792 / 1792x1024), `DALLE_QUALITY` (standard / hd).
