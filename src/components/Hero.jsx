import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBanners, fetchHeroImage } from '../utils/catalog';
import heroLogo from '../assets/hero-logo.png';
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
  return (
    <section className="nw-hero">
      <div className="nw-wrap">
        <div className="nw-hero-inner">
          <div>
            <div className="nw-eyebrow">Abiye &amp; Davet — 2026</div>

            <h1>
              Gecenin<br />
              <em>en zarif</em> hali
            </h1>

            <p>
              Davet, nişan ve özel geceler için elbiseler. Kumaşın düşüşü,
              kesimin oturuşu ve detayın sadeliği üzerine kurulu.
            </p>

            <div className="nw-hero-actions">
              <button className="nw-btn nw-btn-primary" onClick={() => navigate('/cok-satanlar')}>
                Koleksiyonu keşfet
              </button>
              <button className="nw-btn nw-btn-ghost" onClick={() => navigate('/yeni-gelenler')}>
                Yeni gelenler
              </button>
            </div>
          </div>

          {/* Admin panelinden (settings/hero) bir görsel yüklendiyse o gösterilir;
              yüklenene kadar markanın logo görseli duruyor.
              Logo kare; kutu ise geniş. object-fit:cover ile üstteki/alttaki
              boş pay kırpılıyor, yazı tam ortada kalıyor. */}
          <div className={`nw-hero-media${heroImg ? '' : ' is-logo'}`}>
            {heroImg ? (
              <img src={imageUrl(heroImg, 1200)} alt="Nova Wear yeni sezon koleksiyonu" onError={imageFallback} />
            ) : (
              <img src={heroLogo} alt="Nova Wear — Shine like a nova" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
