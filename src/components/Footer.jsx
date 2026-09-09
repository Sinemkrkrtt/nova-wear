import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InstagramIcon from '@mui/icons-material/Instagram';
import { fetchCategories, DEFAULT_CATEGORIES } from '../utils/categories';
import BRAND from '../config/brand';
import Logo from './Logo';

const SERVICE_LINKS = [
  { to: '/iade-degisim', label: 'İade, İptal ve Değişim' },
  { to: '/mesafeli-satis-sozlesmesi', label: 'Mesafeli Satış Sözleşmesi' },
  { to: '/on-bilgilendirme-formu', label: 'Ön Bilgilendirme Formu' },
  { to: '/sikca-sorulan-sorular', label: 'Sıkça Sorulan Sorular' },
  { to: '/kargo-takip', label: 'Kargo Takip' },
  { to: '/kvkk', label: 'KVKK ve Aydınlatma Metni' },
  { to: '/gizlilik-politikasi', label: 'Gizlilik Politikası' },
];

export default function Footer() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  useEffect(() => { fetchCategories().then(setCategories); }, []);

  return (
    <footer className="nw-footer">
      <div className="nw-wrap">
        <div className="nw-footer-grid">

          {/* MARKA */}
          <div>
            <Logo size="footer" layout="stack" />
            <p className="nw-footer-slogan">{BRAND.slogan}</p>
            <p className="nw-footer-about">
              Günlük giyimde doğru kumaş ve abartısız kesim.
              Sezon geçse de eskimeyen parçalar.
            </p>
          </div>

          {/* KOLEKSİYONLAR */}
          <div>
            <h4>Koleksiyonlar</h4>
            {categories.map((cat) => (
              <Link key={cat} to={`/kategori/${encodeURIComponent(cat)}`} className="nw-footer-link">
                {cat}
              </Link>
            ))}
          </div>

          {/* MÜŞTERİ HİZMETLERİ */}
          <div>
            <h4>Müşteri hizmetleri</h4>
            {SERVICE_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="nw-footer-link">{l.label}</Link>
            ))}
          </div>

          {/* İLETİŞİM */}
          <div>
            <h4>Bize ulaşın</h4>

            {BRAND.instagram && (
              <a
                className="nw-footer-social"
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <InstagramIcon fontSize="small" />
              </a>
            )}

            <p className="nw-footer-contact">{BRAND.phone}</p>
            <p className="nw-footer-contact">{BRAND.email}</p>
            <p className="nw-footer-contact nw-footer-contact-dim">
              {[BRAND.address.line1, BRAND.address.line2].filter(Boolean).map((line) => (
                <React.Fragment key={line}>{line}<br /></React.Fragment>
              ))}
            </p>
          </div>
        </div>

        <div className="nw-footer-bottom">
          <span>&copy; {new Date().getFullYear()} {BRAND.name}. Tüm hakları saklıdır.</span>

          {/* Ödeme logoları — yerel görseller, dış bağımlılık yok */}
          <div className="nw-footer-pay">
            {['iyzico', 'visa', 'mastercard'].map((brand) => (
              <span className="nw-pay-chip" key={brand}>
                <img
                  src={`${process.env.PUBLIC_URL}/payment/${brand}.svg`}
                  alt={brand}
                  style={{ height: brand === 'mastercard' ? 20 : 14, display: 'block' }}
                />
              </span>
            ))}
          </div>

          <span>%100 güvenli alışveriş — 256-bit SSL</span>
        </div>
      </div>
    </footer>
  );
}
