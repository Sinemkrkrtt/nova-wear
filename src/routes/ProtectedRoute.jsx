import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, role } = useAuth();

  // Kullanıcı hiç giriş yapmamışsa admin giriş sayfasına yönlendir
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Kullanıcı giriş yapmış ama veritabanında rolü "admin" değilse ana sayfaya kovala
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Her iki testi de geçtiyse (admin ise) içeri al
  return <Outlet />;
};

export default ProtectedRoute;