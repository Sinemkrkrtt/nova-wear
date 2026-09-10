// ---------------------------------------------------------------------------
// NOVA WEAR — MARKA BİLGİLERİ (TEK KAYNAK)
//
// Marka adı, iletişim ve satıcı bilgileri sitenin her yerinde buradan okunur.
// Daha önce bu bilgiler 15+ dosyaya elle yazılmıştı; e-posta değiştiğinde
// hepsini tek tek bulmak gerekiyordu.
//
// !!! YAYINA ALMADAN ÖNCE DOLDURULMASI ZORUNLU !!!
// Aşağıda "DOLDURULACAK" yazan alanlar yer tutucudur. Mesafeli Satış
// Sözleşmesi, Ön Bilgilendirme Formu ve KVKK metinleri gereği satıcının
// unvanı, adresi, telefonu ve e-postası sitede DOĞRU ve ERİŞİLEBİLİR olmak
// zorundadır. Yanlış/eksik bilgi yasal risk doğurur.
// ---------------------------------------------------------------------------

export const BRAND = {
  // --- Görünen marka kimliği ---
  name: 'Nova Wear',
  slogan: 'Shine like a nova.',
  description: 'Özel günler için zarif elbiseler.',

  // --- İletişim ---
  email: 'novawear.destek@gmail.com',
  // Okunurluk için gruplanmış yazılıyor; aramada sorun çıkarmaz.
  phone: '0551 943 85 72',

  // --- Satıcı / şirket bilgileri (DOLDURULACAK) ---
  // Yasal metinlerde "SATICI" olarak geçer.
  legalName: 'DOLDURULACAK (şirket ticari unvanı)',
  address: {
    line1: 'DOLDURULACAK (açık adres)',
    line2: 'İlçe / İl',
  },
  taxOffice: 'DOLDURULACAK (vergi dairesi)',
  taxNumber: 'DOLDURULACAK (vergi/TCKN no)',
  mersis: 'DOLDURULACAK (MERSİS no)',

  // --- Web ---
  // Alan adı henüz alınmadıysa boş bırakın; metinlerde "sitemiz" olarak geçer.
  domain: '',
  instagram: '', // örn: 'https://instagram.com/novawear'

  // --- Ticari koşullar ---
  freeShippingThreshold: 1500, // ₺
  shippingFee: 135,            // ₺
  returnDays: 14,
};

// Yasal metinlerde alan adı geçen cümleler için: alan adı tanımlıysa onu,
// değilse nötr bir ifade döndürür. Böylece sözleşmelerde boş/yanlış adres
// görünmez.
export const siteRef = () => BRAND.domain || 'internet sitemiz';

// Adresi tek satır olarak verir (yazışma/sözleşme metinleri için).
export const addressLine = () =>
  [BRAND.address.line1, BRAND.address.line2].filter(Boolean).join(', ');

export default BRAND;
