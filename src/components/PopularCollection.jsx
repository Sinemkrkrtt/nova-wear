import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductRail from './ProductRail';
import { fetchBestSellers } from '../utils/catalog';

// Çok satanlar. Sıralama ürünlerdeki 'soldCount' sayacına göre yapılır;
// müşteri bilgisi içeren 'orders' koleksiyonu istemciden okunmaz (bkz. catalog.js).
export default function PopularCollection() {
  const navigate = useNavigate();

  return (
    <ProductRail
      title="Çok satanlar"
      subtitle="En çok tercih edilen elbiseler"
      load={() => fetchBestSellers(12)}
      onSeeAll={() => navigate('/cok-satanlar')}
    />
  );
}
