import React, { useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BRAND from '../config/brand';

function ReturnAndExchangePage() {
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
                    
                    {/* YENİ NESİL BAŞLIK */}
                    <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
                        <Typography variant="h2" sx={{
                            color: textMain,
                            fontWeight: 700,
                            fontSize: { xs: "1.7rem", sm: "2rem", md: "2.5rem" },
                            mb: 2,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            İPTAL, İADE VE DEĞİŞİM POLİTİKASI
                        </Typography>
                        <Typography variant="body1" sx={{ 
                            color: textMuted, 
                            letterSpacing: '3px', 
                            textTransform: "uppercase", 
                            fontSize: "0.8rem", 
                            fontWeight: 400 
                        }}>
                            MÜŞTERİ HİZMETLERİ
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

                        {/* 1. İPTAL SÜRECİ */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            1. Sipariş İptal Süreci
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400 }}>
                            Siparişinizi oluşturduktan sonra fikrinizi değiştirmeniz durumunda, ürünleriniz henüz <strong>kargoya teslim edilmeden önce</strong> iptal işlemini gerçekleştirebilirsiniz. Sistemimizde otomatik bir iptal butonu bulunmamaktadır; tüm süreçler güvenliğiniz ve hızlı çözüm sunabilmemiz adına müşteri hizmetlerimiz aracılığıyla yürütülmektedir.
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontWeight: 400 }}>
                            İptal talebiniz için sipariş numaranızla birlikte <strong>{BRAND.email}</strong> adresine e-posta göndermeniz yeterlidir. İptal talebiniz işleme alındığında, <strong>kredi/banka kartı ile ödenen</strong> siparişlerde tutar İyzico güvencesiyle kartınıza kesintisiz olarak iade edilir. <strong>Kapıda ödeme</strong> ile verdiğiniz siparişlerde (ürün henüz size ulaşmadan iptal edilmişse) herhangi bir tahsilat yapılmadığından iade işlemine gerek kalmaz; tahsilat gerçekleşmiş bir siparişin iadesinde ise ödediğiniz tutar, tarafınızdan bildirilecek <strong>IBAN'a banka havalesi</strong> ile iade edilir. Kargoya teslim edilmiş siparişlerde iptal işlemi yapılamaz; bu durumda paket size ulaştıktan sonra "İade Süreci" başlatılır.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* 2. İADE KOŞULLARI */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            2. İade Koşulları ve Süreci
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400 }}>
                            {BRAND.name}'den satın almış olduğunuz ürünleri, teslim tarihinden itibaren <strong>14 gün içerisinde</strong> iade etme hakkına sahipsiniz. İade edilecek ürünlerin kullanılmamış, etiketleri koparılmamış, parfüm veya kozmetik lekesi taşımaması ve tekrar satılabilirliğinin bozulmamış olması zorunludur. Ürünlerimizde bulunan <strong>güvenlik/hijyen bantlarının</strong> çıkarılmış veya yırtılmış olması durumunda iade talebi kesinlikle kabul edilmeyecektir.
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400 }}>
                            İade işlemini başlatmak için <strong>{BRAND.email}</strong> adresine sipariş numaranızı ve iade sebebinizi içeren bir e-posta göndermeniz gerekmektedir. E-postanız onaylandıktan sonra size iletilecek olan kargo firması anlaşma koduyla ürünleri tarafımıza güvenle gönderebilirsiniz. 
                        </Typography>
                        <Box component="ul" sx={{ color: textMain, lineHeight: 1.8, fontWeight: 400, pl: 3, mb: 4 }}>
                            <li style={{ paddingBottom: "8px" }}>Önceden e-posta onayı alınmadan, anlaşmasız kargolarla "karşı ödemeli" gönderilen paketler depomuz tarafından teslim alınmamaktadır.</li>
                            
                        </Box>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* 3. DEĞİŞİM SÜRECİ */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            3. Değişim İşlemleri
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontWeight: 400 }}>
                            Ürününüzün bedeninin uymaması veya farklı bir renkle değiştirmek istemeniz durumunda değişim hakkınız bulunmaktadır. Değişim taleplerinizi de tıpkı iade sürecinde olduğu gibi <strong>{BRAND.email}</strong> adresine mail atarak başlatabilirsiniz. İstediğiniz yeni beden veya ürün stoklarımızda mevcutsa, ürününüz depomuza ulaştığı gün değişim paketiniz hazırlanarak size gönderilir. 
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* 4. GERİ ÖDEMELER */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            4. Geri Ödemeler
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 0, fontWeight: 400 }}>
                            Tarafımıza ulaşan iade kargoları, kalite kontrol ekibimiz tarafından titizlikle incelenir. İade şartlarına uygunluğu onaylanan siparişlerin ücret iadesi işlemi anında başlatılır. Geri ödemeniz İyzico altyapısı üzerinden, alışveriş yaparken kullandığınız kredi/banka kartınıza doğrudan yansıtılır. İşlemin bankanızın hesap özetinize yansıması, bankanızın iç prosedürlerine bağlı olarak ortalama <strong>3-7 iş günü</strong> sürebilmektedir. 
                        </Typography>
                    </Paper>

                    {/* FOOTER ÖNCESİ İLETİŞİM ALANI */}
                    <Box sx={{ textAlign: "center", mt: 6 }}>
                        <Typography variant="body2" sx={{ color: textMuted, mb: 1.5, fontSize: "1rem" }}>
                            Tüm İptal, İade ve Değişim Talepleriniz İçin:
                        </Typography>
                        <Typography variant="body1" sx={{
                            color: brandColor,
                            fontWeight: 700,
                            letterSpacing: '1px',
                            fontSize: { xs: "1rem", md: "1.2rem" },
                            border: `2px dashed ${brandColor}`,
                            display: "inline-block",
                            maxWidth: "100%",
                            wordBreak: "break-word",
                            padding: { xs: "10px 18px", md: "10px 24px" },
                            borderRadius: "50px",
                            backgroundColor: "var(--nw-bg-elev)"
                        }}>
                          {BRAND.email} 
                        </Typography>
                        <Typography variant="body2" sx={{ color: textMuted, mt: 2, fontSize: "0.9rem" }}>
                            *Maillerinize iş günleri içerisinde 24 saat içinde dönüş sağlanmaktadır.
                        </Typography>
                    </Box>

                </Container>
            </Box>

            <Footer />
        </div>
    );
}

export default ReturnAndExchangePage;