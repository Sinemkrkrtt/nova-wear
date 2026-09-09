import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { uploadImage } from '../utils/storage';
import { fetchCategories, DEFAULT_CATEGORIES } from '../utils/categories';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); 

  // Form State'leri
  const [name, setName] = useState('');
  const [category, setCategory] = useState([]); 
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  
  // ÇOKLU GÖRSEL YÖNETİMİ
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  
  const [variants, setVariants] = useState([{ color: '', size: '', stock: '' }]);

  // Kullanılabilir Kategoriler (admin Pazarlama'dan yönetilir; boşsa varsayılanlar)
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    fetchProducts();
    fetchCategories().then(setAvailableCategories);
  }, []);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsArray = querySnapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));
    setProducts(productsArray);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    
    if (indexToRemove < selectedFiles.length) {
      setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { color: '', size: '', stock: '' }]);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    if (field === 'stock' && value < 0) value = 0; 
    newVariants[index][field] = field === 'stock' ? Number(value) : value;
    setVariants(newVariants);
  };

  const handleCategoryToggle = (cat) => {
    if (category.includes(cat)) {
      setCategory(category.filter(c => c !== cat));
    } else {
      setCategory([...category, cat]);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(Array.isArray(product.category) ? product.category : [product.category].filter(Boolean));
    setPrice(product.price);
    setDescription(product.description || ''); 
    setVariants(product.variants || [{ color: '', size: '', stock: '' }]);
    
    if (product.images && Array.isArray(product.images)) {
        setImageUrls(product.images);
    } else if (product.imageUrl) {
        setImageUrls([product.imageUrl]);
    } else {
        setImageUrls([]);
    }
    setSelectedFiles([]); 
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setCategory([]);
    setPrice('');
    setDescription(''); 
    setSelectedFiles([]);
    setImageUrls([]);
    setVariants([{ color: '', size: '', stock: '' }]);
  };

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm("Bu ürünü tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.");
    
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(product => product.id !== productId));
        alert('Ürün başarıyla silindi.');
      } catch (error) {
        console.error("Silme hatası:", error);
        alert('Ürün silinirken bir hata oluştu.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (imageUrls.length === 0) {
      alert('Lütfen en az bir ürün görseli ekleyin!');
      return;
    }

    if (category.length === 0) {
      alert('Lütfen en az bir kategori seçin!');
      return;
    }
    
    setLoading(true);

    try {
      let finalImages = [];

      // Sadece yeni yüklenenleri (blob olmayanları) tut
      const existingUrls = imageUrls.filter(url => !url.startsWith('blob:'));
      finalImages = [...existingUrls];

      // Yeni dosya seçildiyse Cloudinary'ye GÜVENLİ (imzalı) şekilde yükle
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const secureUrl = await uploadImage(file, 'products');
          finalImages.push(secureUrl);
        }
      }

      // Düzenleme modunda değilsek, aynı isimde ürün var mı diye kontrol et
      let existingProduct = null;
      if (!editingId) {
        existingProduct = products.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
      }

      if (editingId) {
        // Zaten "Düzenle" butonuna basılarak girildiyse normal güncelleme yap
        const productData = {
          name, category, price: Math.max(0, Number(price)), description, 
          images: finalImages, imageUrl: finalImages[0] || '', variants
        };
        await updateDoc(doc(db, 'products', editingId), productData);
        alert('Ürün başarıyla güncellendi!');
      } 
      else if (existingProduct) {
        // EĞER AYNI İSİMDE ÜRÜN BULUNDUYSA: Kullanıcıya Özel Onay Kutusu Çıkar
        // Tarayıcının standart confirm penceresi yerine, daha kontrollü bir karar yapısı
        const userChoice = window.confirm(
          `"${name}" isimli ürün sistemde zaten var!\n\n` +
          `[TAMAM] derseniz -> Stoklar ve resimler VAR OLAN ürünün üzerine eklenir.\n` +
          `[İPTAL] derseniz -> Aynı isimle AYRI bir ürün olarak kaydedilir.`
        );

        if (userChoice) {
            // SEÇENEK 1: Üzerine Ekle (TAMAM'a basıldı)
            let mergedVariants = [...(existingProduct.variants || [])];

            variants.forEach(newVariant => {
                const existingVarIndex = mergedVariants.findIndex(
                    ev => ev.color.trim().toLowerCase() === newVariant.color.trim().toLowerCase() &&
                          ev.size.trim().toLowerCase() === newVariant.size.trim().toLowerCase()
                );

                if (existingVarIndex > -1) {
                    mergedVariants[existingVarIndex].stock = Number(mergedVariants[existingVarIndex].stock) + Number(newVariant.stock);
                } else {
                    mergedVariants.push({ ...newVariant, stock: Number(newVariant.stock) });
                }
            });

            const mergedImages = [...(existingProduct.images || [])];
            finalImages.forEach(img => {
                if (!mergedImages.includes(img)) {
                    mergedImages.push(img);
                }
            });

            await updateDoc(doc(db, 'products', existingProduct.id), {
                category,
                price: Math.max(0, Number(price)),
                description,
                variants: mergedVariants,
                images: mergedImages,
                imageUrl: mergedImages[0] || existingProduct.imageUrl
            });
            alert('Mevcut ürünün üzerine başarıyla eklendi!');
        } else {
            // SEÇENEK 2: Ayrı Kaydet (İPTAL'e basıldı)
            // Aynen yepyeni bir ürünmüş gibi sıfırdan oluştur
            const productData = {
                name, category, price: Math.max(0, Number(price)), description, 
                images: finalImages, imageUrl: finalImages[0] || '', variants,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'products'), productData);
            alert('Aynı isimle yeni ve bağımsız bir ürün olarak kaydedildi!');
        }
      } 
      else {
        // TAMAMEN YENİ ÜRÜN İSE (İsim hiç eşleşmedi)
        const productData = {
            name, category, price: Math.max(0, Number(price)), description, 
            images: finalImages, imageUrl: finalImages[0] || '', variants,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'products'), productData);
        alert('Yeni ürün başarıyla eklendi!');
      }
      
      handleCancelEdit();
      fetchProducts(); // Tabloyu yenile
      
    } catch (error) {
      console.error("Hata:", error);
      // Gerçek sebebi göster: genel mesaj, kurulum eksikliğini de izin
      // hatasını da aynı cümleye indirgiyor ve sorunu bulmayı zorlaştırıyordu.
      const sebep =
        error?.code === 'permission-denied'
          ? 'Veritabanına yazma izniniz yok. Firestore kuralları yüklenmemiş olabilir.'
          : (error?.message || 'Bilinmeyen hata');
      alert(`Ürün kaydedilemedi.\n\n${sebep}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: 'var(--nw-text)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--nw-font-display)', fontSize: 'clamp(21px, 5vw, 25px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--nw-text)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          Ürün Yönetimi
        </h2>
        <p style={{ color: 'var(--nw-text-dim)', fontSize: '14px', marginTop: '4px' }}>Mağazanızdaki ürünleri, açıklamaları, renk/beden varyantlarını ve stok durumlarını buradan güncelleyin.</p>
      </div>
      
      <div style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ backgroundColor: editingId ? 'var(--nw-accent-soft)' : 'var(--nw-accent-soft)', color: editingId ? 'var(--nw-accent)' : 'var(--nw-accent)', padding: '8px', borderRadius: 'var(--nw-r-sm)', display: 'flex' }}>
            {editingId ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            )}
          </div>
          <h3 style={sectionTitleStyle}>
            {editingId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={imageGalleryStyle}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--nw-text-dim)', marginBottom: '12px', display: 'block' }}>
              Ürün Görselleri <span style={{fontWeight:'normal', color: 'var(--nw-text-faint)'}}>(İlk görsel ana resim olacaktır. Yüklemek için birden fazla seçebilirsiniz.)</span>
            </span>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {imageUrls.map((url, index) => (
                <div key={index} style={{ position: 'relative', width: '120px', height: '150px', borderRadius: 'var(--nw-r-sm)', overflow: 'hidden', border: '1px solid var(--nw-line)' }}>
                  <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {index === 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(155, 112, 255, 0.9)', color: 'var(--nw-on-accent)', fontSize: '10px', textAlign: 'center', padding: '4px 0' }}>Ana Görsel</div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImage(index)}
                    style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}
                  >
                    X
                  </button>
                </div>
              ))}

              <label style={{ ...uploadAreaStyle, width: '120px', height: '150px', border: '2px dashed var(--nw-line)', backgroundColor: 'var(--nw-bg-elev)', borderRadius: 'var(--nw-r-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                 <svg width="24" height="24" fill="none" stroke="var(--nw-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                 <span style={{ fontSize: '12px', color: 'var(--nw-text-faint)', marginTop: '8px', fontWeight: '500' }}>Fotoğraf Ekle</span>
                 <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <input required type="text" placeholder="Ürün Adı" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
              <input required type="number" min="0" placeholder="Fiyat (TL)" value={price} onChange={(e) => setPrice(e.target.value)} style={{ ...inputStyle, flex: '1 1 200px' }} />
            </div>

            <div style={categoryBoxStyle}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--nw-text-dim)', marginBottom: '8px', display: 'block' }}>Kategoriler (Birden fazla seçebilirsiniz)</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableCategories.map(cat => {
                    const isSelected = category.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        style={{
                          ...categoryBtnStyle,
                          backgroundColor: isSelected ? 'var(--nw-accent-soft)' : 'var(--nw-surface)',
                          borderColor: isSelected ? 'var(--nw-accent)' : 'var(--nw-line)',
                          color: isSelected ? 'var(--nw-accent)' : 'var(--nw-text)',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
            </div>

            <div>
              <textarea 
                required 
                placeholder="Ürün Açıklaması (Detaylar, kumaş bilgisi, yıkama talimatı vb.)" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical' }} 
              />
            </div>

            <div style={variantBoxStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--nw-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 8-8v8H4z"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  Varyant Yapılandırması (Renk, Beden, Stok)
                </h4>
                <button type="button" onClick={handleAddVariant} style={addBtnStyle}>+ Varyant Ekle</button>
              </div>
              
              {variants.map((variant, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <input required type="text" placeholder="Renk (Örn: Mor)" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} style={{ ...inputStyle, flex: '1 1 100px' }} />
                  <input required type="text" placeholder="Beden (Örn: S)" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} style={{ ...inputStyle, flex: '1 1 100px' }} />
                  <input required type="number" min="0" placeholder="Stok Adedi" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} style={{ ...inputStyle, flex: '1 1 100px' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', flexWrap: 'wrap-reverse' }}>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={{...cancelBtnStyle, flex: '1 1 auto', textAlign: 'center'}}>
                İptal Et
              </button>
            )}
            <button type="submit" disabled={loading} style={{...submitBtnStyle, flex: '1 1 auto', textAlign: 'center'}}>
              {loading ? (
                'İşlem Yapılıyor...'
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  {editingId ? 'Değişiklikleri Kaydet' : 'Ürünü Kaydet ve Yükle'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>Görsel</th>
              <th style={thStyle}>Ürün Adı</th>
              <th style={thStyle}>Kategoriler</th>
              <th style={thStyle}>Fiyat</th>
              <th style={thStyle}>Toplam Stok Durumu</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const totalStock = product.variants?.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) || 0;
              const isEditing = editingId === product.id;
              
              const productCategories = Array.isArray(product.category) 
                  ? product.category 
                  : [product.category].filter(Boolean);

              const displayImage = product.images && product.images.length > 0 ? product.images[0] : product.imageUrl;

              return (
                <tr key={product.id} style={{ 
                  borderBottom: index !== products.length - 1 ? '1px solid var(--nw-bg-elev)' : 'none', 
                  transition: 'background-color 0.2s', 
                  backgroundColor: isEditing ? 'var(--nw-accent-soft)' : 'transparent' 
                }}>
                  <td style={tdStyle}>
                    {displayImage ? (
                      <div style={{position: 'relative', width: '48px', height: '58px'}}>
                        <img src={displayImage} alt={product.name} style={{ width: '48px', height: '58px', objectFit: 'cover', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)' }} />
                        {product.images && product.images.length > 1 && (
                            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: 'var(--nw-accent)', color: 'var(--nw-on-accent)', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                +{product.images.length - 1}
                            </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ width: '48px', height: '58px', backgroundColor: 'var(--nw-bg-elev)', borderRadius: 'var(--nw-r-sm)', border: '1px solid var(--nw-line)' }}></div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '600', color: 'var(--nw-text)' }}>{product.name}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {productCategories.map(cat => (
                        <span key={cat} style={{ backgroundColor: 'var(--nw-bg-elev)', border: '1px solid var(--nw-line)', padding: '4px 8px', borderRadius: 'var(--nw-r-sm)', fontSize: '11px', fontWeight: '500', color: 'var(--nw-text-dim)' }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '700', color: 'var(--nw-text)' }}>{product.price} ₺</td>
                  <td style={tdStyle}>
                    {totalStock > 0 ? (
                      <span style={{ color: 'var(--nw-success)', backgroundColor: 'var(--nw-success-soft)', padding: '4px 10px', borderRadius: 'var(--nw-r-md)', fontSize: '12px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {totalStock} Adet Stokta
                      </span>
                    ) : (
                      <span style={{ color: 'var(--nw-danger)', backgroundColor: 'var(--nw-danger-soft)', padding: '4px 10px', borderRadius: 'var(--nw-r-md)', fontSize: '12px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        Tükendi
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => handleEditClick(product)} style={editBtnStyle} title="Ürünü Düzenle">Düzenle</button>
                      <button onClick={() => handleDeleteProduct(product.id)} style={deleteBtnStyle} title="Ürünü Sil">Sil</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && <tr><td colSpan="6" style={emptyStateStyle}>Sistemde henüz ürün bulunmamaktadır.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STYLES ---
const cardStyle = { 
  backgroundColor: 'var(--nw-surface)', 
  borderRadius: 'var(--nw-r-md)', 
  border: '1px solid var(--nw-line)', 
  boxShadow: 'none',
  padding: 'clamp(16px, 4vw, 24px)',
  marginBottom: '32px',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box'
};

const sectionHeaderStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', 
  marginBottom: '24px', 
  paddingBottom: '16px', 
  borderBottom: '1px solid var(--nw-line)',
  flexWrap: 'wrap'
};

const sectionTitleStyle = { 
  fontFamily: 'var(--nw-font-display)', 
  fontSize: '16px', letterSpacing: '-0.01em', 
  fontWeight: '600', 
  color: 'var(--nw-text)', 
  margin: 0 
};

const imageGalleryStyle = {
  backgroundColor: 'var(--nw-surface)',
  padding: '16px',
  borderRadius: 'var(--nw-r-md)',
  border: '1px solid var(--nw-line)',
  marginBottom: '8px'
};

const inputStyle = { 
  flex: 1, 
  padding: '12px 16px', 
  borderRadius: 'var(--nw-r-sm)', 
  border: '1px solid var(--nw-line)', 
  outline: 'none', 
  fontSize: '14px', 
  backgroundColor: 'var(--nw-surface)', 
  transition: 'border-color 0.2s', 
  color: 'var(--nw-text)',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const categoryBoxStyle = {
  backgroundColor: 'var(--nw-surface)',
  padding: '12px 16px',
  borderRadius: 'var(--nw-r-sm)',
  border: '1px solid var(--nw-line)'
};

const categoryBtnStyle = {
  padding: '6px 14px',
  borderRadius: '20px',
  border: '1px solid',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  outline: 'none'
};

const variantBoxStyle = { 
  backgroundColor: 'var(--nw-bg-elev)', 
  padding: '16px', 
  borderRadius: 'var(--nw-r-md)', 
  border: '1px solid var(--nw-line)' 
};

const addBtnStyle = { 
  padding: '6px 12px', 
  backgroundColor: 'var(--nw-surface)', 
  color: 'var(--nw-text-dim)', 
  border: '1px solid var(--nw-line)', 
  borderRadius: 'var(--nw-r-sm)', 
  cursor: 'pointer', 
  fontSize: '12px', 
  fontWeight: '600',
  transition: 'background-color 0.2s',
  whiteSpace: 'nowrap'
};

const submitBtnStyle = { 
  padding: '12px 24px', 
  backgroundColor: 'var(--nw-accent)',
  color: 'var(--nw-on-accent)', 
  border: 'none', 
  borderRadius: 'var(--nw-r-sm)', 
  cursor: 'pointer', 
  fontWeight: '600', 
  fontSize: '14px', 
  boxShadow: '0 6px 18px -8px var(--nw-accent)', 
  transition: 'opacity 0.2s' 
};

const cancelBtnStyle = { 
  padding: '12px 24px', 
  backgroundColor: 'var(--nw-surface)', 
  color: 'var(--nw-text-dim)', 
  border: '1px solid var(--nw-line)', 
  borderRadius: 'var(--nw-r-sm)', 
  cursor: 'pointer', 
  fontWeight: '600', 
  fontSize: '14px' 
};

const uploadAreaStyle = { 
  cursor: 'pointer', 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  justifyContent: 'center', 
  backgroundColor: 'var(--nw-bg-elev)', 
  overflow: 'hidden', 
  position: 'relative', 
  transition: 'border-color 0.2s' 
};

const tableContainerStyle = { 
  backgroundColor: 'var(--nw-surface)', 
  borderRadius: 'var(--nw-r-md)', 
  border: '1px solid var(--nw-line)', 
  boxShadow: 'none', 
  overflowX: 'auto', 
  WebkitOverflowScrolling: 'touch' 
};

const tableStyle = { 
  width: '100%', 
  minWidth: '700px', 
  borderCollapse: 'collapse', 
  textAlign: 'left' 
};
const theadStyle = { backgroundColor: 'var(--nw-bg-elev)', borderBottom: '1px solid var(--nw-line)' };
const thStyle = { padding: '14px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--nw-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '16px 20px', fontSize: '14px', color: 'var(--nw-text-dim)', verticalAlign: 'middle' };
const emptyStateStyle = { padding: '40px', textAlign: 'center', color: 'var(--nw-text-faint)', fontSize: '14px' };

const editBtnStyle = { 
  padding: '6px 12px', 
  backgroundColor: 'var(--nw-accent-soft)', 
  color: 'var(--nw-accent)', 
  border: 'none', 
  borderRadius: 'var(--nw-r-sm)', 
  cursor: 'pointer', 
  fontSize: '13px', 
  fontWeight: '600', 
  transition: 'background-color 0.2s' 
};

const deleteBtnStyle = { 
  padding: '6px 12px', 
  backgroundColor: 'var(--nw-danger-soft)', 
  color: 'var(--nw-danger)', 
  border: 'none', 
  borderRadius: 'var(--nw-r-sm)', 
  cursor: 'pointer', 
  fontSize: '13px', 
  fontWeight: '600', 
  transition: 'background-color 0.2s' 
};

export default Products;