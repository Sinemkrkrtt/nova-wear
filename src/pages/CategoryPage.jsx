import React from 'react';
import { useParams } from 'react-router-dom';
import CollectionPage from './CollectionPage';
import { fetchByCategory } from '../utils/catalog';

const icon = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 7H4l1.2 12.1a2 2 0 0 0 2 1.9h9.6a2 2 0 0 0 2-1.9z" />
    <path d="M8.5 7V5.5a3.5 3.5 0 0 1 7 0V7" />
  </svg>
);

// Kategori sayfası. Liste, ızgara ve kart tasarımı CollectionPage'den geliyor;
// burada yalnızca hangi kategorinin gösterileceği belirleniyor.
export default function CategoryPage() {
  const { categoryName } = useParams();
  const name = decodeURIComponent(categoryName || '');

  return (
    <CollectionPage
      title={name}
      subtitle={`${name} koleksiyonundaki parçalar`}
      load={() => fetchByCategory(name)}
      empty={{
        icon,
        title: 'Bu koleksiyon henüz hazırlanıyor',
        text: `${name} kategorisine yakında yeni parçalar eklenecek. Bu arada diğer koleksiyonlara göz atabilirsin.`,
        primary: { label: 'Yeni gelenler', to: '/yeni-gelenler' },
        secondary: { label: 'Ana sayfa', to: '/' },
      }}
    />
  );
}
