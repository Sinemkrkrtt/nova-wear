import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebase';
import { useNavigate } from 'react-router-dom';

// Logo dosyasının yolu. Layout'taki ile aynıdır.
import Logo from '../components/Logo';

// --- GÜVENLİK AYARLARI ---
const MAX_ATTEMPTS = 5;                 // İzin verilen ardışık hatalı deneme
const LOCK_MINUTES = 15;                // Kilitlenme süresi (dakika)
const STORAGE_KEY = 'nw_admin_login_guard';

const readGuard = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { fails: 0, lockUntil: 0 }; }
  catch { return { fails: 0, lockUntil: 0 }; }
};
const writeGuard = (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch (e) { /* yoksay */ }
};

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Deneme sınırı / kilitleme durumu
  const [lockUntil, setLockUntil] = useState(() => readGuard().lockUntil || 0);
  const [now, setNow] = useState(Date.now());

  const navigate = useNavigate();

  const isLocked = lockUntil > now;
  const remainingSec = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const remainingText = `${String(Math.floor(remainingSec / 60)).padStart(2, '0')}:${String(remainingSec % 60).padStart(2, '0')}`;

  // Kilit süresi dolana kadar her saniye sayacı güncelle
  useEffect(() => {
    if (!lockUntil) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockUntil]);

  // Hatalı denemeyi kaydet; kilit gerekiyorsa uygula
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // 1) Kilitliyse hiçbir şekilde deneme yapma
    const guard = readGuard();
    if (guard.lockUntil && guard.lockUntil > Date.now()) {
      setLockUntil(guard.lockUntil);
      setNow(Date.now());
      setError('Çok fazla hatalı deneme yapıldı. Lütfen süre dolana kadar bekleyin.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 2) YETKİ DOĞRULAMASI: Yalnızca users/{uid}.role === 'admin' olanlar girebilir.
      //
      // Bu okuma başarısız OLABİLİR (ör. Firestore kuralları henüz yüklenmemişse
      // izin reddedilir). Bu durumu şifre hatasından ayırmak şart: aksi halde
      // doğru şifreyle giren yönetici "şifre hatalı" uyarısı alıp deneme hakkını
      // boşa harcıyordu.
      let role = null;
      let roleDocExists = false;
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        roleDocExists = snap.exists();
        role = roleDocExists ? snap.data().role : null;
      } catch (roleErr) {
        console.error('Yetki bilgisi okunamadı:', roleErr);
        await signOut(auth);
        setError(
          'Giriş yapıldı ancak yetki bilgisi okunamadı. Firestore güvenlik ' +
          'kuralları yüklenmemiş olabilir. (Terminal: firebase deploy --only firestore:rules)'
        );
        return; // Şifre yanlış değil — deneme hakkı düşürülmüyor.
      }

      if (role !== 'admin') {
        // Kimlik doğru ama yetki yok: oturumu anında kapat.
        // Bu bir parola denemesi değil, o yüzden kilit sayacı artırılmıyor;
        // yoksa yanlış hesapla giren biri kendini kilitliyordu.
        //
        // Mesaj bilerek teşhis edici: kurulum sırasında en sık yapılan üç hata
        // (doküman yok / yanlış kimlik / yanlış rol değeri) burada ayrışıyor.
        // Gösterilen kimlik, zaten giriş yapmış kullanıcının kendi kimliğidir.
        const uid = cred.user.uid;
        await signOut(auth);
        setError(
          !roleDocExists
            ? `Bu hesap için yetki kaydı bulunamadı. Firestore > users koleksiyonunda doküman kimliği "${uid}" olan bir kayıt oluşturup role alanını "admin" yapın.`
            : `Bu hesabın rolü "${String(role)}" görünüyor; yönetim paneli için "admin" olmalı. (Kimlik: ${uid})`
        );
        return;
      }

      // 3) Başarılı ve yetkili giriş — sayacı sıfırla
      writeGuard({ fails: 0, lockUntil: 0 });
      setLockUntil(0);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      // Firebase kendi sunucu tarafı brute-force korumasını da uygular
      if (err.code === 'auth/too-many-requests') {
        const until = Date.now() + LOCK_MINUTES * 60 * 1000;
        writeGuard({ fails: MAX_ATTEMPTS, lockUntil: until });
        setLockUntil(until);
        setNow(Date.now());
        setError('Çok fazla hatalı deneme. Güvenlik nedeniyle giriş geçici olarak kilitlendi.');
      } else {
        const r = registerFailure();
        setError(r.locked
          ? `Çok fazla başarısız deneme. Giriş ${LOCK_MINUTES} dakika kilitlendi.`
          : `E-posta veya şifre hatalı. Kalan deneme hakkınız: ${r.remaining}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* LOGO & BAŞLIK */}
        <div style={styles.header}>
          <Logo size="hero" layout="stack" className="nw-admin-logo" />
          <h2 style={styles.title}>Yönetici Paneli</h2>
          <p style={styles.subtitle}>Sisteme erişmek için bilgilerinizi girin.</p>
        </div>
        
        {/* HATA MESAJI */}
        {error && (
          <div style={styles.errorBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* GİRİŞ FORMU */}
        <form onSubmit={handleLogin} style={styles.form}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-posta Adresi</label>
            <div style={styles.inputWrapper}>
              <div style={styles.iconWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--nw-text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLocked || loading}
                style={{ ...styles.input, ...((isLocked || loading) ? styles.inputDisabled : {}) }}
                placeholder="admin@novawear.com"
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre</label>
            <div style={styles.inputWrapper}>
              <div style={styles.iconWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--nw-text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLocked || loading}
                style={{ ...styles.input, ...((isLocked || loading) ? styles.inputDisabled : {}) }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading || isLocked} style={{ ...styles.button, ...((loading || isLocked) ? styles.buttonDisabled : {}) }}>
            {isLocked ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Giriş Kilitli — {remainingText}
              </span>
            ) : loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Giriş Yapılıyor...
              </span>
            ) : (
              'Sisteme Giriş Yap'
            )}
          </button>
        </form>
        
        {/* CSS KEYFRAMES (Spin animasyonu için) */}
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

// --- PREMIUM STYLES ---
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--nw-bg-elev)',
    fontFamily: 'var(--nw-font-body)',
    padding: '16px',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: 'var(--nw-surface)',
    padding: 'clamp(24px, 5vw, 40px)',
    borderRadius: 'var(--nw-r-md)',
    boxShadow: 'var(--nw-shadow)',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid var(--nw-line)',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px'
  },
  title: { 
    fontSize: '22px', 
    fontWeight: '700', 
    color: 'var(--nw-text)', 
    margin: '0 0 8px 0' 
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--nw-text-dim)',
    margin: 0
  },
  errorBox: {
    wordBreak: 'break-word',
    lineHeight: 1.5, 
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--nw-danger-soft)', 
    color: 'var(--nw-danger)', 
    padding: '12px 16px', 
    borderRadius: 'var(--nw-r-sm)', 
    marginBottom: '24px', 
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid var(--nw-danger-soft)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: { 
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: { 
    color: 'var(--nw-text)', 
    fontSize: '13px', 
    fontWeight: '600' 
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  iconWrapper: {
    position: 'absolute',
    left: '14px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  input: { 
    width: '100%', 
    padding: '12px 16px 12px 42px', 
    border: '1px solid var(--nw-line)', 
    borderRadius: 'var(--nw-r-sm)', 
    fontSize: '14px', 
    boxSizing: 'border-box',
    outline: 'none',
    color: 'var(--nw-text)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  inputDisabled: {
    backgroundColor: 'var(--nw-bg-elev)',
    color: 'var(--nw-text-faint)',
    cursor: 'not-allowed'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--nw-accent)', // Kurumsal Mor
    color: 'var(--nw-on-accent)',
    border: 'none',
    borderRadius: 'var(--nw-r-sm)',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 8px 22px -8px var(--nw-accent)',
    transition: 'opacity 0.2s'
  },
  buttonDisabled: {
    backgroundColor: 'var(--nw-text-faint)',
    cursor: 'not-allowed',
    boxShadow: 'none'
  }
};

export default AdminLogin;