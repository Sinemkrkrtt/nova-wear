import React, { useState, useEffect } from 'react';
// EKLENDİ: useParams URL'deki ID'yi yakalamak için import edildi
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Button, IconButton, Divider, Card, CardMedia, CardContent,
    Stack, Accordion, AccordionSummary, AccordionDetails, Chip,
    Snackbar, Alert, useTheme, useMediaQuery, CircularProgress // EKLENDİ: Yükleniyor animasyonu için CircularProgress
} from "@mui/material";

import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// EKLENDİ: Tekil ürünü çekmek için doc ve getDoc eklendi
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { imageUrl, imageFallback } from '../utils/storage';

function ProductDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    // EKLENDİ: URL'den ürün ID'sini alıyoruz (Örn: /product/123456 -> id=123456)
    const { id } = useParams(); 
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); 
    const isTablet = useMediaQuery(theme.breakpoints.down('md')); 
    
    const visibleCount = isTablet ? 3 : 4;

    // DEĞİŞTİRİLDİ: Artık product sabit bir değişken değil, bir state. Yüklenme durumu da eklendi.
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [newProducts, setNewProducts] = useState([]);
    const [favoritesList, setFavoritesList] = useState([]);
    const [sliderIndex, setSliderIndex] = useState(0);

    const brandFont = 'var(--nw-font-display)';
    const colors = {
        primary: "var(--nw-accent)",
        primaryHover: "var(--nw-accent-hover)", 
        secondary: "var(--nw-accent-hover)", 
        bgLight: "var(--nw-bg-elev)", 
        bgCard: "var(--nw-accent-soft)", 
        textMain: "var(--nw-text)", 
        textMuted: "var(--nw-text-dim)", 
        border: "var(--nw-line)"
    };

    const priorityCategories = ["Nişan & Söz", "Mezuniyet & Balo", "Kokteyl & Parti", "Abiye"];

    const getProductColor = (item) => {
        if (!item) return "";
        return item.color || item.selectedColor || item.renk || item.Renk || (item.variants && item.variants.length > 0 ? item.variants[0].color : "");
    };

    // YENİ EKLENEN YAPI: Site içinden mi geldi yoksa dışarıdan linkle mi?
    useEffect(() => {
        const loadProduct = async () => {
            setIsLoading(true);
            
            // Eğer site içinden tıklandıysa (location.state doluysa) veritabanına gitmeye gerek yok
            if (location.state) {
                setProduct(location.state);
                setIsLoading(false);
            } 
            // Eğer dışarıdan Instagram/WhatsApp vb. linkiyle gelindiyse URL'deki id ile ürünü bul
            else if (id) {
                try {
                    const docRef = doc(db, 'products', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setProduct({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        setProduct(null); // Ürün gerçekten silinmişse
                    }
                } catch (error) {
                    console.error("Firebase'den ürün çekilirken hata:", error);
                    setProduct(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        loadProduct();
    }, [location.state, id]);


   // Mevcut UseEffect: Sadece product başarıyla yüklendikten SONRA çalışır
   useEffect(() => {
        if (product) {
            const storedFavs = JSON.parse(localStorage.getItem('myFavorites') || '[]');
            setIsFavorite(!!storedFavs.find(item => item.id === product.id));
            setFavoritesList(storedFavs);
            setSelectedSize(""); 
            setQuantity(1);
            setCurrentImageIndex(0); // Yeni ürüne geçildiğinde ilk görsele sıfırla

            const fetchNewProducts = async () => {
                try {
                    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(25));
                    const querySnapshot = await getDocs(q);
                    
                    const productsData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    const inStockProducts = productsData.filter(item => {
                        if (item.id === product?.id) return false;
                        const itemTotalStock = (item.variants && item.variants.length > 0) 
                            ? item.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) 
                            : 0;
                        return itemTotalStock > 0;
                    });

                    setNewProducts(inStockProducts.slice(0, 12));
                    
                } catch (error) {
                    console.error("Yeni ürünler çekilemedi:", error);
                }
            };

            fetchNewProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        }
    }, [product]);

    useEffect(() => {
        if (!isMobile && sliderIndex + visibleCount > newProducts.length) {
            setSliderIndex(Math.max(0, newProducts.length - visibleCount));
        }
    }, [visibleCount, newProducts.length, sliderIndex, isMobile]);

    const toggleFavorite = () => {
        const storedFavs = JSON.parse(localStorage.getItem('myFavorites') || '[]');
        let updatedFavs;
        if (isFavorite) {
            updatedFavs = storedFavs.filter(item => item.id !== product.id);
        } else {
            updatedFavs = [...storedFavs, product];
        }
        localStorage.setItem('myFavorites', JSON.stringify(updatedFavs));
        setIsFavorite(!isFavorite);
        setFavoritesList(updatedFavs);
    };

    const toggleCardFavorite = (e, item) => {
        e.stopPropagation();
        let updatedFavs;
        if (favoritesList.find(fav => fav.id === item.id)) {
            updatedFavs = favoritesList.filter(fav => fav.id !== item.id);
        } else {
            updatedFavs = [...favoritesList, item];
        }
        setFavoritesList(updatedFavs);
        localStorage.setItem('myFavorites', JSON.stringify(updatedFavs));
    };

    const handleAddToCart = () => {
        const storedCart = JSON.parse(localStorage.getItem('myCart') || '[]');
        let updatedCart = [...storedCart];
        const existingItemIndex = updatedCart.findIndex(item =>
            item.id === product.id && item.selectedSize === selectedSize
        );

        const productColor = getProductColor(product);

        if (existingItemIndex > -1) {
            updatedCart[existingItemIndex].quantity += quantity;
        } else {
            updatedCart.push({
                ...product,
                name: product.name, 
                quantity: quantity,
                selectedSize: selectedSize || "Standart",
                color: productColor 
            });
        }
        localStorage.setItem('myCart', JSON.stringify(updatedCart));
        setOpenSnackbar(true);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const handleCardAddToCart = (e, item) => {
        e.stopPropagation();
        const storedCart = JSON.parse(localStorage.getItem('myCart') || '[]');
        let updatedCart = [...storedCart];
        const existingItemIndex = updatedCart.findIndex(cartItem => cartItem.id === item.id);

        const itemColor = getProductColor(item);

        if (existingItemIndex > -1) {
            updatedCart[existingItemIndex].quantity = (updatedCart[existingItemIndex].quantity || 1) + 1;
        } else {
            updatedCart.push({ 
                ...item, 
                name: item.name,
                quantity: 1, 
                selectedSize: "Standart",
                color: itemColor 
            });
        }

        localStorage.setItem('myCart', JSON.stringify(updatedCart));
        alert(`${item.name} sepete eklendi!`);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };

    // EKLENDİ: Firebase'den veri çekilirken gösterilecek ekran
    if (isLoading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: colors.primary, mb: 2 }} />
                <Typography variant="h6" sx={{ color: colors.textMain, fontFamily: brandFont }}>Ürün yükleniyor...</Typography>
            </Box>
        );
    }

    // Ürün hala yoksa (silinmişse veya yanlış linkse) gösterilecek hata ekranı
    if (!product) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ color: colors.primary, fontFamily: brandFont, fontWeight: 700, mb: 2 }}>Ürün verisi bulunamadı.</Typography>
                <Typography variant="body1" sx={{ color: colors.textMuted, fontFamily: brandFont, mb: 3 }}>Aradığınız ürün yayından kaldırılmış veya bağlantı hatalı olabilir.</Typography>
                <Button variant="outlined" onClick={() => navigate('/')} sx={{ mt: 2, color: colors.primary, borderColor: colors.primary, fontFamily: brandFont, '&:hover':{ bgcolor: colors.bgCard } }}>Ana Sayfaya Dön</Button>
            </Box>
        );
    }

    const displayImages = product.images && product.images.length > 0 
        ? product.images 
        : [product.imageUrl].filter(Boolean);

    const handleNextImage = () => setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    const handlePrevImage = () => setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

    let displayCategory = "YENİ";
    if (product.category) {
        if (Array.isArray(product.category) && product.category.length > 0) {
            displayCategory = product.category[0].toUpperCase();
        } else if (typeof product.category === 'string') {
            displayCategory = product.category.toUpperCase();
        }
    }

    const lowerName = product.name ? product.name.toLowerCase() : "";
    const isShoe = (lowerName.includes("shoe") || lowerName.includes("sneaker") || lowerName.includes("boot") || lowerName.includes("ayakkabı"));
    const isAccessory = (lowerName.includes("bag") || lowerName.includes("watch") || lowerName.includes("glass") || lowerName.includes("çanta"));

    const clothingSizes = ["XS", "S", "M", "L", "XL"];
    const shoeSizes = ["37", "38", "39", "40", "41"];
    const masterSizes = isShoe ? shoeSizes : clothingSizes;

    const totalStock = (product.variants && product.variants.length > 0) 
        ? product.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) 
        : 0;
    const isOutOfStock = totalStock === 0;

    const selectedVariant = product.variants?.find(v => v.size?.toUpperCase() === selectedSize);
    const selectedVariantStock = selectedVariant ? (Number(selectedVariant.stock) || 0) : 0;

    const handleIncrease = () => {
        if (!selectedSize && isAccessory) setQuantity(prev => prev + 1);
        else if (quantity < selectedVariantStock) setQuantity(prev => prev + 1);
    };
    const handleDecrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const handleNextSlider = () => {
        if (sliderIndex + visibleCount < newProducts.length) setSliderIndex(sliderIndex + 1);
    };
    const handlePrevSlider = () => {
        if (sliderIndex > 0) setSliderIndex(sliderIndex - 1);
    };

    const productsToRender = isMobile ? newProducts : newProducts.slice(sliderIndex, sliderIndex + visibleCount);

    const mainProductColor = getProductColor(product);

    return (
        <Box sx={{ backgroundColor: colors.bgLight, minHeight: "calc(100vh - 80px)", py: { xs: 4, md: 8 }, overflowX: 'hidden' }}>
            
            {/* ÜST KISIM: ÜRÜN DETAYI */}
            <Box sx={{ 
                display: "flex", flexDirection: { xs: "column", md: "row" }, width: "100%", maxWidth: "1300px", 
                mx: "auto", px: { xs: 2, md: 4 }, gap: { xs: 3, md: 8 }, mb: { xs: 8, md: 12 }
            }}>
                
                {/* SOL YARI: GÖRSELLER */}
                <Box sx={{ flex: "1 1 50%", display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 2, height: { xs: "auto", md: "85vh" } }}>
                    
                    {displayImages.length > 1 && (
                        <Stack direction={{ xs: "row", md: "column" }} spacing={1.5} sx={{ overflowY: { xs: 'hidden', md: 'auto' }, overflowX: { xs: 'auto', md: 'hidden' }, pr: { md: 1 }, pb: { xs: 1, md: 0 }, height: { md: "100%" }, '&::-webkit-scrollbar': { width: '4px', height: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: colors.border, borderRadius: '4px' } }}>
                            {displayImages.map((img, index) => (
                                <Box key={index} onClick={() => setCurrentImageIndex(index)} component="img" src={img} sx={{ width: { xs: "65px", md: "80px" }, minWidth: { xs: "65px", md: "80px" }, height: { xs: "85px", md: "110px" }, objectFit: "cover", objectPosition: "top center", borderRadius: "8px", cursor: "pointer", border: currentImageIndex === index ? `2px solid ${colors.primary}` : `1px solid transparent`, opacity: currentImageIndex === index ? 1 : 0.6, transition: "all 0.2s ease-in-out", '&:hover': { opacity: 1, transform: "scale(1.05)" } }} />
                            ))}
                        </Stack>
                    )}

                    <Box sx={{ flex: 1, height: { xs: "60vh", sm: "70vh", md: "100%" }, borderRadius: { xs: "12px", md: "16px" }, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.bgCard, width: "100%" }}>
                        {isOutOfStock ? (
                            <Chip 
                                label="STOKTA YOK" 
                                sx={{ position: "absolute", top: { xs: 16, md: 24 }, left: { xs: 16, md: 24 }, bgcolor: "var(--nw-danger)", color: "var(--nw-on-accent)", fontWeight: "700", fontFamily: brandFont, borderRadius: "50px", height: "26px", fontSize: { xs: "0.7rem", md: "0.8rem" }, letterSpacing: 1, px: 1, zIndex: 2 }} 
                            />
                        ) : (
                            <Chip 
                                label={displayCategory} 
                                sx={{ position: "absolute", top: { xs: 16, md: 24 }, left: { xs: 16, md: 24 }, bgcolor: colors.primary, color: "var(--nw-on-accent)", fontWeight: "600", fontFamily: brandFont, borderRadius: "50px", height: "26px", fontSize: { xs: "0.65rem", md: "0.75rem" }, letterSpacing: 1, px: 1, zIndex: 2 }} 
                            />
                        )}
                        
                        {displayImages.length > 1 && (
                            <IconButton onClick={handlePrevImage} sx={{ position: 'absolute', left: { xs: 8, md: 16 }, zIndex: 3, bgcolor: 'rgba(255, 255, 255, 0.9)', width: { xs: 35, md: 40 }, height: { xs: 35, md: 40 }, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', '&:hover': { bgcolor: 'var(--nw-surface)', color: colors.primary } }}>
                                <ArrowBackIosNewIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                            </IconButton>
                        )}

                        <Box component="img" src={imageUrl(displayImages[currentImageIndex], 1000)} alt={product.name} onError={imageFallback}
                            sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", transition: "transform 0.4s ease-in-out", "&:hover": { transform: "scale(1.03)" }, filter: isOutOfStock ? "grayscale(40%)" : "none" }}
                        />

                        {displayImages.length > 1 && (
                            <IconButton onClick={handleNextImage} sx={{ position: 'absolute', right: { xs: 8, md: 16 }, zIndex: 3, bgcolor: 'rgba(255, 255, 255, 0.9)', width: { xs: 35, md: 40 }, height: { xs: 35, md: 40 }, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', '&:hover': { bgcolor: 'var(--nw-surface)', color: colors.primary } }}>
                                <ArrowForwardIosIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                {/* SAĞ YARI: ÜRÜN BİLGİLERİ */}
                <Box sx={{ flex: "1 1 50%", display: "flex", flexDirection: "column", justifyContent: "center", height: { md: "85vh" }, pt: { xs: 2, md: 0 } }}>
                    <Box sx={{ width: "100%", maxWidth: "550px", mx: { xs: "auto", md: 0 } }}>
                        
                        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 42 }, fontWeight: 600, mb: 1, fontFamily: brandFont, color: colors.textMain, lineHeight: 1.1 }}>
                            {product.name} {mainProductColor ? `- ${mainProductColor}` : ""}
                        </Typography>

                        <Typography variant="h3" sx={{ color: isOutOfStock ? "var(--nw-text-faint)" : colors.primary, fontFamily: brandFont, fontWeight: 700, fontSize: { xs: "1.6rem", md: "2.2rem" }, mb: { xs: 3, md: 4 }, mt: 1, textDecoration: isOutOfStock ? "line-through" : "none" }}>{product.price} ₺</Typography>

                        <Divider sx={{ mb: { xs: 3, md: 4 }, borderColor: colors.border }} />

                        {/* BEDEN SEÇİMİ */}
                        {!isAccessory && (
                            <Box sx={{ mb: { xs: 3, md: 4 }, width: "100%" }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontFamily: brandFont, letterSpacing: 0.5, color: colors.textMain, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                                        {isShoe ? "NUMARA SEÇİN" : "BEDEN SEÇİN"}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                                    {masterSizes.map((size) => {
                                        const variantForSize = product.variants?.find(v => v.size?.toUpperCase() === size);
                                        const sizeStock = variantForSize ? (Number(variantForSize.stock) || 0) : 0;
                                        const isAvailable = sizeStock > 0 && !isOutOfStock; 
                                        
                                        return (
                                            <Button
                                                key={size} disabled={!isAvailable} onClick={() => { setSelectedSize(size); setQuantity(1); }}
                                                sx={{
                                                    minWidth: { xs: "48px", md: "60px" }, flex: { xs: "1 1 calc(20% - 8px)", sm: 1 }, 
                                                    height: { xs: "46px", md: "54px" }, borderRadius: "8px", border: "1px solid",
                                                    borderColor: selectedSize === size ? colors.primary : colors.border,
                                                    color: selectedSize === size ? "var(--nw-on-accent)" : colors.textMain,
                                                    backgroundColor: selectedSize === size ? colors.primary : "transparent",
                                                    fontSize: { xs: "1rem", md: "1.2rem" }, fontFamily: brandFont, fontWeight: selectedSize === size ? 700 : 500, transition: "all 0.2s",
                                                    "&:hover": { backgroundColor: selectedSize === size ? colors.primaryHover : colors.bgLight, borderColor: colors.primary },
                                                    "&.Mui-disabled": { color: "var(--nw-text-faint)", borderColor: "var(--nw-line)", textDecoration: "line-through", backgroundColor: "transparent" }
                                                }}
                                            >
                                                {size}
                                            </Button>
                                        );
                                    })}
                                </Stack>
                                {!selectedSize && !isOutOfStock && (
                                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontSize: '0.85rem', fontFamily: brandFont }}>Lütfen bir beden seçiniz.</Typography>
                                )}
                            </Box>
                        )}

                        <Stack direction="row" spacing={2} sx={{ mb: { xs: 3, md: 4 }, width: "100%" }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: "8px", px: 1, height: { xs: "54px", md: "64px" }, flexGrow: 0, opacity: (isOutOfStock || (!isAccessory && !selectedSize)) ? 0.5 : 1, pointerEvents: (isOutOfStock || (!isAccessory && !selectedSize)) ? "none" : "auto" }}>
                                <IconButton onClick={handleDecrease} disabled={isOutOfStock}><RemoveIcon sx={{ color: colors.textMain, fontSize: { xs: 20, md: 24 } }} /></IconButton>
                                <Typography sx={{ px: { xs: 2, md: 3 }, fontWeight: 600, fontSize: { xs: "1.2rem", md: "1.4rem" }, fontFamily: brandFont, color: colors.textMain }}>{quantity}</Typography>
                                <IconButton onClick={handleIncrease} disabled={isOutOfStock}><AddIcon sx={{ color: colors.textMain, fontSize: { xs: 20, md: 24 } }} /></IconButton>
                            </Box>

                            <IconButton onClick={toggleFavorite} sx={{ border: `1px solid ${colors.border}`, borderRadius: "8px", width: { xs: "54px", md: "64px" }, height: { xs: "54px", md: "64px" }, color: colors.textMuted, transition: "0.2s", "&:hover": { backgroundColor: colors.bgCard, color: colors.secondary, borderColor: colors.secondary } }}>
                                {isFavorite ? <FavoriteIcon sx={{ color: colors.secondary }} /> : <FavoriteBorderIcon />}
                            </IconButton>
                        </Stack>

                        <Box sx={{ width: "100%", mb: { xs: 4, md: 5 } }}>
                            <Button
                                fullWidth variant="contained" onClick={handleAddToCart} disabled={isOutOfStock || (!isAccessory && !selectedSize)}
                                sx={{
                                    backgroundColor: isOutOfStock ? "var(--nw-danger)" : colors.primary, color: "var(--nw-on-accent)", 
                                    height: { xs: "56px", md: "64px" }, fontSize: { xs: "1.1rem", md: "1.3rem" }, fontFamily: brandFont, fontWeight: 600, letterSpacing: 1, borderRadius: "8px", 
                                    boxShadow: isOutOfStock ? "none" : "0 4px 14px rgba(155, 112, 255, 0.25)",
                                    "&:hover": { backgroundColor: isOutOfStock ? "var(--nw-danger)" : colors.primaryHover, boxShadow: isOutOfStock ? "none" : "0 6px 20px rgba(155, 112, 255, 0.4)" },
                                    "&:disabled": { backgroundColor: isOutOfStock ? "var(--nw-danger)" : "var(--nw-surface-2)", color: isOutOfStock ? "var(--nw-on-accent)" : "var(--nw-text-faint)", boxShadow: "none", opacity: isOutOfStock ? 0.9 : 1 }
                                }}
                            >
                                {isOutOfStock ? "STOKTA YOK" : "Sepete Ekle"}
                            </Button>
                        </Box>

                        <Box sx={{ borderTop: `1px solid ${colors.border}`, width: "100%" }}>
                            <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, borderBottom: `1px solid ${colors.border}`, bgcolor: 'transparent' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textMain }} />} sx={{ px: 0, py: { xs: 0, md: 1 } }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textMain, letterSpacing: 0.5, fontFamily: brandFont, fontSize: { xs: "1rem", md: "1.1rem" } }}>ÜRÜN DETAYLARI</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                                    <Typography variant="body1" sx={{ color: colors.textMuted, lineHeight: 1.8, fontFamily: brandFont, fontSize: { xs: "1rem", md: "1.1rem" } }}>
                                        {product.description ? product.description : "Zarif silueti ve modern kesimi ile öne çıkar."}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                            <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, borderBottom: `1px solid ${colors.border}`, bgcolor: 'transparent' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textMain }} />} sx={{ px: 0, py: { xs: 0, md: 1 } }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textMain, letterSpacing: 0.5, fontFamily: brandFont, fontSize: { xs: "1rem", md: "1.1rem" } }}>TESLİMAT VE İADE</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                                    <Typography variant="body1" sx={{ color: colors.textMuted, lineHeight: 1.8, fontFamily: brandFont, fontSize: { xs: "1rem", md: "1.1rem" } }}>
                                        Siparişleriniz ortalama 1-3 iş günü içinde kargoya verilir. Kullanılmamış, etiketi ve varsa hijyen/güvenlik bandı çıkarılmamış ürünler için teslim tarihinden itibaren 14 gün içinde cayma (iade) hakkınız bulunmaktadır. Tüm fiyatlarımıza KDV dahildir.
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ALT KISIM: YENİ GELENLER */}
            {newProducts.length > 0 && (
                <Box sx={{ textAlign: "center", mt: { xs: 4, md: 8 }, pt: { xs: 4, md: 8 }, pb: 6, borderTop: `1px solid ${colors.border}`, maxWidth: "1300px", mx: "auto", px: { xs: 1, md: 4 } }}>
                    
                    <Box sx={{ mb: { xs: 4, md: 6 } }}>
                        <Typography variant="h3" sx={{ fontFamily: brandFont, color: colors.textMain, fontWeight: 700, mb: 1, fontSize: { xs: "2rem", md: "3rem" } }}>
                            Yeni Gelenler
                        </Typography>
                        <Typography variant="body1" sx={{ color: colors.textMuted, fontFamily: brandFont, fontStyle: "italic", fontSize: { xs: "1rem", md: "1.2rem" } }}>
                            En yeni tasarımlarımızla tarzını tazele.
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: "100%" }}>
                        
                        {!isMobile && (
                            <IconButton 
                                onClick={handlePrevSlider} disabled={sliderIndex === 0} 
                                sx={{ width: 50, height: 50, bgcolor: "var(--nw-surface)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", color: "var(--nw-text-dim)", mr: 2, "&:hover": { bgcolor: "var(--nw-bg-elev)", color: colors.primary }, "&:disabled": { opacity: 0.3 } }}
                            >
                                <ArrowBackIosNewIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        )}

                        <Box sx={{ 
                            display: 'flex', gap: { xs: 2, md: 3 }, width: '100%', overflowX: { xs: 'auto', md: 'hidden' }, 
                            scrollSnapType: { xs: 'x mandatory', md: 'none' }, scrollBehavior: 'smooth', pb: { xs: 2, md: 0 }, '&::-webkit-scrollbar': { display: 'none' } 
                        }}>
                            {productsToRender.map((item) => {
                                let cardCategory = "";
                                if (Array.isArray(item.category)) {
                                    cardCategory = item.category.find(cat => priorityCategories.includes(cat)) || item.category[0];
                                } else {
                                    cardCategory = item.category || "";
                                }

                                const cardTotalStock = (item.variants && item.variants.length > 0) ? item.variants.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) : 0;
                                const cardOutOfStock = cardTotalStock === 0;
                                const cardImage = item.images && item.images.length > 0 ? item.images[0] : item.imageUrl;
                                
                                const cardColor = getProductColor(item);
                                const displayCardName = cardColor ? `${item.name} - ${cardColor}` : item.name;
                                const truncatedCardName = displayCardName.length > 20 && isMobile ? displayCardName.substring(0, 20) + "..." : displayCardName;

                                return (
                                    <Box key={item.id} sx={{ minWidth: { xs: 'calc(50% - 8px)', md: '0' }, flex: { xs: '0 0 auto', md: '1 1 0' }, scrollSnapAlign: 'start' }}>
                                        <Card onClick={() => navigate(`/product/${item.id}`, { state: item })} elevation={0} sx={{ borderRadius: { xs: 2, md: 4 }, textAlign: "left", bgcolor: "var(--nw-surface)", height: "100%", width: "100%", display: "flex", flexDirection: "column", position: "relative", cursor: "pointer", border: "1px solid var(--nw-line)", transition: "all 0.3s ease", overflow: "hidden", "&:hover": { transform: "translateY(-5px)", boxShadow: "0 15px 30px rgba(155, 112, 255, 0.08)", borderColor: "var(--nw-line)" }, "&:hover .product-image": { transform: "scale(1.08)" } }}>
                                           
                                           {cardOutOfStock ? (
                                                <Chip label="STOKTA YOK" size="small" sx={{ position: "absolute", top: { xs: 8, md: 15 }, left: { xs: 8, md: 15 }, zIndex: 2, bgcolor: "var(--nw-danger)", color: "var(--nw-on-accent)", fontWeight: 700, fontFamily: brandFont, fontSize: { xs: "0.6rem", md: "0.7rem" }, borderRadius: "50px", letterSpacing: 0.5, px: 0.5 }} />
                                            ) : (
                                                <Chip label="YENİ" size="small" sx={{ position: "absolute", top: { xs: 8, md: 15 }, left: { xs: 8, md: 15 }, zIndex: 2, bgcolor: colors.primary, color: "var(--nw-on-accent)", fontWeight: 700, fontFamily: brandFont, fontSize: { xs: "0.6rem", md: "0.7rem" }, borderRadius: "50px", letterSpacing: 0.5, px: 0.5 }} />
                                            )}
                                            
                                            <IconButton sx={{ position: "absolute", top: { xs: 4, md: 10 }, right: { xs: 4, md: 10 }, zIndex: 2, width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 }, bgcolor: "rgba(255,255,255,0.9)", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", "&:hover": { bgcolor: "var(--nw-surface)", color: colors.primary } }} onClick={(e) => toggleCardFavorite(e, item)}>
                                                {favoritesList.find(fav => fav.id === item.id) ? <FavoriteIcon sx={{ color: colors.primary, fontSize: { xs: 18, md: 22 } }} /> : <FavoriteBorderIcon sx={{ color: "var(--nw-text-faint)", fontSize: { xs: 18, md: 22 } }} />}
                                            </IconButton>

                                            <Box sx={{ width: "100%", paddingTop: "133.33%", position: "relative", overflow: "hidden", bgcolor: "var(--nw-bg-elev)" }}>
                                                <CardMedia className="product-image" component="img" image={imageUrl(cardImage, 500)} alt={item.name} onError={imageFallback} sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", transition: "transform 0.5s ease", filter: cardOutOfStock ? "grayscale(40%)" : "none" }} />
                                            </Box>

                                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", p: { xs: 1.5, md: 2.5 } }}>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily: brandFont, color: "var(--nw-text)", fontSize: { xs: "1rem", md: "1.15rem" }, lineHeight: 1.3, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.6em' }}>
                                                        {truncatedCardName}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: colors.textMuted, fontFamily: brandFont, fontSize: { xs: "0.85rem", md: "0.95rem" } }}>{cardCategory}</Typography>
                                                </Box>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: { xs: 1, md: 2 } }}>
                                                    <Typography sx={{ color: cardOutOfStock ? "var(--nw-text-faint)" : colors.textMain, fontWeight: 700, fontFamily: brandFont, fontSize: { xs: "1rem", md: "1.2rem" }, textDecoration: cardOutOfStock ? "line-through" : "none" }}>{item.price} ₺</Typography>
                                                    
                                                    <Button 
                                                        disabled={cardOutOfStock} onClick={(e) => handleCardAddToCart(e, item)} variant="outlined" 
                                                        sx={{ 
                                                            borderRadius: "50%", minWidth: { xs: 32, md: 40 }, width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 }, p: 0,
                                                            borderColor: colors.border, color: colors.textMuted, transition: '0.2s',
                                                            "&:hover": { bgcolor: colors.primary, color: "var(--nw-on-accent)", borderColor: colors.primary },
                                                            "&:disabled": { borderColor: "var(--nw-line)", bgcolor: "var(--nw-bg-elev)", color: "var(--nw-text-faint)" }
                                                        }}
                                                    >
                                                        <ShoppingBagOutlinedIcon sx={{ fontSize: { xs: 16, md: 20 } }} />
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                );
                            })}
                        </Box>

                        {!isMobile && (
                            <IconButton onClick={handleNextSlider} disabled={sliderIndex + visibleCount >= newProducts.length} sx={{ width: 50, height: 50, bgcolor: "var(--nw-surface)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", color: "var(--nw-text-dim)", ml: 2, opacity: sliderIndex + visibleCount >= newProducts.length ? 0.3 : 1, "&:hover": { bgcolor: "var(--nw-bg-elev)", color: colors.primary } }}>
                                <ArrowForwardIosIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            )}

            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity="success" variant="filled" sx={{ width: '100%', bgcolor: colors.primary, fontFamily: brandFont }}>
                    Ürün sepete başarıyla eklendi!
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ProductDetail;