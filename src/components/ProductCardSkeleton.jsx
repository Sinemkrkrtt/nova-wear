import React from 'react';

// ---------------------------------------------------------------------------
// ÜRÜN KARTI İSKELETİ
//
// Veri gelene kadar gerçek kartın yerini tutar. Amaç iki yönlü:
//  - Kullanıcı sayfanın çalıştığını görür (boş ekran "bozuk" hissi vermez),
//  - Kartlar yüklenince yerleşim zıplamaz, çünkü iskelet aynı ölçüde.
//
// Parıltı animasyonu, hareket azaltma tercihi olan kullanıcılarda otomatik
// olarak durur (bkz. tokens.css > prefers-reduced-motion).
// ---------------------------------------------------------------------------

export default function ProductCardSkeleton() {
  return (
    <div className="nw-card nw-card-skel" aria-hidden="true">
      <div className="nw-card-media nw-skel" />
      <div className="nw-card-body">
        <span className="nw-skel nw-skel-line" style={{ width: '85%' }} />
        <span className="nw-skel nw-skel-line" style={{ width: '55%' }} />
        <span className="nw-skel nw-skel-line nw-skel-price" style={{ width: '38%' }} />
      </div>
    </div>
  );
}
