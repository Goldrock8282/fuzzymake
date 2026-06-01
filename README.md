# YouTube Studio Çoklu Dil Çevirici

YouTube Studio'daki video başlıklarını ve açıklamalarını tek tıkla birden fazla dile otomatik çevirin.

## Özellikler

- **16 Dil Desteği** — Türkçe, İngilizce, Almanca, Fransızca, İspanyolca ve daha fazlası
- **Çift Motor** — Ücretsiz LibreTranslate veya Google Translate API
- **Toplu Çeviri** — Tüm diller aynı anda paralel olarak çevrilir
- **Tek Tık Uygulama** — Sonuçları doğrudan YouTube Studio'ya uygulayın
- **Güvenli Saklama** — Google API key Chrome storage'da saklanır

## Kurulum (Geliştirici Modu)

1. Chrome'da `chrome://extensions` adresine gidin
2. **Geliştirici modu**nu açın (sağ üst köşe)
3. **Paketlenmemiş öğe yükle** butonuna tıklayın
4. Bu klasörü seçin

## Kullanım

1. [YouTube Studio](https://studio.youtube.com) üzerinde bir video düzenleme sayfasına gidin
2. Tarayıcı araç çubuğundaki eklenti ikonuna tıklayın
3. **"Panel'i Aç"** butonuna tıklayın
4. **"Sayfadan Oku"** ile mevcut başlık/açıklamayı otomatik doldurun
5. Çevirmek istediğiniz dilleri seçin
6. **"Çevir"** butonuna tıklayın
7. Her çeviri kartındaki **"Uygula"** butonuyla istediğiniz dili YouTube Studio'ya uygulayın

## Çeviri Motorları

### LibreTranslate (Ücretsiz)
- API key gerektirmez
- Hız ve doğruluk orta düzeyde

### Google Translate API
- [Google Cloud Console](https://console.cloud.google.com) üzerinden API key alın
- Cloud Translation API'yi etkinleştirin
- Popup'taki API key alanına girin ve kaydedin

## Desteklenen Diller

| Dil | Kod | Dil | Kod |
|-----|-----|-----|-----|
| Türkçe | tr | Rusça | ru |
| İngilizce | en | Japonca | ja |
| Almanca | de | Korece | ko |
| Fransızca | fr | Çince | zh |
| İspanyolca | es | Arapça | ar |
| İtalyanca | it | Hintçe | hi |
| Portekizce | pt | Hollandaca | nl |
| İsveççe | sv | Lehçe | pl |
