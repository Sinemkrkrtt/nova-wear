import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// --- ADMİN SAYFALARI VE İSKELETİ ---
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Marketing from './pages/Marketing';

// --- MÜŞTERİ SAYFASI BİLEŞENLERİ ---
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import NewArrivals from './components/NewArrivals';
import TrustBar from './components/TrustBar';
import PopularCollection from './components/PopularCollection';
import Footer from './components/Footer';
import { fetchNewArrivals, fetchBestSellers } from './utils/catalog';

// --- İÇ SAYFALAR ---
import CategoryPage from './pages/CategoryPage';
import CollectionPage from './pages/CollectionPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage'; 
import ProductDetail from './components/ProductDetail';
import CustomerLogin from './pages/CustomerLogin';

// --- BİLGİLENDİRME VE POLİTİKA SAYFALARI ---
import KargoTakip from './pages/KargoTakip';
import FaqPage from './pages/FaqPage';
import IadeDegisim from './pages/IadeDegisim';
import Kvkk from './pages/Kvkk';
import GizlilikPolitikası from './pages/GizlilikPolitikasi';
import DistanceSellingContract from './pages/DistanceSellingContract';
import OnBilgilendirmeFormu from './pages/OnBilgilendirmeFormu';

import SearchResults from './pages/Arama';
import PaymentResult from './pages/PaymentResult';
import MyOrders from './pages/MyOrders';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* 1. MÜŞTERİ EKRANI (Ana Sayfa) */}
          <Route 
            path="/" 
            element={
              /* nw-page: Nova Wear'in yeni koyu temasi. Ic sayfalar henuz
                 devralinan nw-page duzenini kullaniyor. */
              <div className="nw-page">
                <Navbar />
                <Hero />
                <NewArrivals />
                <TrustBar />
                <PopularCollection />
                <Footer />
              </div>
            } 
          />

          {/* MÜŞTERİ İÇ SAYFALARI */}
          <Route 
            path="/product/:id" 
            element={
              <div className="nw-page">
                <Navbar />
                <ProductDetail />
                <Footer />
              </div>
            } 
          />
          <Route path="/kategori/:categoryName" element={<CategoryPage />} />

          {/* KOLEKSİYON SAYFALARI — ana sayfadaki "Tümünü gör" bağlantıları
              buraya gelir. İkisi de aynı CollectionPage iskeletini kullanır,
              yalnızca hangi veriyi çektikleri farklıdır. */}
          <Route
            path="/yeni-gelenler"
            element={
              <CollectionPage
                title="Yeni gelenler"
                subtitle="Bu sezon rafa çıkan son parçalar"
                badge="YENİ"
                load={() => fetchNewArrivals(60)}
                empty={{
                  icon: (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3v18M3 12h18" />
                    </svg>
                  ),
                  title: 'Henüz yeni ürün yok',
                  text: 'Bu sezonun ilk parçaları eklendiğinde burada listelenecek.',
                  primary: { label: 'Çok satanlar', to: '/cok-satanlar' },
                  secondary: { label: 'Ana sayfa', to: '/' },
                }}
              />
            }
          />
          <Route
            path="/cok-satanlar"
            element={
              <CollectionPage
                title="Çok satanlar"
                subtitle="En çok tercih edilen parçalar"
                load={() => fetchBestSellers(60)}
                empty={{
                  icon: (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" />
                    </svg>
                  ),
                  title: 'Henüz satış verisi yok',
                  text: 'Siparişler gelmeye başladıkça en çok tercih edilen parçalar burada sıralanacak.',
                  primary: { label: 'Yeni gelenler', to: '/yeni-gelenler' },
                  secondary: { label: 'Ana sayfa', to: '/' },
                }}
              />
            }
          />
          <Route path="/favoriler" element={<FavoritesPage />} />
          <Route path="/sepet" element={<CartPage />} />
          <Route path="/siparislerim" element={<MyOrders />} />
          <Route path="/login" element={<CustomerLogin />} />

          {/* FOOTER BİLGİLENDİRME VE POLİTİKA SAYFALARI */}
          <Route path="/kargo-takip" element={<KargoTakip />} />
          <Route path="/sikca-sorulan-sorular" element={<FaqPage />} />
          <Route path="/iade-degisim" element={<IadeDegisim />} />
          <Route path="/kvkk" element={<Kvkk />} />
          <Route path="/gizlilik-politikasi" element={<GizlilikPolitikası />} />
          <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSellingContract />} />
          <Route path="/on-bilgilendirme-formu" element={<OnBilgilendirmeFormu />} />

          <Route path="/arama" element={<SearchResults />} />

          <Route path="/odeme-sonucu" element={<PaymentResult />} />

          {/* 2. ADMİN GİRİŞ SAYFASI */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* 3. KORUMALI ADMİN SAYFALARI */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/marketing" element={<Marketing />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/products" element={<Products />} />
            </Route>
          </Route>

          {/* 4. 404 — TANIMSIZ TÜM ROTALAR */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;