import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// Firestore'daki 'categories' koleksiyonu boşken menüde gösterilecek
// başlangıç listesi. Admin > Pazarlama sayfasından kategori eklendiği anda
// bunların yerini gerçek kayıtlar alır.
//
// NOT: Bunlar yalnızca MENÜ başlıklarıdır, ürün değildir. Ürünler tamamen
// admin panelinden eklenir.
export const DEFAULT_CATEGORIES = [
    "Yeni Sezon",
    "Dış Giyim",
    "Sweatshirt",
    "Denim",
    "Triko",
    "Tişört",
    "Pantolon",
    "Gömlek",
];

// Kategorileri Firestore'dan çeker. Koleksiyon boşsa varsayılanları döndürür —
// böylece admin kategori eklemeden önce de menü boş görünmez.
export async function fetchCategories() {
    if (!isFirebaseConfigured) return DEFAULT_CATEGORIES;
    try {
        const snap = await getDocs(collection(db, 'categories'));
        if (snap.empty) return DEFAULT_CATEGORIES;
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) =>
                ((a.order ?? 999) - (b.order ?? 999)) ||
                ((a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
            )
            .map(d => d.name)
            .filter(Boolean);
    } catch (e) {
        console.error("Kategoriler çekilemedi:", e);
        return DEFAULT_CATEGORIES;
    }
}
