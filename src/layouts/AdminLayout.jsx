import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/config/firebase';

import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import BRAND from '../config/brand';

const AdminLayout = () => {
  // Giriş yapan yöneticinin bilgisi (üst barda gösterilir).
  const { user } = useAuth();
  const adminEmail = user?.email || '';
  const adminInitial = (adminEmail[0] || 'A').toUpperCase();

  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobil ekran algılama (breakpoint: 768px)
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  // Mobilde kenar menüyü aç/kapat (off-canvas drawer)
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Yönetim panelindeyken sekme başlığı da değişsin.
  useEffect(() => {
    const previous = document.title;
    document.title = `${BRAND.name} · Yönetim Paneli`;
    return () => { document.title = previous; };
  }, []);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false); // masaüstüne geçince drawer'ı kapat
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Masaüstünde daraltma; mobilde tam genişlik menü
  const effectiveCollapsed = isMobile ? false : isCollapsed;

  const handleMenuButton = () => {
    if (isMobile) setMobileOpen(prev => !prev);
    else setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin-login');
  };

  // Kurumsal SVG İkonlar (Emojiler yerine)
  const menuItems = [
    { 
      path: '/admin', 
      label: 'Genel Bakış',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    { 
      path: '/admin/products', 
      label: 'Ürün Yönetimi',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
    },
    { 
      path: '/admin/orders', 
      label: 'Siparişler',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
    },
    { 
      path: '/admin/marketing', 
      label: 'Banner & Kupon',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--nw-bg)', fontFamily: 'var(--nw-font-body)' }}>

      {/* MOBİL KARARTMA (Drawer açıkken arka plana tıklayınca kapanır) */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 40 }}
        />
      )}

      {/* ================= SOL MENÜ (SIDEBAR) ================= */}
      <aside style={{
        width: effectiveCollapsed ? '80px' : '260px',
        backgroundColor: 'var(--nw-surface)',
        display: 'flex',
        flexDirection: 'column',
        transition: isMobile ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid var(--nw-line)',
        zIndex: isMobile ? 50 : 10,
        // Mobilde off-canvas drawer: ekran dışından kayar, içeriği kaplamaz
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: mobileOpen ? '0 10px 25px rgba(0,0,0,0.15)' : 'none'
        } : {})
      }}>
        
        {/* LOGO ALANI (Büyütüldü ve Ortalatıldı) */}
        <div style={{ 
          height: '70px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderBottom: '1px solid var(--nw-line)',
          overflow: 'hidden'
        }}>
          {/* Menü daraldığında yazı sığmıyor, yalnızca halka işareti gösteriliyor. */}
          <Logo size="nav" markOnly={effectiveCollapsed} />
        </div>
        
        {/* MENÜ LİNKLERİ */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 14px', gap: '6px' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path; 
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (isMobile) setMobileOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--nw-accent)' : 'var(--nw-text-dim)', // Aktifse Kurumsal Mor, değilse Gri
                  backgroundColor: isActive ? 'var(--nw-accent-soft)' : 'transparent',
                  borderRadius: 'var(--nw-r-sm)',
                  // Aktif sayfayı belirginleştiren sol kenar çubuğu. Ayrı bir
                  // öğe eklemek yerine iç gölge kullanıldı.
                  boxShadow: isActive ? 'inset 3px 0 0 var(--nw-accent)' : 'none',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.18s cubic-bezier(0.22, 0.61, 0.36, 1)',
                  justifyContent: effectiveCollapsed ? 'center' : 'flex-start'
                }}
                title={effectiveCollapsed ? item.label : ""}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: effectiveCollapsed ? 'auto' : '24px' }}>
                  {item.icon}
                </div>

                {!effectiveCollapsed && (
                  <span style={{ marginLeft: '14px', fontSize: '13.5px', letterSpacing: '-0.005em', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ÇIKIŞ YAP BUTONU */}
        <div style={{ padding: '20px 16px', borderTop: '1px solid var(--nw-line)', marginTop: 'auto' }}>
          <button 
            onClick={handleLogout} 
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
              padding: '12px 16px',
              backgroundColor: 'var(--nw-surface)',
              color: 'var(--nw-danger)',
              border: '1px solid var(--nw-danger-soft)',
              borderRadius: 'var(--nw-r-sm)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--nw-danger-soft)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--nw-surface)'}
            title={effectiveCollapsed ? "Çıkış Yap" : ""}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: effectiveCollapsed ? 'auto' : '24px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </div>
            {!effectiveCollapsed && <span style={{ marginLeft: '16px', whiteSpace: 'nowrap' }}>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* ================= SAĞ İÇERİK (MAIN) ================= */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ÜST BAR (TOPBAR) */}
        <header style={{
          height: '70px',
          backgroundColor: 'var(--nw-surface)',
          borderBottom: '1px solid var(--nw-line)',
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 16px' : '0 24px',
          justifyContent: 'space-between',
        }}>
          
          {/* SOL KISIM: 3 Çizgi Menü Butonu (Tam yerine oturdu) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={handleMenuButton}
              style={{
                background: 'none',
                border: '1px solid var(--nw-line)',
                cursor: 'pointer',
                color: 'var(--nw-text-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: 'var(--nw-r-sm)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--nw-bg-elev)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>

          {/* SAĞ KISIM: Giriş yapan yönetici */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
              <div style={{ fontWeight: '600', color: 'var(--nw-text)', fontSize: '13px' }}>
                {BRAND.name} Yönetim
              </div>
              {adminEmail && (
                <div style={{ color: 'var(--nw-text-faint)', fontSize: '11.5px' }}>{adminEmail}</div>
              )}
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--nw-accent)',
              color: 'var(--nw-on-accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: '600',
              fontSize: '14px'
            }} title={adminEmail}>
              {adminInitial}
            </div>
          </div>
        </header>

        {/* SAYFA İÇERİKLERİ */}
        <div style={{ flex: 1, padding: isMobile ? '16px' : '32px', overflowY: 'auto' }}>
          <Outlet />
        </div>
        
      </main>
    </div>
  );
};

export default AdminLayout;