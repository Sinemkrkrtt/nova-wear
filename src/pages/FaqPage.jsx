import React, { useState, useEffect } from 'react';
import { 
    Box, Container, Typography, Accordion, AccordionSummary, 
    AccordionDetails, Paper
} from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import BRAND from '../config/brand';

const faqData = [
    {
        categoryId: "shipping",
        title: "KARGO VE TESLİMAT",
        icon: <LocalShippingOutlinedIcon fontSize="medium" />,
        questions: [
            { 
                q: "Siparişim kaç günde elime ulaşır?", 
                a: "Siparişleriniz onaylandıktan sonra ortalama 1-3 iş günü içerisinde özenle hazırlanarak anlaşmalı kargo firmalarına teslim edilir." 
            },
            { 
                q: "Kargo ücreti ne kadar?", 
                a: `${BRAND.name}'de ${BRAND.freeShippingThreshold} ₺ ve üzeri alışverişlerinizde kargo ücretsizdir. ${BRAND.freeShippingThreshold} ₺ altındaki siparişlerinizde ise sabit ${BRAND.shippingFee}.00 ₺ kargo ücreti yansıtılmaktadır.` 
            },
            { 
                q: "Siparişimi nasıl takip edebilirim?", 
                a: "Siparişiniz kargoya teslim edildiğinde sitemizin 'Kargo Takip' sayfasından sipariş numaranız ve e-posta adresiniz ile kargonuzun anlık durumunu sorgulayabilirsiniz." 
            }
        ]
    },
    {
        categoryId: "returns",
        title: "İPTAL, İADE VE DEĞİŞİM",
        icon: <AssignmentReturnOutlinedIcon fontSize="medium" />,
        questions: [
            { 
                q: "Siparişimi nasıl iptal edebilirim?", 
                a: `Siparişleriniz kargoya teslim edilmeden önce, sipariş numaranızla birlikte ${BRAND.email} adresine e-posta göndererek iptal işlemini gerçekleştirebilirsiniz.` 
            },
            { 
                q: "İade ve değişim koşulları nelerdir?", 
                a: "Teslim tarihinden itibaren 14 gün içerisinde iade veya değişim yapabilirsiniz. Ürünlerin kullanılmamış, etiketleri koparılmamış ve abiye/özel gün elbiselerindeki hijyen bantlarının kesinlikle çıkarılmamış olması zorunludur." 
            },
            { 
                q: "İade/Değişim işlemlerini nasıl başlatabilirim?", 
                a: `Talebinizi sipariş numaranız ve gerekçeniz ile birlikte ${BRAND.email} adresine mail atarak başlatabilirsiniz. E-postanız onaylandıktan sonra müşteri hizmetlerimiz size kargo gönderim adımlarını iletecektir.` 
            },
            { 
                q: "İade ve değişimlerde kargo ücretini kim karşılıyor?", 
                a: "Mesafeli satış sözleşmemizde de belirtildiği üzere, kusurlu ürün gönderimi dışındaki tüm standart değişim ve iade işlemlerinde kargo bedeli ALICI'ya (müşteriye) aittir." 
            }
        ]
    },
    {
        categoryId: "payment",
        title: "ÖDEME İŞLEMLERİ",
        icon: <PaymentOutlinedIcon fontSize="medium" />,
        questions: [
            { 
                q: "Hangi ödeme yöntemlerini kullanabilirim?", 
                a: "İyzico güvencesiyle tüm bankaların kredi ve banka kartları ile 256-Bit SSL şifreleme standartları altında güvenle ödeme yapabilirsiniz." 
            },
            { 
                q: "Kredi kartına taksit imkanı var mı?", 
                a: "Evet, ödeme adımında kredi kartı bilgilerinizi girdiğinizde İyzico sistemi tarafından kartınıza uygun 12 aya varan taksit seçenekleri sunulmaktadır." 
            },
            { 
                q: "Kapıda ödeme seçeneğiniz mevcut mu?",
                a: "Evet, kredi/banka kartıyla online ödemenin yanı sıra Kapıda Ödeme seçeneğimiz de bulunmaktadır. Ödeme adımında \"Kapıda Ödeme\"yi seçerek siparişinizi verebilir, tutarı teslimat sırasında kuryeye ödeyebilirsiniz. (Havale/EFT seçeneği şu an bulunmamaktadır.)"
            }
        ]
    }
];

function FaqPage() {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const [expanded, setExpanded] = useState(false);
    
    const handleChange = (panel) => (event, isExpanded) => { 
        setExpanded(isExpanded ? panel : false); 
    };

    // Marka ve Tasarım Değişkenleri
    const brandFont = 'var(--nw-font-display)';
    const brandColor = "var(--nw-accent)";   
    const bgLight = "var(--nw-bg-elev)";      
    const textMain = "var(--nw-text)";     
    const textMuted = "var(--nw-text-dim)";    
    const fontStyle = { fontFamily: 'inherit' };

    return (
        <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: bgLight, ...fontStyle }}>
            <Navbar />
            
            <Box sx={{ flexGrow: 1, py: { xs: 6, md: 10 } }}>
                <Container maxWidth="md">
                    
                    {/* BAŞLIK */}
                    <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
                        <Typography variant="h2" sx={{
                            color: textMain,
                            fontFamily: brandFont,
                            fontWeight: 700,
                            fontSize: { xs: "1.8rem", sm: "2rem", md: "2.8rem" },
                            mb: 2
                        }}>
                            Sıkça Sorulan Sorular
                        </Typography>
                        <Typography sx={{ color: textMuted, letterSpacing: '2px', textTransform: "uppercase", fontSize: "0.85rem", fontWeight: 500 }}>
                            Aklınıza Takılan Her Şey
                        </Typography>
                    </Box>

                    {/* SSS KATEGORİLERİ */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 4, md: 6 } }}>
                        {faqData.map((category, catIndex) => (
                            <Box key={category.categoryId}>
                                
                                {/* Kategori Başlığı */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, px: 1 }}>
                                    <Box sx={{ color: brandColor, display: 'flex' }}>
                                        {category.icon}
                                    </Box>
                                    <Typography sx={{ color: textMain, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.1rem' }}>
                                        {category.title}
                                    </Typography>
                                </Box>

                                {/* Kategori Akordiyonları */}
                                <Paper elevation={0} sx={{ 
                                    borderRadius: '12px', 
                                    border: "1px solid var(--nw-line)", 
                                    bgcolor: "var(--nw-surface)",
                                    overflow: 'hidden'
                                }}>
                                    {category.questions.map((item, qIndex) => {
                                        const panelId = `panel-${catIndex}-${qIndex}`;
                                        const isLast = qIndex === category.questions.length - 1;
                                        
                                        return (
                                            <Accordion 
                                                key={panelId} 
                                                expanded={expanded === panelId} 
                                                onChange={handleChange(panelId)} 
                                                disableGutters 
                                                sx={{ 
                                                    boxShadow: 'none', 
                                                    borderBottom: isLast ? 'none' : '1px solid #eeeeee', 
                                                    '&:before': { display: 'none' },
                                                    bgcolor: 'transparent'
                                                }}
                                            >
                                                <AccordionSummary 
                                                    expandIcon={
                                                        expanded === panelId 
                                                        ? <RemoveIcon sx={{ color: brandColor }} /> 
                                                        : <AddIcon sx={{ color: textMuted }} />
                                                    } 
                                                    sx={{ py: 1.5, px: { xs: 2, md: 3 }, minHeight: 56 }}
                                                >
                                                    <Typography sx={{ 
                                                        fontWeight: expanded === panelId ? 700 : 500, 
                                                        color: expanded === panelId ? brandColor : textMain,
                                                        fontSize: '1rem',
                                                        transition: 'all 0.2s ease'
                                                    }}>
                                                        {item.q}
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ pb: 3, px: { xs: 2, md: 3 } }}>
                                                    <Typography sx={{ color: textMuted, lineHeight: 1.8, fontSize: "0.95rem" }}>
                                                        {item.a}
                                                    </Typography>
                                                </AccordionDetails>
                                            </Accordion>
                                        );
                                    })}
                                </Paper>
                            </Box>
                        ))}
                    </Box>

                    {/* İLETİŞİM YÖNLENDİRMESİ */}
                    <Box sx={{ textAlign: "center", mt: { xs: 5, md: 8 }, p: { xs: 3, md: 4 }, bgcolor: 'var(--nw-surface)', border: `1px dashed ${brandColor}40`, borderRadius: '12px' }}>
                        <Typography variant="body1" sx={{ color: textMain, mb: 1, fontWeight: 500 }}>
                            Cevabını bulamadığınız farklı bir sorunuz mu var?
                        </Typography>
                        <Typography variant="body1" sx={{ color: brandColor, fontWeight: 700, letterSpacing: '0.5px', fontSize: '1.1rem' }}>
                           {BRAND.email}
                        </Typography>
                    </Box>

                </Container>
            </Box>
            <Footer />
        </div>
    );
}

export default FaqPage;