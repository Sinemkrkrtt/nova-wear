import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';

import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { imageUrl, imageFallback } from '../utils/storage';
import ProductRail from './ProductRail';

// ---------------------------------------------------------------------------
// ÜRÜN DETAY SAYFASI
//
// Görünüm sitenin geri kalanıyla aynı dili konuşur: .nw-wrap kapsayıcısı,
// ekmek kırıntısı, serif başlık, geniş harf aralıklı etiketler, dik köşeler.
// Daha önce bu sayfa MUI bileşenleriyle (Accordion, Chip, Button) ayrı bir
// dilde yazılmıştı; renkler yeni palete geçse de yerleşimi ve tipografisi
// ana sayfaya benzemiyordu.
//
// MANTIK DEĞİŞMEDİ: ürün yükleme (site içi state ya da URL'den Firestore),
// beden/stok kontrolü, adet, favori ve sepete ekleme aynı şekilde çalışıyor.
// ---------------------------------------------------------------------------

const tl = (n) => `${Number(n || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;

const IconHeart = ({ filled }) => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M20.8 6.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2c-1 3 1.4 6 8.8 11.6 7.4-5.6 9.8-8.6 8.8-11.6z" />
    </svg>
);

const IconArrow = ({ dir }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
);

function ProductDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [newProducts, setNewProducts] = useState([]);

    const getProductColor = (item) => {
        if (!item) return "";
        return item.color || item.selectedColor || item.renk || item.Renk || (item.variants && item.variants.length > 0 ? item.variants[0].color : "");
    };

    // Site içinden mi geldi yoksa dışarıdan linkle mi?
    useEffect(() => {
        const loadProduct = async () => {
            setIsLoading(true);

            // Site içinden tıklandıysa (location.state doluysa) veritabanına gitmeye gerek yok
            if (location.state) {
                setProduct(location.state);
                setIsLoading(false);
            }
            // Dışarıdan Instagram/WhatsApp vb. linkiyle gelindiyse URL'deki id ile bul
            else if (id) {
                try {
                    const docRef = doc(db, 'products', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setProduct({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        setProduct(null); // Ürün gerçekten silinmişse
                    }
                } catch (error) {
                    console.error("Firebase'den ürün çekilirken hata:", error);
                    setProduct(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        loadProduct();
    }, [location.state, id]);

    // Yalnızca ürün başarıyla yüklendikten SONRA çalışır
    useEffect(() => {
        if (product) {
            const storedFavs = JSON.parse(localStorage.getItem('myFavorites') || '[]');
            setIsFavorite(!!storedFavs.find(item => item.id === product.id));
            setSelectedSize("");
            setQuantity(1);
            setCurrentImageIndex(0); // Yeni ürüne geçildiğinde ilk görsele sıfırla

            const fetchNewProducts = async () => {
                try {
                    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(25));
                    const querySnapshot = await getDocs(q);

                    const productsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                    const inStockProducts = productsData.filter(item => {
                        if (item.id === product?.id) return false;
                        const itemTotalStock = (item.variants && item.variants.length > 0)
                            ? item.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
                            : 0;
                        return itemTotalStock > 0;
                    });

                    setNewProducts(inStockProducts.slice(0, 12));
                } catch (error) {
                    console.error("Yeni ürünler çekilemedi:", error);
                }
            };

            fetchNewProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [product]);

    // Sepete eklendi bildirimi kendiliğinden kapanır.
    useEffect(() => {
        if (!toastOpen) return;
        const t = setTimeout(() => setToastOpen(false), 3000);
        return () => clearTimeout(t);
    }, [toastOpen]);

    const toggleFavorite = () => {
        const storedFavs = JSON.parse(localStorage.getItem('myFavorites') || '[]');
        let updatedFavs;
        if (isFavorite) {
            updatedFavs = storedFavs.filter(item => item.id !== product.id);
        } else {
            updatedFavs = [...storedFavs, product];
        }
        localStorage.setItem('myFavorites', JSON.stringify(updatedFavs));
        setIsFavorite(!isFavorite);
    };

    const handleAddToCart = () => {
        const storedCart = JSON.parse(localStorage.getItem('myCart') || '[]');
        let updatedCart = [...storedCart];
        const existingItemIndex = updatedCart.findIndex(item =>
            item.id === product.id && item.selectedSize === selectedSize
        );

        const productColor = getProductColor(product);

        if (existingItemIndex > -1) {
            updatedCart[existingItemIndex].quantity += quantity;
        } else {
            updatedCart.push({
                ...product,
                name: product.name,
                quantity: quantity,
                selectedSize: selectedSize || "Standart",
                color: productColor
            });
        }
        localStorage.setItem('myCart', JSON.stringify(updatedCart));
        setToastOpen(true);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    // --- YÜKLENİYOR ---
    // Dönen çember yerine sayfanın kendi iskeleti: yerleşim zıplamıyor.
    if (isLoading) {
        return (
            <div className="nw-wrap nw-pd-skel" aria-busy="true" aria-label="Ürün yükleniyor">
                <div className="nw-skel nw-pd-skel-img" />
                <div className="nw-pd-skel-info">
                    <span className="nw-skel nw-skel-line" style={{ width: '35%' }} />
                    <span className="nw-skel nw-skel-line" style={{ width: '70%', height: 30 }} />
                    <span className="nw-skel nw-skel-line" style={{ width: '25%', height: 20 }} />
                    <span className="nw-skel nw-skel-line" style={{ width: '100%', height: 54, marginTop: 24 }} />
                </div>
            </div>
        );
    }

    // --- ÜRÜN YOK ---
    if (!product) {
        return (
            <div className="nw-wrap">
                <div className="nw-empty">
                    <span className="nw-empty-mark">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="9" /><path d="M9 9h.01M15 9h.01M9 15.5c1.7-1.2 3.3-1.2 5 0" />
                        </svg>
                    </span>
                    <h2>Ürün bulunamadı</h2>
                    <p>Aradığın ürün yayından kaldırılmış ya da bağlantı hatalı olabilir.</p>
                    <div className="nw-empty-actions">
                        <button className="nw-btn nw-btn-primary" onClick={() => navigate('/yeni-gelenler')}>Yeni gelenler</button>
                        <button className="nw-btn nw-btn-ghost" onClick={() => navigate('/')}>Ana sayfa</button>
                    </div>
                </div>
            </div>
        );
    }

    const displayImages = product.images && product.images.length > 0
        ? product.images
        : [product.imageUrl].filter(Boolean);

    const handleNextImage = () => setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    const handlePrevImage = () => setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

    let displayCategory = "";
    if (product.category) {
        if (Array.isArray(product.category) && product.category.length > 0) {
            displayCategory = product.category[0];
        } else if (typeof product.category === 'string') {
            displayCategory = product.category;
        }
    }

    const lowerName = product.name ? product.name.toLowerCase() : "";
    const isShoe = (lowerName.includes("shoe") || lowerName.includes("sneaker") || lowerName.includes("boot") || lowerName.includes("ayakkabı"));
    const isAccessory = (lowerName.includes("bag") || lowerName.includes("watch") || lowerName.includes("glass") || lowerName.includes("çanta"));

    const clothingSizes = ["XS", "S", "M", "L", "XL"];
    const shoeSizes = ["37", "38", "39", "40", "41"];
    const masterSizes = isShoe ? shoeSizes : clothingSizes;

    const totalStock = (product.variants && product.variants.length > 0)
        ? product.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
        : 0;
    const isOutOfStock = totalStock === 0;

    const selectedVariant = product.variants?.find(v => v.size?.toUpperCase() === selectedSize);
    const selectedVariantStock = selectedVariant ? (Number(selectedVariant.stock) || 0) : 0;

    const handleIncrease = () => {
        if (!selectedSize && isAccessory) setQuantity(prev => prev + 1);
        else if (quantity < selectedVariantStock) setQuantity(prev => prev + 1);
    };
    const handleDecrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const mainProductColor = getProductColor(product);
    const buyDisabled = isOutOfStock || (!isAccessory && !selectedSize);
    // Adet kontrolü beden seçilmeden anlamsız: kapalı görünüyor.
    const qtyLocked = isOutOfStock || (!isAccessory && !selectedSize);

    return (
        <>
            <div className="nw-wrap">
                <nav className="nw-crumbs" aria-label="Konum">
                    <Link to="/">Ana sayfa</Link>
                    <span aria-hidden="true">/</span>
                    {displayCategory ? (
                        <>
                            <Link to={`/kategori/${encodeURIComponent(displayCategory)}`}>{displayCategory}</Link>
                            <span aria-hidden="true">/</span>
                        </>
                    ) : null}
                    <span>{product.name}</span>
                </nav>

                <div className="nw-pd">
                    {/* --- SOL: GÖRSELLER --- */}
                    <div className="nw-pd-gallery">
                        {displayImages.length > 1 && (
                            <div className="nw-pd-thumbs">
                                {displayImages.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`nw-pd-thumb${currentImageIndex === index ? ' is-on' : ''}`}
                                        onClick={() => setCurrentImageIndex(index)}
                                        aria-label={`${index + 1}. görsel`}
                                        aria-pressed={currentImageIndex === index}
                                    >
                                        <img src={imageUrl(img, 200)} alt="" onError={imageFallback} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="nw-pd-stage">
                            {isOutOfStock && <span className="nw-pd-flag">Stokta yok</span>}

                            <img
                                className={isOutOfStock ? 'is-gone' : ''}
                                src={imageUrl(displayImages[currentImageIndex], 1000)}
                                alt={product.name}
                                onError={imageFallback}
                            />

                            {displayImages.length > 1 && (
                                <>
                                    <button className="nw-pd-nav nw-pd-prev" onClick={handlePrevImage} aria-label="Önceki görsel">
                                        <IconArrow dir="left" />
                                    </button>
                                    <button className="nw-pd-nav nw-pd-next" onClick={handleNextImage} aria-label="Sonraki görsel">
                                        <IconArrow dir="right" />
                                    </button>
                                    <span className="nw-pd-count">{currentImageIndex + 1} / {displayImages.length}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* --- SAĞ: BİLGİLER --- */}
                    <div className="nw-pd-info">
                        {displayCategory && <span className="nw-label">{displayCategory}</span>}

                        <h1 className="nw-pd-name">
                            {product.name}{mainProductColor ? ` — ${mainProductColor}` : ""}
                        </h1>

                        <div className={`nw-pd-price${isOutOfStock ? ' is-gone' : ''}`}>{tl(product.price)}</div>

                        {!isAccessory && (
                            <div className="nw-pd-sizes">
                                <span className="nw-label">{isShoe ? 'Numara' : 'Beden'}</span>

                                <div className="nw-pd-size-row">
                                    {masterSizes.map((size) => {
                                        const variantForSize = product.variants?.find(v => v.size?.toUpperCase() === size);
                                        const sizeStock = variantForSize ? (Number(variantForSize.stock) || 0) : 0;
                                        const isAvailable = sizeStock > 0 && !isOutOfStock;

                                        return (
                                            <button
                                                key={size}
                                                className={`nw-pd-size${selectedSize === size ? ' is-on' : ''}`}
                                                disabled={!isAvailable}
                                                onClick={() => { setSelectedSize(size); setQuantity(1); }}
                                                aria-pressed={selectedSize === size}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Seçili bedende son parçalar kaldıysa haber ver. */}
                                {selectedSize && selectedVariantStock > 0 && selectedVariantStock <= 3 && (
                                    <p className="nw-pd-note">Bu bedenden son {selectedVariantStock} adet.</p>
                                )}
                                {!selectedSize && !isOutOfStock && (
                                    <p className="nw-pd-note is-hint">Sepete eklemek için beden seç.</p>
                                )}
                            </div>
                        )}

                        <div className="nw-pd-buy">
                            <div className={`nw-qty${qtyLocked ? ' is-locked' : ''}`}>
                                <button onClick={handleDecrease} disabled={qtyLocked || quantity <= 1} aria-label="Adedi azalt">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14" /></svg>
                                </button>
                                <span aria-live="polite">{quantity}</span>
                                <button onClick={handleIncrease} disabled={qtyLocked} aria-label="Adedi artır">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                </button>
                            </div>

                            <button
                                className={`nw-pd-fav${isFavorite ? ' is-on' : ''}`}
                                onClick={toggleFavorite}
                                aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                aria-pressed={isFavorite}
                            >
                                <IconHeart filled={isFavorite} />
                            </button>
                        </div>

                        <button
                            className="nw-btn nw-btn-primary nw-pd-cta"
                            onClick={handleAddToCart}
                            disabled={buyDisabled}
                        >
                            {isOutOfStock ? 'Stokta yok' : 'Sepete ekle'}
                        </button>

                        <div className="nw-acc">
                            <details open>
                                <summary>Ürün detayları</summary>
                                <p>{product.description ? product.description : 'Zarif silueti ve modern kesimiyle öne çıkar.'}</p>
                            </details>
                            <details>
                                <summary>Teslimat ve iade</summary>
                                <p>
                                    Siparişleriniz ortalama 1-3 iş günü içinde kargoya verilir. Kullanılmamış,
                                    etiketi ve varsa hijyen/güvenlik bandı çıkarılmamış ürünler için teslim
                                    tarihinden itibaren 14 gün içinde cayma (iade) hakkınız bulunmaktadır.
                                    Tüm fiyatlarımıza KDV dahildir.
                                </p>
                            </details>
                        </div>
                    </div>
                </div>
            </div>

            {/* ALT KISIM: YENİ GELENLER — ana sayfadaki şeridin aynısı. */}
            {newProducts.length > 0 && (
                <div className="nw-pd-more">
                    <ProductRail
                        title="Yeni gelenler"
                        subtitle="Sezonun rafa yeni çıkan elbiseleri"
                        badge="YENİ"
                        items={newProducts}
                        onSeeAll={() => navigate('/yeni-gelenler')}
                    />
                </div>
            )}

            {/* Sepete eklendi bildirimi */}
            <div className={`nw-toast${toastOpen ? ' is-on' : ''}`} role="status" aria-live="polite">
                <span>Ürün sepete eklendi.</span>
                <button onClick={() => navigate('/sepet')}>Sepete git</button>
            </div>
        </>
    );
}

export default ProductDetail;
