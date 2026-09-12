import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBanners, fetchHeroImage } from '../utils/catalog';
import heroBanner from '../assets/hero-banner.jpg';
import { imageUrl, imageFallback } from '../utils/storage';

export default function Hero() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [heroImg, setHeroImg] = useState(null);

  useEffect(() => {
    // Aktif banner'lar (admin > Pazarlama) ve hero görseli (admin > settings/hero)
    fetchBanners()
      .then(setBanners)
      .finally(() => setLoaded(true));

    fetchHeroImage().then((url) => { if (url) setHeroImg(url); });
  }, []);

  // Birden fazla banner varsa otomatik geçiş
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setCurrent((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const handleBannerClick = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link);
    }
  };

  // --- AKTİF BANNER VARSA: ANA SAYFA SLIDER ---
  if (loaded && banners.length > 0) {
    return (
      <section className="nw-wrap" style={{ paddingTop: 18, paddingBottom: 6 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 7',
            borderRadius: 'var(--nw-r-lg)',
            overflow: 'hidden',
            border: '1px solid var(--nw-line)',
            background: 'var(--nw-bg-elev)',
            boxShadow: 'var(--nw-shadow)',
          }}
        >
          {banners.map((b, i) => (
            <div
              key={b.id}
              onClick={() => handleBannerClick(b.link)}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: i === current ? 1 : 0,
                transition: 'opacity .7s var(--nw-ease)',
                cursor: b.link ? 'pointer' : 'default',
              }}
            >
              <img
                src={imageUrl(b.imageUrl, 1600)}
                alt={b.title || 'Nova Wear kampanya görseli'}
                onError={imageFallback}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}

          {/* Birden fazla banner varsa geçiş noktaları */}
          {banners.length > 1 && (
            <div
              style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 8,
              }}
            >
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  aria-label={`${i + 1}. görsele geç`}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: i === current ? 26 : 8, height: 8, borderRadius: 999, border: 0,
                    background: i === current ? 'var(--nw-accent)' : 'rgba(255,255,255,.45)',
                    cursor: 'pointer', transition: 'all .3s var(--nw-ease)', padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- BANNER YOKSA: STATİK HERO ---
  // Metin bloğu ve logo paneli kaldırıldı: sayfa, tam genişlikte tek bir
  // görselle açılıyor. Admin panelinden (settings/hero) bir görsel
  // yüklendiğinde onun yerini o alır.
  return (
    <section className="nw-hero-banner">
      <img
        src={heroImg ? imageUrl(heroImg, 1600) : heroBanner}
        alt="Nova Wear yeni sezon koleksiyonu"
        onError={imageFallback}
      />
    </section>
  );
}
