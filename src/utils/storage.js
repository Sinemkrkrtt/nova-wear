import { auth } from '../config/firebase';

// ---------------------------------------------------------------------------
// GÖRSEL YÜKLEME (Cloudinary — imzasız / unsigned)
//
// Tarayıcı görseli doğrudan Cloudinary'ye yükler; arada Cloud Functions
// yoktur. Lavia'da yükleme sunucuda imzalanıyordu, o yol Cloud Functions'ı
// ve dolayısıyla ücretli Firebase paketini gerektiriyor. İmzasız yükleme
// aynı Cloudinary hesabıyla, ücretsiz pakette çalışır.
//
// GÜVENLİK — bilerek yapılmış bir ödünleşme:
// "Upload preset" adı istemci paketinde görünür; teknik olarak siteyi
// inceleyen biri aynı ön ayarla hesabınıza görsel yükleyebilir. Riski
// sınırlamak için Cloudinary panelinde ön ayara şunlar tanımlanmalı:
//   - yalnızca görsel formatları
//   - dosya boyutu üst sınırı
//   - sabit klasör (nova-wear/...)
// Kötüye kullanım olursa ön ayar panelden silinip yenisi oluşturulabilir.
// ---------------------------------------------------------------------------

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Görseli Cloudinary'ye yükler ve herkese açık adresini döndürür.
 * @param {File} file
 * @param {string} folder  'products' | 'banners' | 'hero'
 */
export async function uploadImage(file, folder = 'products') {
  if (!auth.currentUser) {
    throw new Error('Görsel yüklemek için yönetici olarak giriş yapmalısınız.');
  }
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Görsel yükleme ayarlanmamış. .env dosyasına REACT_APP_CLOUDINARY_CLOUD_NAME ' +
      've REACT_APP_CLOUDINARY_UPLOAD_PRESET değerlerini girip "npm start"ı ' +
      'yeniden başlatın.'
    );
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Yalnızca JPG, PNG, WEBP veya AVIF görseller yüklenebilir.');
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`Görsel çok büyük (${mb} MB). En fazla 8 MB olabilir.`);
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', `nova-wear/${folder}`);

  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch (e) {
    throw new Error('Cloudinary\'ye ulaşılamadı. İnternet bağlantınızı kontrol edin.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.secure_url) {
    // Cloudinary'nin kendi mesajı doğrudan neyin eksik olduğunu söylüyor
    // ("Upload preset not found", "Invalid cloud_name" gibi).
    const detay = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Görsel yüklenemedi. Cloudinary: ${detay}`);
  }

  return data.secure_url;
}

// ---------------------------------------------------------------------------
// TESLİM ADRESİ (bant genişliği optimizasyonu)
//
// Cloudinary'nin ücretsiz kotasını asıl tüketen depolama değil, indirilen
// veridir. Ham adres kullanılırsa her ürün kartı tam çözünürlüklü fotoğrafı
// indirir — 2-3 MB'lık bir görsel, 200 piksellik bir kart için.
//
// Adrese dönüşüm ekleyerek Cloudinary'nin görseli sunucu tarafında
// küçültmesini ve tarayıcıya uygun formatta (AVIF/WEBP) vermesini sağlıyoruz:
//   f_auto  → tarayıcının desteklediği en verimli format
//   q_auto  → göze fark ettirmeden kalite/boyut dengesi
//   c_limit → yalnızca büyükse küçült, asla büyütme
// Tipik kazanç: kart görselinde %85-95 daha az veri.
// ---------------------------------------------------------------------------
export function imageUrl(url, width = 600) {
  if (!url || typeof url !== 'string') return url;
  // Cloudinary dışındaki adresler (dış bağlantı, data URI) olduğu gibi kalır.
  if (!url.includes('/image/upload/')) return url;
  // Zaten dönüşüm eklenmişse tekrar ekleme.
  if (/\/image\/upload\/[a-z]{1,3}_/.test(url)) return url;
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

// Dönüşümlü adres çalışmazsa ham görsele düş.
//
// Cloudinary panelinde "Strict transformations" açıksa, izin verilmemiş her
// dönüşüm 401 döner ve kart/küçük görsel yerine kırık resim simgesi çıkar.
// Ham adres her zaman servis edilir; bu yüzden hata anında ona dönüyoruz:
// kullanıcı biraz daha büyük bir dosya indirir ama görseli GÖRÜR.
//
// Kullanımı:  <img src={imageUrl(u, 300)} onError={imageFallback} />
export function imageFallback(e) {
  const img = e.currentTarget;
  // Yalnızca bir kez dene; ham adres de açılmıyorsa sonsuz döngüye girmesin.
  if (img.dataset.nwFallback) return;
  img.dataset.nwFallback = '1';
  img.src = img.src.replace(/\/image\/upload\/[^/]*_[^/]*\//, '/image/upload/');
}
