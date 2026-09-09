import React from 'react';
import { useNavigate } from 'react-router-dom';
import { imageUrl, imageFallback } from '../utils/storage';

// ---------------------------------------------------------------------------
// ÜRÜN KARTI
// Daha önce NewArrivals ve PopularCollection içinde neredeyse birebir aynı
// şekilde iki kez yazılmıştı. Tek bileşene alındı: kart tasarımı değiştiğinde
// tek dosya güncellenir, iki bölüm birden değişir.
// ---------------------------------------------------------------------------

// Favoriler localStorage'da tutulur (giriş yapmadan da çalışsın diye).
function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem('myFavorites') || '[]');
  } catch {
    return [];
  }
}

export default function ProductCard({ product, badge, favorites, onFavoritesChange }) {
  const navigate = useNavigate();

  const image = product.images?.[0] || product.imageUrl;
  const color =
    product.color ||
    (product.variants?.length ? product.variants[0].color : null);
  const displayName = color ? `${product.name} - ${color}` : product.name;
  const isFavorite = favorites.some((f) => f.id === product.id);

  const openProduct = () => navigate(`/product/${product.id}`, { state: product });

  const toggleFavorite = (e) => {
    e.stopPropagation();
    const current = readFavorites();
    const next = current.some((f) => f.id === product.id)
      ? current.filter((f) => f.id !== product.id)
      : [...current, product];
    localStorage.setItem('myFavorites', JSON.stringify(next));
    onFavoritesChange(next);
  };

  const addToCart = (e) => {
    e.stopPropagation();

    // Bedenli üründe kart üzerinden seçim yapılamadığı için kullanıcıyı
    // doğrudan detay sayfasına gönderiyoruz.
    if (product.variants?.length) {
      openProduct();
      return;
    }

    const cart = JSON.parse(localStorage.getItem('myCart') || '[]');
    const existing = cart.findIndex((item) => item.id === product.id);
    if (existing > -1) {
      cart[existing].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('myCart', JSON.stringify(cart));
    // Navbar'daki sepet sayacı bu olayı dinliyor.
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <article className="nw-card" onClick={openProduct}>
      <div className="nw-card-media">
        {badge && <span className="nw-card-badge">{badge}</span>}

        <button
          className={`nw-card-fav${isFavorite ? ' is-on' : ''}`}
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          aria-pressed={isFavorite}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
               fill={isFavorite ? 'currentColor' : 'none'}
               stroke="currentColor" strokeWidth="1.8">
            <path d="M20.8 6.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2c-1 3 1.4 6 8.8 11.6 7.4-5.6 9.8-8.6 8.8-11.6z" />
          </svg>
        </button>

        <img className="nw-card-img" src={imageUrl(image, 500)} alt={product.name} loading="lazy" onError={imageFallback} />
      </div>

      <div className="nw-card-body">
        <h3 className="nw-card-name" title={displayName}>{displayName}</h3>

        <div className="nw-card-foot">
          <span className="nw-card-price">
            {Number(product.price).toLocaleString('tr-TR')} ₺
          </span>

          <button className="nw-card-cart" onClick={addToCart} aria-label="Sepete ekle" title="Sepete ekle">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
