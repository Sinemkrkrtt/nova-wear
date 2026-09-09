import React, { useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BRAND from '../config/brand';

function PrivacyPolicy() {
    // Tasarımın geneliyle uyumlu renkler
    const brandColor = "var(--nw-accent)";   
    const bgLight = "var(--nw-bg-elev)";      
    const textMain = "var(--nw-text)";     
    const textMuted = "var(--nw-text-dim)";    

    // Genel fontu miras alacak stil
    const fontStyle = { fontFamily: 'inherit' };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: bgLight, ...fontStyle }}>
            <Navbar />

            <Box sx={{ flexGrow: 1, py: { xs: 6, md: 10 } }}>
                <Container maxWidth="md">
                    
                    {/* BAŞLIK */}
                    <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
                        <Typography variant="h2" sx={{
                            color: textMain,
                            fontWeight: 700,
                            fontSize: { xs: "1.7rem", sm: "2rem", md: "2.5rem" },
                            mb: 2,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            GİZLİLİK POLİTİKASI
                        </Typography>
                        <Typography variant="body1" sx={{ 
                            color: textMuted, 
                            letterSpacing: '3px', 
                            textTransform: "uppercase", 
                            fontSize: "0.8rem", 
                            fontWeight: 400 
                        }}>
                            KİŞİSEL VERİLERİN KORUNMASI
                        </Typography>
                    </Box>

                    {/* METİN KUTUSU */}
                    <Paper elevation={0} sx={{
                        p: { xs: 2.5, sm: 4, md: 7 },
                        borderRadius: 0, 
                        border: "1px solid var(--nw-line)", 
                        bgcolor: "var(--nw-surface)",
                        boxShadow: "none"
                    }}>
                        
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontWeight: 400, fontSize: "0.95rem" }}>
                            <strong>{BRAND.name}</strong> olarak, temel gizlilik ilkemiz müşterilerimizin ve kullanıcılarımızın verilerine izinsiz erişimin engellenmesidir. Bu nedenle sitemiz, gizlilik ve güvenlik seviyesini en üst düzeyde tutmak amacıyla çeşitli önlemler alır ve gerekli kısıtlamaları uygular.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* 1. Hangi Verileriniz Saklanır? */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            1. Hangi Verileriniz Saklanır?
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400, fontSize: "0.95rem" }}>
                            Sitemiz, kullanıcıların hizmetlerden en verimli şekilde yararlanması için gerekli bilgileri ulusal ve uluslararası standartlara uygun teknik özeni göstererek saklamaktadır. Sitedeki ziyaretiniz sırasında sizi benzersiz olarak tanımlamak amacıyla “Cookie (Çerez)” kullanılmaktadır. Sitemiz sadece kendi çerezlerine erişebilir ve güncelleyebilir.
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: brandColor, mt: 3, mb: 1 }}>Kayıtlı Kullanıcılar İçin:</Typography>
                        <Typography variant="body2" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontSize: "0.95rem" }}>
                            Kullanıcı Adı, Şifre, E-Posta Adresi, Adres Bilgisi, Banka Bilgileri (kullanıcı paylaştıysa), Tanımlayıcı Diğer Bilgiler, Temel Analitik Bilgileri (Google Analytics vb. servislerce istenen) ve IP adresi bilgisi.
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: brandColor, mt: 3, mb: 1 }}>Kayıtlı Olmayan (Misafir) Kullanıcılar İçin:</Typography>
                        <Typography variant="body2" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontSize: "0.95rem" }}>
                            Temel Analitik Bilgileri (Google Analytics vb.), site üzerinde yapılan işlemlerle ilgili istatistik bilgileri ve IP adresi bilgisi.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* 2. Hangi Verileriniz Saklanmaz? */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            2. Hangi Verileriniz SAKLANMAZ?
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400, fontSize: "0.95rem" }}>
                            Sitemiz, alışverişlerinizdeki özel ödeme bilgilerini kendi veritabanında kesinlikle saklamaz. Sistemimizde <strong>saklanmayan</strong> bilgiler şunlardır:
                        </Typography>
                        <Box component="ul" sx={{ color: textMain, lineHeight: 1.8, fontWeight: 600, pl: 3, mb: 4, fontSize: "0.95rem" }}>
                            <li style={{ paddingBottom: "4px" }}>Kredi Kartı Numarası</li>
                            <li style={{ paddingBottom: "4px" }}>Kredi Kartı Son Kullanma Tarihi</li>
                            <li style={{ paddingBottom: "4px" }}>Kredi Kartı Güvenlik Numarası (CVV/CVC)</li>
                            <li>Ödeme altyapısında ödeme yapan kullanıcıyı tanımlayan şifreler</li>
                        </Box>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* 3. Saklanan Verilerin Paylaşılması */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            3. Saklanan Verilerin Paylaşılması
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400, fontSize: "0.95rem" }}>
                            {BRAND.name}, kişisel bilgi güvenliğinizi öncelik olarak görür. Bu nedenle sitemizde toplanan hiçbir veri, ticari amaçla üçüncü şahıs, şirket veya kurumlarla paylaşılmaz ve satılmaz.
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontWeight: 400, fontSize: "0.95rem" }}>
                            Ancak; yetkili resmi makamların (Mahkemeler, Savcılıklar vb.) usulüne uygun şekilde bilgi talep etmesi ve sitemizin yasal yükümlülüğü nedeniyle bilgi vermesi gereken durumlarda, talep edilen bilgiler Resmi Kurumlar ile yasal sınırlar çerçevesinde paylaşılabilir.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        <Typography variant="body2" sx={{ color: textMuted, lineHeight: 1.8, fontWeight: 400, fontSize: "0.9rem" }}>
                            Kullanıcılar, bu siteyi kullanmaya başladıkları ve/veya sipariş verip sözleşmeleri kabul ettikleri andan itibaren bu gizlilik politikasının hükümlerini kabul etmiş sayılırlar.
                        </Typography>

                    </Paper>

                    {/* İLETİŞİM */}
                    <Box sx={{ textAlign: "center", mt: 6 }}>
                        <Typography variant="body2" sx={{ color: textMuted, mb: 1 }}>
                            Gizlilik politikamız ile ilgili sorularınız için bize ulaşın:
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, fontWeight: 600, letterSpacing: '1px' }}>
                           {BRAND.email}
                        </Typography>
                    </Box>

                </Container>
            </Box>

            <Footer />
        </div>
    );
}

export default PrivacyPolicy;