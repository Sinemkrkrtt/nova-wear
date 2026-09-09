import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// --- DEMO MOD ---
// .env dosyası yoksa (ör. yeni klonlanmış proje, tasarım çalışması) uygulama
// çökmek yerine "demo mod"a düşer: örnek katalog verisiyle açılır. Böylece
// Firebase kurulumu tamamlanmadan da site görülebilir/geliştirilebilir.
// Gerçek anahtarlar .env'e girildiği anda hiçbir kod değişikliği gerekmeden
// normal moda geçer.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

if (!isFirebaseConfigured && typeof window !== "undefined") {
  console.warn(
    "%c[NOVA WEAR] DEMO MOD",
    "background:#9B70FF;color:#150A26;font-weight:700;padding:2px 6px;border-radius:3px",
    "\nFirebase anahtarları bulunamadı; ürünler ve siparişler yüklenemez." +
    "\n.env.example dosyasını .env olarak kopyalayıp doldurun."
  );
}

const app = initializeApp(firebaseConfig);

// --- APP CHECK (bot / kötüye kullanım koruması) ---
// Geliştirmede (localhost) debug token üretilir; konsola basılan token'ı
// Firebase Console > App Check > Debug tokens bölümüne eklemen gerekir.
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  // eslint-disable-next-line no-underscore-dangle
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_APPCHECK_RECAPTCHA_KEY;

// Site anahtarı tanımlıysa App Check'i başlat. Tanımlı değilse (henüz
// kurulmadıysa) uygulama normal çalışmaya devam eder — böylece kurulum
// tamamlanana kadar hiçbir şey bozulmaz.
export const appCheck = (isFirebaseConfigured && RECAPTCHA_SITE_KEY)
  ? initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  : null;

// Cloud Functions'a yapılan fetch istekleri için App Check başlığı üretir.
// Token alınamazsa boş başlık döner (kurulum öncesi güvenli davranış).
export async function appCheckHeaders() {
  if (!appCheck) return {};
  try {
    const result = await getToken(appCheck, /* forceRefresh */ false);
    return result?.token ? { "X-Firebase-AppCheck": result.token } : {};
  } catch (e) {
    console.warn("App Check token alınamadı:", e);
    return {};
  }
}

// Cloud Functions temel adresi. Açıkça verilmemişse proje kimliğinden türetilir
// — böylece Firebase projesi değiştiğinde koda dokunmak gerekmez.
export const FUNCTIONS_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_BASE_URL ||
  (firebaseConfig.projectId
    ? `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net`
    : "");

export const auth = getAuth(app);

// Giriş yapılmışsa Cloud Functions çağrılarına eklenecek kimlik başlığını
// üretir. Sunucu sipariş sahibini BU token'dan çözer; istemcinin gönderdiği
// bir kullanıcı kimliğine güvenilmez. Misafir alışverişte boş döner.
export async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    return { Authorization: `Bearer ${await user.getIdToken()}` };
  } catch (e) {
    // Token alınamazsa misafir siparişi olarak devam edilir.
    return {};
  }
}

export const db = getFirestore(app);

// Analytics yalnızca gerçek yapılandırma varsa ve tarayıcı destekliyorsa
// başlatılır; aksi halde geçersiz measurementId ile hata fırlatıp tüm
// uygulamanın açılmasını engelliyordu.
export let analytics = null;
if (isFirebaseConfigured && firebaseConfig.measurementId) {
  analyticsIsSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => { /* analytics olmadan da site çalışır */ });
}
