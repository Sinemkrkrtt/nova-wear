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
// FİLTRELEME VE SIRALAMA
//
// Hepsi tarayıcıda yapılıyor: liste zaten çekilmiş durumda, sunucuya ikinci
// bir sorgu atmak hem yavaş hem gereksiz. Ürün sayısı binleri bulursa bu
// mantık Firestore sorgusuna taşınmalı.
// ---------------------------------------------------------------------------

// Bedenler alfabetik değil, giyim sırasıyla dizilir: XS, S, M, L, XL...
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const sizeRank = (v) => {
  const i = SIZE_ORDER.indexOf(String(v).toUpperCase());
  if (i >= 0) return i;
  const n = parseFloat(v);              // 36, 38, 40 gibi numaralar
  return Number.isFinite(n) ? 100 + n : 999;
};

const variantsOf = (p) => (Array.isArray(p.variants) ? p.variants : []);

// Yalnızca stoğu olan beden/renkler seçenek olarak sunulur: tükenmiş bir
// bedeni filtreye koymak kullanıcıyı boş sonuca götürür.
const sizesOf = (p) => variantsOf(p).filter(v => Number(v.stock) > 0).map(v => v.size).filter(Boolean);
const colorsOf = (p) => {
  const list = variantsOf(p).filter(v => Number(v.stock) > 0).map(v => v.color).filter(Boolean);
  return list.length ? list : [p.color].filter(Boolean);
};

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

  // --- FİLTRE / SIRALAMA DURUMU ---
  const [sort, setSort] = useState('onerilen');
  const [pickedSizes, setPickedSizes] = useState([]);
  const [pickedColors, setPickedColors] = useState([]);

  // Rota değişince (başka kategoriye geçilince) seçimler sıfırlanır.
  useEffect(() => {
    setSort('onerilen');
    setPickedSizes([]);
    setPickedColors([]);
  }, [pathname, search]);

  // Seçenekler listenin kendisinden çıkarılır: elle yazılmış bir beden/renk
  // listesi, admin yeni bir değer eklediğinde eskir.
  const sizeOptions = useMemo(() => {
    const set = new Set();
    items.forEach(p => sizesOf(p).forEach(v => set.add(String(v).toUpperCase())));
    return [...set].sort((a, b) => sizeRank(a) - sizeRank(b));
  }, [items]);

  const colorOptions = useMemo(() => {
    const set = new Set();
    items.forEach(p => colorsOf(p).forEach(v => set.add(String(v))));
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [items]);

  const visible = useMemo(() => {
    let list = items;

    if (pickedSizes.length) {
      list = list.filter(p => sizesOf(p).some(v => pickedSizes.includes(String(v).toUpperCase())));
    }
    if (pickedColors.length) {
      list = list.filter(p => colorsOf(p).some(v => pickedColors.includes(String(v))));
    }

    // Sıralama listeyi yerinde değiştirmemeli: kopya üzerinde çalışılıyor.
    const priced = (p) => Number(p.price) || 0;
    switch (sort) {
      case 'ucuz':   return [...list].sort((a, b) => priced(a) - priced(b));
      case 'pahali': return [...list].sort((a, b) => priced(b) - priced(a));
      case 'yeni':   return [...list].sort((a, b) => timeOf(b) - timeOf(a));
      default:       return list;   // 'önerilen' = geldiği sıra
    }
  }, [items, pickedSizes, pickedColors, sort]);

  const toggle = (value, picked, setPicked) =>
    setPicked(picked.includes(value) ? picked.filter(v => v !== value) : [...picked, value]);

  const filtreliMi = pickedSizes.length > 0 || pickedColors.length > 0;
  const temizle = () => { setPickedSizes([]); setPickedColors([]); };

  // Araç çubuğu tek seçenek varken gereksiz yer kaplar.
  const araclarGorunsun = !loading && items.length > 1 &&
    (sizeOptions.length > 1 || colorOptions.length > 1 || items.length > 3);

  return (
    <div className="nw-page">
      <Navbar />

      <div className="nw-wrap">
        <nav className="nw-crumbs" aria-label="Konum">
          <Link to="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <span>{title}</span>
        </nav>

        <header className="nw-collection-head">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {!loading && items.length > 0 && (
            <span className="nw-collection-count">{visible.length} ürün</span>
          )}
        </header>

        {araclarGorunsun && (
          <div className="nw-tools">
            {sizeOptions.length > 1 && (
              <div className="nw-tool">
                <span className="nw-label">Beden</span>
                <div className="nw-chips">
                  {sizeOptions.map((sz) => (
                    <button
                      key={sz}
                      className={`nw-chip${pickedSizes.includes(sz) ? ' is-on' : ''}`}
                      onClick={() => toggle(sz, pickedSizes, setPickedSizes)}
                      aria-pressed={pickedSizes.includes(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colorOptions.length > 1 && (
              <div className="nw-tool">
                <span className="nw-label">Renk</span>
                <div className="nw-chips">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      className={`nw-chip${pickedColors.includes(c) ? ' is-on' : ''}`}
                      onClick={() => toggle(c, pickedColors, setPickedColors)}
                      aria-pressed={pickedColors.includes(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="nw-tool nw-tool-sort">
              <label className="nw-label" htmlFor="nw-sort">Sırala</label>
              <select
                id="nw-sort"
                className="nw-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORTS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>

            {filtreliMi && (
              <button className="nw-tool-clear" onClick={temizle}>Filtreleri temizle</button>
            )}
          </div>
        )}

        {loading ? (
          // İskelet kartlar: yerleşim zıplamasın ve sayfanın çalıştığı belli olsun.
          <div className="nw-grid" aria-busy="true" aria-label="Ürünler yükleniyor">
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState {...empty} />
        ) : visible.length === 0 ? (
          /* Liste dolu ama filtre her şeyi eledi: boş sayfa yerine çıkış yolu. */
          <div className="nw-tools-empty">
            <p>Seçtiğin filtreye uyan ürün yok.</p>
            <button className="nw-btn nw-btn-ghost" onClick={temizle}>Filtreleri temizle</button>
          </div>
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
