import React from 'react';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// EDİTORYAL BANT
//
// İki ürün şeridinden sonra, footer'dan önce duran tek cümlelik bir moment.
// İşlevi ürün göstermek değil: sayfaya nefes vermek ve markanın tonunu
// hissettirmek. Moda kataloglarında iki ürün sayfasının arasına konan boş
// sayfa gibi — orada satış yapılmaz, hava kurulur.
//
// Bu yüzden içinde tek bir cümle, ince bir ayraç ve tek bir çıkış var.
// ---------------------------------------------------------------------------

export default function Statement() {
  const navigate = useNavigate();

  return (
    <section className="nw-statement">
      <div className="nw-wrap nw-statement-inner">
        <span className="nw-statement-rule" aria-hidden="true" />

        <p className="nw-statement-text">
          Bir elbise yalnızca giyilmez;<br />
          <em>hatırlanacak</em> bir akşamın parçası olur.
        </p>

        <button className="nw-statement-link" onClick={() => navigate('/yeni-gelenler')}>
          Koleksiyona göz at
        </button>
      </div>
    </section>
  );
}
