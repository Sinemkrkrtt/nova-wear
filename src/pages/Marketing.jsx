import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { uploadImage } from '../utils/storage';
import { DEFAULT_CATEGORIES } from '../utils/categories';

const Marketing = () => {
  // Banners State
  const [banners, setBanners] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState('');

  // Ana Sayfa Hero Görseli (statik hero'nun sağındaki görsel) State'leri
  const [heroImage, setHeroImage] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState('');
  const [heroCurrentUrl, setHeroCurrentUrl] = useState('');
  const [heroLoading, setHeroLoading] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  // Kupon limitleri (opsiyonel)
  const [minPurchase, setMinPurchase] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [oncePerUser, setOncePerUser] = useState(false);

  // Kategoriler
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchBanners();
    fetchCoupons();
    fetchCategoriesList();
    fetchHeroImage();
  }, []);

  const fetchHeroImage = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'hero'));
      if (snap.exists() && snap.data().imageUrl) setHeroCurrentUrl(snap.data().imageUrl);
    } catch (e) { /* yoksa boş kalır */ }
  };

  // --- GET DATA ---
  const fetchBanners = async () => {
    const querySnapshot = await getDocs(collection(db, 'banners'));
    setBanners(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchCoupons = async () => {
    const querySnapshot = await getDocs(collection(db, 'coupons'));
    setCoupons(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchCategoriesList = async () => {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    setCategories(
      querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
    );
  };

  // --- KATEGORİ FONKSİYONLARI ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some(c => c.name?.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'))) {
      return alert('Bu kategori zaten mevcut.');
    }
    await addDoc(collection(db, 'categories'), { name, createdAt: serverTimestamp() });
    setNewCategory('');
    fetchCategoriesList();
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Bu kategoriyi silmek istediğinize emin misiniz? (Ürünler silinmez, sadece kategori listeden kalkar.)')) {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategoriesList();
    }
  };

  const handleSeedDefaultCategories = async () => {
    for (const name of DEFAULT_CATEGORIES) {
      await addDoc(collection(db, 'categories'), { name, createdAt: serverTimestamp() });
    }
    fetchCategoriesList();
  };

  // --- BANNER FUNCTIONS ---
  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
      setBannerImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerImage) return alert('Lütfen bir banner görseli seçin!');
    setBannerLoading(true);

    try {
      // Görseli GÜVENLİ (imzalı) şekilde yükle
      const secureUrl = await uploadImage(bannerImage, 'banners');

      await addDoc(collection(db, 'banners'), {
        title: bannerTitle,
        link: bannerLink,
        imageUrl: secureUrl,
        isActive: true,
        createdAt: serverTimestamp()
      });

      setBannerTitle('');
      setBannerLink('');
      setBannerImage(null);
      setBannerImagePreview('');
      fetchBanners();
      alert('Banner başarıyla eklendi!');
    } catch (error) {
      console.error(error);
      alert('Banner eklenirken hata oluştu.');
    } finally {
      setBannerLoading(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (window.confirm("Bu banner'ı silmek istediğinize emin misiniz?")) {
      await deleteDoc(doc(db, 'banners', id));
      setBanners(banners.filter(b => b.id !== id));
    }
  };

  const handleToggleBanner = async (id, currentStatus) => {
    await updateDoc(doc(db, 'banners', id), { isActive: !currentStatus });
    fetchBanners();
  };

  // --- ANA SAYFA HERO GÖRSELİ ---
  const handleHeroImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeroImage(file);
      setHeroImagePreview(URL.createObjectURL(file));
    }
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    if (!heroImage) return alert('Lütfen bir hero görseli seçin!');
    setHeroLoading(true);
    try {
      const secureUrl = await uploadImage(heroImage, 'hero');
      await setDoc(doc(db, 'settings', 'hero'), {
        imageUrl: secureUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setHeroCurrentUrl(secureUrl);
      setHeroImage(null);
      setHeroImagePreview('');
      alert('Ana sayfa hero görseli güncellendi!');
    } catch (error) {
      console.error(error);
      alert('Hero görseli güncellenirken hata oluştu.');
    } finally {
      setHeroLoading(false);
    }
  };

  // --- COUPON FUNCTIONS ---
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponLoading(true);

    try {
      await addDoc(collection(db, 'coupons'), {
        code: couponCode.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minPurchase: Number(minPurchase) || 0,      // 0 = minimum yok
        usageLimit: Number(usageLimit) || 0,        // 0 = sınırsız
        usedCount: 0,
        oncePerUser: oncePerUser,                   // kişi başı tek kullanım
        expiresAt: couponExpiry ? Timestamp.fromDate(new Date(`${couponExpiry}T23:59:59`)) : null, // null = süresiz
        isActive: true,
        createdAt: serverTimestamp()
      });

      setCouponCode('');
      setDiscountValue('');
      setMinPurchase('');
      setUsageLimit('');
      setCouponExpiry('');
      setOncePerUser(false);
      fetchCoupons();
      alert('Kupon başarıyla oluşturuldu!');
    } catch (error) {
      console.error(error);
      alert('Kupon oluşturulurken hata oluştu.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm("Bu kuponu silmek istediğinize emin misiniz?")) {
      await deleteDoc(doc(db, 'coupons', id));
      setCoupons(coupons.filter(c => c.id !== id));
    }
  };

  const handleToggleCoupon = async (id, currentStatus) => {
    await updateDoc(doc(db, 'coupons', id), { isActive: !currentStatus });
    fetchCoupons();
  };

  return (
    <div style={{ color: 'var(--nw-text)' }}>
      
      {/* SAYFA BAŞLIĞI */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--nw-font-display)', fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--nw-text)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          Pazarlama ve İçerik
        </h2>
        <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', marginTop: '4px' }}>Anasayfa vitrinini ve indirim kampanyalarını buradan yönetin.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* ================= BANNER YÖNETİMİ KARTI ================= */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ backgroundColor: 'var(--nw-accent-soft)', color: 'var(--nw-accent)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <h3 style={sectionTitleStyle}>Anasayfa Slider / Banner Yönetimi</h3>
          </div>
          
          <form onSubmit={handleBannerSubmit} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>
            <label style={uploadAreaStyle}>
              {bannerImagePreview ? (
                <img src={bannerImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--nw-text-faint)', padding: '20px' }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <span style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>Geniş Banner Seç</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleBannerImageChange} style={{ display: 'none' }} />
            </label>

            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <input required type="text" placeholder="Banner Başlığı (Örn: Yeni Sezon Abiyeler)" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
                <input type="text" placeholder="Tıklanınca Gideceği Link (Örn: /kategori/abiye)" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={bannerLoading} style={{ ...submitBtnStyle, width: '100%', maxWidth: '300px' }}>
                  {bannerLoading ? 'Yükleniyor...' : 'Afişi Yayına Al'}
                </button>
              </div>
            </div>
          </form>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead style={theadStyle}>
                <tr>
                  <th style={thStyle}>Görsel</th>
                  <th style={thStyle}>Başlık & Link</th>
                  <th style={thStyle}>Durum</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner, index) => (
                  <tr key={banner.id} style={{ borderBottom: index !== banners.length - 1 ? '1px solid var(--nw-bg-elev)' : 'none' }}>
                    <td style={tdStyle}>
                      <img src={banner.imageUrl} alt={banner.title} style={{ width: '120px', height: '56px', objectFit: 'cover', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)' }} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: 'var(--nw-text)', marginBottom: '2px' }}>{banner.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--nw-text-dim)' }}>{banner.link || 'Yönlendirme Linki Yok'}</div>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleToggleBanner(banner.id, banner.isActive)} style={banner.isActive ? badgeActive : badgeInactive}>
                        {banner.isActive ? 'Yayında' : 'Gizli'}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => handleDeleteBanner(banner.id)} style={deleteBtnStyle}>Sil</button>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && <tr><td colSpan="4" style={emptyStateStyle}>Sistemde henüz banner bulunmuyor.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= ANA SAYFA HERO GÖRSELİ KARTI ================= */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ backgroundColor: 'var(--nw-accent-soft)', color: 'var(--nw-accent)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <h3 style={sectionTitleStyle}>Ana Sayfa Hero Görseli</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--nw-text-dim)', marginTop: '-8px', marginBottom: '20px' }}>
            Ana sayfada (aktif banner yokken) sağ tarafta görünen büyük görsel. Yeni görsel yükleyince anında güncellenir.
          </p>

          <form onSubmit={handleHeroSubmit} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <label style={uploadAreaStyle}>
              {heroImagePreview ? (
                <img src={heroImagePreview} alt="Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : heroCurrentUrl ? (
                <img src={heroCurrentUrl} alt="Mevcut hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--nw-text-faint)', padding: '20px' }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <span style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>Hero Görseli Seç</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleHeroImageChange} style={{ display: 'none' }} />
            </label>

            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--nw-text-dim)', lineHeight: 1.6 }}>
                {heroCurrentUrl
                  ? 'Şu an özel bir hero görseli yayında. Değiştirmek için yeni bir görsel seçip güncelleyin.'
                  : 'Henüz özel bir hero görseli yüklenmedi; uygulamadaki varsayılan görsel gösteriliyor.'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={heroLoading} style={{ ...submitBtnStyle, width: '100%', maxWidth: '300px' }}>
                  {heroLoading ? 'Yükleniyor...' : 'Hero Görselini Güncelle'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ================= KUPON YÖNETİMİ KARTI ================= */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ backgroundColor: 'var(--nw-success-soft)', color: 'var(--nw-success)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            </div>
            <h3 style={sectionTitleStyle}>İndirim Kuponu Yönetimi</h3>
          </div>
          
          <form onSubmit={handleCouponSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>
            <input required type="text" placeholder="KUPON KODU (Örn: ILK10)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} style={{ ...inputStyle, textTransform: 'uppercase', flex: '1 1 200px' }} />
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }}>
              <option value="percentage">% Yüzde İndirimi</option>
              <option value="fixed">₺ Sabit Tutar İndirimi</option>
            </select>
            <input required type="number" min="1" placeholder="İndirim Değeri" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
            <input type="number" min="0" placeholder="Min. Sepet Tutarı ₺ (ops.)" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
            <input type="number" min="0" placeholder="Kullanım Limiti (ops.)" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 200px' }}>
              <span style={{ fontSize: '11px', color: 'var(--nw-text-faint)', fontWeight: '600', marginBottom: '4px' }}>Son Kullanma Tarihi (opsiyonel)</span>
              <input type="date" value={couponExpiry} onChange={(e) => setCouponExpiry(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 100%', cursor: 'pointer', color: 'var(--nw-text-dim)', fontSize: '14px', fontWeight: '500' }}>
              <input type="checkbox" checked={oncePerUser} onChange={(e) => setOncePerUser(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--nw-accent)', cursor: 'pointer' }} />
              Her müşteri bu kuponu yalnızca 1 kez kullanabilsin (kişi başı tek kullanım)
            </label>
            <button type="submit" disabled={couponLoading} style={{ ...submitBtnStyle, flex: '1 1 100%' }}>
              {couponLoading ? 'Oluşturuluyor...' : 'Kupon Oluştur'}
            </button>
          </form>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead style={theadStyle}>
                <tr>
                  <th style={thStyle}>Kupon Kodu</th>
                  <th style={thStyle}>İndirim Türü / Değeri</th>
                  <th style={thStyle}>Durum</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon, index) => (
                  <tr key={coupon.id} style={{ borderBottom: index !== coupons.length - 1 ? '1px solid var(--nw-bg-elev)' : 'none' }}>
                    <td style={{ ...tdStyle, fontWeight: '700', fontSize: '15px', color: 'var(--nw-text)' }}>
                      {coupon.code}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ backgroundColor: 'var(--nw-bg-elev)', padding: '4px 10px', borderRadius: 'var(--nw-r-sm)', fontSize: '13px', fontWeight: '500', color: 'var(--nw-text-dim)', whiteSpace: 'nowrap' }}>
                        {coupon.discountType === 'percentage' ? `%${coupon.discountValue} İndirim` : `${coupon.discountValue} TL İndirim`}
                      </span>
                      {(coupon.minPurchase > 0 || coupon.usageLimit > 0 || coupon.expiresAt || coupon.oncePerUser) && (
                        <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {coupon.minPurchase > 0 && (
                            <span style={couponMetaStyle}>Min. {coupon.minPurchase} ₺</span>
                          )}
                          {coupon.usageLimit > 0 && (
                            <span style={couponMetaStyle}>{coupon.usedCount || 0}/{coupon.usageLimit} kullanıldı</span>
                          )}
                          {coupon.oncePerUser && (
                            <span style={{ ...couponMetaStyle, backgroundColor: 'var(--nw-accent-soft)', color: 'var(--nw-accent)' }}>Kişi başı 1</span>
                          )}
                          {coupon.expiresAt && (
                            <span style={{ ...couponMetaStyle, color: coupon.expiresAt.toMillis() < Date.now() ? 'var(--nw-danger)' : 'var(--nw-text-dim)', backgroundColor: coupon.expiresAt.toMillis() < Date.now() ? 'var(--nw-danger-soft)' : 'var(--nw-bg-elev)' }}>
                              {coupon.expiresAt.toMillis() < Date.now() ? 'Süresi doldu' : `Bitiş: ${coupon.expiresAt.toDate().toLocaleDateString('tr-TR')}`}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)} style={coupon.isActive ? badgeActive : badgeInactive}>
                        {coupon.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => handleDeleteCoupon(coupon.id)} style={deleteBtnStyle}>Sil</button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && <tr><td colSpan="4" style={emptyStateStyle}>Henüz indirim kuponu oluşturulmamış.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= KATEGORİ YÖNETİMİ KARTI ================= */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ backgroundColor: 'var(--nw-accent-soft)', color: 'var(--nw-accent)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </div>
            <h3 style={sectionTitleStyle}>Kategori Yönetimi</h3>
          </div>

          <p style={{ color: 'var(--nw-text-dim)', fontSize: '13px', marginBottom: '16px' }}>
            Buradaki kategoriler; ürün ekleme ekranında, üst menüde ve site alt bilgisinde görünür. Boşsa varsayılan kategoriler kullanılır.
          </p>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input type="text" placeholder="Yeni kategori adı (Örn: Bluz)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ ...inputStyle, flex: '1 1 240px' }} />
            <button type="submit" style={{ ...submitBtnStyle, flex: '0 0 auto' }}>+ Kategori Ekle</button>
          </form>

          {categories.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--nw-bg-elev)', borderRadius: 'var(--nw-r-sm)', border: '1px dashed var(--nw-line)' }}>
              <p style={{ color: 'var(--nw-text-dim)', fontSize: '13px', marginBottom: '12px' }}>
                Henüz özel kategori eklenmedi. Şu an sitede <b>varsayılan kategoriler</b> gösteriliyor: {DEFAULT_CATEGORIES.join(', ')}.
              </p>
              <button onClick={handleSeedDefaultCategories} style={{ ...submitBtnStyle, backgroundColor: 'var(--nw-accent)' }}>Varsayılan Kategorileri Yükle</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {categories.map((cat) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--nw-accent-soft)', border: '1px solid var(--nw-line-strong)', borderRadius: '20px', padding: '6px 8px 6px 14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--nw-accent)' }}>{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} title="Kategoriyi sil" style={{ width: '20px', height: '20px', border: 'none', backgroundColor: 'var(--nw-surface)', color: 'var(--nw-danger)', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', fontWeight: '700', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// --- YENİ KURUMSAL TASARIM (SENIOR LEVEL STYLES) ---
const cardStyle = { backgroundColor: 'var(--nw-surface)', borderRadius: 'var(--nw-r-md)', border: '1px solid var(--nw-line)', boxShadow: 'none', padding: 'clamp(16px, 4vw, 24px)' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--nw-line)', flexWrap: 'wrap' };
const sectionTitleStyle = { fontFamily: 'var(--nw-font-display)', fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--nw-text)', margin: 0 };

const inputStyle = { flex: 1, padding: '12px 16px', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)', outline: 'none', fontSize: '14px', backgroundColor: 'var(--nw-surface)', transition: 'border-color 0.2s', color: 'var(--nw-text)', boxSizing: 'border-box' };
const submitBtnStyle = { padding: '12px 24px', backgroundColor: 'var(--nw-accent)', color: 'var(--nw-on-accent)', border: 'none', borderRadius: 'var(--nw-r-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', boxShadow: '0 6px 18px -8px var(--nw-accent)', transition: 'opacity 0.2s' };
const deleteBtnStyle = { padding: '6px 12px', backgroundColor: 'var(--nw-danger-soft)', color: 'var(--nw-danger)', border: 'none', borderRadius: 'var(--nw-r-sm)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'background-color 0.2s' };

// Upload alanı mobilde taşmasın diye width: 100% ve maxWidth kullanıldı
const uploadAreaStyle = { cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '280px', minHeight: '110px', border: '2px dashed var(--nw-line)', borderRadius: 'var(--nw-r-md)', backgroundColor: 'var(--nw-bg-elev)', overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s' };

// Mobilde tabloyu sağa sola kaydırmak için eklentiler
const tableWrapperStyle = { border: '1px solid var(--nw-line)', borderRadius: 'var(--nw-r-md)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' };
const tableStyle = { width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: 'var(--nw-surface)' };
const theadStyle = { backgroundColor: 'var(--nw-bg-elev)', borderBottom: '1px solid var(--nw-line)' };
const thStyle = { padding: '14px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--nw-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '16px 20px', fontSize: '14px', color: 'var(--nw-text-dim)', verticalAlign: 'middle' };
const emptyStateStyle = { padding: '40px', textAlign: 'center', color: 'var(--nw-text-faint)', fontSize: '14px' };

const couponMetaStyle = { backgroundColor: 'var(--nw-bg-elev)', color: 'var(--nw-text-dim)', padding: '3px 8px', borderRadius: 'var(--nw-r-sm)', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' };
const badgeActive = { padding: '4px 10px', borderRadius: 'var(--nw-r-md)', fontSize: '12px', fontWeight: '600', backgroundColor: 'var(--nw-success-soft)', color: 'var(--nw-success)', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', whiteSpace: 'nowrap' };
const badgeInactive = { padding: '4px 10px', borderRadius: 'var(--nw-r-md)', fontSize: '12px', fontWeight: '600', backgroundColor: 'var(--nw-bg-elev)', color: 'var(--nw-text-dim)', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', whiteSpace: 'nowrap' };

export default Marketing;