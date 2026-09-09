import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductRail from './ProductRail';
import { fetchNewArrivals } from '../utils/catalog';

// Karusel ve kart tasarımı ProductRail/ProductCard içinde ortaklandı —
// bu dosya artık yalnızca "hangi veri, hangi başlık" sorusunu cevaplıyor.
export default function NewArrivals() {
  const navigate = useNavigate();

  return (
    <ProductRail
      title="Yeni gelenler"
      subtitle="Bu sezon rafa çıkan son parçalar"
      badge="YENİ"
      load={() => fetchNewArrivals(12)}
      onSeeAll={() => navigate('/yeni-gelenler')}
    />
  );
}
