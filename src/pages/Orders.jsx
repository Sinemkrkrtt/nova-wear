import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import BRAND from '../config/brand';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargoData, setCargoData] = useState({});

  // Arama / filtre / yeni sipariş bildirimi
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newOrderCount, setNewOrderCount] = useState(0);

  // CANLI güncelleme: siparişler onSnapshot ile anlık dinlenir (elle yenileme yok)
  useEffect(() => {
    let isInitial = true;
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const validOrders = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(o => o.status !== 'Ödeme Bekliyor')
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

      // İlk yüklemeden SONRA eklenen siparişler için bildirim
      if (!isInitial) {
        const added = snapshot.docChanges().filter(
          c => c.type === 'added' && c.doc.data().status !== 'Ödeme Bekliyor'
        );
        if (added.length > 0) setNewOrderCount(prev => prev + added.length);
      }
      isInitial = false;

      // Kargo düzenlemelerini koru; yeni siparişlere varsayılan ata
      setCargoData(prev => {
        const next = { ...prev };
        validOrders.forEach(o => {
          if (!next[o.id]) {
            next[o.id] = {
              cargoCompany: o.cargoCompany || 'Yurtiçi Kargo',
              trackingNumber: o.trackingNumber || ''
            };
          }
        });
        return next;
      });

      setOrders(validOrders);
      setLoading(false);
    }, (error) => {
      console.error("Siparişler dinlenirken hata:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    } catch (error) {
      alert("Durum güncellenemedi.");
    }
  };

  // Kapıda ödeme siparişinde teslimatta para alınınca ödemeyi "alındı" işaretler.
  const handleMarkPaid = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { paymentStatus: 'paid' });
      setOrders(orders.map(order => order.id === orderId ? { ...order, paymentStatus: 'paid' } : order));
    } catch (error) {
      alert("Ödeme durumu güncellenemedi.");
    }
  };

  // SİLME ÖZELLİĞİ
  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm("Bu siparişi tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!");
    
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        setOrders(orders.filter(order => order.id !== orderId));
        alert("Sipariş başarıyla silindi.");
      } catch (error) {
        console.error("Silme hatası:", error);
        alert("Sipariş silinirken bir hata oluştu.");
      }
    }
  };

  const handleCargoSave = async (orderId) => {
    const data = cargoData[orderId];
    if (!data.cargoCompany || !data.trackingNumber) {
      alert("Lütfen kargo firması ve takip numarasını eksiksiz girin.");
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        cargoCompany: data.cargoCompany,
        trackingNumber: data.trackingNumber
      });
      
      const currentOrder = orders.find(o => o.id === orderId);
      if(currentOrder && currentOrder.status !== 'Kargoya Verildi' && currentOrder.status !== 'Tamamlandı') {
          await handleStatusChange(orderId, 'Kargoya Verildi');
      }
      alert("Kargo bilgileri başarıyla kaydedildi!");
    } catch (error) {
      alert("Kargo bilgisi kaydedilemedi.");
    }
  };

  const handleCargoInputChange = (orderId, field, value) => {
    setCargoData(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value }
    }));
  };

  const handleSendEmail = (order) => {
    if (!order.email) {
      alert("Bu müşterinin kayıtlı bir e-posta adresi bulunmuyor.");
      return;
    }

    const company = cargoData[order.id]?.cargoCompany || order.cargoCompany || '';
    const tracking = cargoData[order.id]?.trackingNumber || order.trackingNumber || '';

    let subject = encodeURIComponent(`Sipariş Durumu Güncellemesi - ${order.orderNumber}`);
    let body = `Merhaba ${order.customerName},\n\n${order.orderNumber} numaralı siparişinizin durumu "${order.status}" olarak güncellenmiştir.\n\n`;

    if (order.status === 'Kargoya Verildi' || order.status === 'Tamamlandı') {
        body += `Kargo Firması: ${company}\nTakip Numarası: ${tracking}\n\n`;
        body += `Kargonuzu sitemizdeki 'Kargo Takip' sayfasından takip edebilirsiniz.\n\n`;
    }

    body += `Bizi tercih ettiğiniz için teşekkür ederiz.\n\n${BRAND.name}`;
    body = encodeURIComponent(body);

    window.location.href = `mailto:${order.email}?subject=${subject}&body=${body}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Yeni': return { bg: 'var(--nw-warning-soft)', text: 'var(--nw-warning)' };
      case 'Hazırlanıyor': return { bg: 'var(--nw-accent-soft)', text: 'var(--nw-accent)' }; 
      case 'Kargoya Verildi': return { bg: 'var(--nw-accent-soft)', text: 'var(--nw-accent)' }; 
      case 'Tamamlandı': return { bg: 'var(--nw-success-soft)', text: 'var(--nw-success)' };
      case 'İptal Edildi': return { bg: 'var(--nw-danger-soft)', text: 'var(--nw-danger)' };
      case 'İnceleme Gerekli': return { bg: 'var(--nw-danger-soft)', text: 'var(--nw-danger)' };
      default: return { bg: 'var(--nw-bg-elev)', text: 'var(--nw-text-dim)' };
    }
  };

  // Arama + durum filtresi
  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLocaleLowerCase('tr-TR');
      // TC Kimlik numarasını da aramaya dahil ettik (order.identityNumber)
      const hay = `${order.orderNumber || ''} ${order.customerName || ''} ${order.phone || ''} ${order.email || ''} ${order.identityNumber || ''}`.toLocaleLowerCase('tr-TR');
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // İncelenmesi gereken sipariş sayısı (tutar uyuşmazlığı veya stok yetersiz)
  const reviewCount = orders.filter(o => o.status === 'İnceleme Gerekli' || o.fulfillmentIssue).length;

  const statusFilters = [
    { key: 'all', label: 'Tümü' },
    { key: 'Yeni', label: 'Yeni' },
    { key: 'Hazırlanıyor', label: 'Hazırlanıyor' },
    { key: 'Kargoya Verildi', label: 'Kargoda' },
    { key: 'Tamamlandı', label: 'Tamamlandı' },
    { key: 'İnceleme Gerekli', label: '⚠ İnceleme' },
    { key: 'İptal Edildi', label: 'İptal' },
  ];

  return (
    <div style={{ color: 'var(--nw-text)', fontFamily: 'inherit' }}>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--nw-font-display)', fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--nw-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Sipariş ve Kargo Yönetimi
        </h2>
        <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', marginTop: '4px' }}>Siparişler anlık güncellenir. Müşteri siparişlerini yönetin ve kargo takip numaralarını tanımlayın.</p>
      </div>

      {/* YENİ SİPARİŞ BİLDİRİMİ (canlı) */}
      {newOrderCount > 0 && (
        <div onClick={() => setNewOrderCount(0)} style={{ cursor: 'pointer', marginBottom: '16px', padding: '12px 18px', backgroundColor: 'var(--nw-success-soft)', border: '1px solid var(--nw-success-soft)', borderRadius: 'var(--nw-r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ color: 'var(--nw-success)', fontWeight: 700, fontSize: '14px' }}>🔔 {newOrderCount} yeni sipariş geldi!</span>
          <span style={{ color: 'var(--nw-success)', fontSize: '12px', fontWeight: 600 }}>Kapat ✕</span>
        </div>
      )}

      {/* İNCELEME UYARISI */}
      {reviewCount > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px 18px', backgroundColor: 'var(--nw-danger-soft)', border: '1px solid var(--nw-danger-soft)', borderRadius: 'var(--nw-r-sm)' }}>
          <span style={{ color: 'var(--nw-danger)', fontWeight: 700, fontSize: '14px' }}>⚠ {reviewCount} sipariş inceleme gerektiriyor (ödeme tutarı uyuşmazlığı veya stok yetersiz). "İnceleme" filtresiyle görebilirsiniz.</span>
        </div>
      )}

      {/* ARAMA + DURUM FİLTRESİ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--nw-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sipariş no, müşteri, telefon, e-posta veya TC kimlik ara..."
            style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--nw-line)', borderRadius: 'var(--nw-r-sm)', fontSize: '13px', outline: 'none', color: 'var(--nw-text)', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {statusFilters.map(f => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--nw-r-sm)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--nw-accent)' : 'var(--nw-line)'}`,
                  backgroundColor: active ? 'var(--nw-accent-soft)' : 'var(--nw-surface)',
                  color: active ? 'var(--nw-accent)' : 'var(--nw-text-dim)', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={{...thStyle, width: '15%'}}>Sipariş Bilgisi</th>
              <th style={{...thStyle, width: '25%'}}>Müşteri & Adres</th>
              <th style={{...thStyle, width: '25%'}}>Ürünler (Renk/Beden)</th>
              <th style={{...thStyle, width: '20%'}}>Kargo İşlemleri</th>
              <th style={{...thStyle, width: '15%'}}>Durum & İletişim</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--nw-text-dim)' }}>Veriler Yükleniyor...</td></tr>}
            
            {!loading && filteredOrders.map((order, index) => {
              const badge = getStatusBadge(order.status);
              const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString('tr-TR') : 'Tarih Yok';
              const time = order.createdAt ? order.createdAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <tr key={order.id} style={{ borderBottom: index !== filteredOrders.length - 1 ? '1px solid var(--nw-bg-elev)' : 'none', backgroundColor: (order.status === 'İnceleme Gerekli' || order.fulfillmentIssue) ? 'var(--nw-bg-elev)' : 'transparent' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '700', color: 'var(--nw-text)', marginBottom: '4px', fontSize: '15px' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '13px', color: 'var(--nw-text-dim)' }}>{date} - {time}</div>
                    <div style={{ marginTop: '6px', display: 'inline-block', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--nw-r-sm)', ...(order.paymentMethod === 'kapida' ? { backgroundColor: 'var(--nw-warning-soft)', color: 'var(--nw-warning)' } : { backgroundColor: 'var(--nw-accent-soft)', color: 'var(--nw-accent)' }) }}>
                      {order.paymentMethod === 'kapida' ? '💵 Kapıda Ödeme' : '💳 Kart'}
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ fontWeight: '700', color: 'var(--nw-text)', marginBottom: '10px', fontSize: '14px' }}>{order.customerName || '—'}</div>

                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>E-posta</span>
                      {order.email
                        ? <a href={`mailto:${order.email}`} style={infoLinkStyle}>{order.email}</a>
                        : <span style={infoValueStyle}>—</span>}
                    </div>

                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>Telefon</span>
                      {order.phone
                        ? <a href={`tel:${order.phone}`} style={infoLinkStyle}>{order.phone}</a>
                        : <span style={infoValueStyle}>—</span>}
                    </div>

                    {/* YENİ EKLENEN TC KİMLİK KISMI */}
                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>TC Kimlik Numarası</span>
                      <span style={{ ...infoValueStyle, fontWeight: '500', color: 'var(--nw-text)' }}>{order.identityNumber || 'Belirtilmedi'}</span>
                    </div>

                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>Adres</span>
                      <span style={{ ...infoValueStyle, lineHeight: '1.45' }}>{order.address || '—'}</span>
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.items?.map((item, idx) => {
                        const namePart = item.name || "Ürün";
                        const qty = item.quantity || 1;

                        const itemColor = item.color || "";
                        const itemSize = item.size || item.selectedSize || "";
                        let combinedVariant = item.variant || [itemColor, itemSize].filter(Boolean).join(' / ');

                        const unitPrice = Number(item.price) || 0;
                        const lineTotal = unitPrice * qty;

                        return (
                          <div key={idx} style={{
                            fontSize: '13px',
                            color: 'var(--nw-text-dim)',
                            lineHeight: '1.4',
                            paddingBottom: '6px',
                            borderBottom: idx !== order.items.length - 1 ? '1px dashed var(--nw-line)' : 'none'
                          }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                               <span><span style={{ fontWeight: '700', color: 'var(--nw-text)' }}>{qty}x</span> {namePart}</span>
                               {unitPrice > 0 && (
                                 <span style={{ fontWeight: '700', color: 'var(--nw-text)', whiteSpace: 'nowrap' }}>{lineTotal.toFixed(2)} ₺</span>
                               )}
                             </div>

                             {unitPrice > 0 && qty > 1 && (
                               <div style={{ color: 'var(--nw-text-faint)', fontSize: '11px', marginLeft: '16px' }}>
                                 Birim: {unitPrice.toFixed(2)} ₺
                               </div>
                             )}

                             {combinedVariant && !namePart.includes(combinedVariant) && (
                               <div style={{ color: 'var(--nw-accent)', fontSize: '12px', fontWeight: '600', marginTop: '2px', marginLeft: '16px' }}>
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'middle'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                 {combinedVariant}
                               </div>
                             )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--nw-line)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {order.subtotal != null && (
                        <div style={breakdownRowStyle}><span>Ara Toplam</span><span>{Number(order.subtotal).toFixed(2)} ₺</span></div>
                      )}
                      {order.shipping != null && (
                        <div style={breakdownRowStyle}>
                          <span>Kargo</span>
                          <span>{Number(order.shipping) === 0 ? 'Ücretsiz' : `${Number(order.shipping).toFixed(2)} ₺`}</span>
                        </div>
                      )}
                      {order.discount ? (
                        <div style={{ ...breakdownRowStyle, color: 'var(--nw-success)' }}>
                          <span>İndirim{order.appliedCoupon ? ` (${order.appliedCoupon})` : ''}</span>
                          <span>- {Number(order.discount).toFixed(2)} ₺</span>
                        </div>
                      ) : null}
                      <div style={{ ...breakdownRowStyle, fontWeight: '800', color: 'var(--nw-text)', fontSize: '14px', marginTop: '2px' }}>
                        <span>Toplam</span><span>{Number(order.totalAmount || 0).toFixed(2)} ₺</span>
                      </div>
                      {order.paidPrice != null && Math.abs(Number(order.paidPrice) - Number(order.totalAmount || 0)) >= 0.02 && (
                        <div style={{ ...breakdownRowStyle, color: 'var(--nw-danger)', fontWeight: '700' }}>
                          <span>⚠ Ödenen</span><span>{Number(order.paidPrice).toFixed(2)} ₺</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: (order.status === 'İptal Edildi') ? 0.5 : 1 }}>
                      <select 
              
                        value={cargoData[order.id]?.cargoCompany || 'Yurtiçi Kargo'}
                        onChange={(e) => handleCargoInputChange(order.id, 'cargoCompany', e.target.value)}
                        style={inputStyle}
                        disabled={order.status === 'İptal Edildi'}
                      >
                        <option value="">Firma Seçin</option>
                        <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                        <option value="Aras Kargo">Aras Kargo</option>
                        <option value="MNG Kargo">MNG Kargo</option>
                        <option value="Sürat Kargo">Sürat Kargo</option>
                        <option value="PTT Kargo">PTT Kargo</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Takip Numarası"
                        value={cargoData[order.id]?.trackingNumber || ''}
                        onChange={(e) => handleCargoInputChange(order.id, 'trackingNumber', e.target.value)}
                        style={inputStyle}
                        disabled={order.status === 'İptal Edildi'}
                      />
                      <button onClick={() => handleCargoSave(order.id)} style={{...saveBtnStyle, opacity: order.status === 'İptal Edildi' ? 0.5 : 1}} disabled={order.status === 'İptal Edildi'}>
                        Kaydet
                      </button>
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ backgroundColor: badge.bg, color: badge.text, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', alignSelf: 'flex-start' }}>
                        {order.status}
                      </span>
                      {order.fulfillmentIssue && (
                        <span style={{ backgroundColor: 'var(--nw-danger-soft)', color: 'var(--nw-danger)', padding: '4px 10px', borderRadius: 'var(--nw-r-sm)', fontSize: '11px', fontWeight: '700', alignSelf: 'flex-start' }}>
                          ⚠ Stok yetersiz — kontrol edin
                        </span>
                      )}
                      <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)} style={selectStyle}>
                        <option value="Yeni">Yeni Sipariş</option>
                        <option value="Hazırlanıyor">Hazırlanıyor</option>
                        <option value="Kargoya Verildi">Kargoya Verildi</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                        <option value="İptal Edildi">İptal Edildi</option>
                        <option value="İnceleme Gerekli">İnceleme Gerekli</option>
                      </select>

                      {order.paymentMethod === 'kapida' && (
                        order.paymentStatus === 'paid' ? (
                          <span style={{ backgroundColor: 'var(--nw-success-soft)', color: 'var(--nw-success)', padding: '8px 12px', borderRadius: 'var(--nw-r-sm)', fontSize: '12px', fontWeight: 700, textAlign: 'center', display: 'block' }}>
                            ✓ Ödeme Alındı (Kapıda)
                          </span>
                        ) : (
                          <button onClick={() => handleMarkPaid(order.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: 'var(--nw-warning-soft)', color: 'var(--nw-warning)', border: '1px solid var(--nw-warning-soft)', padding: '8px 12px', borderRadius: 'var(--nw-r-sm)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                            💵 Ödemeyi "Alındı" işaretle
                          </button>
                        )
                      )}

                      <button onClick={() => handleSendEmail(order)} style={mailBtnStyle}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        Müşteriye Bildir
                      </button>

                      <button onClick={() => handleDeleteOrder(order.id)} style={deleteBtnStyle}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        Siparişi Sil
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {!loading && filteredOrders.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--nw-text-dim)' }}>
                {orders.length === 0 ? 'Şu an sistemde hiç onaylanmış sipariş bulunmuyor.' : 'Arama/filtre kriterine uygun sipariş bulunamadı.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STİLLER ---
const infoRowStyle = { display: 'flex', flexDirection: 'column', marginBottom: '8px' };
const infoLabelStyle = { fontSize: '10px', fontWeight: '700', color: 'var(--nw-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1px' };
const infoValueStyle = { fontSize: '13px', color: 'var(--nw-text-dim)', wordBreak: 'break-word' };
const infoLinkStyle = { fontSize: '13px', color: 'var(--nw-accent)', fontWeight: '600', textDecoration: 'none', wordBreak: 'break-word' };
const breakdownRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--nw-text-dim)', gap: '8px' };

const tableContainerStyle = { backgroundColor: 'var(--nw-surface)', borderRadius: 'var(--nw-r-md)', border: '1px solid var(--nw-line)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' };
const tableStyle = { width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left' };
const theadStyle = { backgroundColor: 'var(--nw-bg-elev)', borderBottom: '1px solid var(--nw-line)' };
const thStyle = { padding: '16px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--nw-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '20px', fontSize: '14px', color: 'var(--nw-text-dim)', verticalAlign: 'top' };
const inputStyle = { padding: '8px 10px', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)', fontSize: '13px', width: '100%', maxWidth: '200px', outline: 'none' };
const saveBtnStyle = { padding: '8px 12px', backgroundColor: 'var(--nw-bg-elev)', color: 'var(--nw-text)', border: 'none', borderRadius: 'var(--nw-r-sm)', cursor: 'pointer', fontSize: '12px', width: '100%', maxWidth: '200px' };
const selectStyle = { padding: '8px 12px', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)', fontSize: '13px', fontWeight: '600', color: 'var(--nw-text)', cursor: 'pointer', width: '100%', maxWidth: '160px', outline: 'none' };
const mailBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: 'var(--nw-bg-elev)', color: 'var(--nw-text)', border: '1px solid var(--nw-line)', borderRadius: 'var(--nw-r-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', width: '100%', maxWidth: '160px' };
const deleteBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: 'var(--nw-danger-soft)', color: 'var(--nw-danger)', border: '1px solid var(--nw-danger-soft)', borderRadius: 'var(--nw-r-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', width: '100%', maxWidth: '160px' };

export default Orders;