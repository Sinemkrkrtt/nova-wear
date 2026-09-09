import React, { useState, useEffect } from 'react';
import { 
    Box, Container, Typography, Paper, TextField, Button, 
    Divider, Stepper, Step, StepLabel, CircularProgress, Alert, Chip, IconButton, InputAdornment 
} from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LocalShippingOutlined, SearchOutlined, ContentCopy, CheckCircle, EmailOutlined } from '@mui/icons-material';
import { appCheckHeaders, FUNCTIONS_BASE_URL } from '../../src/config/firebase';
import BRAND from '../config/brand';

function KargoTakip() {
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderData, setOrderData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Nova Wear tasarım değişkenleri
    const brandFont = 'var(--nw-font-display)';
    const brandColor = "var(--nw-accent)";   
    const brandDark = "var(--nw-accent-hover)";    
    const bgLight = "var(--nw-surface)";
    const borderColor = "var(--nw-line)";
    const textMain = "var(--nw-text)";
    const textMuted = "var(--nw-text-dim)";
    const fontStyle = { fontFamily: 'inherit' };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!orderNumber.trim() || !email.trim()) {
            setError("Lütfen sipariş numaranızı ve e-posta adresinizi giriniz.");
            return;
        }

        setLoading(true);
        setError('');
        setOrderData(null);

        try {
            const acHeaders = await appCheckHeaders();
            const response = await fetch(`${FUNCTIONS_BASE_URL}/trackOrder`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...acHeaders },
                body: JSON.stringify({ data: { orderNumber: orderNumber.trim(), email: email.trim() } })
            });

            const result = await response.json();
            const payload = result.data || {};

            if (payload.found) {
                setOrderData(payload);
            } else {
                setError(payload.message || "Sipariş bulunamadı. Lütfen bilgileri kontrol edin.");
            }
        } catch (err) {
            console.error("Sorgulama hatası:", err);
            setError("Sistemde bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStepIndex = (status) => {
        switch (status) {
            case 'Yeni': return 0;
            case 'Hazırlanıyor': return 1;
            case 'Kargoya Verildi': return 2;
            case 'Tamamlandı': return 3;
            case 'İptal Edildi': return -1;
            default: return 0;
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Yeni': return { bg: 'var(--nw-warning-soft)', text: 'var(--nw-warning)', border: "var(--nw-line)" }; 
            case 'Hazırlanıyor': return { bg: 'var(--nw-accent-soft)', text: 'var(--nw-accent)', border: "var(--nw-line)" }; 
            case 'Kargoya Verildi': return { bg: 'var(--nw-accent-soft)', text: 'var(--nw-accent)', border: 'var(--nw-line-strong)' }; 
            case 'Tamamlandı': return { bg: 'var(--nw-success-soft)', text: 'var(--nw-success)', border: 'var(--nw-success-soft)' }; 
            case 'İptal Edildi': return { bg: 'var(--nw-danger-soft)', text: 'var(--nw-danger)', border: 'var(--nw-danger-soft)' }; 
            default: return { bg: 'var(--nw-bg-elev)', text: 'var(--nw-text-dim)', border: 'var(--nw-line)' }; 
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

    const steps = ['SİPARİŞ ALINDI', 'HAZIRLANIYOR', 'KARGOYA VERİLDİ', 'TESLİM EDİLDİ'];
    const activeStep = orderData ? getStepIndex(orderData.status) : 0;
    const currentStatusStyle = orderData ? getStatusStyle(orderData.status) : {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: bgLight, ...fontStyle }}>
            <Navbar />

            <Box sx={{ flexGrow: 1, py: { xs: 6, md: 10 } }}>
                <Container maxWidth="md">
                    
                    {/* BAŞLIK */}
                    <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
                        <Typography variant="h2" sx={{ color: brandColor, fontFamily: brandFont, fontWeight: 700, fontSize: { xs: "2.2rem", md: "3rem" }, mb: 2 }}>
                            Kargo Takip
                        </Typography>
                        <Typography sx={{ color: textMuted, letterSpacing: '2px', textTransform: "uppercase", fontSize: "0.85rem", fontWeight: 500 }}>
                            Siparişinizin durumunu anlık olarak öğrenin
                        </Typography>
                    </Box>

                    {/* SORGULAMA FORMU */}
                    <Paper elevation={0} component="form" onSubmit={handleSearch} sx={{ 
                        p: { xs: 3, md: 5 }, mb: 6, borderRadius: '16px', 
                        border: `1px solid ${borderColor}`, bgcolor: "var(--nw-surface)",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.03)"
                    }}>
                        
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: 'stretch' }}>
                            <TextField 
                                fullWidth
                                label="Sipariş Numarası" 
                                variant="outlined" 
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                sx={inputStyles}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ color: 'var(--nw-text-faint)' }}/></InputAdornment>
                                }}
                            />
                            <TextField 
                                fullWidth
                                label="E-Posta Adresi" 
                                type="email"
                                variant="outlined" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={inputStyles}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: 'var(--nw-text-faint)' }}/></InputAdornment>
                                }}
                            />
                            <Button 
                                type="submit"
                                variant="contained" 
                                disabled={loading}
                                sx={{ 
                                    minWidth: { sm: "140px" }, bgcolor: brandColor, color: "var(--nw-on-accent)", 
                                    borderRadius: '8px', fontSize: "1rem", fontWeight: 700, py: { xs: 1.5, sm: 0 },
                                    boxShadow: `0 8px 20px ${brandColor}40`,
                                    "&:hover": { bgcolor: brandDark, boxShadow: `0 8px 25px ${brandColor}60` }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Sorgula"}
                            </Button>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mt: 3, borderRadius: '8px' }}>
                                {error}
                            </Alert>
                        )}
                    </Paper>

                    {/* SİPARİŞ SONUÇ ALANI */}
                    {orderData && (
                        <Paper elevation={0} sx={{
                            p: { xs: 2.5, sm: 4, md: 6 }, borderRadius: '16px',
                            border: `1px solid ${borderColor}`, bgcolor: "var(--nw-surface)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.03)"
                        }}>
                            
                            {/* ÜST BİLGİ */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 5, flexWrap: "wrap", gap: 2 }}>
                                <div>
                                    <Typography sx={{ color: textMuted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, fontSize: "0.75rem", mb: 0.5 }}>
                                        SİPARİŞ NUMARASI
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: textMain, fontWeight: 800 }}>
                                        {orderData.orderNumber}
                                    </Typography>
                                </div>
                                
                                <Chip 
                                    label={orderData.status.toUpperCase()} 
                                    sx={{ 
                                        bgcolor: currentStatusStyle.bg, 
                                        color: currentStatusStyle.text, 
                                        fontWeight: 700, 
                                        borderRadius: '8px', 
                                        border: `1px solid ${currentStatusStyle.border}`,
                                        letterSpacing: '0.5px',
                                        px: 1
                                    }} 
                                />
                            </Box>

                            {/* DURUM ÇUBUĞU (Stepper) */}
                            {orderData.status !== 'İptal Edildi' && (
                                <Box sx={{ width: '100%', mb: 6 }}>
                                    <Stepper activeStep={activeStep} alternativeLabel sx={{
                                        '& .MuiStepIcon-root.Mui-active': { color: brandColor },
                                        '& .MuiStepIcon-root.Mui-completed': { color: "var(--nw-success)" },
                                        '& .MuiStepLabel-label': { fontWeight: 600, mt: 1, fontSize: { xs: '0.62rem', sm: '0.8rem' } }
                                    }}>
                                        {steps.map((label) => (
                                            <Step key={label}>
                                                <StepLabel>{label}</StepLabel>
                                            </Step>
                                        ))}
                                    </Stepper>
                                </Box>
                            )}

                            <Divider sx={{ my: 4, borderColor: borderColor }} />

                            {/* STRATEJİK İPTAL YÖNLENDİRMESİ (Sadece Yeni ve Hazırlanıyor aşamasında görünür) */}
                            {(orderData.status === 'Yeni' || orderData.status === 'Hazırlanıyor') && (
                                <Box sx={{ mt: 2, p: 3, bgcolor: 'var(--nw-bg-elev)', borderRadius: '12px', border: `1px dashed ${brandColor}60`, textAlign: 'center' }}>
                                    <Typography variant="body1" sx={{ color: 'var(--nw-text-dim)', mb: 1.5, fontWeight: 500 }}>
                                        Siparişinizi iptal etmek veya değiştirmek mi istiyorsunuz?
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: textMuted, lineHeight: 1.6 }}>
                                        Ürünleriniz kargoya teslim edilmeden önce sipariş numaranızla birlikte <br/>
                                        <a href={`mailto:${BRAND.email}?subject=Sipariş İptal/Değişim Talebi - ${orderData.orderNumber}`} style={{ color: brandColor, fontWeight: 700, textDecoration: 'none' }}>
                                            {BRAND.email}
                                        </a> adresine mail atabilirsiniz.
                                    </Typography>
                                </Box>
                            )}

                            {/* KARGO DETAYLARI (Sadece kargoya verildiğinde görünür) */}
                            {(orderData.status === 'Kargoya Verildi' || orderData.status === 'Tamamlandı') && (
                                <Box sx={{ bgcolor: "var(--nw-bg-elev)", p: { xs: 2.5, sm: 4 }, borderRadius: '12px', border: `1px solid ${brandColor}30` }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <LocalShippingOutlined sx={{ color: brandColor }} />
                                        <Typography sx={{ color: brandColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: '0.9rem' }}>
                                            Kargo Bilgileri
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 3, sm: 6 } }}>
                                        <div>
                                            <Typography sx={{ color: textMuted, fontSize: '0.8rem', textTransform: 'uppercase', mb: 0.5, fontWeight: 600 }}>Kargo Firması</Typography>
                                            <Typography sx={{ color: textMain, fontWeight: 700, fontSize: '1.1rem' }}>{orderData.cargoCompany || 'Belirtilmedi'}</Typography>
                                        </div>
                                        <div>
                                            <Typography sx={{ color: textMuted, fontSize: '0.8rem', textTransform: 'uppercase', mb: 0.5, fontWeight: 600 }}>Takip Numarası</Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography sx={{ color: textMain, fontWeight: 700, fontSize: '1.1rem' }}>
                                                    {orderData.trackingNumber || 'Belirtilmedi'}
                                                </Typography>
                                                {orderData.trackingNumber && (
                                                    <IconButton size="small" onClick={() => handleCopy(orderData.trackingNumber)} sx={{ color: copied ? 'var(--nw-success)' : brandColor }}>
                                                        {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </div>
                                    </Box>
                                </Box>
                            )}

                        </Paper>
                    )}

                </Container>
            </Box>

            <Footer />
        </div>
    );
}

export default KargoTakip;