import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';

// ---------------------------------------------------------------------------
// KOLEKSİYON SAYFASI
//
// Ürün listeleyen tüm sayfaların ortak iskeleti: yeni gelenler, çok satanlar,
// kategori, arama sonuçları ve favoriler.
//
// Daha önce bu sayfaların her biri kendi kart işaretlemesini, kendi boş
// durumunu ve kendi ızgarasını ayrı ayrı yazıyordu. Artık kart ana sayfadaki
// ProductCard'dan geliyor — bir kez güncellenince her yerde değişiyor.
//
// Veri iki yoldan gelebilir:
//   load          — sunucudan/katalogdan çeken fonksiyon
//   fromFavorites — liste, tarayıcıdaki favorilerin kendisi olur (canlı)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SIRALAMA
//
// Tarayıcıda yapılıyor: liste zaten çekilmiş durumda, sunucuya ikinci bir
// sorgu atmak hem yavaş hem gereksiz. Ürün sayısı binleri bulursa bu mantık
// Firestore sorgusuna taşınmalı.
// ---------------------------------------------------------------------------

// createdAt Firestore Timestamp, Date ya da sayı olabilir; hepsini karşılar.
const timeOf = (p) => {
  const c = p.createdAt;
  if (!c) return 0;
  if (typeof c.toMillis === 'function') return c.toMillis();
  if (c.seconds) return c.seconds * 1000;
  const t = new Date(c).getTime();
  return Number.isFinite(t) ? t : 0;
};

const SORTS = [
  { id: 'onerilen', label: 'Önerilen' },
  { id: 'yeni', label: 'Yeni eklenenler' },
  { id: 'ucuz', label: 'Fiyat: düşükten yükseğe' },
  { id: 'pahali', label: 'Fiyat: yüksekten düşüğe' },
];

// Boş durum: sayfanın en zayıf hâli olduğu için özellikle tasarlandı.
// Halka, markanın logo işaretini yankılıyor.
function EmptyState({ icon, title, text, primary, secondary }) {
  const navigate = useNavigate();
  // Başlık verilmemişse anlamlı bir varsayılan kullan: aksi halde yalnızca
  // boş bir halka basılıyordu.
  if (!title) title = 'Burada henüz ürün yok';
  return (
    <div className="nw-empty">
      <span className="nw-empty-mark">{icon}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      <div className="nw-empty-actions">
        {primary && (
          <button className="nw-btn nw-btn-primary" onClick={() => navigate(primary.to)}>
            {primary.label}
          </button>
        )}
        {secondary && (
          <button className="nw-btn nw-btn-ghost" onClick={() => navigate(secondary.to)}>
            {secondary.label}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CollectionPage({
  title,
  subtitle,
  badge,
  load,
  fromFavorites = false,
  empty,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!fromFavorites);
  const [favorites, setFavorites] = useState([]);
  const { pathname, search } = useLocation();

  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    setFavorites(JSON.parse(localStorage.getItem('myFavorites') || '[]'));

    if (fromFavorites) { setLoading(false); return; }

    setLoading(true);
    load()
      .then((list) => { if (alive) setProducts(list); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
    // Rota veya arama terimi değişince yeniden yüklensin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // Favoriler sayfasında liste favorilerin kendisidir: kalp ikonuna basılınca
  // ürün anında listeden çıkar.
  const items = fromFavorites ? favorites : products;

  // --- SIRALAMA ---
  const [sort, setSort] = useState('onerilen');

  // Rota değişince (başka kategoriye geçilince) sıralama başa döner.
  useEffect(() => { setSort('onerilen'); }, [pathname, search]);

  const visible = useMemo(() => {
    // Sıralama listeyi yerinde değiştirmemeli: kopya üzerinde çalışılıyor.
    const priced = (p) => Number(p.price) || 0;
    switch (sort) {
      case 'ucuz':   return [...items].sort((a, b) => priced(a) - priced(b));
      case 'pahali': return [...items].sort((a, b) => priced(b) - priced(a));
      case 'yeni':   return [...items].sort((a, b) => timeOf(b) - timeOf(a));
      default:       return items;   // 'önerilen' = geldiği sıra
    }
  }, [items, sort]);

  return (
    <div className="nw-page">
      <Navbar />

      <div className="nw-wrap">
        <nav className="nw-crumbs" aria-label="Konum">
          <Link to="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <span>{title}</span>
        </nav>

        {/* Başlık ile sağdaki sayı/sıralama iki ayrı sütun: mutlak konum yerine
            ızgara kullanılıyor, böylece uzun bir alt başlık sağdaki kutunun
            altına giremiyor. */}
        <header className="nw-collection-head">
          <div className="nw-collection-titles">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>

          {!loading && items.length > 0 && (
            <div className="nw-collection-meta">
              <label className="nw-sort">
                <span className="nw-label">Sırala</span>
                <select
                  className="nw-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sıralama"
                >
                  {SORTS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>

              <span className="nw-collection-count">{visible.length} ürün</span>
            </div>
          )}
        </header>

        {loading ? (
          // İskelet kartlar: yerleşim zıplamasın ve sayfanın çalıştığı belli olsun.
          <div className="nw-grid" aria-busy="true" aria-label="Ürünler yükleniyor">
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState {...empty} />
        ) : (
          <div className="nw-grid">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                badge={badge}
                favorites={favorites}
                onFavoritesChange={setFavorites}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
