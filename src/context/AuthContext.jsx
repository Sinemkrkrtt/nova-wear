import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase'; // Dosya yolu daha güvenli hale getirildi
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kullanıcı giriş/çıkış yaptığında tetiklenir
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Firestore'dan kullanıcının rolünü çekiyoruz
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setRole(userDocSnap.data().role);
          } else {
            setRole('customer'); // Döküman yoksa normal müşteri say
          }
        } catch (error) {
          console.error("Rol çekilirken hata oluştu:", error);
          setRole('customer');
        }
      } else {
        // Çıkış yapılmışsa state'leri sıfırla
        setUser(null);
        setRole(null);
      }
      setLoading(false); // Veri çekme bitti, kilitleri aç
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// İstediğimiz sayfada kullanabilmek için özel hook
export const useAuth = () => useContext(AuthContext);