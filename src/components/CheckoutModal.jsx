import React, { useState, useEffect } from 'react';
import {
    Dialog, Box, Typography, TextField, Button, Grid, IconButton,
    Checkbox, FormControlLabel, InputAdornment, Divider, CircularProgress, Slide,
    useMediaQuery, useTheme
} from '@mui/material';
import { CloseRounded, LockOutlined, HelpOutlineOutlined as HelpOutline, ShieldOutlined } from '@mui/icons-material';
import { appCheckHeaders, FUNCTIONS_BASE_URL } from '../../src/config/firebase';
import { createCodOrder, COD_MAX_TOTAL } from '../utils/orderApi';
import BRAND from '../config/brand';

// Marka renkleri
const brandColor = "var(--nw-accent)";
const brandDark = "var(--nw-accent-hover)";
const brandHover = "var(--nw-accent-hover)";
const borderColor = "var(--nw-line)";
const brandFont = 'var(--nw-font-display)';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Zarif, rafine ortak input stili (floating label + yumuşak odak halkası)
const inputSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        backgroundColor: "var(--nw-bg-elev)",
        fontSize: "0.95rem",
        transition: "all 0.2s ease",
        "& fieldset": { borderColor: borderColor, transition: "border-color 0.2s" },
        "&:hover fieldset": { borderColor: "var(--nw-line)" },
        "&.Mui-focused": { backgroundColor: "var(--nw-surface)", boxShadow: `0 0 0 3px ${brandColor}14` },
        "&.Mui-focused fieldset": { borderColor: brandColor, borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": { color: "var(--nw-text-faint)", fontSize: "0.92rem" },
    "& .MuiInputLabel-root.Mui-focused": { color: brandColor, fontWeight: 600 }
};

// Editoryal bölüm başlığı (numaralı rozet + harf aralıklı etiket + ince çizgi)
function SectionTitle({ no, children }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                bgcolor: 'var(--nw-bg-elev)', color: brandColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 800
            }}>{no}</Box>
            <Typography sx={{ fontWeight: 700, color: 'var(--nw-text)', fontSize: '0.8rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {children}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'var(--nw-bg-elev)' }} />
        </Box>
    );
}

// Markaya uygun checkbox stili
const checkboxSx = { color: 'var(--nw-accent-soft)', py: 0.4, '&.Mui-checked': { color: brandColor } };

export default function CheckoutModal({
    open, onClose, cartItems = [], couponCode = '',
    subtotal = 0, shipping = 0, discount = 0, total = 0, user = null
}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '', firstName: '', lastName: '', identityNumber: '', // TC KİMLİK EKLENDİ
        address: '', apartment: '', city: '', district: '', phone: '',
        newsletter: false, corporateInvoice: false, sameBilling: true, termsAccepted: false,
        paymentMethod: 'card' 
    });

    // Kullanıcı giriş yaptıysa bilgilerini otomatik doldur
    useEffect(() => {
        if (open && user) {
            const nameParts = user.displayName ? user.displayName.split(" ") : [];
            setFormData(prev => ({
                ...prev,
                email: prev.email || user.email || '',
                firstName: prev.firstName || nameParts[0] || '',
                lastName: prev.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : '')
            }));
        }
    }, [open, user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // TC Kimlik için sadece rakam girişine izin ver
        if (name === 'identityNumber') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: onlyNums }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // TC Kimlik uzunluk kontrolü
        if (formData.identityNumber.length !== 11) {
            setError("Lütfen geçerli bir 11 haneli TC Kimlik Numarası giriniz.");
            return;
        }

        if (!formData.termsAccepted) {
            setError("Devam etmek için Mesafeli Satış Sözleşmesi'ni onaylamalısınız.");
            return;
        }
        if (!cartItems.length) {
            setError("Sepetiniz boş görünüyor.");
            return;
        }

        setLoading(true);
        try {
            const payloadItems = cartItems.map(item => {
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

            const fullAddress = `${formData.address}${formData.apartment ? ', ' + formData.apartment : ''} - ${formData.district}/${formData.city}`;
            const formattedPhone = `+90${formData.phone.replace(/\D/g, '')}`;

            const paymentData = {
                userId: user?.uid || ("GUEST_" + Date.now()),
                email: formData.email,
                userName: formData.firstName,
                userSurname: formData.lastName,
                identityNumber: formData.identityNumber, // TC KİMLİK BACKEND'E GÖNDERİLİYOR
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
                    setError(result.errorMessage || "Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
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
                setError("Ödeme başlatılamadı: " + (result.data?.errorMessage || "Bilinmeyen hata"));
                setLoading(false);
            }
        } catch (err) {
            console.error("Ödeme hatası:", err);
            setError("Ödeme sistemine bağlanılamadı. Lütfen tekrar deneyin.");
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            TransitionComponent={Transition}
            fullWidth
            fullScreen={fullScreen}
            maxWidth="sm"
            slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(42,17,61,0.45)', backdropFilter: 'blur(4px)' } } }}
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: '22px' },
                    m: { xs: 0, sm: 2 },
                    width: { xs: '100%', sm: 'calc(100% - 64px)' },
                    overflow: 'hidden',
                    maxHeight: { xs: '100%', sm: '94vh' },
                    boxShadow: '0 30px 80px -20px rgba(42,17,61,0.5)'
                }
            }}
        >
            {/* ===== DEKORATİF MOR BAŞLIK ===== */}
            <Box sx={{
                position: 'relative', flexShrink: 0,
                background: `linear-gradient(135deg, ${brandDark} 0%, ${brandColor} 55%, ${brandHover} 115%)`,
                px: { xs: 3, sm: 4 }, py: 3, overflow: 'hidden'
            }}>
                <Box sx={{ position: 'absolute', top: -45, right: -25, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Box sx={{ position: 'absolute', bottom: -55, right: 70, width: 110, height: 110, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ color: 'rgba(21,10,38,0.60)', fontSize: '0.66rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, mb: 0.5 }}>
                            {BRAND.name.toUpperCase()}
                        </Typography>
                        <Typography sx={{ color: 'var(--nw-on-accent)', fontWeight: 700, fontSize: '1.55rem', fontFamily: brandFont, fontStyle: 'italic', lineHeight: 1.05 }}>
                            Teslimat Bilgileri
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 1.2 }}>
                            <LockOutlined sx={{ color: 'rgba(21,10,38,0.75)', fontSize: 14 }} />
                            <Typography sx={{ color: 'rgba(21,10,38,0.75)', fontSize: '0.72rem', letterSpacing: 0.3 }}>
                                256-Bit SSL ile güvenli ödeme
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} disabled={loading} sx={{ color: 'var(--nw-on-accent)', bgcolor: 'rgba(21,10,38,0.12)', '&:hover': { bgcolor: 'rgba(21,10,38,0.22)' } }}>
                        <CloseRounded />
                    </IconButton>
                </Box>
            </Box>

            {/* ===== FORM ===== */}
            <Box component="form" onSubmit={handleSubmit} sx={{ px: { xs: 2.5, sm: 4 }, py: 3.5, overflowY: 'auto', flex: 1, minHeight: 0 }}>

                <SectionTitle no="1">İletişim Bilgileri</SectionTitle>
                <TextField
                    required fullWidth label="E-Posta" name="email" type="email"
                    value={formData.email} onChange={handleChange} sx={inputSx}
                    InputProps={{ endAdornment: <InputAdornment position="end"><HelpOutline sx={{ color: 'var(--nw-text-faint)', fontSize: 20 }} /></InputAdornment> }}
                />
                <FormControlLabel
                    control={<Checkbox name="newsletter" checked={formData.newsletter} onChange={handleChange} sx={checkboxSx} />}
                    label={<Typography variant="body2" sx={{ color: 'var(--nw-text-dim)', fontSize: '0.85rem' }}>Kampanya ve yeniliklerden haberdar et</Typography>}
                    sx={{ mt: 0.5, ml: -0.5 }}
                />

                <Box sx={{ mt: 3 }}>
                    <SectionTitle no="2">Teslimat Adresi</SectionTitle>
                </Box>
                <Grid container spacing={1.75}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField required fullWidth label="Ad" name="firstName" value={formData.firstName} onChange={handleChange} sx={inputSx} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField required fullWidth label="Soyad" name="lastName" value={formData.lastName} onChange={handleChange} sx={inputSx} />
                    </Grid>
                    
                    {/* YENİ EKLENEN TC KİMLİK ALANI */}
                    <Grid size={12}>
                        <TextField 
                            required 
                            fullWidth 
                            label="TC Kimlik Numarası (Fatura için gereklidir)" 
                            name="identityNumber" 
                            value={formData.identityNumber} 
                            onChange={handleChange} 
                            sx={inputSx}
                            inputProps={{ maxLength: 11 }}
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField required fullWidth label="Adres" name="address" value={formData.address} onChange={handleChange} sx={inputSx} />
                    </Grid>
                    <Grid size={12}>
                        <TextField fullWidth label="Apartman, daire, vb. (opsiyonel)" name="apartment" value={formData.apartment} onChange={handleChange} sx={inputSx} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField required fullWidth label="İl" name="city" value={formData.city} onChange={handleChange} sx={inputSx} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField required fullWidth label="İlçe" name="district" value={formData.district} onChange={handleChange} sx={inputSx} />
                    </Grid>
                    <Grid size={12}>
                        <TextField
                            required fullWidth label="Telefon" name="phone"
                            value={formData.phone} onChange={handleChange} sx={inputSx}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <span style={{ fontSize: '1.05rem', marginRight: 4 }}>🇹🇷</span>
                                        <Typography sx={{ color: 'var(--nw-text)', fontWeight: 600, fontSize: '0.9rem' }}>+90</Typography>
                                        <Divider orientation="vertical" flexItem sx={{ mx: 1.25, height: 20, alignSelf: 'center', borderColor }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column' }}>
                    <FormControlLabel
                        control={<Checkbox name="corporateInvoice" checked={formData.corporateInvoice} onChange={handleChange} sx={checkboxSx} />}
                        label={<Typography variant="body2" sx={{ color: 'var(--nw-text-dim)', fontSize: '0.85rem' }}>Kurumsal fatura</Typography>}
                        sx={{ ml: -0.5 }}
                    />
                    <FormControlLabel
                        control={<Checkbox name="sameBilling" checked={formData.sameBilling} onChange={handleChange} sx={checkboxSx} />}
                        label={<Typography variant="body2" sx={{ color: 'var(--nw-text-dim)', fontSize: '0.85rem' }}>Fatura adresim teslimat adresimle aynı</Typography>}
                        sx={{ ml: -0.5 }}
                    />
                </Box>

                {/* ===== ÖDEME YÖNTEMİ ===== */}
                <Box sx={{ mt: 3 }}>
                    <SectionTitle no="3">Ödeme Yöntemi</SectionTitle>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
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
                                    cursor: disabled ? 'not-allowed' : 'pointer', p: 1.75, borderRadius: '14px',
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    opacity: disabled ? 0.5 : 1,
                                    bgcolor: active ? 'var(--nw-bg-elev)' : 'var(--nw-bg-elev)',
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
                                    <Typography sx={{ fontWeight: 700, color: 'var(--nw-text)', fontSize: '0.92rem' }}>{opt.title}</Typography>
                                    <Typography sx={{ color: 'var(--nw-text-dim)', fontSize: '0.78rem' }}>
                                        {disabled ? `${COD_MAX_TOTAL.toFixed(0)} ₺ üzeri siparişlerde kullanılamaz` : opt.desc}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                {/* ===== SÖZLEŞME ONAYI ===== */}
                <Box sx={{
                    mt: 2, p: 2, borderRadius: '14px', display: 'flex', gap: 1.25, alignItems: 'flex-start',
                    bgcolor: formData.termsAccepted ? 'var(--nw-bg-elev)' : 'var(--nw-bg-elev)',
                    border: `1.5px solid ${formData.termsAccepted ? brandColor : borderColor}`,
                    transition: 'all 0.25s ease'
                }}>
                    <ShieldOutlined sx={{ color: formData.termsAccepted ? brandColor : "var(--nw-accent)", fontSize: 22, mt: 0.4 }} />
                    <FormControlLabel
                        control={<Checkbox name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} sx={{ ...checkboxSx, pt: 0 }} />}
                        label={
                            <Typography variant="body2" sx={{ color: 'var(--nw-text-dim)', fontSize: '0.85rem', lineHeight: 1.55 }}>
                                <a href="/on-bilgilendirme-formu" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: brandColor, fontWeight: 600, textDecoration: 'underline' }}>Ön Bilgilendirme Formu</a>'nu, <a href="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: brandColor, fontWeight: 600, textDecoration: 'underline' }}>Mesafeli Satış Sözleşmesi</a>'ni ve <a href="/iade-degisim" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: brandColor, fontWeight: 600, textDecoration: 'underline' }}>İade/İptal Koşulları</a>'nı okudum, onaylıyorum.
                            </Typography>
                        }
                        sx={{ ml: -0.5, mr: 0, alignItems: 'flex-start' }}
                    />
                </Box>

                {error && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: '10px', bgcolor: 'var(--nw-danger-soft)', border: '1px solid var(--nw-danger-soft)' }}>
                        <Typography sx={{ color: 'var(--nw-danger)', fontSize: '0.85rem', fontWeight: 500 }}>{error}</Typography>
                    </Box>
                )}

                {/* ===== TOPLAM ===== */}
                <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: 'var(--nw-text-dim)', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>
                        Ödenecek Tutar
                    </Typography>
                    <Typography sx={{ color: brandColor, fontWeight: 700, fontSize: '2rem', fontFamily: brandFont, fontStyle: 'italic', lineHeight: 1 }}>
                        {Number(total).toFixed(2)} ₺
                    </Typography>
                </Box>

                <Button
                    type="submit" fullWidth variant="contained" disableElevation
                    disabled={loading || !formData.termsAccepted}
                    startIcon={!loading && formData.paymentMethod === 'card' && <LockOutlined sx={{ fontSize: 20 }} />}
                    sx={{
                        mt: 2.5, py: 1.7, fontSize: '1.02rem', fontWeight: 700, borderRadius: '14px', textTransform: 'none', letterSpacing: 0.3,
                        background: `linear-gradient(135deg, ${brandColor}, ${brandHover})`,
                        boxShadow: `0 12px 26px -6px ${brandColor}70`,
                        "&:hover": { background: `linear-gradient(135deg, ${brandDark}, ${brandColor})`, boxShadow: `0 14px 30px -6px ${brandColor}90`, transform: 'translateY(-1px)' },
                        "&:disabled": { background: 'var(--nw-line)', color: 'var(--nw-text-faint)', boxShadow: 'none' },
                        transition: 'all 0.25s ease'
                    }}
                >
                    {loading
                        ? <CircularProgress size={24} color="inherit" />
                        : (formData.paymentMethod === 'kapida' ? "Siparişi Onayla" : "Güvenli Ödemeye Geç")}
                </Button>

                {formData.paymentMethod === 'card' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6, mt: 1.75 }}>
                        <img src={`${process.env.PUBLIC_URL}/payment/iyzico.svg`} alt="iyzico" style={{ height: '14px', opacity: 0.55 }} />
                        <Typography sx={{ color: 'var(--nw-text-faint)', fontSize: '0.72rem' }}>ile güvenli ödeme</Typography>
                    </Box>
                ) : (
                    <Typography sx={{ color: 'var(--nw-text-faint)', fontSize: '0.72rem', textAlign: 'center', mt: 1.75 }}>
                        Ödemeyi teslimat sırasında yapacaksınız.
                    </Typography>
                )}
            </Box>
        </Dialog>
    );
}