import React, { useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

// ---------------------------------------------------------------------------
// ÜRÜN ŞERİDİ (yatay karusel)
//
// "Yeni Gelenler" ve "Çok Satanlar" bölümlerinin ortak iskeleti.
//
// Üç durumu var:
//   yükleniyor  — iskelet kartlar (sayfanın çalıştığı belli olsun)
//   boş         — başlık kalır, altında kısa bir not (bölüm kaybolmaz)
//   dolu        — gerçek kartlar
//
// Kaydırma, dizin sayacı yerine gerçek yatay scroll + CSS scroll-snap ile
// yapılır: mobilde parmakla, masaüstünde oklarla kayar.
// ---------------------------------------------------------------------------

const SKELETON_COUNT = 4;

// items: liste dışarıdan verilebilir (ürün detay sayfası kendi sorgusunu
// zaten yapıyor). Verilmezse şerit load() ile kendi verisini çeker.
export default function ProductRail({ title, subtitle, badge, load, items, onSeeAll, emptyText }) {
  const controlled = Array.isArray(items);
  const [products, setProducts] = useState(controlled ? items : []);
  const [loading, setLoading] = useState(!controlled);
  const [favorites, setFavorites] = useState([]);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem('myFavorites') || '[]'));
  }, []);

  // Dışarıdan gelen liste değişince (başka bir ürüne geçildiğinde) yenile.
  useEffect(() => {
    if (controlled) setProducts(items);
  }, [controlled, items]);

  useEffect(() => {
    if (controlled) return;
    let alive = true;
    load()
      .then((list) => { if (alive) setProducts(list); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // load() her render'da yeni referans almasın diye bilerek boş bağımlılık;
    // bölümler sayfa açılışında bir kez yüklenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Okların aktif/pasif durumunu gerçek kaydırma konumundan hesaplar.
  const syncArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  useEffect(() => { syncArrows(); }, [products]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    // Görünen genişliğin %80'i kadar kaydır — kartların bir kısmı görünür kalır,
    // devamı olduğu belli olur.
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const isEmpty = !loading && products.length === 0;

  return (
    <section className="nw-section nw-wrap">
      <div className="nw-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {/* Boşken ok ve "tümünü gör" göstermenin anlamı yok. */}
        {!isEmpty && (
          <div className="nw-rail-nav">
            {onSeeAll && !loading && (
              <span className="nw-section-link" onClick={onSeeAll}>Tümünü gör →</span>
            )}
            <button className="nw-rail-arrow" onClick={() => scrollBy(-1)} disabled={loading || atStart} aria-label="Geri kaydır">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button className="nw-rail-arrow" onClick={() => scrollBy(1)} disabled={loading || atEnd} aria-label="İleri kaydır">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="nw-rail" aria-busy="true" aria-label={`${title} yükleniyor`}>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : isEmpty ? (
        <p className="nw-rail-empty">
          {emptyText || 'Bu bölüm şu anda boş. Yeni parçalar eklendiğinde burada görünecek.'}
        </p>
      ) : (
        <div className="nw-rail" ref={trackRef} onScroll={syncArrows}>
          {products.map((p) => (
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
    </section>
  );
}
