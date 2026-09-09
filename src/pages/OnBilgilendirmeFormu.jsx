import React, { useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BRAND from '../config/brand';

function OnBilgilendirmeFormu() {
    const bgLight = "var(--nw-bg-elev)";
    const textMain = "var(--nw-text)";
    const textMuted = "var(--nw-text-dim)";
    const fontStyle = { fontFamily: 'inherit' };

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const h5 = { color: textMain, fontWeight: 700, mb: 2.5, mt: 0, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' };
    const body = { color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400, fontSize: "0.95rem" };
    const info = { color: textMain, lineHeight: 1.9, fontSize: "0.95rem", mb: 0 };
    const divider = { my: 4, borderColor: "var(--nw-line)" };

    return (
        <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: bgLight, ...fontStyle }}>
            <Navbar />

            <Box sx={{ flexGrow: 1, py: { xs: 6, md: 10 } }}>
                <Container maxWidth="md">

                    <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
                        <Typography variant="h2" sx={{ color: textMain, fontWeight: 700, fontSize: { xs: "1.6rem", sm: "2rem", md: "2.5rem" }, mb: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            ÖN BİLGİLENDİRME FORMU
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMuted, letterSpacing: '3px', textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 400 }}>
                            YASAL BİLGİLENDİRME METNİ
                        </Typography>
                    </Box>

                    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4, md: 7 }, borderRadius: 0, border: "1px solid var(--nw-line)", bgcolor: "var(--nw-surface)", boxShadow: "none" }}>

                        <Typography variant="body1" sx={body}>
                            İşbu Ön Bilgilendirme Formu, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, ALICI'nın sipariş kesinleşmeden önce bilgilendirilmesi amacıyla hazırlanmıştır. ALICI, işbu formu ve Mesafeli Satış Sözleşmesi'ni elektronik ortamda okuyup onayladıktan sonra sipariş verebilir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* 1 */}
                        <Typography variant="h5" sx={h5}>1 - SATICI BİLGİLERİ</Typography>
                        <Box sx={info}>
                            <div><strong>Ünvanı:</strong> {BRAND.legalName}</div>
                            <div><strong>Adres:</strong> Mehmet Nesih Özmen Mahallesi, Taflan Sokak, No:18/A Güngören / İstanbul</div>
                            <div><strong>Telefon:</strong> 0 (530) 378 44 92</div>
                            <div><strong>E-Posta:</strong> {BRAND.email}</div>
                        </Box>

                        <Divider sx={divider} />

                        {/* 2 */}
                        <Typography variant="h5" sx={h5}>2 - SÖZLEŞME KONUSU MAL/HİZMETİN TEMEL NİTELİKLERİ</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            Sözleşme konusu mal/hizmetin türü, miktarı, marka/modeli, rengi, adedi ve satış fiyatı; siparişin sonlandığı andaki internet sitesinde (ürün sayfasında) ve ALICI'ya gönderilen sipariş onay e-postasında belirtildiği gibidir. Ürünlerin temel özellikleri, ilgili ürünün sitedeki sayfasında yayınlanmaktadır.
                        </Typography>

                        <Divider sx={divider} />

                        {/* 3 */}
                        <Typography variant="h5" sx={h5}>3 - MAL/HİZMETİN FİYATI VE ÖDEME</Typography>
                        <Typography variant="body2" sx={body}>
                            Sitede ilan edilen fiyatlar, tüm vergiler dâhil (<strong>KDV dahil</strong>) ve <strong>Türk Lirası (₺)</strong> cinsinden satış fiyatlarıdır. Sipariş anındaki toplam bedel; ürün tutarı, varsa indirim ve kargo ücreti dâhil olacak şekilde sepet/ödeme adımında ve sipariş onayında ALICI'ya gösterilir. İlan edilen fiyatlar güncelleme yapılana kadar geçerlidir.
                        </Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            <strong>Ödeme yöntemleri:</strong> (i) Kredi/banka kartı ile online ödeme (İyzico güvencesiyle, 256-Bit SSL) ve (ii) Kapıda Ödeme (ürün bedeli teslimat sırasında kargo görevlisine nakit veya kart ile ödenir).
                        </Typography>

                        <Divider sx={divider} />

                        {/* 4 */}
                        <Typography variant="h5" sx={h5}>4 - TESLİMAT ŞEKLİ VE SÜRESİ, KARGO</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            Ürün, ALICI'nın belirttiği teslimat adresine, siparişin onaylanmasını takiben yasal süre olan 30 günü aşmamak kaydıyla (ortalama 1-3 iş günü içinde kargoya verilerek) anlaşmalı kargo firması aracılığıyla teslim edilir. <strong>1.500 ₺ ve üzeri</strong> alışverişlerde kargo ücretsizdir; altındaki siparişlerde sabit kargo ücreti uygulanır. Teslimat masrafı aksi belirtilmedikçe ALICI'ya aittir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* 5 */}
                        <Typography variant="h5" sx={h5}>5 - CAYMA HAKKI</Typography>
                        <Typography variant="body2" sx={body}>
                            ALICI, malın kendisine veya gösterdiği adresteki kişiye teslim tarihinden itibaren <strong>14 (on dört) gün</strong> içerisinde, hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma hakkını kullanmak için bu süre içinde SATICI'ya <strong>{BRAND.email}</strong> adresinden bildirimde bulunulması; ürünün kullanılmamış, etiketinin ve varsa hijyen/güvenlik bandının koparılmamış olması gerekir.
                        </Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            Cayma bildiriminin ve ürünün SATICI'ya ulaşmasından itibaren en geç <strong>14 gün</strong> içinde ürün bedeli, ödemede kullanılan yönteme uygun şekilde iade edilir (kartla ödemede karta; kapıda ödemede ALICI'nın bildireceği IBAN'a). İadeden doğan kargo bedeli, kusurlu ürün halleri dışında ALICI'ya aittir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* 6 */}
                        <Typography variant="h5" sx={h5}>6 - CAYMA HAKKININ KULLANILAMAYACAĞI HALLER</Typography>
                        <Typography variant="body2" sx={body}>
                            Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca aşağıdaki hallerde cayma hakkı kullanılamaz:
                        </Typography>
                        <Box component="ul" sx={{ ...info, pl: 3, mb: 0 }}>
                            <li style={{ paddingBottom: "6px" }}>Kişiye özel/özel ölçüde hazırlanan ürünler,</li>
                            <li style={{ paddingBottom: "6px" }}>Ambalajı/hijyen bandı açılmış; iadesi sağlık ve hijyen açısından uygun olmayan iç giyim, mayo vb. ürünler,</li>
                            <li style={{ paddingBottom: "6px" }}>Kullanılmış, yıkanmış, etiketi/hijyen bandı koparılmış ürünler. (Abiye ve özel gün elbiselerinde hijyen bandı çıkarılmışsa iade kabul edilmez.)</li>
                        </Box>

                        <Divider sx={divider} />

                        {/* 7 */}
                        <Typography variant="h5" sx={h5}>7 - ŞİKÂYET VE İTİRAZ BAŞVURULARI</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            ALICI, satın alma işlemine ilişkin her türlü talep, şikâyet ve itirazını yukarıda belirtilen SATICI iletişim bilgilerine iletebilir. Uyuşmazlık halinde ise; Ticaret Bakanlığı'nca her yıl belirlenen parasal sınırlar dâhilinde ALICI'nın yerleşim yerindeki veya işlemin yapıldığı yerdeki <strong>Tüketici Hakem Heyetleri</strong> ile <strong>Tüketici Mahkemeleri</strong> yetkilidir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* 8 */}
                        <Typography variant="h5" sx={h5}>8 - ONAY</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            ALICI; işbu Ön Bilgilendirme Formu'nu ve Mesafeli Satış Sözleşmesi'ni okuduğunu, mal/hizmetin temel nitelikleri, KDV dahil toplam fiyatı, ödeme ve teslimat şekli ile cayma hakkı konularında bilgi sahibi olduğunu, elektronik ortamda teyit ederek siparişi onayladığını kabul ve beyan eder.
                        </Typography>

                    </Paper>

                </Container>
            </Box>

            <Footer />
        </div>
    );
}

export default OnBilgilendirmeFormu;
