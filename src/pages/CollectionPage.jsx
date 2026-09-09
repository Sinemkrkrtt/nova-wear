import React, { useEffect, useState } from 'react';
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
            <span className="nw-collection-count">{items.length} ürün</span>
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
            {items.map((p) => (
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
