import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Badge, Menu, MenuItem, Box, Typography, Divider, Avatar, ListItemIcon, IconButton, Drawer, TextField, Button, Container, useMediaQuery, useTheme, List, ListItem, ListItemText
} from '@mui/material';
import { 
  Search, Person, FavoriteBorder, ShoppingBagOutlined, 
  Logout, CloseOutlined, ArrowRightAltOutlined, Menu as MenuIcon
} from '@mui/icons-material';

// Firebase Importları
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebase';
import { fetchCategories, DEFAULT_CATEGORIES } from '../utils/categories';
import { nw } from '../theme/muiTheme';
import BRAND from '../config/brand';
import { imageUrl, imageFallback } from '../utils/storage';
import Logo from './Logo';

// Türkçe / aksan duyarsız arama için normalize (Arama sayfası ile aynı davranış)
const normalizeText = (s) => String(s || '')
  .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c')
  .replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u').replace(/[ğĞ]/g, 'g')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

export default function Navbar() {
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // Mobilde hamburger menüye geçiş

  // Kullanıcı ve Menü State'leri
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Mobil Menü (Drawer) State'i
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Arama Modalı (Live Search) State'leri
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [liveResults, setLiveResults] = useState([]);
  // Arama placeholder'ında kendi kendine yazan kategori animasyonu (typewriter)
  const [typedHint, setTypedHint] = useState('');

  // Renk ve fontlar tek kaynaktan (src/theme/muiTheme.js > nw) geliyor —
  // böylece palet değiştiğinde bu dosyaya dokunmak gerekmiyor.
  // Başlık fontu artık yalnızca Logo bileşeninde kullanılıyor.
  const modernFont = nw.fontBody;
  const sharpStyle = {
    fontFamily: modernFont,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '-0.5px'
  };
  
  const brandColor = nw.accent;
  const brandHover = nw.accentHover;
  const textMain = nw.text;
  const textMuted = nw.textDim;
  const surface = nw.surface;
  const surfaceElev = nw.bgElev;
  const line = nw.line;
  const onAccent = nw.onAccent;

  // Kategori Listesi (admin Pazarlama'dan yönetilir; boşsa varsayılanlar)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  useEffect(() => { fetchCategories().then(setCategories); }, []);

  const updateCartCount = () => {
    const storedCart = JSON.parse(localStorage.getItem('myCart') || '[]');
    const count = storedCart.reduce((acc, item) => acc + item.quantity, 0);
    setCartCount(count);
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'customers', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Kullanıcı bilgileri çekilemedi:", error);
        }
      } else {
        setUserData(null);
      }
    });

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      unsubscribe();
    };
  }, [location]);

  useEffect(() => {
    if (searchOpen && allProducts.length === 0) {
      const fetchAllProducts = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'products'));
          setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Ürünler çekilemedi:", error);
        }
      };
      fetchAllProducts();
    }
  }, [searchOpen, allProducts.length]);

  useEffect(() => {
    const tokens = normalizeText(searchQuery).split(' ').filter(Boolean);
    if (tokens.length > 0 && searchQuery.trim().length > 1) {
      const filtered = allProducts.filter(p => {
        const categoryText = Array.isArray(p.category) ? p.category.join(' ') : (p.category || '');
        const variantText = Array.isArray(p.variants)
          ? p.variants.map(v => `${v.color || ''} ${v.size || ''}`).join(' ')
          : '';
        const haystack = normalizeText(`${p.name || ''} ${categoryText} ${p.color || ''} ${variantText}`);
        return tokens.every(t => haystack.includes(t));
      }).slice(0, 4);
      setLiveResults(filtered);
    } else {
      setLiveResults([]);
    }
  }, [searchQuery, allProducts]);

  // Arama placeholder'ı: kategori isimlerini kendi kendine yazıp silen animasyon.
  useEffect(() => {
    if (!searchOpen) { setTypedHint(''); return; }
    const HINTS = ['ABİYE', 'ELBİSE', 'NİŞANLIK', 'MEZUNİYET ELBİSESİ', 'KOKTEYL ELBİSESİ', 'MİNİ ELBİSE', 'GECE ELBİSESİ'];
    let wordIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const word = HINTS[wordIdx];
      if (!deleting) {
        charIdx++;
        setTypedHint(word.slice(0, charIdx));
        if (charIdx === word.length) { deleting = true; timer = setTimeout(tick, 1500); return; }
        timer = setTimeout(tick, 85);
      } else {
        charIdx--;
        setTypedHint(word.slice(0, charIdx));
        if (charIdx === 0) { deleting = false; wordIdx = (wordIdx + 1) % HINTS.length; timer = setTimeout(tick, 350); return; }
        timer = setTimeout(tick, 40);
      }
    };
    timer = setTimeout(tick, 450);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleMenuClose();
      navigate('/');
    } catch (error) {
      console.error("Çıkış yaparken hata:", error);
    }
  };

  const getInitials = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const handleSearchSubmit = (e) => {
    if(e) e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/arama?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Kayan promo yazısı — tek "birim" defalarca tekrarlanıp iki eşit segment
  // yapılır; animasyon -50% olduğu için başa dönüşte HİÇ sıçrama olmaz (seamless).
  // --- Mobil menü ortak stilleri ---
  // Satırlar eskiden 65px yüksekliğindeydi ve her biri ayırıcı çizgi
  // taşıyordu; menü 8 kategoriyle ekranı dolduruyordu. Artık 46px ve
  // çizgi yerine bölüm başlıkları ayırıyor.
  const drawerSectionSx = {
    fontFamily: modernFont, fontSize: '0.68rem', fontWeight: 700,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: textMuted, opacity: 0.75, px: 2.5, pb: 0.75, pt: 0.5,
  };
  const drawerRowSx = {
    py: 1.25, px: 2.5, minHeight: 46,
    color: textMain,
    borderRadius: 0,
    '-webkit-tap-highlight-color': 'transparent',
    '& .MuiListItemText-primary': { color: textMain, transition: 'color 0.18s' },
    '&:hover': { bgcolor: surface },
    '&:hover .MuiListItemText-primary': { color: brandColor },
    '&:active .MuiListItemText-primary': { color: brandColor },
  };

  const promoUnit = "NOVA WEAR: TARZINLA PARLA.   •   1500 TL ÜZERİ ÜCRETSİZ KARGO   •   YENİ SEZON YAYINDA   •   ";
  const promoSegment = promoUnit.repeat(4); // geniş ekranları da dolduracak kadar tekrar

  return (
    <>
      <style>
        {`
          .nw-topbar { overflow: hidden; width: 100%; background-color: ${brandColor}; color: ${onAccent}; }
          .nw-topbar-track { display: flex; width: max-content; animation: marquee-scroll 40s linear infinite; }
          .nw-topbar-track:hover { animation-play-state: paused; }
          .nw-topbar-seg { font-family: ${modernFont}; font-weight: 600; font-size: 0.72rem; letter-spacing: 1.2px; padding: 10px 0; text-transform: uppercase; white-space: pre; }
          @keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}
      </style>

      {/* ÜST BİLDİRİM BARI — kesintisiz (seamless) akış, başa dönüşte sıçrama yok (SABİT DEĞİL, kayıp gider) */}
      <div className="nw-topbar">
        <div className="nw-topbar-track">
          <span className="nw-topbar-seg">{promoSegment}</span>
          <span className="nw-topbar-seg" aria-hidden="true">{promoSegment}</span>
        </div>
      </div>

      {/* ANA NAVBAR (logotype + kategoriler) — kaydırınca üste yapışık kalır */}
      <Box component="header" sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        px: { xs: 2, md: 5 }, py: { xs: 1, md: 1 },
        borderBottom: `1px solid ${line}`, bgcolor: 'rgba(19,19,22,0.86)',
        backdropFilter: 'blur(18px)',
        position: 'sticky', top: 0, zIndex: 1100
      }}>
        
        {/* MOBİL: HAMBURGER MENÜ BUTONU (Sadece Mobilde) */}
        {isMobile && (
          <IconButton onClick={() => setMobileMenuOpen(true)} sx={{ color: textMain, p: 1, ml: -1 }}>
            <MenuIcon sx={{ fontSize: 28 }} />
          </IconButton>
        )}

        {/* LOGO — görsel yerine yazıyla kurulmuş logotype.
            Avantajı: her ekran boyutunda net, dosya indirmesi yok, rengi
            temadan geliyor. Hazır bir logo görseli olduğunda burası
            <Box component="img" .../> ile değiştirilebilir. */}
        <Box sx={{ flex: isMobile ? 1 : 'none', display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '10px 4px', margin: '-10px -4px' }}>
            <Logo size="nav" />
          </Link>
        </Box>

        {/* MASAÜSTÜ: LİNKLER (Mobilde Gizli) */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 4 }}>
            {categories.map((cat) => (
              <Link 
                key={cat} 
                to={`/kategori/${cat}`} 
                style={{ 
                  textDecoration: 'none', color: textMain, ...sharpStyle, fontSize: '0.85rem', transition: 'color 0.3s' 
                }}
                onMouseOver={(e) => e.target.style.color = brandHover}
                onMouseOut={(e) => e.target.style.color = textMain}
              >
                {cat}
              </Link>
            ))}
          </Box>
        )}

        {/* İKONLAR */}
        <Box sx={{ display: 'flex', gap: { xs: 0.25, md: 2 }, alignItems: 'center', mr: { xs: -1, md: -1 } }}>
          <IconButton onClick={() => setSearchOpen(true)} sx={{ p: 1, color: textMain, "&:hover": { color: brandHover }, transition: '0.3s' }}>
            <Search sx={{ fontSize: { xs: 24, md: 26 } }} />
          </IconButton>
          
          {user ? (
            <Box onClick={handleMenuOpen} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', p: 1 }}>
              <Person sx={{ fontSize: { xs: 24, md: 26 }, color: textMain, "&:hover": { color: brandHover }, transition: '0.3s' }} />
            </Box>
          ) : (
            <Link to="/login" title="Giriş Yap" style={{ color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
              <Person sx={{ fontSize: { xs: 24, md: 26 }, color: textMain, "&:hover": { color: brandHover }, transition: '0.3s' }} />
            </Link>
          )}
          
          <Link to="/favoriler" title="Favoriler" style={{ color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
            <FavoriteBorder sx={{ fontSize: { xs: 24, md: 26 }, color: textMain, "&:hover": { color: brandHover }, transition: '0.3s' }} />
          </Link>
          
          <Link to="/sepet" title="Sepetim" style={{ color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
       <Badge 
  badgeContent={cartCount} 
  sx={{ 
    "& .MuiBadge-badge": { 
       bgcolor: brandColor, 
       color: onAccent, 
       fontWeight: 700, 
       fontSize: "0.7rem", 
       fontFamily: modernFont, 
       borderRadius: '50%', // İşte burası kareyi yuvarlak yapar
       minWidth: "18px", 
       height: "18px" 
    } 
  }}
>
  <ShoppingBagOutlined sx={{ fontSize: { xs: 24, md: 26 }, color: textMain, "&:hover": { color: brandHover }, transition: '0.3s' }} />
</Badge>
          </Link>
        </Box>
      </Box>

  {/* --- MOBİL YAN MENÜ --- */}
<Drawer
  anchor="left"
  open={mobileMenuOpen}
  onClose={() => setMobileMenuOpen(false)}
  PaperProps={{
    sx: {
      width: '86vw',
      maxWidth: '340px',
      bgcolor: surfaceElev,
      backgroundImage: 'none',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'none',
    }
  }}
>
  {/* Başlık: logo + kapatma. Eskiden kapatma düğmesi yoktu, menü ancak
      dışarı dokunarak kapanıyordu. */}
  <Box sx={{
    px: 2.5, py: 2, display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 1, borderBottom: `1px solid ${line}`
  }}>
    <Box>
      <Logo size="nav" />
      <Typography sx={{ fontFamily: modernFont, fontSize: '0.7rem', color: textMuted, mt: 1 }}>
        {BRAND.slogan}
      </Typography>
    </Box>
    <IconButton
      onClick={() => setMobileMenuOpen(false)}
      aria-label="Menüyü kapat"
      sx={{ color: textMuted, mt: -0.5, mr: -1, '&:hover': { color: textMain } }}
    >
      <CloseOutlined />
    </IconButton>
  </Box>

  {/* Orta alan kaydırılabilir: kategori sayısı artınca alttaki giriş
      bölümü ekrandan taşmıyor. */}
  <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
    <Typography sx={drawerSectionSx}>Koleksiyonlar</Typography>
    <List disablePadding>
      {categories.map((cat) => (
        <ListItem
          button
          key={cat}
          component={Link}
          to={`/kategori/${encodeURIComponent(cat)}`}
          onClick={() => setMobileMenuOpen(false)}
          sx={drawerRowSx}
        >
          <ListItemText
            primary={cat}
            primaryTypographyProps={{ sx: { fontFamily: modernFont, fontSize: '0.95rem', fontWeight: 500 } }}
          />
          <Box component="span" sx={{ display: 'flex', color: textMuted, opacity: 0.6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </Box>
        </ListItem>
      ))}
    </List>

    <Divider sx={{ borderColor: line, my: 1.5 }} />

    <Typography sx={drawerSectionSx}>Hesabım</Typography>
    <List disablePadding>
      {[
        { to: '/favoriler', label: 'Favorilerim', icon: <FavoriteBorder sx={{ fontSize: 19 }} /> },
        { to: '/sepet', label: 'Sepetim', icon: <ShoppingBagOutlined sx={{ fontSize: 19 }} />, count: cartCount },
        { to: '/siparislerim', label: 'Siparişlerim', icon: <Person sx={{ fontSize: 19 }} /> },
      ].map((item) => (
        <ListItem
          button
          key={item.to}
          component={Link}
          to={item.to}
          onClick={() => setMobileMenuOpen(false)}
          sx={drawerRowSx}
        >
          <Box component="span" sx={{ display: 'flex', color: textMuted, mr: 1.75 }}>{item.icon}</Box>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{ sx: { fontFamily: modernFont, fontSize: '0.95rem', fontWeight: 500 } }}
          />
          {item.count > 0 && (
            <Box component="span" sx={{
              minWidth: 20, height: 20, px: 0.75, borderRadius: '999px',
              bgcolor: brandColor, color: onAccent, fontSize: '0.7rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {item.count}
            </Box>
          )}
        </ListItem>
      ))}
    </List>
  </Box>

  {/* Alt kısım: oturum durumu */}
  <Box sx={{ p: 2.5, borderTop: `1px solid ${line}` }}>
    {user ? (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.75 }}>
          <Avatar sx={{ bgcolor: brandColor, color: onAccent, width: 38, height: 38, mr: 1.5, fontSize: '0.9rem', fontWeight: 700 }}>
            {getInitials()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: modernFont, fontSize: '0.85rem', fontWeight: 600, color: textMain }}>
              Hoş geldin
            </Typography>
            <Typography sx={{
              fontFamily: modernFont, fontSize: '0.72rem', color: textMuted,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {user?.email?.toLowerCase() || ''}
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
          fullWidth
          startIcon={<Logout sx={{ fontSize: 18 }} />}
          sx={{
            fontFamily: modernFont, color: textMain, bgcolor: 'transparent',
            border: `1px solid ${line}`, borderRadius: '999px', py: 1.25,
            fontWeight: 600, fontSize: '0.85rem', textTransform: 'none',
            '&:hover': { bgcolor: surface, borderColor: textMuted }
          }}
        >
          Çıkış yap
        </Button>
      </Box>
    ) : (
      <Button
        component={Link}
        to="/login"
        onClick={() => setMobileMenuOpen(false)}
        fullWidth
        sx={{
          fontFamily: modernFont, bgcolor: brandColor, color: onAccent,
          py: 1.5, borderRadius: '999px', fontWeight: 600, fontSize: '0.9rem',
          textTransform: 'none',
          '&:hover': { bgcolor: brandHover }
        }}
      >
        Giriş yap / Üye ol
      </Button>
    )}
  </Box>
</Drawer>

      {/* --- PREMİUM TAM EKRAN ARAMA OVERLAY --- */}
      <Drawer
        anchor="top"
        open={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
        transitionDuration={400}
        PaperProps={{
          sx: { height: '100vh', bgcolor: 'rgba(19, 19, 22, 0.97)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' }
        }}
      >
        <Box sx={{ p: { xs: 3, md: 5 }, display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
            <IconButton onClick={() => { setSearchOpen(false); setSearchQuery(''); }} sx={{ color: textMain, "&:hover": { color: brandHover, transform: 'rotate(90deg)' }, transition: 'all 0.4s ease' }}>
              <CloseOutlined sx={{ fontSize: 36 }} />
            </IconButton>
        </Box>

        <Container maxWidth="lg" sx={{ mt: { xs: 12, md: 15 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <Typography sx={{ ...sharpStyle, color: textMuted, letterSpacing: '4px', fontSize: "0.85rem", mb: 2 }}>
              {BRAND.name.toUpperCase()} ARAMA
            </Typography>

            <Box component="form" onSubmit={handleSearchSubmit} sx={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
                <TextField
                    autoFocus fullWidth variant="standard"
                    placeholder={`${typedHint}|`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        disableUnderline: true, 
                        sx: { 
                            ...sharpStyle,
                            fontSize: { xs: '1.2rem', md: '2rem' }, 
                            color: textMain, 
                            textAlign: 'center',
                            '& input': { textAlign: 'center' },
                            '& input::placeholder': { opacity: 0.38, fontWeight: 700 }
                        }
                    }}
                />
                <Divider sx={{ mt: 2, mb: 6, borderColor: line, borderWidth: 1, width: '100%' }} />
            </Box>

            <Box sx={{ width: '100%', mt: 2 }}>
              {searchQuery.trim().length > 1 ? (
                liveResults.length > 0 ? (
                  <Box>
                    {/* Saf CSS grid — MUI Grid v2 sürüm farkından etkilenmez;
                        her sütun tam olarak eşit (1fr) → görseller ve kartlar eşit. */}
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                      gap: { xs: 2, sm: 4 },
                      alignItems: 'stretch'
                    }}>
                      {liveResults.map((product) => (
                        <Box
                          key={product.id}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate(`/product/${product.id}`, { state: product }); }}
                          sx={{ cursor: 'pointer', minWidth: 0, display: 'flex', flexDirection: 'column', '&:hover .nw-search-img': { transform: 'scale(1.05)' } }}
                        >
                          <Box sx={{ position: 'relative', width: '100%', paddingTop: '133%', overflow: 'hidden', mb: { xs: 1.25, sm: 2 }, bgcolor: surfaceElev }}>
                            <img src={imageUrl(product.imageUrl || product.images?.[0], 300)} alt={product.name} onError={imageFallback} className="nw-search-img" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                          </Box>
                          <Box sx={{ textAlign: 'left', px: 0.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography sx={{ ...sharpStyle, color: textMain, fontSize: '0.8rem', mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4em', lineHeight: 1.2 }}>
                              {product.name}
                            </Typography>
                            <Typography sx={{ ...sharpStyle, color: textMain, fontSize: '0.9rem', mt: 'auto' }}>
                              {Number(product.price).toFixed(2)} ₺
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                      <Button onClick={handleSearchSubmit} endIcon={<ArrowRightAltOutlined />} sx={{ ...sharpStyle, color: textMain, borderBottom: `2px solid ${textMain}`, borderRadius: 0, p: 0, pb: 0.5, '&:hover': { bgcolor: 'transparent', color: brandHover, borderColor: brandHover } }}>
                        TÜM SONUÇLARI GÖR
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ ...sharpStyle, color: textMuted, fontSize: '1rem' }}>
                      "{searchQuery}" İLE EŞLEŞEN ÜRÜN BULUNAMADI.
                    </Typography>
                  </Box>
                )
              ) : null}
            </Box>

        </Container>
      </Drawer>

      {/* KULLANICI PROFİL MENÜSÜ */}
      <Menu
        anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose} onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible', filter: 'drop-shadow(0px 10px 30px rgba(0,0,0,0.45))', mt: 1.5, width: 260, borderRadius: 0, border: `1px solid ${line}`,
            '& .MuiAvatar-root': { width: 40, height: 40, ml: -0.5, mr: 2, fontFamily: modernFont },
            '&::before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 18, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0, borderLeft: `1px solid ${line}`, borderTop: `1px solid ${line}` },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center' }}>
         <Avatar sx={{ bgcolor: brandColor, fontSize: '1rem', fontWeight: 700, mr: 2, borderRadius: '50%' }}>{getInitials()}</Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ ...sharpStyle, fontSize: '0.9rem', color: textMain, lineHeight: 1.2 }}>
              {userData ? `${userData.firstName} ${userData.lastName}` : 'Hoş geldin!'}
            </Typography>
           <Typography 
  noWrap 
  sx={{ 
    ...sharpStyle, 
    color: textMuted, 
    fontSize: '0.7rem', 
    mt: 0.5,
    textTransform: 'lowercase !important' // CSS önceliğini zorla
  }}
>
  {user?.email?.toLowerCase() || ''}
</Typography>
          </Box>
        </Box>
        
        <Divider sx={{ borderColor: line, my: 1 }} />
        <MenuItem onClick={() => navigate('/siparislerim')} sx={{ py: 1.5, px: 2.5, '&:hover': { bgcolor: surface } }}>
          <ListItemIcon><ShoppingBagOutlined fontSize="small" sx={{ color: textMain }} /></ListItemIcon>
          <Typography sx={{ ...sharpStyle, color: textMain, fontSize: '0.8rem' }}>SİPARİŞLERİM</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2.5, '&:hover': { bgcolor: surface } }}>
          <ListItemIcon><Logout fontSize="small" sx={{ color: textMain }} /></ListItemIcon>
          <Typography sx={{ ...sharpStyle, color: textMain, fontSize: '0.8rem' }}>ÇIKIŞ YAP</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}