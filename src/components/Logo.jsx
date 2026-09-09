import React from 'react';

// ---------------------------------------------------------------------------
// NOVA WEAR — LOGO
//
// Yazı-logo (logotype): görsel dosya değil, canlı yazıyla kurulur. Böylece
// her ekran yoğunluğunda net kalır, rengini temadan alır ve ayrı bir dosya
// indirilmez.
//
// Fikir: "nova" yeni doğan yıldız demek. Bu yüzden O harfi, vurgu renginde
// tam bir halkaya dönüşüyor — markanın kendine ait, tek bakışta tanınan bir
// işareti oluyor. Halka tek başına favicon olarak da kullanılıyor.
//
// Ölçü tek yerden yönetilir: bileşenin font-size'ı neyse tüm parçalar ona
// oranlı büyür/küçülür (em cinsinden tanımlı).
// ---------------------------------------------------------------------------

// layout:
//   'inline' — tek satır (navbar gibi alçak alanlar için)
//   'stack'  — iki satır, "WEAR" altta (hero ve footer gibi geniş alanlar)
// markOnly: yalnızca halka işareti. Daralan admin menüsü gibi yazının
// sığmadığı dar yerlerde kullanılır.
export default function Logo({ size = 'nav', layout = 'inline', markOnly = false, className = '', ...rest }) {
  if (markOnly) {
    return (
      <span
        className={`nw-logo nw-logo--${size} nw-logo--mark ${className}`.trim()}
        role="img"
        aria-label="Nova Wear"
        {...rest}
      >
        <i className="nw-logo-ring" />
      </span>
    );
  }

  return (
    <span
      className={`nw-logo nw-logo--${size} nw-logo--${layout} ${className}`.trim()}
      // Ekran okuyucular parçalanmış harfleri değil markanın adını okusun.
      role="img"
      aria-label="Nova Wear"
      {...rest}
    >
      <span className="nw-logo-main" aria-hidden="true">
        N<i className="nw-logo-ring" />VA
      </span>

      {/* Harfler space-between ile dağıtıldığı için "WEAR" satırı üstteki
          "NOVA"nın genişliğine tam olarak oturur. */}
      <span className="nw-logo-sub" aria-hidden="true">
        {['W', 'E', 'A', 'R'].map((ch, i) => <span key={i}>{ch}</span>)}
      </span>
    </span>
  );
}
