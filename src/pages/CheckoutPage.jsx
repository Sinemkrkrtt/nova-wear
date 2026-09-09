import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
    Box, Container, Typography, Grid, Paper, TextField, Button, 
    Divider, CircularProgress, Stack, Checkbox, FormControlLabel, InputAdornment
} from '@mui/material';
import { VerifiedUserOutlined, ShoppingBagOutlined, HelpOutlineOutlined as HelpOutline } from '@mui/icons-material';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, appCheckHeaders, FUNCTIONS_BASE_URL } from '../../src/config/firebase';
import { createCodOrder, COD_MAX_TOTAL } from '../utils/orderApi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // CartPage'den gelen veriler
    const { cartItems = [], total = 0, subtotal = 0, shipping = 0, discount = 0, couponCode = '' } = location.state || {};

    const [loading, setLoading] = useState(false);
    
    // TC Kimlik eklendi (identityNumber)
    const [formData, setFormData] = useState({
        email: '',
        newsletter: false,
        firstName: '',
        lastName: '',
        identityNumber: '', // YENİ EKLENDİ
        address: '',
        apartment: '',
        city: '',
        district: '',
        phone: '',
        corporateInvoice: false,
        sameBilling: true,
        termsAccepted: false,
        paymentMethod: 'card'
    });

    const brandFont = 'var(--nw-font-display)';
    const brandColor = "var(--nw-accent)";
    const brandDark = "var(--nw-accent-hover)";
    const bgLight = "var(--nw-surface)";
    const borderColor = "var(--nw-line)";

    useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            navigate('/sepet');
        }
        window.scrollTo(0, 0);
    }, [cartItems, navigate]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const nameParts = currentUser.displayName ? currentUser.displayName.split(" ") : [];
                setFormData(prev => ({
                    ...prev,
                    email: currentUser.email || prev.email,
                    firstName: nameParts[0] || prev.firstName,
                    lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : prev.lastName
                }));
            }
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // TC Kimlik için sadece rakam girişine izin ver
        if (name === 'identityNumber') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData({ ...formData, [name]: onlyNums });
            return;
        }

        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleStartPayment = async (e) => {
        e.preventDefault();
        
        // TC Kimlik uzunluk kontrolü (opsiyonel ama önerilir)
        if (formData.identityNumber.length !== 11) {
            alert("Lütfen geçerli bir 11 haneli TC Kimlik Numarası giriniz.");
            return;
        }

        if (!formData.termsAccepted) {
            alert("Lütfen Mesafeli Satış Sözleşmesi'ni ve İade Koşulları'nı onaylayın.");
            return;
        }
        
        setLoading(true);

        try {
            const payloadItems = cartItems.map(item => {
                // Beden ve rengi AYRI alanlar olarak göndermek zorunlu: sunucu
                // stok kontrolünü ve stok düşümünü it.size / it.color üzerinden
                // yapıyor. Eskiden yalnızca birleşik 'variant' metni
                // gönderiliyordu; sunucu bedeni göremediği için stok hiç
                // düşmüyor, tükenmiş ürün satılmaya devam ediyordu.
                const itemColor = item.color || item.selectedColor || item.renk || "";
                const itemSize = item.selectedSize || item.size || item.variant || "";
                const variantText = [itemColor, itemSize].filter(Boolean).join(' / ');
                return {
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity || 1,
                    variant: variantText,
                    color: itemColor,
                    size: itemSize
                };
            });

            const fullAddress = `${formData.address} ${formData.apartment ? ', ' + formData.apartment : ''} - ${formData.district}/${formData.city}`;
            const formattedPhone = `+90${formData.phone.replace(/\s+/g, '')}`;

            const paymentData = {
                userId: auth.currentUser?.uid || "GUEST_" + Date.now(),
                email: formData.email,
                userName: formData.firstName,
                userSurname: formData.lastName,
                identityNumber: formData.identityNumber, // YENİ EKLENDİ (İyzico için)
                city: formData.city,
                address: fullAddress,
                gsmNumber: formattedPhone,
                couponCode: couponCode || "",
                newsletter: !!formData.newsletter,
                items: payloadItems
            };

            if (formData.paymentMethod === 'kapida') {
                const result = await createCodOrder(paymentData);
                if (result.success && result.orderNumber) {
                    window.location.href = `/odeme-sonucu?status=success&method=kapida&order=${encodeURIComponent(result.orderNumber)}`;
                } else {
                    alert("Sipariş oluşturulamadı: " + (result.errorMessage || "Bilinmeyen hata"));
                    setLoading(false);
                }
                return;
            }

            const acHeaders = await appCheckHeaders();
            const response = await fetch(`${FUNCTIONS_BASE_URL}/createPayment`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...acHeaders },
                body: JSON.stringify({ data: paymentData })
            });

            const result = await response.json();

            if (result.data && result.data.paymentPageUrl) {
                window.location.href = result.data.paymentPageUrl;
            } else {
                alert("Ödeme başlatılamadı: " + (result.data?.errorMessage || "Bilinmeyen hata"));
                setLoading(false);
            }
        } catch (error) {
            console.error("Hata:", error);
            alert("Ödeme sistemiyle bağlantı kurulamadı. Lütfen tekrar deneyin.");
            setLoading(false);
        }
    };

    const inputStyles = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            backgroundColor: "var(--nw-surface)",
            "& fieldset": { borderColor: borderColor },
            "&:hover fieldset": { borderColor: "var(--nw-line)" },
            "&.Mui-focused fieldset": { borderColor: brandColor, borderWidth: "1px" },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: brandColor }
    };

    if (!cartItems || cartItems.length === 0) return null;

    return (
        <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: bgLight }}>
            <Navbar />
            
            <Box sx={{ flexGrow: 1, py: { xs: 4, md: 8 } }}>
                <Container maxWidth="lg">
                    <Grid container spacing={{ xs: 4, md: 8 }}>
                        
                        {/* SOL TARAF: BİLGİ FORMU */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box component="form" onSubmit={handleStartPayment} sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--nw-text)', mb: 2, fontSize: '1.25rem' }}>
                                        İletişim Bilgileri
                                    </Typography>
                                    <TextField 
                                        required fullWidth placeholder="E-Posta" name="email" type="email" 
                                        value={formData.email} onChange={handleInputChange} 
                                        sx={inputStyles}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <HelpOutline sx={{ color: 'var(--nw-text-faint)', fontSize: 20 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <FormControlLabel 
                                        control={<Checkbox name="newsletter" checked={formData.newsletter} onChange={handleInputChange} sx={{ color: 'var(--nw-text-faint)', '&.Mui-checked': { color: brandColor } }} />} 
                                        label={<Typography variant="body2" sx={{ color: 'var(--nw-text-dim)', mt: 0.5 }}>Beni haberlerden ve özel tekliflerden haberdar et</Typography>} 
                                        sx={{ mt: 1, ml: 0 }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--nw-text)', mb: 2, fontSize: '1.25rem' }}>
                                        Teslimat Adresi
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField required fullWidth placeholder="Ad" name="firstName" value={formData.firstName} onChange={handleInputChange} sx={inputStyles} />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField required fullWidth placeholder="Soyad" name="lastName" value={formData.lastName} onChange={handleInputChange} sx={inputStyles} />
                                        </Grid>

                                        {/* YENİ EKLENEN TC KİMLİK ALANI */}
                                        <Grid size={12}>
                                            <TextField 
                                                required 
                                                fullWidth 
                                                placeholder="TC Kimlik Numarası (Fatura için gereklidir)" 
                                                name="identityNumber" 
                                                value={formData.identityNumber} 
                                                onChange={handleInputChange} 
                                                sx={inputStyles}
                                                inputProps={{ maxLength: 11 }}
                                            />
                                        </Grid>
                                        
                                        <Grid size={12}>
                                            <TextField required fullWidth placeholder="Adres" name="address" value={formData.address} onChange={handleInputChange} sx={inputStyles} />
                                        </Grid>
                                        
                                        <Grid size={12}>
                                            <TextField fullWidth placeholder="Apartman, daire, vb." name="apartment" value={formData.apartment} onChange={handleInputChange} sx={inputStyles} />
                                        </Grid>
                                        
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField required fullWidth placeholder="İl" name="city" value={formData.city} onChange={handleInputChange} sx={inputStyles} />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField required fullWidth placeholder="İlçe" name="district" value={formData.district} onChange={handleInputChange} sx={inputStyles} />
                                        </Grid>

                                        <Grid size={12}>
                                            <TextField 
                                                required fullWidth placeholder="Telefon" name="phone" 
                                                value={formData.phone} onChange={handleInputChange} 
                                                sx={inputStyles}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ mr: 1 }}>
                                                            <span style={{ fontSize: '1.1rem', marginRight: '6px' }}>🇹🇷</span>
                                                            <Typography sx={{ color: 'var(--nw-text)', fontWeight: 500, fontSize: '0.95rem' }}>+90</Typography>
                                                            <Divider orientation="vertical" flexItem sx={{ mx: 1.5, height: 24, alignSelf: 'center', borderColor: borderColor }} />
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 3 }}>
                                        <FormControlLabel 
                                            control={<Checkbox name="corporateInvoice" checked={formData.corporateInvoice} onChange={handleInputChange} sx={{ color: 'var(--nw-text-faint)', '&.Mui-checked': { color: brandColor } }} />} 
                                            label={<Typography variant="body2" sx={{ color: 'var(--nw-text-dim)' }}>Kurumsal fatura</Typography>} 
                                            sx={{ ml: 0 }}
                                        />
                                        <FormControlLabel 
                                            control={<Checkbox name="sameBilling" checked={formData.sameBilling} onChange={handleInputChange} sx={{ color: 'var(--nw-text-faint)', '&.Mui-checked': { color: brandColor } }} />} 
                                            label={<Typography variant="body2" sx={{ color: 'var(--nw-text-dim)' }}>Fatura adresim teslimat adresimle aynı</Typography>} 
                                            sx={{ ml: 0 }}
                                        />
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 2, p: 2.5, bgcolor: 'var(--nw-bg-elev)', borderRadius: '12px', border: `1px solid ${formData.termsAccepted ? brandColor : borderColor}`, transition: 'all 0.3s ease' }}>
                                    <FormControlLabel 
                                        control={
                                            <Checkbox 
                                                name="termsAccepted" 
                                                checked={formData.termsAccepted} 
                                                onChange={handleInputChange} 
                                                sx={{ color: 'var(--nw-text-faint)', '&.Mui-checked': { color: brandColor } }} 
                                            />
                                        } 
                                        label={
                                            <Typography variant="body2" sx={{ color: 'var(--nw-text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                <Link to="/on-bilgilendirme-formu" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: brandColor, fontWeight: 600, textDecoration: 'underline' }}>Ön Bilgilendirme Formu</Link>'nu, <Link to="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: brandColor, fontWeight: 600, textDecoration: 'underline' }}>Mesafeli Satış Sözleşmesi</Link>'ni ve <Link to="/iade-degisim" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: brandColor, fontWeight: 600, textDecoration: 'underline' }}>İade/İptal Koşulları</Link>'nı okudum ve onaylıyorum.
                                            </Typography>
                                        } 
                                        sx={{ ml: 0, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--nw-text)', mb: 2, fontSize: '1.25rem' }}>
                                        Ödeme Yöntemi
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {[
                                            { key: 'card', title: 'Kredi / Banka Kartı', desc: 'iyzico ile güvenli online ödeme' },
                                            { key: 'kapida', title: 'Kapıda Ödeme', desc: 'Teslimatta nakit veya kart ile ödeyin' },
                                        ].map((opt) => {
                                            const active = formData.paymentMethod === opt.key;
                                            const disabled = opt.key === 'kapida' && Number(total) > COD_MAX_TOTAL;
                                            return (
                                                <Box
                                                    key={opt.key}
                                                    onClick={() => { if (!loading && !disabled) setFormData((prev) => ({ ...prev, paymentMethod: opt.key })); }}
                                                    sx={{
                                                        cursor: disabled ? 'not-allowed' : 'pointer', p: 2, borderRadius: '10px',
                                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                                        opacity: disabled ? 0.5 : 1,
                                                        bgcolor: active ? 'var(--nw-accent-soft)' : 'var(--nw-surface)',
                                                        border: `1.5px solid ${active ? brandColor : borderColor}`,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <Box sx={{
                                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                                        border: `2px solid ${active ? brandColor : "var(--nw-accent)"}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        {active && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: brandColor }} />}
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, color: 'var(--nw-text)', fontSize: '0.95rem' }}>{opt.title}</Typography>
                                                        <Typography sx={{ color: 'var(--nw-text-dim)', fontSize: '0.82rem' }}>
                                                            {disabled ? `${COD_MAX_TOTAL.toFixed(0)} ₺ üzeri siparişlerde kullanılamaz` : opt.desc}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>

                                    {formData.paymentMethod === 'kapida' && (
                                        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: '10px', bgcolor: 'var(--nw-warning-soft)', border: '1px solid var(--nw-warning-soft)' }}>
                                            <Typography sx={{ color: 'var(--nw-warning)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                                Ödemeyi teslimat sırasında kuryeye <strong>nakit veya kart</strong> ile yapabilirsiniz. Sipariş onayınız e-posta ile gönderilecektir.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Button
                                    type="submit" variant="contained"
                                    disabled={loading || !formData.termsAccepted}
                                    sx={{
                                        bgcolor: brandColor, color: 'var(--nw-on-accent)', py: 2.2, fontSize: '1.1rem', fontWeight: 700, borderRadius: '8px',
                                        boxShadow: `0 8px 20px ${brandColor}40`,
                                        "&:hover": { bgcolor: brandDark, boxShadow: `0 8px 25px ${brandColor}60` },
                                        "&:disabled": { bgcolor: 'var(--nw-surface-2)', color: 'var(--nw-text-faint)', boxShadow: 'none' },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {loading
                                        ? <CircularProgress size={24} color="inherit" />
                                        : (formData.paymentMethod === 'kapida' ? "Siparişi Onayla" : "Güvenli Ödemeye Git")}
                                </Button>
                            </Box>
                        </Grid>

                        {/* SAĞ TARAF: SİPARİŞ ÖZETİ */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ position: { xs: 'static', md: 'sticky' }, top: 100 }}>
                                <Paper elevation={0} sx={{ p: {xs: 3, md: 4}, borderRadius: '16px', bgcolor: 'var(--nw-surface)', border: `1px solid ${borderColor}` }}>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                                        <ShoppingBagOutlined sx={{ color: brandColor, fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ fontFamily: brandFont, fontWeight: 700, fontSize: '1.4rem', fontStyle: 'italic', color: brandDark }}>
                                            Sipariş Özeti
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4, maxHeight: '350px', overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: borderColor, borderRadius: '4px' } }}>
                                        {cartItems.map((item, index) => {
                                            const variantText = item.selectedSize || item.variant || [item.color, item.size].filter(Boolean).join(' / ') || '';
                                            return (
                                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                                                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                                                            <img src={item.imageUrl || item.images?.[0]} alt={item.name} style={{ width: 64, height: 85, objectFit: 'cover', borderRadius: 8, border: `1px solid ${borderColor}` }} />
                                                            <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'var(--nw-text-dim)', color: 'var(--nw-on-accent)', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                                                                {item.quantity}
                                                            </Box>
                                                        </Box>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--nw-text)', mb: 0.5, maxWidth: { xs: '110px', sm: '150px' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {item.name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: 'var(--nw-text-dim)' }}>
                                                                {variantText || 'Standart'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--nw-text)', whiteSpace: 'nowrap' }}>
                                                        {(item.price * item.quantity).toFixed(2)} ₺
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>

                                    <Divider sx={{ my: 3, borderColor: borderColor }} />

                                    <Stack spacing={2} sx={{ mb: 3 }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="body2" color="text.secondary">Ara Toplam</Typography>
                                            <Typography variant="body2" fontWeight={600} color="var(--nw-text)">{subtotal.toFixed(2)} ₺</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="body2" color="text.secondary">Kargo</Typography>
                                            <Typography variant="body2" fontWeight={600} color={shipping === 0 ? "var(--nw-success)" : "var(--nw-text)"}>
                                                {shipping === 0 ? "Ücretsiz" : `${shipping.toFixed(2)} ₺`}
                                            </Typography>
                                        </Box>
                                        {discount > 0 && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="body2" color="var(--nw-success)">İndirim</Typography>
                                                <Typography variant="body2" fontWeight={600} color="var(--nw-success)">- {discount.toFixed(2)} ₺</Typography>
                                            </Box>
                                        )}
                                    </Stack>

                                    <Divider sx={{ my: 3, borderColor: borderColor }} />

                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography variant="h6" fontWeight={700} color="var(--nw-text)">Toplam</Typography>
                                        <Typography variant="h4" fontWeight={700} color={brandColor} sx={{ fontFamily: brandFont, fontStyle: 'italic' }}>
                                            {total.toFixed(2)} ₺
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ display: 'block', textAlign: 'right', color: 'var(--nw-text-faint)', mt: 1, fontSize: '0.72rem' }}>
                                        Tüm fiyatlara KDV dahildir.
                                    </Typography>
                                </Paper>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 3, justifyContent: 'center', color: "var(--nw-success)", bgcolor: "var(--nw-success-soft)", px: 2, py: 1.5, borderRadius: '12px', border: '1px solid var(--nw-success-soft)' }}>
                                    <VerifiedUserOutlined fontSize="small" />
                                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.8rem' }}>256-Bit SSL Güvenli Ödeme</Typography>
                                </Box>
                            </Box>
                        </Grid>

                    </Grid>
                </Container>
            </Box>
            
            <Footer />
        </div>
    );
}