// ---------------------------------------------------------------------------
// KATALOG VERİ KATMANI
//
// Ürün listeleyen tüm sayfaların (ana sayfa şeritleri, kategori, arama,
// yeni gelenler, çok satanlar) okumaları burada toplanır.
//
// TEK VERİ KAYNAĞI FIRESTORE'DUR: ürünler yalnızca admin panelinden
// eklendiğinde görünür. Koleksiyon boşsa boş liste döner ve sayfalar kendi
// "henüz ürün yok" ekranını gösterir.
// ---------------------------------------------------------------------------

import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// Bir ürünün toplam stoğu. Varyantı olmayan ürünler stoksuz sayılır.
export function totalStock(product) {
  if (!product?.variants?.length) return 0;
  return product.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
}

// Tüm ürünler. Firebase kurulu değilse veya okuma başarısızsa boş liste.
async function allProducts() {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Ürünler çekilemedi:', e);
    return [];
  }
}

// YENİ GELENLER — en son eklenen, stokta olan ürünler.
export async function fetchNewArrivals(max = 12) {
  if (!isFirebaseConfigured) return [];
  try {
    // Stoksuzlar elenince geriye ürün kalsın diye limiti geniş tutuyoruz.
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(max * 3));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => totalStock(p) > 0)
      .slice(0, max);
  } catch (e) {
    console.error('Yeni ürünler çekilemedi:', e);
    return [];
  }
}

// ÇOK SATANLAR — ürün üzerindeki 'soldCount' sayacına göre sıralanır.
// GÜVENLİK NOTU: Bu sayaç, ödeme başarıyla tamamlandığında sunucu tarafında
// (paymentCallback) artar. Müşteri PII'si içeren 'orders' koleksiyonu
// istemciden hiçbir zaman okunmaz.
export async function fetchBestSellers(max = 12) {
  const products = await allProducts();
  return products
    .map((p) => ({ ...p, totalSales: Number(p.soldCount) || 0 }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, max);
}

// Aramayı Türkçe karakter ve aksan duyarsız hale getirir:
// "şık ELBİSE" ile "sik elbise", "abıye" ile "abiye" eşleşsin.
export const normalizeText = (s) => String(s || '')
  .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c')
  .replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u').replace(/[ğĞ]/g, 'g')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

// KATEGORİYE GÖRE ÜRÜNLER. Ürünün 'category' alanı dizi de olabilir, tek
// değer de — ikisi de destekleniyor.
export async function fetchByCategory(categoryName) {
  const products = await allProducts();
  return products.filter((p) => {
    const cats = Array.isArray(p.category) ? p.category : [p.category].filter(Boolean);
    return cats.includes(categoryName);
  });
}

// ARAMA — ürün adı, kategori, renk ve açıklamada arar. Tüm kelimelerin
// geçmesi gerekir (VE mantığı), böylece "siyah tişört" ikisini de içerenleri
// getirir.
export async function searchProducts(term) {
  const tokens = normalizeText(term).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  const products = await allProducts();
  return products.filter((p) => {
    const cats = Array.isArray(p.category) ? p.category.join(' ') : (p.category || '');
    const haystack = normalizeText(
      [p.name, cats, p.color, p.description].filter(Boolean).join(' ')
    );
    return tokens.every((t) => haystack.includes(t));
  });
}

// ANA SAYFA BANNER'LARI — admin > Pazarlama sayfasından yönetilir.
// Banner yoksa boş dizi döner; Hero bu durumda kendi tasarımını gösterir.
export async function fetchBanners() {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(collection(db, 'banners'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => b.isActive && b.imageUrl)
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (e) {
    console.error('Bannerlar çekilemedi:', e);
    return [];
  }
}

// KATEGORİLER — tek kaynak utils/categories.js; buradan yeniden dışa aktarılır
// ki sayfalar tüm katalog okumalarını tek modülden yapabilsin.
export { fetchCategories, DEFAULT_CATEGORIES } from './categories';

// Admin panelinden ayarlanan hero görseli (settings/hero). Yoksa null.
export async function fetchHeroImage() {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDoc(doc(db, 'settings', 'hero'));
    return snap.exists() ? (snap.data().imageUrl || null) : null;
  } catch (e) {
    return null;
  }
}
