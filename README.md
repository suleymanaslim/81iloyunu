# 81 İl Öğrenme Oyunu

Android ve iPhone tarayıcılarında açılan, kurulum gerektirmeyen Türkiye haritası oyunu.

- 81 ilin doğru sınırları ve plaka numaraları; İstanbul'un iki yakası tek il olarak değerlendirilir.
- **İli bul:** Sorulan ili haritada seç. Doğru cevaptan 700 ms sonra sonraki soru otomatik gelir. Doğru bulunan iller tur boyunca ve tur sonunda yeşil kalır; yeni turda yeşil işaretler sıfırlanır. Yanlış seçilen iller o soru boyunca kırmızı kalır ve yeniden seçilemez; yeni soruda açılır. Bulunamayan hedef il tekrar listesine kaydedilir.
- **Haritayı öğren:** Bir ile dokunup adını, plakasını ve bölgesini öğren.
- **İpuçları:** Bölge bilgisi, bölgedeki illeri belirginleştirme, cevabı gösterme.
- **Hataları tekrar et:** Tüm bekleyen illeri veya listeden tek bir ili tekrar çalış. İpucusuz ve hatasız bulduğun il tamamlanır; hata geçmişi görünür kalır.
- Dokunma, doğru ve yanlış cevap sesleri. Ses kapatılabilir; ilk dokunmayla etkinleşir.
- Yakınlaştırma düğmeleri, yakınlaştırınca sürükleme ve iki parmakla ölçekleme.
- Klavye ile il seçimi: Tab, Enter veya boşluk.
- **Ana ekrana ekle:** Destekleyen Android tarayıcılarında yerel yükleme penceresi; iPhone ve iPad’de Safari için adım adım yönerge. Ana ekran simgesinden tarayıcı çerçevesi olmadan açılır.
- İlk başarılı açılıştan ve önbelleklemeden sonra oyun dosyaları çevrimdışı açılabilir. Yeni sürüm, açık oyun pencereleri kapatıldıktan sonra etkinleşir.

## Cihazda kayıt

Hatalar `localStorage` içinde `81il_ogrenmeoyunu.hatalar.v1` anahtarıyla saklanır. Hesap veya sunucu gerekmez. Başka cihaz, tarayıcı ya da alan adına aktarılmaz. Sites adresinden Cloudflare adresine geçince her adresin ayrı yerel kaydı olur. iOS’te ana ekran web uygulaması ile Safari sekmesinin kayıtlarının ortak olması garanti edilmez. Tarayıcı verileri silinirse kayıt silinir. Gizli sekme veya tarayıcı kısıtlamaları kayıt süresini etkileyebilir. Kayıt erişimi başarısızsa oyun bunu bildirir ve o oturumda çalışmaya devam eder.

## Cloudflare Workers ile yayınla

[Cloudflare paneli](https://dash.cloudflare.com/) → **Workers & Pages → Create application → Import a repository**. GitHub hesabını bağlayıp **suleymanaslim/81iloyunu** deposunu seç.

| Ayar | Değer |
| --- | --- |
| Worker / Project name | `81iloyunu` |
| Production branch | `main` |
| Build command | Boş bırak |
| Deploy command | `npx wrangler deploy` |
| Root directory | Depo kökü; boş bırak |

**Save and Deploy** seç. Workers için yapılandırma `wrangler.jsonc` içinde hazırdır. Ek Worker kodu veya derleme gerekmez; Workers Static Assets kullanılır. Yalnızca `public/` içindeki oyun dosyaları ve simgeler yayınlanır; depo ayarları ve README yayın dosyalarına dahil edilmez.

Var olan bir Worker kullanıyorsan paneldeki Worker adıyla `wrangler.jsonc` içindeki `name` aynı olmalıdır. Depo bağlantısı kurulunca `main` dalına gönderilen güncellemeler otomatik yayınlanır. Canlı adresi paneldeki başarılı yayından al.

Bilgisayardan alternatif: `npx wrangler login`, ardından `npx wrangler deploy`. Hesap bilgileri veya API anahtarı depoya yazılmamalıdır.

## Ana ekrana ekleme

- **Android:** Oyun içindeki Ana ekrana ekle düğmesi, tarayıcı yükleme etkinliğini sunmuşsa yükleme penceresini açar. Sunmamışsa tarayıcı menüsüne yönlendiren açıklamayı gösterir.
- **iPhone/iPad:** Safari’de aç → Paylaş → Ana Ekrana Ekle → varsa Web Uygulaması Olarak Aç → Ekle. Safari düzenine göre Paylaş önce sayfa menüsünde olabilir. Web sitesi iOS yükleme penceresini kendiliğinden açamaz.
- Ana ekran modunda ekleme düğmesi gizlenir. Gerçek yükleme davranışı telefonun ve tarayıcının sürümüne bağlıdır.
- Çevrimdışı kabuk için `sw.js` kullanılır. Yayın güncellemelerinde `CACHE` sürümünü artır; açık bir oyunu ortasında zorla yenileme.

## Yerelde çalıştır

Depo kökünde `python -m http.server 8000 --directory public` çalıştırıp `http://localhost:8000` adresini aç. Dosyayı doğrudan çift tıklamak yerine sunucu kullan; SVG harita `fetch` ile yüklenir. Derleme veya paket kurulumu gerekmez.

## Doğrulama

JavaScript sözdizimi, 81 eşsiz plaka kodu, yedi bölge kapsamı ve yerel dosya referansları kontrol edildi. Otomatik geçiş, yanlış seçim kilidi, soru değişince kilitlerin açılması ve mod değişiminde bekleyen geçişin iptali kontrol edildi. Oyun durumu testlerinde hedef ilin kaydı, kaydın yeniden yüklenmesi, hatalı/ipuculu tekrarın beklemede kalması, temiz tekrarın tamamlanması ve kayıt erişim hatası kontrol edildi. Gerçek Android/iPhone cihaz testi yapılmadı.

## Harita lisansı

Harita: [Doğukan Güven Nomak / SVG Türkiye Haritası](https://github.com/dnomak/svg-turkiye-haritasi), MIT. Lisans metni `public/MAP-LICENSE.txt` dosyasındadır.
