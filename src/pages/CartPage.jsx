import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { auth, db, appCheckHeaders, authHeaders, FUNCTIONS_BASE_URL } from '../config/firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CheckoutModal from '../components/CheckoutModal';
import { imageUrl, imageFallback } from '../utils/storage';

// ---------------------------------------------------------------------------
// SEPET SAYFASI
//
// Görünüm, sitenin geri kalanıyla (koleksiyon/favoriler sayfaları) aynı
// yapıyı kullanır: .nw-wrap kapsayıcısı, ekmek kırıntısı, .nw-collection-head
// başlığı ve boşken .nw-empty. Daha önce bu sayfa MUI bileşenleriyle ayrı bir
// dilde yazılmıştı (tam genişlik, italik başlıklar, degrade butonlar) ve
// siteden kopuk duruyordu.
//
// Sayfanın MANTIĞI değişmedi: sepet localStorage'da tutulur, stok kontrolü ve
// kupon doğrulaması aynı şekilde çalışır, ödeme yine CheckoutModal üzerinden
// ilerler ve nihai fiyat her hâlükârda sunucuda yeniden hesaplanır.
// ---------------------------------------------------------------------------

// Fiyatlar site genelindeki biçimde: 1.235 ₺ (ürün kartlarıyla aynı).
const tl = (n) => `${Number(n || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;

const IconTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
);

const IconMinus = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
);

const IconPlus = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);

const IconShield = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" /><path d="M9 12l2 2 4-4" />
    </svg>
);

// Boş sepet işareti — koleksiyon sayfalarındaki halka işaretin içinde durur.
const IconBag = (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCouponCode, setAppliedCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

    // Kullanıcı Durumu
    const [user, setUser] = useState(null);

    // Adres/ödeme modalı
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    // Stok ön kontrolü: sepette tükenen/yetersiz ürünlerin id'leri
    const [unavailableIds, setUnavailableIds] = useState([]);

    const navigate = useNavigate();

    const FREE_SHIPPING_THRESHOLD = 1500;
    const SHIPPING_COST = 135.00;

    // Kullanıcı oturumunu dinle
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        try {
            const storedCart = JSON.parse(localStorage.getItem('myCart') || '[]');
            setCartItems(storedCart);
        } catch (error) {
            setCartItems([]);
        }
    }, []);

    // Sepetteki ürünlerin GÜNCEL stoğunu kontrol et (ürün sepetteyken tükenmiş olabilir)
    useEffect(() => {
        if (!cartItems.length) { setUnavailableIds([]); return; }
        let cancelled = false;

        const availableFor = (product, size, color) => {
            const variants = Array.isArray(product.variants) ? product.variants : [];
            if (!variants.length) return 0;
            const ws = (size || '').toString().trim().toLowerCase();
            const wc = (color || '').toString().trim().toLowerCase();
            if (ws) {
                let vm = variants.find(v => (v.size || '').toString().trim().toLowerCase() === ws && (!wc || (v.color || '').toString().trim().toLowerCase() === wc));
                if (!vm) vm = variants.find(v => (v.size || '').toString().trim().toLowerCase() === ws);
                if (vm) return Number(vm.stock) || 0;
            }
            return variants.reduce((a, v) => a + (Number(v.stock) || 0), 0);
        };

        (async () => {
            const bad = [];
            for (const item of cartItems) {
                try {
                    const snap = await getDoc(doc(db, 'products', String(item.id)));
                    if (!snap.exists()) { bad.push(item.id); continue; }
                    const p = snap.data();
                    const size = item.selectedSize || item.size || item.variant || '';
                    const color = item.color || item.selectedColor || item.renk || '';
                    if (availableFor(p, size, color) < (item.quantity || 1)) bad.push(item.id);
                } catch (e) { /* sessiz geç */ }
            }
            if (!cancelled) setUnavailableIds(bad);
        })();

        return () => { cancelled = true; };
    }, [cartItems]);

    const updateCart = (newCart) => {
        setCartItems(newCart);
        localStorage.setItem('myCart', JSON.stringify(newCart));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("cartUpdated")); // Sepet ikonunun güncellenmesi için

        if (newCart.length === 0) {
            setDiscount(0);
            setCouponMessage({ type: '', text: '' });
            setCouponCode('');
            setAppliedCouponCode('');
        }
    };

    const handleRemoveItem = (id) => {
        const updatedCart = cartItems.filter(item => item.id !== id);
        updateCart(updatedCart);
    };

    const handleQuantityChange = (id, delta) => {
        const updatedCart = cartItems.map(item => {
            if (item.id === id) {
                const newQuantity = (item.quantity || 1) + delta;
                return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
            }
            return item;
        });
        updateCart(updatedCart);
    };

    // --- SUNUCU TARAFI KUPON DOĞRULAMA ---
    // Kupon kodları artık istemciye açık DEĞİL; kod enumerasyonunu önlemek için
    // doğrulama validateCoupon fonksiyonunda yapılır. Nihai indirim yine ödeme
    // sırasında sunucuda yeniden hesaplanır (buradaki değer yalnızca önizleme).
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        const codeUpper = couponCode.toUpperCase().trim();

        try {
            const acHeaders = await appCheckHeaders();
            // E-posta gövdede GÖNDERİLMEZ: sunucu, "kişi başı tek kullanım"
            // kontrolü için adresi doğrulanmış token'dan okur.
            const idHeaders = await authHeaders();
            const response = await fetch(`${FUNCTIONS_BASE_URL}/validateCoupon`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...acHeaders, ...idHeaders },
                body: JSON.stringify({ data: { code: codeUpper, subtotal: Number(subtotal.toFixed(2)) } })
            });
            const result = await response.json();
            const payload = result.data || {};

            if (payload.valid) {
                setDiscount(Number(payload.discount) || 0);
                setAppliedCouponCode(codeUpper);
                setCouponMessage({ type: 'success', text: 'Kupon başarıyla uygulandı.' });
            } else {
                setDiscount(0);
                setAppliedCouponCode('');
                setCouponMessage({ type: 'error', text: payload.message || 'Geçersiz veya süresi dolmuş kupon kodu.' });
            }
        } catch (error) {
            console.error("Kupon kontrol hatası:", error);
            setCouponMessage({ type: 'error', text: 'Sistem hatası. Kupon kontrol edilemedi.' });
        }
    };

    // "Ödemeye Geç" artık adres/iletişim bilgilerini toplayan modalı açar.
    // Ödeme isteği (sunucu tarafı fiyatlandırma ile) CheckoutModal içinde atılır.
    const handleCheckout = () => {
        if (!cartItems.length) return;
        if (unavailableIds.length > 0) {
            alert("Sepetinizde stokta olmayan ürün(ler) var. Lütfen ödemeye geçmeden önce bunları kaldırın.");
            return;
        }
        setCheckoutOpen(true);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const amountLeftForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const progressPercentage = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const total = Math.max(0, subtotal > 0 ? (subtotal + shipping - discount) : 0);

    const itemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    // Sayfanın üst kısmı (ekmek kırıntısı + başlık) dolu ve boş sepette aynı:
    // sepet boşalınca kullanıcı bambaşka bir sayfaya düşmüş gibi hissetmesin.
    const head = (
        <>
            <nav className="nw-crumbs" aria-label="Konum">
                <Link to="/">Ana sayfa</Link>
                <span aria-hidden="true">/</span>
                <span>Sepetim</span>
            </nav>

            <header className="nw-collection-head">
                <h1>Sepetim</h1>
                <p>Ödemeye geçmeden önce seçtiklerini gözden geçir.</p>
                {cartItems.length > 0 && (
                    <span className="nw-collection-count">{itemCount} parça</span>
                )}
            </header>
        </>
    );

    // --- BOŞ SEPET ---
    if (cartItems.length === 0) {
        return (
            <div className="nw-page">
                <Navbar />

                <div className="nw-wrap">
                    {head}

                    <div className="nw-empty">
                        <span className="nw-empty-mark">{IconBag}</span>
                        <h2>Sepetin şu an boş</h2>
                        <p>
                            Henüz bir seçim yapmadın. Yeni gelenlere göz at ya da favorilerine
                            eklediğin parçaları sepete taşı.
                        </p>
                        <div className="nw-empty-actions">
                            <button className="nw-btn nw-btn-primary" onClick={() => navigate('/yeni-gelenler')}>
                                Yeni gelenler
                            </button>
                            <button className="nw-btn nw-btn-ghost" onClick={() => navigate('/favoriler')}>
                                Favorilerim
                            </button>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        );
    }

    // --- DOLU SEPET ---
    return (
        <div className="nw-page">
            <Navbar />

            <div className="nw-wrap">
                {head}

                <div className="nw-cart">
                    {/* --- SOL: ÜRÜNLER --- */}
                    <div className="nw-cart-list">
                        {cartItems.map((item) => {
                            const displayColor = item.color || item.selectedColor || item.renk || "";
                            const displaySize = item.selectedSize || item.size || item.variant || "Standart";
                            const gone = unavailableIds.includes(item.id);
                            const openProduct = () => navigate(`/product/${item.id}`, { state: item });

                            return (
                                <article key={item.id} className={`nw-cart-row${gone ? ' is-gone' : ''}`}>
                                    <button className="nw-cart-thumb" onClick={openProduct} aria-label={`${item.name} ürününe git`}>
                                        <img
                                            src={imageUrl(item.imageUrl || item.images?.[0], 300)}
                                            alt={item.name}
                                            loading="lazy"
                                            onError={imageFallback}
                                        />
                                    </button>

                                    <div className="nw-cart-info">
                                        <div className="nw-cart-top">
                                            <div className="nw-cart-titles">
                                                <h2 className="nw-cart-name" onClick={openProduct}>
                                                    {item.name}{displayColor ? ` - ${displayColor}` : ""}
                                                </h2>
                                                <p className="nw-cart-meta">
                                                    Beden <b>{displaySize}</b>
                                                    {displayColor && <> · Renk <b>{displayColor}</b></>}
                                                </p>
                                                {gone && (
                                                    <p className="nw-cart-warn">
                                                        Bu beden stokta kalmadı — ödemeye geçmek için kaldır.
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                className="nw-cart-remove"
                                                onClick={() => handleRemoveItem(item.id)}
                                                aria-label="Ürünü sepetten kaldır"
                                                title="Sepetten kaldır"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>

                                        <div className="nw-cart-foot">
                                            <div className="nw-qty">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, -1)}
                                                    disabled={(item.quantity || 1) <= 1}
                                                    aria-label="Adedi azalt"
                                                >
                                                    <IconMinus />
                                                </button>
                                                <span aria-live="polite">{item.quantity || 1}</span>
                                                <button onClick={() => handleQuantityChange(item.id, 1)} aria-label="Adedi artır">
                                                    <IconPlus />
                                                </button>
                                            </div>

                                            <span className="nw-cart-price">
                                                {tl(Number(item.price) * (item.quantity || 1))}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* --- SAĞ: SİPARİŞ ÖZETİ --- */}
                    <aside className="nw-cart-summary" aria-label="Sipariş özeti">
                        <h2>Sipariş özeti</h2>

                        <div className="nw-sum-lines">
                            <div className="nw-sum-line">
                                <span>Ara toplam</span>
                                <b>{tl(subtotal)}</b>
                            </div>
                            <div className={`nw-sum-line${shipping === 0 ? ' is-free' : ''}`}>
                                <span>Kargo</span>
                                <b>{shipping === 0 ? 'Ücretsiz' : tl(shipping)}</b>
                            </div>
                            <div className="nw-sum-line">
                                <span>KDV</span>
                                <b>Fiyata dahil</b>
                            </div>
                            {discount > 0 && (
                                <div className="nw-sum-line is-discount">
                                    <span>İndirim{appliedCouponCode ? ` (${appliedCouponCode})` : ''}</span>
                                    <b>- {tl(discount)}</b>
                                </div>
                            )}
                        </div>

                        {shipping > 0 && (
                            <div className="nw-ship">
                                <div className="nw-ship-top">
                                    <span>Ücretsiz kargoya</span>
                                    <b>{tl(amountLeftForFreeShipping)} kaldı</b>
                                </div>
                                <div
                                    className="nw-ship-bar"
                                    role="progressbar"
                                    aria-valuenow={Math.round(progressPercentage)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <i style={{ width: `${progressPercentage}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="nw-coupon">
                            <label className="nw-label" htmlFor="nw-coupon-input">İndirim kodu</label>
                            <div className="nw-coupon-row">
                                <input
                                    id="nw-coupon-input"
                                    className="nw-field"
                                    placeholder="Kodu gir"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                                />
                                <button className="nw-btn nw-btn-ghost" onClick={handleApplyCoupon}>
                                    Uygula
                                </button>
                            </div>
                            {couponMessage.text && (
                                <p className={`nw-coupon-msg ${couponMessage.type === 'success' ? 'ok' : 'err'}`}>
                                    {couponMessage.text}
                                </p>
                            )}
                        </div>

                        <div className="nw-sum-total">
                            <span>Toplam</span>
                            <strong>{tl(total)}</strong>
                        </div>

                        {unavailableIds.length > 0 && (
                            <div className="nw-alert nw-alert-danger" role="alert">
                                Sepetinde stokta olmayan ürün var. Ödemeye geçebilmek için onu kaldır.
                            </div>
                        )}

                        <button
                            className="nw-btn nw-btn-primary nw-cart-cta"
                            onClick={handleCheckout}
                            disabled={unavailableIds.length > 0}
                        >
                            Ödemeye geç
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </button>

                        <div className="nw-cart-trust">
                            <span className="nw-cart-trust-line">
                                <IconShield /> 256-bit SSL ile güvenli ödeme
                            </span>
                            <div className="nw-cart-pay">
                                {['iyzico', 'visa', 'mastercard'].map((b) => (
                                    <span className="nw-pay-chip" key={b}>
                                        <img
                                            src={`${process.env.PUBLIC_URL}/payment/${b}.svg`}
                                            alt={b}
                                            style={{ height: b === 'mastercard' ? 18 : 13, display: 'block' }}
                                        />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <CheckoutModal
                open={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                cartItems={cartItems}
                couponCode={appliedCouponCode}
                subtotal={subtotal}
                shipping={shipping}
                discount={discount}
                total={total}
                user={user}
            />

            <Footer />
        </div>
    );
}

export default CartPage;
