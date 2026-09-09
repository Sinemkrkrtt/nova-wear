import React, { useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BRAND, { siteRef } from '../config/brand';

function DistanceSellingContract() {
    // Tasarımın geneliyle uyumlu renkler
    const brandColor = "var(--nw-accent)";
    const bgLight = "var(--nw-bg-elev)";
    const textMain = "var(--nw-text)";
    const textMuted = "var(--nw-text-dim)";

    const fontStyle = { fontFamily: 'inherit' };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Ortak stiller
    const h5 = { color: textMain, fontWeight: 700, mb: 2.5, mt: 0, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' };
    const body = { color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400, fontSize: "0.95rem" };
    const sub = { color: brandColor, fontWeight: 700, mb: 1, mt: 2, fontSize: '0.95rem' };
    const info = { color: textMain, lineHeight: 1.9, fontSize: "0.95rem", mb: 2 };
    const divider = { my: 4, borderColor: "var(--nw-line)" };

    return (
        <div className="nw-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: bgLight, ...fontStyle }}>
            <Navbar />

            <Box sx={{ flexGrow: 1, py: { xs: 6, md: 10 } }}>
                <Container maxWidth="md">

                    {/* BAŞLIK */}
                    <Box sx={{ textAlign: "center", mb: { xs: 5, md: 8 } }}>
                        <Typography variant="h2" sx={{ color: textMain, fontWeight: 700, fontSize: { xs: "1.6rem", sm: "2rem", md: "2.5rem" }, mb: 2, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            MESAFELİ SATIŞ SÖZLEŞMESİ
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMuted, letterSpacing: '3px', textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 400 }}>
                            YASAL BİLGİLENDİRME METNİ
                        </Typography>
                    </Box>

                    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4, md: 7 }, borderRadius: 0, border: "1px solid var(--nw-line)", bgcolor: "var(--nw-surface)", boxShadow: "none" }}>

                        {/* MADDE 1 */}
                        <Typography variant="h5" sx={h5}>MADDE 1 - TARAFLAR</Typography>
                        <Typography variant="body1" sx={body}>
                            İşbu Sözleşme, aşağıda belirtilen SATICI ile ALICI arasında, aşağıdaki hüküm ve şartlar çerçevesinde elektronik ortamda kurulmuştur.
                        </Typography>
                        <Typography sx={sub}>SATICI</Typography>
                        <Box sx={info}>
                            <div><strong>Ünvanı:</strong> {BRAND.legalName}</div>
                            <div><strong>Adres:</strong> Mehmet Nesih Özmen Mahallesi, Taflan Sokak, No:18/A Güngören / İstanbul</div>
                            <div><strong>Telefon:</strong> 0 (530) 378 44 92</div>
                            <div><strong>E-Posta:</strong> {BRAND.email}</div>
                        </Box>
                        <Typography sx={sub}>ALICI</Typography>
                        <Typography variant="body2" sx={body}>
                            SATICI'ya ait {siteRef()} üzerinden sipariş veren ve ödeme adımında kimlik, iletişim ve teslimat/fatura bilgilerini beyan eden müşteridir. ALICI'nın sipariş sırasında beyan ettiği ad-soyad, adres ve iletişim bilgileri işbu sözleşmenin ayrılmaz parçasıdır ve geçerli kabul edilir.
                        </Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0, fontStyle: 'italic', color: textMuted }}>
                            İşbu sözleşmeyi kabul etmekle ALICI, sözleşme konusu siparişi onayladığı takdirde sipariş konusu bedeli ve varsa kargo ücreti, vergi gibi belirtilen ek ücretleri ödeme yükümlülüğü altına gireceğini ve bu konuda bilgilendirildiğini peşinen kabul eder.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 2 */}
                        <Typography variant="h5" sx={h5}>MADDE 2 - TANIMLAR</Typography>
                        <Typography variant="body1" sx={body}>
                            İşbu sözleşmenin uygulanmasında ve yorumlanmasında aşağıda yazılı terimler karşılarındaki açıklamaları ifade edecektir:
                        </Typography>
                        <Box component="ul" sx={{ ...info, pl: 3 }}>
                            <li style={{ paddingBottom: "6px" }}><strong>BAKAN:</strong> Ticaret Bakanı'nı,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>BAKANLIK:</strong> Ticaret Bakanlığı'nı,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>KANUN:</strong> 6502 sayılı Tüketicinin Korunması Hakkında Kanun'u,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>YÖNETMELİK:</strong> Mesafeli Sözleşmeler Yönetmeliği'ni,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>HİZMET:</strong> Bir ücret veya menfaat karşılığında yapılan ya da yapılması taahhüt edilen mal sağlama dışındaki her türlü tüketici işlemini,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>SATICI:</strong> Ticari veya mesleki faaliyetleri kapsamında tüketiciye mal sunan {BRAND.legalName}'i,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>ALICI:</strong> Bir mal veya hizmeti ticari veya mesleki olmayan amaçlarla edinen, kullanan veya yararlanan gerçek ya da tüzel kişiyi,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>SİTE:</strong> SATICI'ya ait {siteRef()} adresini,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>SİPARİŞ VEREN:</strong> Bir mal veya hizmeti SATICI'ya ait internet sitesi üzerinden talep eden gerçek ya da tüzel kişiyi,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>TARAFLAR:</strong> SATICI ve ALICI'yı,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>SÖZLEŞME:</strong> SATICI ve ALICI arasında akdedilen işbu sözleşmeyi,</li>
                            <li style={{ paddingBottom: "6px" }}><strong>MAL:</strong> Alışverişe konu olan taşınır eşyayı ve elektronik ortamda kullanılmak üzere hazırlanan gayri maddi malları ifade eder.</li>
                        </Box>

                        <Divider sx={divider} />

                        {/* MADDE 3 */}
                        <Typography variant="h5" sx={h5}>MADDE 3 - KONU</Typography>
                        <Typography variant="body1" sx={body}>
                            İşbu Sözleşme, ALICI'nın SATICI'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.
                        </Typography>
                        <Typography variant="body1" sx={{ ...body, mb: 0 }}>
                            Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 4 */}
                        <Typography variant="h5" sx={h5}>MADDE 4 - SATICI BİLGİLERİ</Typography>
                        <Box sx={{ ...info, mb: 0 }}>
                            <div><strong>Ünvanı:</strong> {BRAND.legalName}</div>
                            <div><strong>Adres:</strong> Mehmet Nesih Özmen Mahallesi, Taflan Sokak, No:18/A Güngören / İstanbul</div>
                            <div><strong>Telefon:</strong> 0 (530) 378 44 92</div>
                            <div><strong>E-Posta:</strong> {BRAND.email}</div>
                        </Box>

                        <Divider sx={divider} />

                        {/* MADDE 5 */}
                        <Typography variant="h5" sx={h5}>MADDE 5 - ALICI BİLGİLERİ</Typography>
                        <Box sx={{ ...info, mb: 0 }}>
                            <div><strong>Teslim edilecek kişi:</strong> Sipariş sırasında ALICI tarafından beyan edilen ad-soyad.</div>
                            <div><strong>Teslimat Adresi:</strong> Sipariş sırasında ALICI tarafından beyan edilen adres.</div>
                            <div><strong>Telefon:</strong> Sipariş sırasında beyan edilen telefon.</div>
                            <div><strong>E-Posta:</strong> Sipariş sırasında beyan edilen e-posta.</div>
                        </Box>

                        <Divider sx={divider} />

                        {/* MADDE 6 */}
                        <Typography variant="h5" sx={h5}>MADDE 6 - SİPARİŞ VEREN KİŞİ BİLGİLERİ</Typography>
                        <Box sx={{ ...info, mb: 0 }}>
                            <div><strong>Ad/Soyad/Unvan:</strong> Sipariş sırasında beyan edilen bilgiler.</div>
                            <div><strong>Adres:</strong> Sipariş sırasında beyan edilen adres.</div>
                            <div><strong>Telefon:</strong> Sipariş sırasında beyan edilen telefon.</div>
                            <div><strong>E-Posta:</strong> Sipariş sırasında beyan edilen e-posta.</div>
                        </Box>

                        <Divider sx={divider} />

                        {/* MADDE 7 */}
                        <Typography variant="h5" sx={h5}>MADDE 7 - SÖZLEŞME KONUSU ÜRÜN/ÜRÜNLER BİLGİLERİ</Typography>
                        <Typography sx={sub}>7.1 Ürün Özellikleri</Typography>
                        <Typography variant="body2" sx={body}>
                            Malın/Ürünün/Ürünlerin temel özellikleri (türü, miktarı, marka/modeli, rengi, adedi) SATICI'ya ait internet sitesinde yayınlanmaktadır. Satıcı tarafından kampanya düzenlenmiş ise ilgili ürünün temel özelliklerini kampanya süresince inceleyebilirsiniz. Kampanya tarihine kadar geçerlidir.
                        </Typography>
                        <Typography sx={sub}>7.2 Fiyatlar</Typography>
                        <Typography variant="body2" sx={body}>
                            Listelenen ve sitede ilan edilen fiyatlar satış fiyatıdır. İlan edilen fiyatlar ve vaatler güncelleme yapılana ve değiştirilene kadar geçerlidir. Süreli olarak ilan edilen fiyatlar ise belirtilen süre sonuna kadar geçerlidir.
                        </Typography>
                        <Typography sx={sub}>7.3 Vergiler, Kargo ve Ödemeler</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            Sözleşme konusu mal ya da hizmetin tüm vergiler dâhil (KDV dahil) satış fiyatı, sipariş özetinde ve ALICI'ya gönderilen sipariş onay e-postasında ürün bazında, kargo tutarı ve genel toplam ile birlikte gösterilir. 1.500 ₺ ve üzeri alışverişlerde kargo ücretsiz, altındaki siparişlerde sabit kargo ücreti uygulanır. Ödeme; kredi/banka kartı ile online (İyzico güvencesiyle) veya Kapıda Ödeme (teslimatta nakit/kart) yöntemiyle yapılabilir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 8 */}
                        <Typography variant="h5" sx={h5}>MADDE 8 - FATURA BİLGİLERİ</Typography>
                        <Box sx={info}>
                            <div><strong>Ad/Soyad/Unvan:</strong> Sipariş sırasında beyan edilen bilgiler.</div>
                            <div><strong>Adres:</strong> Sipariş sırasında beyan edilen fatura adresi.</div>
                        </Box>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            Fatura, sipariş teslimatı sırasında sipariş ile birlikte veya elektronik ortamda (e-posta) ALICI'ya iletilir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 9 */}
                        <Typography variant="h5" sx={h5}>MADDE 9 - GENEL HÜKÜMLER</Typography>
                        <Typography variant="body2" sx={body}>
                            <strong>9.1-</strong> ALICI, SATICI'ya ait internet sitesinde sözleşme konusu ürünün temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul, beyan ve taahhüt eder.
                        </Typography>
                        <Typography variant="body2" sx={body}>
                            <strong>9.2-</strong> Sözleşme konusu her bir ürün, 30 günlük yasal süreyi aşmamak kaydı ile ALICI'nın yerleşim yeri uzaklığına bağlı olarak, internet sitesindeki ön bilgiler kısmında belirtilen süre zarfında (ortalama 1-3 iş günü içinde kargoya verilecek şekilde) ALICI veya gösterdiği adresteki kişi/kuruluşa teslim edilir.
                        </Typography>
                        <Typography variant="body2" sx={body}>
                            <strong>9.3-</strong> Sözleşme konusu ürün, ALICI'dan başka bir kişi/kuruluşa teslim edilecek ise, teslim edilecek kişi/kuruluşun teslimatı kabul etmemesinden SATICI sorumlu tutulamaz.
                        </Typography>
                        <Typography variant="body2" sx={body}>
                            <strong>9.4-</strong> SATICI, sözleşme konusu ürünün sağlam, eksiksiz, siparişte belirtilen niteliklere uygun teslim edilmesinden sorumludur.
                        </Typography>
                        <Typography variant="body2" sx={body}>
                            <strong>9.5-</strong> Sözleşme konusu ürünün teslimatı için işbu sözleşmenin ALICI tarafından elektronik ortamda onaylanmış olması ve bedelinin tahsil edilmiş olması şarttır. Kapıda ödeme yönteminde ürün bedeli, ürünün ALICI'ya teslimi anında kargo görevlisi aracılığıyla tahsil edilir. Herhangi bir nedenle ürün bedeli ödenmez (kapıda ödemede teslimatın reddedilmesi dahil) veya banka kayıtlarında iptal edilir ise, SATICI ürünün teslimi yükümlülüğünden kurtulmuş kabul edilir.
                        </Typography>
                        <Typography variant="body2" sx={body}>
                            <strong>9.6-</strong> Ürünün tesliminden sonra ALICI'ya ait kredi kartının yetkisiz kişilerce haksız veya hukuka aykırı olarak kullanılması nedeni ile ilgili banka veya finans kuruluşunun ürün bedelini SATICI'ya ödememesi halinde, ALICI'nın kendisine teslim edilmiş olması kaydıyla ürünün 3 gün içinde SATICI'ya iadesi zorunludur.
                        </Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            <strong>9.7-</strong> SATICI mücbir sebepler veya olağanüstü durumlar nedeni ile sözleşme konusu ürünü süresi içinde teslim edemez ise, durumu ALICI'ya bildirir. Bu takdirde ALICI siparişin iptal edilmesini veya teslimat süresinin ertelenmesini talep edebilir. Siparişin iptali halinde ödenen tutar, banka prosedürlerine uygun süre zarfında ALICI'ya iade edilir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 10 */}
                        <Typography variant="h5" sx={h5}>MADDE 10 - CAYMA HAKKI</Typography>
                        <Typography variant="body2" sx={body}>
                            ALICI, mesafeli sözleşmenin mal satışına ilişkin olması durumunda, ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren <strong>14 (on dört) gün</strong> içerisinde, SATICI'ya bildirmek şartıyla hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin malı reddederek sözleşmeden cayma hakkını kullanabilir.
                        </Typography>
                        <Typography variant="body2" sx={body}>
                            Cayma hakkının kullanılması için bu süre içinde SATICI'ya <strong>{BRAND.email}</strong> adresinden yazılı bildirimde bulunulması ve ürünün kullanılmamış, etiketinin ve varsa hijyen/güvenlik bandının koparılmamış, yeniden satılabilirliğinin bozulmamış olması şarttır.
                        </Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            Cayma bildiriminin ve ürünün SATICI'ya ulaşmasından itibaren en geç <strong>14 (on dört) gün</strong> içinde ürün bedeli, ALICI'nın ödemede kullandığı ödeme aracına uygun şekilde iade edilir. Kredi/banka kartı ile yapılan ödemelerde iade karta; kapıda ödeme ile yapılan ödemelerde ALICI'nın bildireceği IBAN'a banka havalesi ile yapılır. İadeden doğan kargo bedeli, kusurlu ürün halleri dışında ALICI'ya aittir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 11 */}
                        <Typography variant="h5" sx={h5}>MADDE 11 - CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER</Typography>
                        <Typography variant="body2" sx={body}>
                            Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca, aşağıdaki ürünlerde/hallerde cayma hakkı kullanılamaz:
                        </Typography>
                        <Box component="ul" sx={{ ...info, pl: 3, mb: 2 }}>
                            <li style={{ paddingBottom: "6px" }}>ALICI'nın istekleri veya açıkça kişisel ihtiyaçları doğrultusunda hazırlanan, kişiye özel/özel ölçüde üretilen ürünler,</li>
                            <li style={{ paddingBottom: "6px" }}>Tesliminden sonra ambalajı/hijyen bandı açılmış olan; iadesi sağlık ve hijyen açısından uygun olmayan iç giyim alt parçaları, mayo, bikini vb. ürünler,</li>
                            <li style={{ paddingBottom: "6px" }}>Kullanılmış, yıkanmış, etiketi veya hijyen/güvenlik bandı koparılmış, tekrar satılabilirliği bozulmuş ürünler.</li>
                        </Box>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            Abiye ve özel gün elbiselerimizdeki hijyen/güvenlik bantlarının çıkarılması veya ürünün kullanılması halinde cayma/iade talebi kabul edilmez.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 12 */}
                        <Typography variant="h5" sx={h5}>MADDE 12 - TEMERRÜT HALİ VE HUKUKİ SONUÇLARI</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            ALICI, ödeme işlemlerini kredi kartı ile yaptığı durumda temerrüde düştüğü takdirde, kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu olacağını kabul, beyan ve taahhüt eder. Bu durumda ilgili banka hukuki yollara başvurabilir ve doğacak masrafları ALICI'dan talep edebilir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 13 */}
                        <Typography variant="h5" sx={h5}>MADDE 13 - YETKİLİ MAHKEME</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            İşbu sözleşmeden doğan uyuşmazlıklarda şikâyet ve itirazlar; Ticaret Bakanlığı'nca her yıl belirlenen parasal sınırlar dâhilinde, ALICI'nın mal veya hizmeti satın aldığı veya ikametgâhının bulunduğu yerdeki Tüketici Hakem Heyetine; bu sınırların üzerindeki uyuşmazlıklarda ise Tüketici Mahkemesine yapılır. Parasal sınırlara ilişkin güncel bilgiler Ticaret Bakanlığı tarafından ilan edilmektedir.
                        </Typography>

                        <Divider sx={divider} />

                        {/* MADDE 14 */}
                        <Typography variant="h5" sx={h5}>MADDE 14 - YÜRÜRLÜK</Typography>
                        <Typography variant="body2" sx={{ ...body, mb: 0 }}>
                            ALICI, site üzerinden verdiği siparişe ait ödemeyi gerçekleştirdiğinde ve işbu sözleşmeyi elektronik ortamda onayladığında, sözleşmenin tüm şartlarını kabul etmiş sayılır. İşbu sözleşme, ALICI tarafından elektronik ortamda onaylanarak siparişin tamamlandığı tarihte yürürlüğe girer ve 14 (on dört) maddeden ibarettir.
                        </Typography>

                    </Paper>

                    <Box sx={{ textAlign: "center", mt: 6 }}>
                        <Typography variant="body2" sx={{ color: textMuted }}>
                            Bu sözleşme elektronik ortamda ALICI tarafından onaylandığı tarihte yürürlüğe girer.
                        </Typography>
                    </Box>

                </Container>
            </Box>

            <Footer />
        </div>
    );
}

export default DistanceSellingContract;
