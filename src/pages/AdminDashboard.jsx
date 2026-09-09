import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  
  // Özet İstatistikler State'i
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeProducts: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  
  // --- YENİ EKLENEN: Tüm envanteri tutacak state ---
  const [inventoryProducts, setInventoryProducts] = useState([]);

  // Envanter arama ve filtre kontrolleri
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // all | low | out

  // Satır içi stok güncelleme: o an kaydedilen varyantın anahtarı (`id:index`)
  const [savingVariant, setSavingVariant] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersArray = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let todayRev = 0;
      let monthRev = 0;
      let totalRev = 0;
      let pendingCount = 0;
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      ordersArray.forEach(order => {
        if (order.status !== 'İptal Edildi') {
          const amount = Number(order.totalAmount || 0);
          totalRev += amount;
          
          if (order.createdAt) {
            const orderTime = order.createdAt.toMillis();
            if (orderTime >= startOfToday) {
              todayRev += amount;
            }
            if (orderTime >= startOfMonth) {
              monthRev += amount;
            }
          }
        }

        if (order.status === 'Yeni' || order.status === 'Hazırlanıyor') {
          pendingCount++;
        }
      });

      const sortedOrders = ordersArray.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).slice(0, 5);
      setRecentOrders(sortedOrders);

      const productsSnap = await getDocs(collection(db, 'products'));
      const productsArray = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const lowStockArr = [];
      const inventoryArr = []; // Tüm ürünleri detaylı tutmak için

      productsArray.forEach(product => {
        const variants = product.variants || [];
        const totalStock = variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
        
        if (totalStock <= 5) {
          lowStockArr.push({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            stock: totalStock
          });
        }

        // --- YENİ EKLENEN: Envanter listesi için tüm ürünleri hazırla ---
        inventoryArr.push({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            totalStock: totalStock,
            variants: variants
        });
      });

      setLowStockProducts(lowStockArr.sort((a, b) => a.stock - b.stock).slice(0, 5));
      // Envanteri alfabetik veya stoğa göre dizebiliriz (Şu an en yeniler/veya karışık gelir)
      setInventoryProducts(inventoryArr);

      setStats({
        todayRevenue: todayRev,
        monthRevenue: monthRev,
        totalRevenue: totalRev,
        totalOrders: ordersArray.length,
        pendingOrders: pendingCount,
        activeProducts: productsArray.length
      });

    } catch (error) {
      console.error("Dashboard verileri çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Satır içi varyant stok güncelleme (Firestore'a anında yazar)
  const handleVariantStockChange = async (productId, variantIndex, delta) => {
    const product = inventoryProducts.find(p => p.id === productId);
    if (!product) return;

    const newVariants = product.variants.map((v, i) => {
      if (i !== variantIndex) return v;
      const newStock = Math.max(0, (Number(v.stock) || 0) + delta);
      return { ...v, stock: newStock };
    });
    const newTotal = newVariants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);

    // Ekranı anında güncelle (iyimser güncelleme)
    setInventoryProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, variants: newVariants, totalStock: newTotal } : p)
    );

    setSavingVariant(`${productId}:${variantIndex}`);
    try {
      await updateDoc(doc(db, 'products', productId), { variants: newVariants });
    } catch (error) {
      console.error('Stok güncellenemedi:', error);
      alert('Stok güncellenemedi. Lütfen tekrar deneyin.');
      // Hata olursa verileri sunucudan tazele
      fetchDashboardData();
    } finally {
      setSavingVariant(null);
    }
  };

  // Envanterden ürünü web sitesinden tamamen sil
  const handleDeleteInventoryProduct = async (productId, productName) => {
    const confirmDelete = window.confirm(
      `"${productName}" ürününü web sitesinden tamamen silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve ürün mağazadan kalkar.`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      setInventoryProducts(prev => prev.filter(p => p.id !== productId));
      setLowStockProducts(prev => prev.filter(p => p.id !== productId));
      setStats(prev => ({ ...prev, activeProducts: Math.max(0, prev.activeProducts - 1) }));
    } catch (error) {
      console.error('Ürün silinemedi:', error);
      alert('Ürün silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--nw-text-dim)', fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
            <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          Gerçek Zamanlı Veriler Yükleniyor...
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- Envanter özet istatistikleri ---
  const inventoryTotalUnits = inventoryProducts.reduce((acc, p) => acc + p.totalStock, 0);
  const inventoryOutCount = inventoryProducts.filter(p => p.totalStock === 0).length;
  const inventoryLowCount = inventoryProducts.filter(p => p.totalStock > 0 && p.totalStock <= 5).length;

  // --- Arama + filtre + kritik önce sıralama ---
  const filteredInventory = inventoryProducts
    .filter(p => {
      if (inventoryFilter === 'out') return p.totalStock === 0;
      if (inventoryFilter === 'low') return p.totalStock > 0 && p.totalStock <= 5;
      return true;
    })
    .filter(p => (p.name || '').toLocaleLowerCase('tr-TR').includes(inventorySearch.toLocaleLowerCase('tr-TR').trim()))
    .sort((a, b) => a.totalStock - b.totalStock);

  const inventoryFilters = [
    { key: 'all', label: `Tümü (${inventoryProducts.length})` },
    { key: 'low', label: `Kritik (${inventoryLowCount})` },
    { key: 'out', label: `Tükendi (${inventoryOutCount})` },
  ];

  return (
    <div style={{ color: 'var(--nw-text)', padding: '0 4px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--nw-font-display)', fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--nw-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          İşletme Özeti
        </h2>
        <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', marginTop: '4px' }}>Veriler Firebase veritabanından anlık olarak hesaplanmaktadır.</p>
      </div>

      {/* Grid 1: KPI Kartları - Responsive yapıldı */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Bugünkü Ciro</span>
            <div style={{ backgroundColor: 'var(--nw-success-soft)', color: 'var(--nw-success)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            </div>
          </div>
          <div style={cardValueStyle}>{stats.todayRevenue.toLocaleString('tr-TR')} ₺</div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Bu Ayki Ciro</span>
            <div style={{ backgroundColor: 'var(--nw-accent-soft)', color: 'var(--nw-accent)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
          </div>
          <div style={cardValueStyle}>{stats.monthRevenue.toLocaleString('tr-TR')} ₺</div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Toplam Ciro</span>
            <div style={{ backgroundColor: 'var(--nw-accent-soft)', color: 'var(--nw-accent)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
          </div>
          <div style={cardValueStyle}>{stats.totalRevenue.toLocaleString('tr-TR')} ₺</div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardTitleStyle}>Bekleyen Sipariş</span>
            <div style={{ backgroundColor: 'var(--nw-warning-soft)', color: 'var(--nw-warning)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>
          <div style={cardValueStyle}>{stats.pendingOrders} Adet</div>
        </div>

      </div>

      {/* Grid 2: Tablolar - Responsive yapıldı */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px' }}>
        
        {/* TABLO: Son Gelen Siparişler */}
        <div style={tableContainerStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--nw-line)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" fill="none" stroke="var(--nw-text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <h3 style={{ fontFamily: 'var(--nw-font-display)', fontSize: '15.5px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--nw-text)' }}>Son Gelen Siparişler</h3>
          </div>
          <div style={{ padding: '8px 20px' }}>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Henüz sipariş yok.</p>
            ) : (
              recentOrders.map((order, index) => (
                <div key={order.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: index !== recentOrders.length - 1 ? '1px solid var(--nw-bg-elev)' : 'none' }}>
                  <div style={{ flex: '1 1 min-content' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--nw-text)', marginBottom: '2px' }}>{order.customerName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--nw-text-dim)' }}>{order.orderNumber} • {order.createdAt?.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--nw-text)' }}>{order.totalAmount} ₺</div>
                    <span style={{ fontSize: '11px', color: order.status === 'Yeni' ? 'var(--nw-warning)' : 'var(--nw-success)', backgroundColor: order.status === 'Yeni' ? 'var(--nw-warning-soft)' : 'var(--nw-success-soft)', padding: '2px 8px', borderRadius: 'var(--nw-r-md)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TABLO: Kritik Stok Uyarıları */}
        <div style={tableContainerStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--nw-line)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" fill="none" stroke="var(--nw-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <h3 style={{ fontFamily: 'var(--nw-font-display)', fontSize: '15.5px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--nw-text)' }}>Kritik Stok Uyarıları (Tükenenler)</h3>
          </div>
          <div style={{ padding: '8px 20px' }}>
            {lowStockProducts.length === 0 ? (
              <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Tüm ürünlerin stoğu yeterli seviyede.</p>
            ) : (
              lowStockProducts.map((product, index) => (
                <div key={product.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: index !== lowStockProducts.length - 1 ? '1px solid var(--nw-bg-elev)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto' }}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--nw-bg-elev)', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)', flexShrink: 0 }}></div>
                    )}
                    <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--nw-text)', wordBreak: 'break-word' }}>{product.name}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {product.stock === 0 ? (
                      <span style={{ color: 'var(--nw-danger)', backgroundColor: 'var(--nw-danger-soft)', padding: '4px 8px', borderRadius: 'var(--nw-r-sm)', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>Tükendi</span>
                    ) : (
                      <span style={{ color: 'var(--nw-warning)', backgroundColor: 'var(--nw-warning-soft)', padding: '4px 8px', borderRadius: 'var(--nw-r-sm)', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>Son {product.stock} Adet</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* --- DETAYLI ENVANTER TAKİBİ --- */}
      <div style={{ ...tableContainerStyle, marginTop: '24px', display: 'flex', flexDirection: 'column' }}>

        {/* BAŞLIK + ÖZET İSTATİSTİKLER */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--nw-line)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" fill="none" stroke="var(--nw-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <h3 style={{ fontFamily: 'var(--nw-font-display)', fontSize: '15.5px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--nw-text)' }}>Detaylı Envanter Takibi</h3>
          </div>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
            <div style={invStatStyle}><span style={invStatNum('var(--nw-text)')}>{inventoryTotalUnits}</span><span style={invStatLabel}>Toplam Adet</span></div>
            <div style={invStatStyle}><span style={invStatNum('var(--nw-warning)')}>{inventoryLowCount}</span><span style={invStatLabel}>Kritik</span></div>
            <div style={invStatStyle}><span style={invStatNum('var(--nw-danger)')}>{inventoryOutCount}</span><span style={invStatLabel}>Tükendi</span></div>
          </div>
        </div>

        {/* ARAMA + FİLTRE */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--nw-line)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--nw-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Ürün adına göre ara..."
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--nw-line)', borderRadius: 'var(--nw-r-sm)', fontSize: '13px', outline: 'none', color: 'var(--nw-text)', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {inventoryFilters.map(f => {
              const active = inventoryFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setInventoryFilter(f.key)}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--nw-r-sm)', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--nw-accent)' : 'var(--nw-line)'}`,
                    backgroundColor: active ? 'var(--nw-accent-soft)' : 'var(--nw-surface)',
                    color: active ? 'var(--nw-accent)' : 'var(--nw-text-dim)', transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Çok ürün olunca sayfayı uzatmaması için scroll eklendi */}
        <div style={{ padding: '8px 20px', maxHeight: '440px', overflowY: 'auto' }}>
            {inventoryProducts.length === 0 ? (
              <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Sistemde ürün bulunmuyor.</p>
            ) : filteredInventory.length === 0 ? (
              <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Bu kritere uygun ürün bulunamadı.</p>
            ) : (
              filteredInventory.map((product, index) => {
                // Stok durumu: doluluk oranı için basit bir referans (10 adet = %100)
                const stockPct = Math.min(100, (product.totalStock / 10) * 100);
                let statusBg = 'var(--nw-success-soft)', statusText = 'var(--nw-success)', statusLabel = 'Yeterli', barColor = 'var(--nw-success)';
                if (product.totalStock === 0) {
                  statusBg = 'var(--nw-danger-soft)'; statusText = 'var(--nw-danger)'; statusLabel = 'Tükendi'; barColor = 'var(--nw-danger)';
                } else if (product.totalStock <= 5) {
                  statusBg = 'var(--nw-warning-soft)'; statusText = 'var(--nw-warning)'; statusLabel = 'Kritik'; barColor = 'var(--nw-warning)';
                }

                return (
                <div key={product.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start', padding: '16px 0', borderBottom: index !== filteredInventory.length - 1 ? '1px solid var(--nw-bg-elev)' : 'none' }}>

                  {/* Sol Kısım: Görsel ve İsim */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 250px' }}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', backgroundColor: 'var(--nw-bg-elev)', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)', flexShrink: 0 }}></div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--nw-text)', wordBreak: 'break-word' }}>{product.name}</span>
                          <span style={{ backgroundColor: statusBg, color: statusText, padding: '2px 8px', borderRadius: 'var(--nw-r-sm)', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{statusLabel}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--nw-text-dim)', fontWeight: '500', marginBottom: '6px' }}>
                           Toplam Stok: <span style={{ color: product.totalStock === 0 ? 'var(--nw-danger)' : 'var(--nw-text)', fontWeight: '700' }}>{product.totalStock}</span> adet
                        </div>
                        {/* Stok doluluk çubuğu */}
                        <div style={{ height: '5px', backgroundColor: 'var(--nw-bg-elev)', borderRadius: '3px', overflow: 'hidden', maxWidth: '180px' }}>
                          <div style={{ width: `${stockPct}%`, height: '100%', backgroundColor: barColor, borderRadius: '3px', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>
                  </div>

                  {/* Sağ Kısım: Varyantlar (Beden/Renk Dağılımı) */}
                  <div style={{ flex: '2 1 300px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {product.variants.length === 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--nw-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>Varyant tanımlanmamış (Standart Beden)</span>
                      ) : (
                          product.variants.map((v, i) => {
                              const vStock = Number(v.stock) || 0;
                              // Renge göre etiket stili belirleme
                              let badgeBg = 'var(--nw-success-soft)'; // Yeşil (Yeterli)
                              let badgeText = 'var(--nw-success)';
                              if (vStock === 0) {
                                  badgeBg = 'var(--nw-danger-soft)'; // Kırmızı (Bitti)
                                  badgeText = 'var(--nw-danger)';
                              } else if (vStock <= 3) {
                                  badgeBg = 'var(--nw-warning-soft)'; // Turuncu (Kritik)
                                  badgeText = 'var(--nw-warning)';
                              }

                              const variantName = [v.color, v.size].filter(Boolean).join(' - ') || 'Standart';
                              const isSaving = savingVariant === `${product.id}:${i}`;

                              return (
                                  <div key={i} style={{ backgroundColor: badgeBg, color: badgeText, border: `1px solid ${badgeBg}`, padding: '4px 6px 4px 10px', borderRadius: 'var(--nw-r-sm)', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.6 : 1 }}>
                                      <span>{variantName}</span>
                                      {/* SATIR İÇİ STOK KONTROLÜ */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: 'var(--nw-surface)', borderRadius: 'var(--nw-r-sm)', padding: '2px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                          <button
                                            type="button"
                                            title="Azalt"
                                            disabled={isSaving || vStock === 0}
                                            onClick={() => handleVariantStockChange(product.id, i, -1)}
                                            style={{ ...stockBtnStyle, color: vStock === 0 ? 'var(--nw-text-faint)' : 'var(--nw-danger)', cursor: (isSaving || vStock === 0) ? 'not-allowed' : 'pointer' }}
                                          >−</button>
                                          <span style={{ minWidth: '20px', textAlign: 'center', color: 'var(--nw-text)', fontSize: '11px', fontWeight: '700' }}>{vStock}</span>
                                          <button
                                            type="button"
                                            title="Artır"
                                            disabled={isSaving}
                                            onClick={() => handleVariantStockChange(product.id, i, 1)}
                                            style={{ ...stockBtnStyle, color: 'var(--nw-success)', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                                          >+</button>
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>

                  {/* SİLME AKSİYONU — ürünü web sitesinden kaldır */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', marginLeft: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteInventoryProduct(product.id, product.name)}
                      title="Ürünü web sitesinden sil"
                      style={inventoryDeleteBtnStyle}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--nw-danger-soft)'; e.currentTarget.style.borderColor = 'var(--nw-danger-soft)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--nw-surface)'; e.currentTarget.style.borderColor = 'var(--nw-line)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      Sil
                    </button>
                  </div>

                </div>
                );
              })
            )}
        </div>
      </div>

    </div>
  );
};

// --- STİLLER ---
const cardStyle = {
  backgroundColor: 'var(--nw-surface)',
  padding: 'clamp(16px, 4vw, 24px)',
  borderRadius: 'var(--nw-r-md)',
  boxShadow: 'none', 
  border: '1px solid var(--nw-line)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: 'default'
};
const cardHeaderStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start', 
  marginBottom: '16px' 
};
const cardTitleStyle = { 
  fontSize: '13px', 
  fontWeight: '600', 
  color: 'var(--nw-text-dim)', 
  textTransform: 'uppercase', 
  letterSpacing: '0.05em',
  marginTop: '4px'
};
const cardValueStyle = {
  fontFamily: 'var(--nw-font-display)',
  fontSize: 'clamp(22px, 5vw, 28px)',
  fontWeight: 700,
  color: 'var(--nw-text)',
  letterSpacing: '-0.02em',
  wordWrap: 'break-word' 
};
// Envanter satırı silme butonu stili
const inventoryDeleteBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
  backgroundColor: 'var(--nw-surface)', color: 'var(--nw-danger)', border: '1px solid var(--nw-line)',
  borderRadius: 'var(--nw-r-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
  transition: 'all 0.2s', whiteSpace: 'nowrap'
};

// Satır içi stok +/- buton stili
const stockBtnStyle = {
  width: '20px', height: '20px', border: 'none', backgroundColor: 'transparent',
  fontSize: '15px', fontWeight: '700', lineHeight: 1, borderRadius: '4px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
};

// Envanter özet istatistik stilleri
const invStatStyle = { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1 };
const invStatNum = (color) => ({ fontFamily: 'var(--nw-font-display)', fontSize: '18px', fontWeight: 700, color });
const invStatLabel = { fontSize: '10px', fontWeight: '600', color: 'var(--nw-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' };

const tableContainerStyle = {
  backgroundColor: 'var(--nw-surface)', 
  borderRadius: 'var(--nw-r-md)', 
  border: '1px solid var(--nw-line)', 
  boxShadow: 'none',
  overflow: 'hidden' 
};

export default AdminDashboard;