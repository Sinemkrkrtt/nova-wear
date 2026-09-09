import React from 'react';
import CollectionPage from './CollectionPage';

const icon = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 6.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2c-1 3 1.4 6 8.8 11.6 7.4-5.6 9.8-8.6 8.8-11.6z" />
  </svg>
);

// Favoriler tarayıcıda (localStorage) tutulur, giriş yapmadan da çalışsın diye.
// fromFavorites: liste doğrudan favorilerin kendisidir — kalp ikonuna basılınca
// ürün anında listeden çıkar.
export default function FavoritesPage() {
  return (
    <CollectionPage
      title="Favorilerim"
      subtitle="Beğendiğin parçalar burada birikiyor"
      fromFavorites
      empty={{
        icon,
        title: 'Favori listen henüz boş',
        text: 'Beğendiğin ürünlerin sağ üstündeki kalbe dokunarak listene ekleyebilir, daha sonra buradan kolayca bulabilirsin.',
        primary: { label: 'Yeni gelenler', to: '/yeni-gelenler' },
        secondary: { label: 'Çok satanlar', to: '/cok-satanlar' },
      }}
    />
  );
}
