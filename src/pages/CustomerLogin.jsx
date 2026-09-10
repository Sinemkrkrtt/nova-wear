import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Typography, TextField, Button, Grid, Paper, 
    IconButton, InputAdornment, Alert, Fade, Divider 
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';

// Firebase Importları
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebase';
import Logo from '../components/Logo';
import BRAND from '../config/brand';
import heroLogo from '../assets/hero-logo.png';

// --- GÜVENLİK: Giriş deneme sınırı / kilitleme ---
const MAX_ATTEMPTS = 6;                 // İzin verilen ardışık hatalı giriş
const LOCK_MINUTES = 10;                // Kilit süresi (dakika)
const STORAGE_KEY = 'nw_customer_login_guard';

const readGuard = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { fails: 0, lockUntil: 0 }; }
    catch { return { fails: 0, lockUntil: 0 }; }
};
const writeGuard = (v) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch (e) { /* yoksay */ }
};

export default function CustomerLogin() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [infoMsg, setInfoMsg] = useState(''); // Şifre sıfırlama vb. bilgilendirme
    const [fade, setFade] = useState(true);
    const navigate = useNavigate();

    // Giriş deneme sınırı / kilitleme durumu
    const [lockUntil, setLockUntil] = useState(() => readGuard().lockUntil || 0);
    const [now, setNow] = useState(Date.now());
    const isLocked = lockUntil > now;
    const remainingSec = Math.max(0, Math.ceil((lockUntil - now) / 1000));
    const remainingText = `${String(Math.floor(remainingSec / 60)).padStart(2, '0')}:${String(remainingSec % 60).padStart(2, '0')}`;

    // Form State'leri
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Zarif ve Naif Serif Font
    const brandFont = 'var(--nw-font-display)';
    const brandColor = "var(--nw-accent)";   
    const brandDark = "var(--nw-accent-hover)";
    const textMain = "var(--nw-text)";
    const textMuted = "var(--nw-text-dim)";

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Kilit süresi dolana kadar sayacı güncelle
    useEffect(() => {
        if (!lockUntil) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [lockUntil]);

    // Hatalı giriş denemesini kaydet; gerekirse kilitle
    const registerFailure = () => {
        const guard = readGuard();
        const fails = (guard.fails || 0) + 1;
        if (fails >= MAX_ATTEMPTS) {
            const until = Date.now() + LOCK_MINUTES * 60 * 1000;
            writeGuard({ fails, lockUntil: until });
            setLockUntil(until);
            setNow(Date.now());
            return { locked: true, remaining: 0 };
        }
        writeGuard({ fails, lockUntil: 0 });
        return { locked: false, remaining: MAX_ATTEMPTS - fails };
    };

    // "Şifremi Unuttum" — e-posta kayıtlıysa sıfırlama bağlantısı gönderir.
    // Gizlilik için e-postanın kayıtlı olup olmadığını AÇIK ETMEZ (aynı mesaj).
    const handleForgotPassword = async () => {
        setError('');
        setInfoMsg('');
        if (!email || !email.includes('@')) {
            setError('Lütfen önce geçerli bir e-posta adresi girin.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            // Kayıtlı değilse bile aynı mesajı göster (e-posta taramasını engelle)
            if (err.code === 'auth/invalid-email') {
                setError('Girdiğiniz e-posta adresi geçersiz.');
                return;
            }
            console.warn('Şifre sıfırlama:', err.code);
        }
        setInfoMsg('Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.');
    };

    // Form geçişlerinde yumuşak animasyon için
    const handleToggleAuth = () => {
        setFade(false);
        setTimeout(() => {
            setIsLogin(!isLogin);
            setError('');
            setInfoMsg('');
            setPassword('');
            setFade(true);
        }, 200);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMsg('');

        // Girişte kilit kontrolü (kayıt olma akışını etkilemez)
        if (isLogin) {
            const guard = readGuard();
            if (guard.lockUntil && guard.lockUntil > Date.now()) {
                setLockUntil(guard.lockUntil);
                setNow(Date.now());
                setError('Çok fazla hatalı deneme yapıldı. Lütfen süre dolana kadar bekleyin.');
                return;
            }
        }

        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                // Başarılı giriş — deneme sayacını sıfırla
                writeGuard({ fails: 0, lockUntil: 0 });
                setLockUntil(0);
                navigate('/');
            } else {
                if (!firstName || !lastName) {
                    throw new Error('Lütfen ad ve soyad alanlarını eksiksiz doldurun.');
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await setDoc(doc(db, 'customers', user.uid), {
                    uid: user.uid,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    role: 'customer',
                    createdAt: serverTimestamp()
                });

                navigate('/');
            }
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Bu e-posta adresi sistemimizde zaten kayıtlı.');
            } else if (err.code === 'auth/too-many-requests') {
                // Firebase'in kendi sunucu tarafı koruması — yerel kilitle birleştir
                const until = Date.now() + LOCK_MINUTES * 60 * 1000;
                writeGuard({ fails: MAX_ATTEMPTS, lockUntil: until });
                setLockUntil(until);
                setNow(Date.now());
                setError('Çok fazla hatalı deneme. Güvenlik nedeniyle giriş geçici olarak kilitlendi.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                // Sadece giriş denemelerini say
                if (isLogin) {
                    const r = registerFailure();
                    setError(r.locked
                        ? `Çok fazla başarısız deneme. Giriş ${LOCK_MINUTES} dakika kilitlendi.`
                        : `E-posta adresi veya şifre hatalı. Kalan deneme hakkınız: ${r.remaining}.`);
                } else {
                    setError('E-posta adresi veya şifre hatalı.');
                }
            } else if (err.code === 'auth/weak-password') {
                setError('Güvenliğiniz için şifreniz en az 6 karakter olmalıdır.');
            } else {
                setError(err.message || 'Beklenmeyen bir hata oluştu, lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Şık ve Keskin TextField Stili
    const textFieldStyle = {
        "& .MuiOutlinedInput-root": {
            borderRadius: "0px", // Keskin köşeler
            backgroundColor: "var(--nw-bg-elev)",
            transition: "all 0.3s ease",
            fontFamily: brandFont,
            "& fieldset": { borderColor: "var(--nw-line)" },
            "&:hover fieldset": { borderColor: "var(--nw-line)" },
            "&.Mui-focused fieldset": { borderColor: brandColor, borderWidth: "1.5px" },
            "&.Mui-focused": { backgroundColor: "var(--nw-surface)" }
        },
        "& .MuiInputLabel-root": { color: textMuted, fontSize: "0.85rem", fontFamily: brandFont, textTransform: 'uppercase', letterSpacing: '1px' },
        "& .MuiInputLabel-root.Mui-focused": { color: brandColor, fontWeight: 700 }
    };

    return (
        <Grid container sx={{ minHeight: '100vh', bgcolor: 'var(--nw-surface)', fontFamily: brandFont }}>
            
            {/* SOL TARAF: MARKA PANELİ (Mobilde Gizli)
                Zemin saf beyaz — logo görselinin kendi zemini de beyaz olduğu
                için ikisi birleşiyor, logo bir kutunun içinde durmuyor. */}
            <Grid size={{ xs: 12, md: 5, lg: 6 }} sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: { md: 6, lg: 8 },
                bgcolor: '#FFFFFF',
                borderRight: '1px solid var(--nw-line)',
            }}>
                <Box
                    component="img"
                    src={heroLogo}
                    alt={`${BRAND.name} — ${BRAND.slogan}`}
                    sx={{ width: '100%', maxWidth: 480, display: 'block' }}
                />

                <Typography sx={{
                    fontFamily: 'var(--nw-font-body)', color: 'var(--nw-text-dim)', fontSize: '0.95rem',
                    fontWeight: 300, lineHeight: 1.8, textAlign: 'center', maxWidth: 360,
                }}>
                    Yeni sezon elbiseleri ilk sen gör, siparişlerini tek yerden takip et.
                </Typography>
            </Grid>

            {/* SAĞ TARAF: FORM ALANI (Mobil Uyumlu) */}
            <Grid size={{ xs: 12, md: 7, lg: 6 }} component={Paper} elevation={0} square sx={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                
                {/* Geri Dön Butonu */}
                <Box sx={{ position: 'absolute', top: { xs: 16, sm: 30 }, left: { xs: 16, sm: 40 }, zIndex: 10 }}>
                    <IconButton onClick={() => navigate('/')} sx={{ bgcolor: 'var(--nw-surface)', color: textMain, borderRadius: '50%', "&:hover": { bgcolor: brandColor, color: 'var(--nw-on-accent)' }, transition: '0.3s' }}>
                        <ArrowBack />
                    </IconButton>
                </Box>

                <Box sx={{ my: 'auto', mx: { xs: 2.5, sm: 8, md: 8, lg: 16 }, py: { xs: 9, md: 8 }, width: 'auto', maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* MARKA LOGOSU — mobilde sol panel gizlendiği için burada da duruyor */}
                    <Box sx={{ mb: { xs: 4, md: 6 }, display: 'flex', justifyContent: 'center' }}>
                        <Logo size="footer" layout="stack" />
                    </Box>

                    <Fade in={fade} timeout={400}>
                        <Box>
                            <Typography component="h1" variant="h4" sx={{ fontFamily: brandFont, fontWeight: 700, color: textMain, mb: 1, textAlign: 'center', textTransform: 'uppercase', fontSize: { xs: '1.5rem', md: '2rem' }, letterSpacing: '1px' }}>
                                {isLogin ? 'HOŞ GELDİNİZ' : 'ARAMIZA KATILIN'}
                            </Typography>
                            <Typography variant="body1" sx={{ color: textMuted, mb: 4, textAlign: 'center', fontSize: '1rem', fontFamily: brandFont, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {isLogin ? 'Hesabınıza giriş yaparak alışverişe devam edin.' : 'Lüks alışveriş deneyimi için hemen hesabınızı oluşturun.'}
                            </Typography>

                            {error && <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 0, fontFamily: brandFont, '& .MuiAlert-message': { fontSize: '0.95rem', fontWeight: 600 } }}>{error}</Alert>}
                            {infoMsg && <Alert severity="success" sx={{ width: '100%', mb: 3, borderRadius: 0, fontFamily: brandFont, '& .MuiAlert-message': { fontSize: '0.9rem', fontWeight: 600 } }}>{infoMsg}</Alert>}

                            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                                
                                {/* KAYIT İÇİN İSİM/SOYİSİM */}
                                {!isLogin && (
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                margin="normal" required fullWidth label="Adınız"
                                                value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                                sx={textFieldStyle}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField
                                                margin="normal" required fullWidth label="Soyadınız"
                                                value={lastName} onChange={(e) => setLastName(e.target.value)}
                                                sx={textFieldStyle}
                                            />
                                        </Grid>
                                    </Grid>
                                )}

                                <TextField
                                    margin="normal" required fullWidth label="E-Posta Adresi" type="email"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLocked && isLogin}
                                    sx={textFieldStyle}
                                />

                                <TextField
                                    margin="normal" required fullWidth label="Şifre"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLocked && isLogin}
                                    sx={textFieldStyle}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: textMuted }}>
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {isLogin && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Typography
                                            variant="body2"
                                            onClick={handleForgotPassword}
                                            sx={{ color: textMuted, cursor: 'pointer', fontWeight: 600, fontFamily: brandFont, fontSize: '0.9rem', textTransform: 'uppercase', "&:hover": { color: brandColor, textDecoration: 'underline' } }}
                                        >
                                            Şifremi Unuttum
                                        </Typography>
                                    </Box>
                                )}

                                <Button
                                    type="submit" fullWidth variant="contained" disabled={loading || (isLocked && isLogin)}
                                    sx={{
                                        mt: 5, mb: 4, py: 1.8, bgcolor: brandColor, color: 'var(--nw-on-accent)', fontSize: '1rem',
                                        fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', borderRadius: 0, fontFamily: brandFont,
                                        "&:hover": { bgcolor: brandDark },
                                        "&.Mui-disabled": { bgcolor: 'var(--nw-text-faint)', color: '#fff' },
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    {(isLocked && isLogin)
                                        ? `GİRİŞ KİLİTLİ — ${remainingText}`
                                        : (loading ? 'İŞLEM YAPILIYOR...' : (isLogin ? 'GİRİŞ YAP' : 'KAYIT OL'))}
                                </Button>

                                <Divider sx={{ mb: 4, '&::before, &::after': { borderColor: 'var(--nw-line)' } }}>
                                    <Typography variant="caption" sx={{ color: textMuted, px: 2, letterSpacing: 2, fontFamily: brandFont }}>VEYA</Typography>
                                </Divider>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body1" sx={{ color: textMuted, fontSize: '0.95rem', fontFamily: brandFont, textTransform: 'uppercase' }}>
                                        {isLogin ? "HENÜZ HESABINIZ YOK MU? " : "ZATEN BİR HESABINIZ VAR MI? "}
                                        <span 
                                            onClick={handleToggleAuth} 
                                            style={{ color: brandColor, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' }}
                                        >
                                            {isLogin ? 'HEMEN KAYIT OLUN' : 'GİRİŞ YAPIN'}
                                        </span>
                                    </Typography>
                                </Box>

                            </Box>
                        </Box>
                    </Fade>
                </Box>
            </Grid>
        </Grid>
    );
}