import React, { useEffect } from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BRAND from '../config/brand';

function KvkkPage() {
    // Tasarımın geneliyle uyumlu renkler
    const brandColor = "var(--nw-accent)";   
    const bgLight = "var(--nw-bg-elev)";      
    const textMain = "var(--nw-text)";     
    const textMuted = "var(--nw-text-dim)";    

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
                            KVKK VE AYDINLATMA METNİ
                        </Typography>
                        <Typography sx={{ color: textMuted, letterSpacing: '3px', textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 400 }}>
                            KİŞİSEL VERİLERİN KORUNMASINA İLİŞKİN BİLGİLENDİRME
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
                            <strong>{BRAND.name}</strong> olarak kişisel verilerinizin 6698 sayılı Kişisel Verilerin Korunması Kanunu'na (“Kanun”) uygun olarak işlenerek, muhafaza edilmesine büyük önem veriyoruz. Müşterilerimizi kişisel verileri toplama, işleme, aktarma amacımız ve yöntemlerimiz ve buna bağlı olarak sizlerin Kanun'dan kaynaklanan haklarınızla ilgili bilgilendirmek isteriz.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* MADDE 1 */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            1. Kişisel Verilerin Toplanmasına İlişkin Yöntemler
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontWeight: 400, fontSize: "0.95rem" }}>
                            {BRAND.name} olarak, veri sorumlusu sıfatıyla, mevzuattan kaynaklanan yasal yükümlülüklerimiz çerçevesinde; markalarımızın hizmetlerinden faydalanabilmeniz, onayınız halinde kampanyalarımız hakkında sizleri bilgilendirmek, öneri ve şikayetlerinizi kayıt altına alabilmek, sizlere daha iyi hizmet standartları oluşturabilmek, {BRAND.name} ticari ve iş stratejilerinin belirlenmesi ve uygulanması gibi amaçlarla kişisel verilerinizi internet sitesi, sosyal medya mecraları, iletişim formları ve benzeri vasıtalarla sözlü, yazılı ya da elektronik yöntemlerle toplamaktayız.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* MADDE 2 */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            2. Kişisel Verilerin İşlenmesi ve İşleme Amaçları
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400, fontSize: "0.95rem" }}>
                            {BRAND.name} olarak, veri sorumlusu sıfatı ile yazılı iletişim kanallarımız, sosyal medya sayfalarımız, mobil iletişim kanalları ve/veya bunlarla sınırlı olmamak üzere her türlü kanallar aracılığı ile; onayınız dahilinde elde ettiğimiz kişisel ve/veya özel nitelikli kişisel verileriniz tamamen veya kısmen elde edilebilir, kaydedilebilir, saklanabilir, depolanabilir, değiştirilebilir, güncellenebilir, periyodik olarak kontrol edilebilir, yeniden düzenlenebilir, sınıflandırılabilir, işlendikleri amaç için gerekli olan ya da ilgili kanunda öngörülen süre kadar muhafaza edilebilir, kanuni ya da hizmete bağlı fiili gereklilikler halinde {BRAND.name}'in birlikte çalıştığı özel-tüzel kişilerle ya da kanunen yükümlü olduğu kamu kurum ve kuruluşlarıyla ve/veya Türkiye'de mukim olan ilgili 3. kişi gerçek kişi/tüzel kişilerle paylaşılabilir/devredilebilir.
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontWeight: 400, fontSize: "0.95rem" }}>
                            {BRAND.name} müşterilerinin markalarımızın hizmetlerinden faydalanabilmesi, onayınız halinde kampanyalarımız hakkında sizleri bilgilendirmek, öneri ve şikayetlerinizi kayıt altına alabilmek, sizlere daha iyi hizmet standartları oluşturabilmek ve her halükarda 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuata uygun olarak kişisel verilerinizi işleyebileceğimizi bilginize sunarız.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* MADDE 3 */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            3. Kişisel Verilerin Aktarılması
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 4, fontWeight: 400, fontSize: "0.95rem" }}>
                            {BRAND.name} söz konusu kişisel verilerinizi sadece; açık rızanıza istinaden veya Kanun'da belirtilen güvenlik ve gizlilik esasları çerçevesinde yeterli önlemler alınmak kaydıyla yurt içinde, faaliyetlerin yürütülmesi, veri sahipleri ile müşterilerimiz arasındaki iş ilişkisinin sağlanması, hizmetler, fırsat ve olanaklar sunulması ve hizmet kalitesinin artırılması amacıyla; iş ortaklarımız, faaliyetlerimizin gereği anlaşmalı olduğumuz ve hizmet sunduğumuz müşteriler, tedarikçiler (kargo, ödeme sistemleri vb.), veya yasal bir zorunluluk gereği bu verileri talep etmeye yetkili olan kamu kurum veya kuruluşları ile paylaşabilecektir.
                        </Typography>

                        <Divider sx={{ my: 4, borderColor: "var(--nw-line)" }} />

                        {/* MADDE 4 */}
                        <Typography variant="h5" sx={{ color: textMain, fontWeight: 700, mb: 2, fontSize: { xs: '1.05rem', md: '1.2rem' }, textTransform: 'uppercase' }}>
                            4. Kişisel Veri Sahibinin KVK Kanunu'nun 11. Maddesinde Sayılan Hakları
                        </Typography>
                        <Typography variant="body1" sx={{ color: textMain, lineHeight: 1.8, mb: 2, fontWeight: 400, fontSize: "0.95rem" }}>
                            {BRAND.name}, ilgili kişilerin aşağıdaki taleplerine karşılık verecektir:
                        </Typography>
                        
                        <Box component="ul" sx={{ color: textMain, lineHeight: 1.8, fontWeight: 400, pl: 3, mb: 6, fontSize: "0.95rem" }}>
                            <li style={{ paddingBottom: "6px" }}>a) Kendilerine ilişkin kişisel verileri işleyip işlemediğini ve hangi kişisel verileri işlediğini öğrenme,</li>
                            <li style={{ paddingBottom: "6px" }}>b) İşleme faaliyetinin amaçlarına ilişkin bilgi alma,</li>
                            <li style={{ paddingBottom: "6px" }}>c) Yurt içinde kişisel verileri aktardığı üçüncü kişileri bilme,</li>
                            <li style={{ paddingBottom: "6px" }}>d) Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
                            <li style={{ paddingBottom: "6px" }}>e) Kanun'a uygun olarak kişisel verilerin silinmesini veya yok edilmesini isteme,</li>
                            <li style={{ paddingBottom: "6px" }}>f) Kişisel verilerin düzeltilmesi, silinmesi ya da yok edilmesi talebi halinde; yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
                            <li style={{ paddingBottom: "6px" }}>g) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,</li>
                            <li>h) Kişisel verilerinin birer kopyasını alma.</li>
                        </Box>

                        {/* İLETİŞİM BİLGİLERİ */}
                        <Box sx={{ p: { xs: 2.5, md: 4 }, bgcolor: 'var(--nw-surface)', border: `1px solid ${brandColor}30`, borderRadius: '8px' }}>
                            <Typography variant="h6" sx={{ color: brandColor, fontWeight: 700, mb: 2, fontSize: '1.1rem' }}>
                                Görüş, Soru ve Talepleriniz İçin İletişim Bilgilerimiz:
                            </Typography>
                            <Typography variant="body2" sx={{ color: textMain, lineHeight: 2, fontSize: "0.95rem" }}>
                                <strong>Unvanı:</strong> {BRAND.legalName} <br />
                                <strong>Telefonu:</strong> 0 (530) 378 44 92 <br />
                                <strong>Adresi:</strong> Mehmet Nesih Özmen Mahallesi, Taflan Sokak, No:18/A Güngören / İstanbul <br />
                                <strong>E-Posta:</strong> {BRAND.email}
                            </Typography>
                        </Box>

                    </Paper>

                </Container>
            </Box>

            <Footer />
        </div>
    );
}

export default KvkkPage;