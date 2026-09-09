import React from 'react';
import { useLocation } from 'react-router-dom';
import CollectionPage from './CollectionPage';
import { searchProducts } from '../utils/catalog';

const icon = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

// Arama sonuçları. Türkçe/aksan duyarsız eşleştirme utils/catalog.js içinde
// (searchProducts) — Navbar'daki canlı arama ile aynı mantığı kullanır.
export default function Arama() {
  const term = (new URLSearchParams(useLocation().search).get('q') || '').trim();

  return (
    <CollectionPage
      title={term ? `“${term}” için sonuçlar` : 'Arama'}
      subtitle={term ? null : 'Aramak istediğin ürünü yukarıdaki arama kutusuna yazabilirsin.'}
      load={() => searchProducts(term)}
      empty={{
        icon,
        title: term ? 'Sonuç bulunamadı' : 'Ne aramıştın?',
        text: term
          ? `“${term}” ile eşleşen bir ürün yok. Yazımı kontrol edebilir veya daha kısa bir kelime deneyebilirsin.`
          : 'Yukarıdaki arama kutusundan ürün adı, kategori veya renk yazarak arayabilirsin.',
        primary: { label: 'Yeni gelenler', to: '/yeni-gelenler' },
        secondary: { label: 'Çok satanlar', to: '/cok-satanlar' },
      }}
    />
  );
}
