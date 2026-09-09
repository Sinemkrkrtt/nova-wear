import { auth, appCheckHeaders, FUNCTIONS_BASE_URL } from '../config/firebase';

// Adres, Firebase proje kimliğinden türetilir (bkz. config/firebase.js) —
// böylece proje değiştiğinde burada elle düzeltme gerekmez.
const COD_URL = `${FUNCTIONS_BASE_URL}/createCodOrder`;

// Kapıda ödeme üst tutar limiti (backend'deki COD_MAX_TOTAL ile aynı olmalı).
// Bu tutarın üzerindeki sepetlerde kapıda ödeme seçeneği kapatılır.
export const COD_MAX_TOTAL = 15000;

// Kapıda ödeme siparişi oluşturur.
// Fiyat/stok/kupon SUNUCUDA hesaplanır; istemci yalnızca ürün id + adet + kupon
// kodu ve adres gönderir. Giriş yapan kullanıcıda kimlik token'ı da eklenir;
// sunucu siparişin userId'sini bu doğrulanmış token'dan alır (istemciye güvenmez).
export async function createCodOrder(payload) {
  const headers = { "Content-Type": "application/json" };

  const acHeaders = await appCheckHeaders();
  Object.assign(headers, acHeaders);

  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      headers["Authorization"] = `Bearer ${idToken}`;
    } catch (e) {
      // Token alınamazsa misafir siparişi gibi devam et.
    }
  }

  const res = await fetch(COD_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ data: payload }),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, ...(json.data || {}) };
}
