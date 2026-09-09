import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Container, Typography, Button, CircularProgress, Chip, Divider, Breadcrumbs } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../src/config/firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const brandFont = 'var(--nw-font-display)';
const brandColor = "var(--nw-accent)";

const getStatusStyle = (status) => {
    switch (status) {
        case 'Yeni': return { bg: 'var(--nw-warning-soft)', text: 'var(--nw-warning)' };
        case 'Hazırlanıyor': return { bg: 'var(--nw-accent-soft)', text: 'var(--nw-accent)' };
        case 'Kargoya Verildi': return { bg: 'var(--nw-accent-soft)', text: 'var(--nw-accent)' };
        case 'Tamamlandı': return { bg: 'var(--nw-success-soft)', text: 'var(--nw-success)' };
        case 'İptal Edildi': return { bg: 'var(--nw-danger-soft)', text: 'var(--nw-danger)' };
        default: return { bg: 'var(--nw-bg-elev)', text: 'var(--nw-text-dim)' };
    }
};

export default function MyOrders() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!authReady) return;
        if (!user) { setLoading(false); return; }

        const fetchOrders = async () => {
            setLoading(true);
            try {
                // Tek eşitlik filtresi → composite index gerekmez; sıralamayı istemcide yaparız.
                const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
                const snap = await getDocs(q);
                const list = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(o => o.status !== 'Ödeme Bekliyor')
                    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                setOrders(list);
            } catch (e) {
                console.error('Siparişler çekilemedi:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [authReady, user]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--nw-bg-elev)', fontFamily: brandFont }}>
            <Navbar />
            <Box sx={{ flexGrow: 1, py: { xs: 4, md: 6 } }}>
                <Container maxWidth="md">
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" sx={{ color: 'var(--nw-text-faint)' }} />} sx={{ mb: 3, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--nw-text-faint)', textDecoration: 'none' }}>
                            <HomeIcon sx={{ mr: 0.5, fontSize: '1.1rem' }} /> ANA SAYFA
                        </Link>
                        <Typography sx={{ color: 'var(--nw-text)', fontWeight: 700, fontSize: '0.75rem', fontFamily: brandFont }}>SİPARİŞLERİM</Typography>
                    </Breadcrumbs>

                    <Typography variant="h3" sx={{ fontFamily: brandFont, color: brandColor, fontWeight: 700, fontStyle: 'italic', mb: 4, fontSize: { xs: '2rem', md: '2.6rem' } }}>
                        Siparişlerim
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: brandColor }} /></Box>
                    ) : !user ? (
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'var(--nw-surface)', borderRadius: '16px', border: '1px solid var(--nw-line)' }}>
                            <Typography sx={{ color: 'var(--nw-text-dim)', fontSize: '1.1rem', mb: 3, fontFamily: brandFont }}>
                                Siparişlerinizi görmek için giriş yapmalısınız.
                            </Typography>
                            <Button variant="contained" onClick={() => navigate('/login')} sx={{ bgcolor: brandColor, color: 'var(--nw-on-accent)', textTransform: 'none', borderRadius: '8px', px: 4, py: 1.3, fontWeight: 600, '&:hover': { bgcolor: 'var(--nw-accent-hover)' } }}>
                                Giriş Yap
                            </Button>
                        </Box>
                    ) : orders.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'var(--nw-surface)', borderRadius: '16px', border: '1px solid var(--nw-line)' }}>
                            <Typography sx={{ color: 'var(--nw-text-dim)', fontSize: '1.1rem', mb: 3, fontFamily: brandFont }}>
                                Henüz bir siparişiniz bulunmuyor.
                            </Typography>
                            <Button variant="outlined" onClick={() => navigate('/')} sx={{ borderColor: brandColor, color: brandColor, textTransform: 'none', borderRadius: '8px', px: 4, py: 1.3, fontWeight: 600, '&:hover': { bgcolor: brandColor, color: 'var(--nw-on-accent)' } }}>
                                Alışverişe Başla
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            {orders.map((order) => {
                                const badge = getStatusStyle(order.status);
                                const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('tr-TR') : '';
                                return (
                                    <Box key={order.id} sx={{ bgcolor: 'var(--nw-surface)', borderRadius: '16px', border: '1px solid var(--nw-line)', p: { xs: 2.5, md: 3 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '11px', color: 'var(--nw-text-faint)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Sipariş No</Typography>
                                                <Typography sx={{ fontWeight: 700, color: brandColor, fontSize: '1.05rem' }}>{order.orderNumber}</Typography>
                                                {date && <Typography sx={{ fontSize: '0.8rem', color: 'var(--nw-text-faint)' }}>{date}</Typography>}
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'flex-end' }}>
                                                <Chip label={(order.status || 'Yeni').toUpperCase()} sx={{ bgcolor: badge.bg, color: badge.text, fontWeight: 700, fontSize: '0.72rem', borderRadius: '6px' }} />
                                                {order.paymentMethod === 'kapida' && (
                                                    <Chip label="KAPIDA ÖDEME" sx={{ bgcolor: 'var(--nw-warning-soft)', color: 'var(--nw-warning)', fontWeight: 700, fontSize: '0.66rem', borderRadius: '6px' }} />
                                                )}
                                            </Box>
                                        </Box>

                                        <Divider sx={{ mb: 2, borderColor: "var(--nw-line)" }} />

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 2 }}>
                                            {(order.items || []).map((it, i) => (
                                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, fontSize: '0.9rem', color: 'var(--nw-text-dim)' }}>
                                                    <span style={{ minWidth: 0, wordBreak: 'break-word' }}><b>{it.quantity || 1}x</b> {it.name}{it.variant ? ` (${it.variant})` : ''}</span>
                                                    <span style={{ whiteSpace: 'nowrap' }}>{((Number(it.price) || 0) * (it.quantity || 1)).toFixed(2)} ₺</span>
                                                </Box>
                                            ))}
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                            <Typography sx={{ fontWeight: 800, color: 'var(--nw-text)', fontSize: '1.15rem', fontFamily: brandFont }}>
                                                Toplam: {Number(order.totalAmount || 0).toFixed(2)} ₺
                                            </Typography>
                                            {(order.status === 'Kargoya Verildi' || order.status === 'Tamamlandı') && order.trackingNumber ? (
                                                <Typography sx={{ fontSize: '0.85rem', color: 'var(--nw-text-dim)' }}>
                                                    {order.cargoCompany} • Takip: <b>{order.trackingNumber}</b>
                                                </Typography>
                                            ) : (
                                                <Button size="small" onClick={() => navigate('/kargo-takip')} sx={{ color: brandColor, textTransform: 'none', fontWeight: 600 }}>
                                                    Kargo Takip →
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Container>
            </Box>
            <Footer />
        </div>
    );
}
