import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BRAND from '../config/brand';

// --- EKLENEN KISIM: Döngü animasyonu (spin) için güvenli CSS kuralı ---
if (typeof document !== 'undefined') {
    let styleEl = document.getElementById('payment-spin-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'payment-spin-style';
        styleEl.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @media (max-width: 480px) {
            .nw-pay-card { padding: 34px 20px !important; border-radius: 20px !important; }
            .nw-pay-title { font-size: 23px !important; }
            .nw-pay-desc { font-size: 15px !important; padding: 0 !important; }
        }`;
        document.head.appendChild(styleEl);
    }
}
// ---------------------------------------------------------------------

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [orderNo, setOrderNo] = useState('');
    const [method, setMethod] = useState('');

    useEffect(() => {
        const statusParam = searchParams.get('status');
        const orderParam = searchParams.get('order');
        const methodParam = searchParams.get('method');

        if (methodParam) setMethod(methodParam);

        if (statusParam === 'success') {
            setStatus('success');
            if (orderParam) setOrderNo(orderParam);
            
            // --- SEPETİ TEMİZLEME İŞLEMİ ---
            // Sepeti tamamen silmek bazı bileşenlerde beklenmeyen yan etkilere
            // neden oluyorsa yerine boş bir dizi atamak daha güvenlidir.
            localStorage.setItem('myCart', JSON.stringify([])); // Sepeti boşalt
            window.dispatchEvent(new Event('cartUpdated')); // Navbar'daki sepet sayısını anında 0'a çek
            
        } else {
            setStatus('fail');
        }
    }, [searchParams]);

    return (
        <div style={styles.container}>
            {/* Arka plan dekoratif çemberleri */}
            <div style={styles.blob1}></div>
            <div style={styles.blob2}></div>

            <div className="nw-pay-card" style={styles.glassCard}>
                {status === 'loading' && (
                    // --- GÜNCELLENEN KISIM: Şık Yükleme Ekranı ---
                    <div style={styles.content}>
                        <div style={styles.pulseContainer}>
                            <div style={styles.loader}></div>
                        </div>
                        <h2 style={styles.loadingText}>Ödemeniz İşleniyor...</h2>
                        <p style={{color: 'var(--nw-text-faint)', fontSize: '14px', margin: 0}}>Lütfen bu sayfayı kapatmayın.</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div style={styles.content}>
                        <div style={styles.successIcon}>✓</div>
                        <h1 className="nw-pay-title" style={styles.title}>{method === 'kapida' ? 'Siparişiniz Alındı!' : 'Ödemeniz Başarılı!'}</h1>
                        <p className="nw-pay-desc" style={styles.description}>
                            {method === 'kapida'
                                ? "Siparişiniz başarıyla oluşturuldu. Ödemeyi teslimat sırasında kuryeye yapacaksınız. Sipariş onayı e-posta adresinize gönderilecektir."
                                : `Siparişiniz başarıyla alındı. ${BRAND.name}'i tercih ettiğiniz için teşekkür ederiz. Sipariş onayı e-posta adresinize gönderilecektir.`}
                        </p>

                        {orderNo && (
                            <div style={styles.orderBox}>
                                <span style={styles.orderLabel}>SİPARİŞ NUMARANIZ</span>
                                <span style={styles.orderValue}>{orderNo}</span>
                                <span style={styles.orderHint}>Bu numarayı ve e-posta adresinizi kullanarak siparişinizi <b>Kargo Takip</b> sayfasından izleyebilirsiniz. Lütfen saklayın.</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => navigate('/kargo-takip')}
                                style={{ ...styles.secondaryButton, marginTop: 0, flex: '1 1 160px' }}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.03)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Siparişi Takip Et
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                style={{ ...styles.primaryButton, marginTop: 0, flex: '1 1 160px', width: 'auto' }}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Alışverişe Devam Et
                            </button>
                        </div>
                    </div>
                )}

                {status === 'fail' && (
                    <div style={styles.content}>
                        <div style={styles.failIcon}>✕</div>
                        <h1 className="nw-pay-title" style={styles.title}>Ödeme Başarısız</h1>
                        <p className="nw-pay-desc" style={styles.description}>
                            İşleminiz sırasında bir sorun oluştu. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.
                        </p>
                        <button 
                            onClick={() => navigate('/sepet')} 
                            style={styles.secondaryButton}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            Sepete Geri Dön
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: '24px 16px',
        backgroundColor: 'var(--nw-bg-elev)', // Çok açık lila/gri arka plan
        overflow: 'hidden',
        fontFamily: "var(--nw-font-body)",
    },
    blob1: {
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '400px',
        height: '400px',
        backgroundColor: 'var(--nw-accent)', // Koyu mor
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.3,
        zIndex: 0,
    },
    blob2: {
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        backgroundColor: 'var(--nw-accent)', // Açık mor
        borderRadius: '50%',
        filter: 'blur(80px)',
        opacity: 0.4,
        zIndex: 0,
    },
    glassCard: {
        position: 'relative',
        zIndex: 1,
        width: '90%',
        maxWidth: '500px',
        background: 'rgba(32, 32, 39, 0.72)', // Cam efekti (koyu yüzey)
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        border: '1px solid var(--nw-line)',
        boxShadow: '0 8px 32px rgba(155, 112, 255, 0.15)', // Mor gölge
        padding: '50px 30px',
        textAlign: 'center',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
    },
    successIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'var(--nw-success-soft)',
        color: 'var(--nw-success)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '40px',
        fontWeight: 'bold',
        marginBottom: '10px',
        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.2)',
    },
    failIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'var(--nw-danger-soft)',
        color: 'var(--nw-danger)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '40px',
        fontWeight: 'bold',
        marginBottom: '10px',
        boxShadow: '0 4px 15px rgba(244, 67, 54, 0.2)',
    },
    title: {
        margin: 0,
        color: 'var(--nw-text)', // En koyu mor
        fontSize: '28px',
        fontWeight: '700',
        letterSpacing: '-0.5px',
    },
    description: {
        margin: 0,
        color: 'var(--nw-text-dim)',
        fontSize: '16px',
        lineHeight: '1.6',
        padding: '0 10px',
    },
    orderBox: {
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(155, 112, 255, 0.06)',
        border: '1px solid rgba(155, 112, 255, 0.2)',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        textAlign: 'center',
    },
    orderLabel: {
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1.5px',
        color: 'var(--nw-accent)',
    },
    orderValue: {
        fontSize: '22px',
        fontWeight: '800',
        color: 'var(--nw-text)',
        letterSpacing: '0.5px',
    },
    orderHint: {
        fontSize: '12px',
        color: 'var(--nw-text-dim)',
        lineHeight: '1.5',
        marginTop: '4px',
    },
    primaryButton: {
        marginTop: '15px',
        padding: '16px 32px',
        backgroundColor: 'var(--nw-accent)',
        color: 'var(--nw-on-accent)',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 4px 15px rgba(74, 20, 140, 0.3)',
        width: '100%',
    },
    secondaryButton: {
        marginTop: '15px',
        padding: '16px 32px',
        backgroundColor: 'transparent',
        color: 'var(--nw-accent)',
        border: '2px solid var(--nw-accent)',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        width: '100%',
    },
    // --- GÜNCELLENEN KISIM: Loading stilleri ---
    loader: {
        width: '60px',
        height: '60px',
        border: '4px solid #f3e5f5',
        borderTop: '4px solid var(--nw-accent)', // Mor yükleme çemberi
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '10px',
    },
    loadingText: {
        color: 'var(--nw-text)',
        fontSize: '22px',
        fontWeight: '600',
        margin: '0',
    },
    pulseContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
    },
};

export default PaymentResult;