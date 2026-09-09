import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CardMedia, IconButton, Button,
    Divider, Stack, TextField, Tooltip, Paper, Chip, LinearProgress
} from "@mui/material";
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, appCheckHeaders, FUNCTIONS_BASE_URL } from '../../src/config/firebase';

// İKONLARI TEK BİR SATIRDAN TOPLU ÇEKİYORUZ
import {
    Delete,
    Add as AddIcon,
    Remove as RemoveIcon,
    ArrowForwardIos as ArrowForwardIosIcon,
    VerifiedUserOutlined as VerifiedUserOutlinedIcon,
    ShoppingBagOutlined as ShoppingBagOutlinedIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CheckoutModal from '../components/CheckoutModal';

// Firebase Auth İmportları
import { onAuthStateChanged } from 'firebase/auth';

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

    // SENİN ORİJİNAL TASARIMIN VE FONTLARIN
    const brandFont = 'var(--nw-font-display)';
    const brandColor = "var(--nw-accent)";   
    const brandDark = "var(--nw-accent-hover)";    
    const brandHover = "var(--nw-accent-hover)";   
    const bgLight = "var(--nw-bg-elev)";      
    const textMain = "var(--nw-text)";
    const textMuted = "var(--nw-text-dim)";

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
            const response = await fetch(`${FUNCTIONS_BASE_URL}/validateCoupon`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...acHeaders },
                body: JSON.stringify({ data: { code: codeUpper, subtotal: Number(subtotal.toFixed(2)), email: user?.email || '' } })
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

    // --- BOŞ SEPET EKRANI ---
    if (cartItems.length === 0) {
        return (
            <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', maxWidth: 'none', backgroundColor: bgLight }}>
                <style>{`
                    html, body, #root, .App, .nw-page { max-width: none !important; width: 100% !important; margin: 0 !important; }
                    .nw-page { overflow-x: hidden; }
                `}</style>

                <Navbar />

                <Box sx={{
                    flexGrow: 1, position: "relative", display: "flex", alignItems: "center",
                    justifyContent: "center", py: { xs: 10, md: 15 }, overflow: "hidden"
                }}>
                    <Box sx={{
                        position: "absolute", width: "100%", height: "100%",
                        background: `radial-gradient(circle at center, ${brandHover}15 0%, transparent 50%)`,
                        zIndex: 0
                    }} />

                    <Stack alignItems="center" spacing={3} sx={{ textAlign: "center", width: "100%", maxWidth: "460px", mx: "auto", px: 3, position: "relative", zIndex: 1 }}>

                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 1 }}>
                            <Box sx={{
                                width: 120, height: 120,
                                borderRadius: "50%",
                                background: `linear-gradient(135deg, ${brandColor}, ${brandHover})`,
                                boxShadow: `0 16px 40px -10px ${brandColor}99`,
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <ShoppingBagOutlinedIcon sx={{ fontSize: 56, color: "var(--nw-on-accent)" }} />
                            </Box>
                        </Box>

                        <Typography sx={{ fontSize: "0.75rem", letterSpacing: 3, fontWeight: 700, color: brandHover, textTransform: "uppercase" }}>
                            Sepetiniz
                        </Typography>

                        <Typography variant="h3" sx={{ fontFamily: brandFont, color: textMain, fontWeight: 500, lineHeight: 1.15, fontSize: { xs: "2rem", sm: "2.4rem" } }}>
                            Şu an <span style={{ color: brandColor, fontStyle: "italic" }}>boş</span> görünüyor
                        </Typography>

                        <Typography variant="body1" sx={{ color: textMuted, lineHeight: 1.7, fontSize: "1rem", maxWidth: "92%" }}>
                            Henüz bir seçim yapmadınız. Yeni sezon koleksiyonumuza göz atın, size özel parçaları keşfedin.
                        </Typography>

                        <Button
                            variant="contained"
                            onClick={() => navigate('/')}
                            endIcon={<ArrowForwardIosIcon sx={{ fontSize: "0.85rem !important" }} />}
                            sx={{
                                background: `linear-gradient(135deg, ${brandColor}, ${brandHover})`,
                                color: "var(--nw-on-accent)", textTransform: "none", borderRadius: "8px",
                                padding: "14px 40px", fontSize: "1rem", letterSpacing: 1, fontWeight: 600,
                                boxShadow: `0 10px 30px -8px ${brandColor}99`,
                                "&:hover": { boxShadow: `0 14px 36px -8px ${brandColor}cc`, transform: "translateY(-2px)" },
                                transition: "all 0.3s ease", mt: 2
                            }}
                        >
                            Alışverişe Başla
                        </Button>
                    </Stack>
                </Box>

                <Footer />
            </div>
        );
    }

    // --- DOLU SEPET EKRANI ---
    return (
        <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', maxWidth: 'none', backgroundColor: bgLight }}>
            <style>{`html, body, #root, .App, .nw-page { max-width: none !important; width: 100% !important; margin: 0 !important; } .nw-page { overflow-x: hidden; }`}</style>
            <Navbar />

            <Box sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
                <Box
                    style={{ width: "100%", maxWidth: "none", marginLeft: 0, marginRight: 0 }}
                    sx={{ px: { xs: 2, sm: 4, md: 6, lg: 8 } }}
                >

                    <Divider sx={{ mb: 5, borderColor: "var(--nw-line)" }}>
                        <Chip
                            label={`${cartItems.length} ÜRÜN`}
                            sx={{
                                bgcolor: "var(--nw-surface)", border: "1px solid var(--nw-line)", fontWeight: 700,
                                color: brandColor, px: 2, letterSpacing: 1.2, fontSize: "0.78rem"
                            }}
                        />
                    </Divider>

                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start", gap: { xs: 3, md: 0 } }}>

                        {/* --- SOL KOLON (ÜRÜNLER) --- */}
                        <Box sx={{ flex: 1, minWidth: 0, width: "100%", pr: { xs: 0, md: 4 } }}>
                            <Stack spacing={3} pb={4}>
                                {cartItems.map((item) => {
                                    const displayColor = item.color || item.selectedColor || item.renk || "";
                                    const displaySize = item.selectedSize || item.size || item.variant || "Standart";

                                    return (
                                        <Paper
                                            key={item.id}
                                            elevation={0}
                                            sx={{
                                                display: 'flex', p: { xs: 2, sm: 3 }, width: "100%", borderRadius: "18px", alignItems: "center", bgcolor: "var(--nw-surface)",
                                                transition: "transform 0.2s, box-shadow 0.2s", border: "1px solid var(--nw-line)",
                                                "&:hover": { boxShadow: "0 10px 30px rgba(0,0,0,0.05)", borderColor: "var(--nw-line)", transform: "translateY(-2px)" }
                                            }}
                                        >
                                            <Box
                                                onClick={() => navigate(`/product/${item.id}`, { state: item })}
                                                sx={{ width: { xs: 90, sm: 130 }, height: { xs: 120, sm: 150 }, flexShrink: 0, cursor: "pointer", overflow: "hidden", borderRadius: "14px", bgcolor: "var(--nw-bg-elev)" }}
                                            >
                                                <CardMedia component="img" image={item.imageUrl} alt={item.name} sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "0.4s", "&:hover": { transform: "scale(1.08)" } }} />
                                            </Box>

                                            <Box sx={{ flexGrow: 1, minWidth: 0, ml: { xs: 1.5, sm: 4 }, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: { xs: 120, sm: 150 } }}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <Box sx={{ pr: 2 }}>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{ fontFamily: brandFont, fontStyle: "italic", fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 600, color: textMain, cursor: "pointer", lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                                            onClick={() => navigate(`/product/${item.id}`, { state: item })}
                                                        >
                                                            {item.name} {displayColor ? `- ${displayColor}` : ""}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: textMuted, mt: 0.5, fontSize: "0.9rem" }}>
                                                            Beden: <span style={{ color: textMain, fontWeight: 500 }}>{displaySize}</span>
                                                        </Typography>
                                                        {unavailableIds.includes(item.id) && (
                                                            <Typography variant="body2" sx={{ color: "var(--nw-danger)", mt: 0.5, fontSize: "0.82rem", fontWeight: 600 }}>
                                                                ⚠ Bu ürün/beden stokta kalmadı. Lütfen kaldırın.
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Tooltip title="Ürünü Kaldır">
                                                        <IconButton onClick={() => handleRemoveItem(item.id)} sx={{ color: "var(--nw-text-faint)", "&:hover": { color: "var(--nw-danger)", bgcolor: "var(--nw-danger-soft)" } }}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>

                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 2 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", bgcolor: "var(--nw-bg-elev)", borderRadius: "50px", px: 0.5, py: 0.25, border: "1px solid var(--nw-line)" }}>
                                                        <IconButton onClick={() => handleQuantityChange(item.id, -1)} disabled={item.quantity <= 1} sx={{ color: textMuted, width: 36, height: 36 }}>
                                                            <RemoveIcon fontSize="small" sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                        <Typography sx={{ px: { xs: 1, sm: 2 }, fontSize: "1rem", fontWeight: 700, minWidth: "20px", textAlign: "center", color: textMain }}>
                                                            {item.quantity || 1}
                                                        </Typography>
                                                        <IconButton onClick={() => handleQuantityChange(item.id, 1)} sx={{ color: textMuted, width: 36, height: 36 }}>
                                                            <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Box>
                                                    <Typography variant="h5" sx={{ fontWeight: 700, color: brandColor, fontFamily: brandFont, fontStyle: "italic", fontSize: { xs: "1.25rem", sm: "1.7rem" }, whiteSpace: "nowrap" }}>
                                                        {(Number(item.price) * (item.quantity || 1)).toFixed(2)} ₺
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>

                        <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ display: { xs: "none", md: "block" }, borderColor: "var(--nw-line)", alignSelf: "stretch" }}
                        />

                        {/* --- SAĞ KOLON (SİPARİŞ ÖZETİ) --- */}
                        <Box sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0, pl: { xs: 0, md: 4 } }}>
                            <Paper elevation={0} sx={{
                                p: { xs: 3, sm: 4 }, bgcolor: "var(--nw-surface)", width: "100%", borderRadius: "18px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
                                border: "1px solid var(--nw-line)", height: "fit-content", position: { xs: "static", md: "sticky" }, top: 100
                            }}>
                                <Typography variant="h5" sx={{ fontFamily: brandFont, fontStyle: "italic", mb: 2, fontWeight: 700, color: textMain }}>
                                    Sipariş Özeti
                                </Typography>
                                <Divider sx={{ mb: 3, borderColor: "var(--nw-line)" }} />

                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography sx={{ fontSize: "0.98rem", color: textMuted }}>Ara Toplam</Typography>
                                        <Typography fontWeight={700} color={textMain} sx={{ fontSize: "0.98rem" }}>{subtotal.toFixed(2)} ₺</Typography>
                                    </Box>

                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography sx={{ fontSize: "0.98rem", color: textMuted }}>Kargo Tahmini</Typography>
                                        <Typography fontWeight={700} sx={{ fontSize: "0.98rem", color: shipping === 0 ? "var(--nw-success)" : textMain }}>
                                            {shipping === 0 ? "Ücretsiz" : `${shipping.toFixed(2)} ₺`}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography sx={{ fontSize: "0.98rem", color: textMuted }}>KDV</Typography>
                                        <Typography fontWeight={700} sx={{ fontSize: "0.98rem", color: textMain }}>Fiyata Dahil</Typography>
                                    </Box>

                                    {discount > 0 && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography sx={{ fontSize: "0.98rem", color: "var(--nw-success)" }}>İndirim</Typography>
                                            <Typography fontWeight={700} sx={{ fontSize: "0.98rem", color: "var(--nw-success)" }}>- {discount.toFixed(2)} ₺</Typography>
                                        </Box>
                                    )}
                                </Stack>

                                {shipping > 0 && (
                                    <Box sx={{ mb: 3, p: 2, bgcolor: bgLight, borderRadius: "10px" }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: textMain, fontSize: "0.82rem" }}>
                                                Ücretsiz Kargo Fırsatı
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: brandHover, fontWeight: 700 }}>
                                                {amountLeftForFreeShipping.toFixed(2)} ₺ Kaldı
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progressPercentage}
                                            sx={{
                                                height: 6, borderRadius: 3, bgcolor: "var(--nw-line)",
                                                "& .MuiLinearProgress-bar": { bgcolor: brandHover }
                                            }}
                                        />
                                    </Box>
                                )}

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: "block", color: textMuted, letterSpacing: 1.2, fontSize: "0.72rem" }}>
                                        PROMO KODU
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <TextField
                                            placeholder="Kodu girin" size="small" fullWidth
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            sx={{ bgcolor: "var(--nw-bg-elev)", "& .MuiOutlinedInput-root": { borderRadius: "10px", '& fieldset': { borderColor: 'var(--nw-line)' }, '&.Mui-focused fieldset': { borderColor: brandColor } } }}
                                        />
                                        <Button
                                            onClick={handleApplyCoupon}
                                            variant="outlined"
                                            sx={{
                                                borderColor: brandColor, color: brandColor, borderRadius: "10px", textTransform: "none",
                                                fontWeight: 700, px: 3, "&:hover": { bgcolor: brandColor, color: "var(--nw-on-accent)", borderColor: brandColor }
                                            }}
                                        >
                                            Uygula
                                        </Button>
                                    </Box>
                                    {couponMessage.text && (
                                        <Typography sx={{ fontSize: '0.85rem', mt: 1, fontWeight: 500, color: couponMessage.type === 'success' ? 'var(--nw-success)' : 'var(--nw-danger)' }}>
                                            {couponMessage.text}
                                        </Typography>
                                    )}
                                </Box>

                                <Divider sx={{ my: 3, borderColor: "var(--nw-line)" }} />

                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center" }}>
                                    <Typography variant="h6" fontWeight={700} color={textMain}>Toplam</Typography>
                                    <Typography variant="h4" fontWeight={700} color={brandColor} sx={{ fontFamily: brandFont, fontStyle: "italic", fontSize: { xs: "1.4rem", sm: "1.7rem" } }}>
                                        {total.toFixed(2)} ₺
                                    </Typography>
                                </Box>

                                {/* STOK UYARISI */}
                                {unavailableIds.length > 0 && (
                                    <Box sx={{ mb: 2, p: 1.5, bgcolor: "var(--nw-danger-soft)", border: "1px solid var(--nw-danger-soft)", borderRadius: "10px" }}>
                                        <Typography sx={{ color: "var(--nw-danger)", fontSize: "0.85rem", fontWeight: 600 }}>
                                            Sepetinizde stokta olmayan ürün(ler) var. Ödemeye geçebilmek için lütfen bunları kaldırın.
                                        </Typography>
                                    </Box>
                                )}

                                {/* KONTROLLÜ ÖDEMEYE GEÇ BUTONU */}
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleCheckout}
                                    disabled={unavailableIds.length > 0}
                                    endIcon={<ArrowForwardIosIcon sx={{ fontSize: "1rem !important" }} />}
                                    sx={{
                                        bgcolor: brandDark, color: "var(--nw-on-accent)", py: 1.8, textTransform: "none", fontSize: "1.05rem", borderRadius: "10px",
                                        fontWeight: 700, mb: 3, boxShadow: "0 8px 25px rgba(58, 24, 80, 0.25)",
                                        "&:hover": { bgcolor: brandColor, transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(58, 24, 80, 0.35)" },
                                        "&.Mui-disabled": { bgcolor: "var(--nw-text-faint)", color: "#fff", boxShadow: "none" },
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    Ödemeye Geç
                                </Button>

                                {/* YENİ GÜVENLİK VE LOGO ALANI EKLENDİ */}
                                <Stack spacing={2} justifyContent="center" alignItems="center">
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "var(--nw-success)", bgcolor: "var(--nw-success-soft)", px: 2, py: 0.5, borderRadius: 10 }}>
                                        <VerifiedUserOutlinedIcon fontSize="small" />
                                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.75rem" }}>256-Bit SSL Güvenli Ödeme</Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5, mt: 0.5 }}>
                                        <img
                                            src={`${process.env.PUBLIC_URL}/payment/iyzico.svg`}
                                            alt="iyzico"
                                            style={{ height: '18px', opacity: 0.85 }}
                                        />
                                        <img
                                            src={`${process.env.PUBLIC_URL}/payment/visa.svg`}
                                            alt="Visa"
                                            style={{ height: '18px', opacity: 0.85 }}
                                        />
                                        <img
                                            src={`${process.env.PUBLIC_URL}/payment/mastercard.svg`}
                                            alt="Mastercard"
                                            style={{ height: '24px', opacity: 0.9 }}
                                        />
                                    </Box>
                                </Stack>
                            </Paper>
                        </Box>
                    </Box>
                </Box>
            </Box>

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