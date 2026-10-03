# 81 İl Öğrenme Oyunu

Android ve iPhone tarayıcılarında açılan, kurulum gerektirmeyen Türkiye haritası oyunu.

- 81 ilin doğru sınırları ve plaka numaraları; İstanbul'un iki yakası tek il olarak değerlendirilir.
- **İli bul:** Sorulan ili haritada seç. Yanlış seçimde sorulan il tekrar listesine kaydedilir.
- **Haritayı öğren:** Bir ile dokunup adını, plakasını ve bölgesini öğren.
- **İpuçları:** Bölge bilgisi, bölgedeki illeri belirginleştirme, cevabı gösterme.
- **Hataları tekrar et:** Tüm bekleyen illeri veya listeden tek bir ili tekrar çalış. İpucusuz ve hatasız bulduğun il tamamlanır; hata geçmişi görünür kalır.
- Dokunma, doğru ve yanlış cevap sesleri. Ses kapatılabilir; ilk dokunmayla etkinleşir.
- Yakınlaştırma düğmeleri, yakınlaştırınca sürükleme ve iki parmakla ölçekleme.
- Klavye ile il seçimi: Tab, Enter veya boşluk.

## Cihazda kayıt

Hatalar `localStorage` içinde `81il_ogrenmeoyunu.hatalar.v1` anahtarıyla saklanır. Hesap veya sunucu gerekmez. Başka cihaz, tarayıcı ya da alan adına aktarılmaz. Tarayıcı verileri silinirse kayıt silinir. Gizli sekme veya tarayıcı kısıtlamaları kayıt süresini etkileyebilir. Kayıt erişimi başarısızsa oyun bunu bildirir ve o oturumda çalışmaya devam eder.

## GitHub Pages ile yayınla

Deponun **Settings → Pages** bölümünde:

1. Source: **Deploy from a branch**
2. Branch: **main**
3. Folder: **/ (root)**
4. **Save**

Yayın tamamlandığında GitHub Pages oyun adresini gösterir. Paylaşılması gereken adres repo adresi değil bu oyun adresidir.

## Yerelde çalıştır

Kök dosyaların bulunduğu klasörde `python -m http.server 8000` çalıştırıp `http://localhost:8000` adresini aç. Dosyayı doğrudan çift tıklamak yerine sunucu kullan; SVG harita `fetch` ile yüklenir. Derleme veya paket kurulumu gerekmez.

## Doğrulama

JavaScript sözdizimi, 81 eşsiz plaka kodu, yedi bölge kapsamı ve yerel dosya referansları kontrol edildi. Oyun durumu testlerinde hedef ilin kaydı, kaydın yeniden yüklenmesi, hatalı/ipuculu tekrarın beklemede kalması, temiz tekrarın tamamlanması ve kayıt erişim hatası kontrol edildi. Gerçek Android/iPhone cihaz testi yapılmadı.

## Harita lisansı

Harita: [Doğukan Güven Nomak / SVG Türkiye Haritası](https://github.com/dnomak/svg-turkiye-haritasi), MIT. Lisans metni `MAP-LICENSE.txt` dosyasındadır.
