import React from 'react';

// ---------------------------------------------------------------------------
// GÜVEN ŞERİDİ
//
// Ana sayfada iki ürün karuselinin arasında duruyor. Bu yüzden dört ayrı kutu
// yerine tek bir şerit olarak kuruldu: bölümleri ayırırken sayfaya nefes
// veriyor, kart yığını görüntüsü oluşturmuyor.
//
// İkonlar emoji değil ince çizgili SVG — emojiler işletim sistemine göre
// değişip tasarımı bozuyordu.
// ---------------------------------------------------------------------------

const icon = (paths) => (
  <svg
    width="19" height="19" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    {paths}
  </svg>
);

const PERKS = [
  {
    title: 'Ücretsiz kargo',
    desc: '1500₺ üzeri siparişlerde',
    svg: icon(<><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></>),
  },
  {
    title: 'Kolay iade',
    desc: '14 gün içinde koşulsuz',
    svg: icon(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>),
  },
  {
    title: 'Güvenli ödeme',
    desc: '3D Secure ile korunur',
    svg: icon(<><path d="M12 3l7 3v6c0 4.4-3 8.2-7 9-4-.8-7-4.6-7-9V6z" /><path d="M9.5 12l1.8 1.8 3.2-3.6" /></>),
  },
  {
    title: 'Hızlı teslimat',
    desc: '15:00 öncesi aynı gün kargo',
    svg: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 1.9" /></>),
  },
];

export default function TrustBar() {
  return (
    <div className="nw-wrap">
      <section className="nw-trust">
        {PERKS.map((p) => (
          <div className="nw-trust-item" key={p.title}>
            <span className="nw-trust-icon">{p.svg}</span>
            <span className="nw-trust-text">
              <strong>{p.title}</strong>
              <span>{p.desc}</span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
