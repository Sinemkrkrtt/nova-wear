import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
    const navigate = useNavigate();
    const brandFont = 'var(--nw-font-display)';
    const brandColor = "var(--nw-accent)";
    const brandHover = "var(--nw-accent-hover)";

    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--nw-surface)' }}>
            <Navbar />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 8, md: 14 }, px: { xs: 2.5, sm: 3 } }}>
                <Stack alignItems="center" spacing={2.5} sx={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
                    <Typography sx={{ fontFamily: brandFont, fontWeight: 700, fontStyle: 'italic', color: brandColor, fontSize: { xs: '5rem', md: '7rem' }, lineHeight: 1 }}>
                        404
                    </Typography>
                    <Typography sx={{ fontFamily: brandFont, color: 'var(--nw-text)', fontWeight: 600, fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
                        Aradığınız sayfa bulunamadı
                    </Typography>
                    <Typography sx={{ color: 'var(--nw-text-dim)', fontSize: '1rem', lineHeight: 1.7 }}>
                        Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Dilerseniz ana sayfaya dönerek yeni sezon koleksiyonumuza göz atabilirsiniz.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1, width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/')}
                            sx={{
                                bgcolor: brandColor, color: 'var(--nw-on-accent)', textTransform: 'none', borderRadius: '8px',
                                px: 4, py: 1.4, fontSize: '1rem', fontWeight: 600,
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { bgcolor: brandHover }
                            }}
                        >
                            Ana Sayfaya Dön
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/kargo-takip')}
                            sx={{
                                borderColor: brandColor, color: brandColor, textTransform: 'none', borderRadius: '8px',
                                px: 4, py: 1.4, fontSize: '1rem', fontWeight: 600,
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': { bgcolor: brandColor, color: 'var(--nw-on-accent)', borderColor: brandColor }
                            }}
                        >
                            Kargo Takip
                        </Button>
                    </Stack>
                </Stack>
            </Box>
            <Footer />
        </div>
    );
}
