const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const Iyzipay = require("iyzipay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
// Iyzico credentials are read from environment variables so that secret keys
// are NEVER committed to source control. Set them locally in functions/.env
// (git-ignored) or in production with:
//   firebase functions:config  /  firebase deploy
// Anahtarlar ZORUNLU. Fail-closed: env yoksa fonksiyon başlatılmaz — böylece
// yanlış yapılandırmada sessizce iyzico'nun herkese açık sandbox demo
// anahtarlarına düşüp "bedava sipariş" oluşması ENGELLENİR.
// (Sandbox testinde functions/.env içindeki sandbox anahtarları kullanılır;
// canlıya geçerken bu değerleri gerçek iyzico anahtarlarıyla değiştir.)
const IYZICO_API_KEY = process.env.IYZICO_API_KEY;
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY;
const IYZICO_URI = process.env.IYZICO_URI || "https://sandbox-api.iyzipay.com";

// iyzico yapılandırılmış mı? (İstek anında kontrol edilir — modül yüklenirken
// DEĞİL; çünkü Firebase deploy analizi sırasında .env henüz yüklenmemiş olur.)
const iyzicoReady = () => Boolean(IYZICO_API_KEY && IYZICO_SECRET_KEY);

const iyzipay = new Iyzipay({
  apiKey: IYZICO_API_KEY || "unset",
  secretKey: IYZICO_SECRET_KEY || "unset",
  uri: IYZICO_URI,
});

// --- NODEMAILER CONFIG ---
// Admin bildirimleri için Gmail ayarları
// Gmail kimlik bilgileri ortam değişkenlerinden okunur (functions/.env).
// Uygulama şifresi ASLA koda yazılmaz: depo herkese açıksa doğrudan sızar.
const MAIL_USER = process.env.MAIL_USER || "";
const MAIL_APP_PASSWORD = process.env.MAIL_APP_PASSWORD || "";
// Sipariş bildirimlerinin gideceği adres (boşsa gönderen adres kullanılır).
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || MAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: MAIL_USER, pass: MAIL_APP_PASSWORD }
});

// Only these origins may call the payment/tracking endpoints from a browser.
// Marka adı ve site adresi ortam değişkenlerinden gelir; koda gömülmez.
const BRAND_NAME = process.env.BRAND_NAME || "Nova Wear";
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
const ORDER_PREFIX = process.env.ORDER_PREFIX || "NW";

const ALLOWED_ORIGINS = [
  ...(SITE_URL ? [SITE_URL] : []),
  "http://localhost:3000",
];
const cors = require("cors")({origin: ALLOWED_ORIGINS});

// --- APP CHECK DOĞRULAMASI ---
// İstek gerçekten senin uygulamandan mı geliyor? Bunu App Check token'ı ile
// doğrularız. Geçiş dönemi için APPCHECK_ENFORCE=false iken eksik/geçersiz
// token engellenmez (sadece loglanır); Console kurulumu bitince env'i "true"
// yapıp yeniden deploy ederek zorunlu hale getirirsin.
const APPCHECK_ENFORCE = String(process.env.APPCHECK_ENFORCE || "false").toLowerCase() === "true";

async function passesAppCheck(req, res) {
  const token = (req.header && req.header("X-Firebase-AppCheck")) || req.headers["x-firebase-appcheck"];
  if (!token) {
    if (APPCHECK_ENFORCE) {
      res.status(401).send({data: {errorMessage: "Doğrulama başlığı eksik."}});
      return false;
    }
    return true;
  }
  try {
    await admin.appCheck().verifyToken(token);
    return true;
  } catch (e) {
    console.warn("App Check doğrulaması başarısız:", e.message);
    if (APPCHECK_ENFORCE) {
      res.status(401).send({data: {errorMessage: "Geçersiz doğrulama."}});
      return false;
    }
    return true;
  }
}

// --- CLOUDINARY (imzalı yükleme) ---
// API anahtarları backend'de tutulur; istemcide asla görünmez. Böylece
// görsel yüklemek için sunucudan imza almak gerekir ve bu imzayı yalnızca
// giriş yapmış ADMIN alabilir — hesap kötüye kullanılamaz.
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dh3xo6sjg";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "nova-wear";

// Firebase kimlik token'ını doğrular ve kullanıcının ADMIN olduğunu kontrol eder.
async function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    res.status(401).send({error: "Oturum bulunamadı."});
    return null;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const snap = await admin.firestore().collection("users").doc(decoded.uid).get();
    if (!snap.exists || snap.data().role !== "admin") {
      res.status(403).send({error: "Bu işlem için yetkiniz yok."});
      return null;
    }
    return decoded;
  } catch (e) {
    res.status(401).send({error: "Geçersiz oturum."});
    return null;
  }
}

// signCloudinaryUpload — sadece admin'e, tek kullanımlık bir yükleme imzası verir.
exports.signCloudinaryUpload = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({error: "Method Not Allowed"});
    }
    if (!(await passesAppCheck(req, res))) return;
    const adminUser = await requireAdmin(req, res);
    if (!adminUser) return;

    if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY) {
      return res.status(500).send({error: "Cloudinary yapılandırılmamış. Lütfen sunucu ayarlarını kontrol edin."});
    }

    // İmzalanacak parametreler (alfabetik): folder, timestamp
    const timestamp = Math.round(Date.now() / 1000);
    const folder = CLOUDINARY_FOLDER;
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(toSign + CLOUDINARY_API_SECRET).digest("hex");

    return res.status(200).send({data: {
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      folder: folder,
      timestamp: timestamp,
      signature: signature,
    }});
  });
});

// Business constants (authoritative — the client can NOT influence these).
const FREE_SHIPPING_THRESHOLD = 1500;
const SHIPPING_COST = 135.00;
// Bir siparişte işlenecek en fazla farklı ürün sayısı (maliyet/DoS koruması).
const MAX_LINE_ITEMS = 50;
// Kapıda ödeme için izin verilen en yüksek sipariş tutarı (sahte sipariş riskini
// sınırlar). Bu tutarın üzerindeki sepetlerde kapıda ödeme kabul edilmez.
const COD_MAX_TOTAL = 15000;

const round2 = (n) => Number(Number(n).toFixed(2));

// Bir kuponu (süre, min. sepet, kullanım limiti dahil) değerlendirir.
// Hem createPayment hem validateCoupon aynı mantığı kullanır.
function evaluateCoupon(c, subtotal) {
  if (!c || c.isActive === false) {
    return {valid: false, discount: 0, message: "Geçersiz veya pasif kupon."};
  }
  // Son kullanma tarihi
  if (c.expiresAt && typeof c.expiresAt.toMillis === "function") {
    if (c.expiresAt.toMillis() < Date.now()) {
      return {valid: false, discount: 0, message: "Bu kuponun süresi dolmuş."};
    }
  }
  // Minimum sepet tutarı
  const minPurchase = Number(c.minPurchase) || 0;
  if (minPurchase > 0 && subtotal < minPurchase) {
    return {valid: false, discount: 0, message: `Bu kupon en az ${minPurchase.toFixed(2)} ₺ sepet tutarında geçerlidir.`};
  }
  // Kullanım limiti
  const usageLimit = Number(c.usageLimit) || 0;
  const usedCount = Number(c.usedCount) || 0;
  if (usageLimit > 0 && usedCount >= usageLimit) {
    return {valid: false, discount: 0, message: "Bu kuponun kullanım limiti dolmuş."};
  }
  // İndirim hesapla
  const value = Number(c.discountValue) || 0;
  let discount = 0;
  if (c.discountType === "percentage") {
    discount = round2(subtotal * (Math.min(Math.max(value, 0), 100) / 100));
  } else if (c.discountType === "fixed") {
    discount = round2(Math.max(value, 0));
  }
  discount = Math.min(discount, subtotal);
  return {valid: true, discount, message: "", discountType: c.discountType, discountValue: value};
}

// Kupon+e-posta için deterministik kullanım kaydı ID'si (kişi başı tek kullanım).
function couponUsageId(code, email) {
  return crypto.createHash("sha1").update(`${code}|${String(email).toLowerCase()}`).digest("hex");
}

// Bu e-posta bu kuponu daha önce TAMAMLANMIŞ bir ödemede kullanmış mı?
async function userAlreadyUsedCoupon(code, email) {
  if (!email) return false;
  const snap = await admin.firestore().collection("couponUsages").doc(couponUsageId(code, email)).get();
  return snap.exists && snap.data().status === "used";
}

// Kupon rezervasyon penceresi: bu süre içinde aynı e-posta+kupon başka bir
// ödemede "kullanımda" sayılır (eşzamanlı çok-sekme kötüye kullanımını önler).
const COUPON_RESERVE_WINDOW_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Server-side price + coupon computation.
// The client only tells us WHICH products (id) and HOW MANY (quantity).
// Every price is looked up from Firestore, so a tampered client payload
// (e.g. price = 0.01) can never change what the customer is actually charged.
// ---------------------------------------------------------------------------
async function computeAuthoritativeOrder(rawItems, couponCode, buyerEmail) {
  const db = admin.firestore();
  // Farklı ürün sayısını sınırla — sınırsız dizi Firestore okumasını (maliyet/DoS) önler.
  const items = (Array.isArray(rawItems) ? rawItems : []).slice(0, MAX_LINE_ITEMS);

  const lineItems = [];
  const stockIssues = [];
  let subtotal = 0;

  for (const it of items) {
    if (!it || !it.id) continue;
    const id = String(it.id);
    // Ignore any synthetic/shipping lines the client might inject.
    if (id.startsWith("KARGO")) continue;

    const qty = Math.max(1, Math.min(99, parseInt(it.quantity, 10) || 1));
    const snap = await db.collection("products").doc(id).get();
    if (!snap.exists) {
      stockIssues.push({name: (it.name || "Ürün"), available: 0, requested: qty});
      continue; // unknown product -> reject, never trust client price
    }

    const product = snap.data();
    const unitPrice = Number(product.price);
    if (!(unitPrice >= 0)) continue;

    // STOK KONTROLÜ — aşırı satışı (overselling) önle.
    const available = availableStockFor(product, it.size, it.color);
    if (qty > available) {
      stockIssues.push({name: product.name || (it.name || "Ürün"), available, requested: qty});
      continue; // stok yetersiz -> siparişe ekleme
    }

    const lineTotal = round2(unitPrice * qty);
    subtotal += lineTotal;

    lineItems.push({
      id: id,
      name: (typeof it.name === "string" && it.name.slice(0, 200)) || product.name || "Ürün",
      category: Array.isArray(product.category) ? (product.category[0] || "Giyim") : (product.category || "Giyim"),
      unitPrice: unitPrice,
      quantity: qty,
      lineTotal: lineTotal,
      variant: (typeof it.variant === "string" && it.variant.slice(0, 120)) || "",
      color: (typeof it.color === "string" && it.color.slice(0, 60)) || "",
      size: (typeof it.size === "string" && it.size.slice(0, 60)) || "",
    });
  }

  subtotal = round2(subtotal);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  // Validate the coupon SERVER-SIDE against Firestore (süre, limit, min. sepet dahil).
  let discount = 0;
  let appliedCoupon = null;
  let couponOncePerUser = false;
  if (couponCode && typeof couponCode === "string") {
    const code = couponCode.toUpperCase().trim().slice(0, 40);
    if (code) {
      const couponSnap = await db.collection("coupons")
        .where("code", "==", code)
        .where("isActive", "==", true)
        .limit(1)
        .get();
      if (!couponSnap.empty) {
        const couponData = couponSnap.docs[0].data();
        const evalResult = evaluateCoupon(couponData, subtotal);
        // Kişi başı tek kullanım: bu e-posta daha önce TAMAMLADIYSA uygulama.
        const usedByUser = couponData.oncePerUser
          ? await userAlreadyUsedCoupon(code, buyerEmail)
          : false;
        if (evalResult.valid && !usedByUser) {
          discount = evalResult.discount;
          appliedCoupon = code;
          couponOncePerUser = !!couponData.oncePerUser;
        }
      }
    }
  }

  const total = round2(Math.max(0, subtotal + shipping - discount));
  return {lineItems, subtotal, shipping, discount, appliedCoupon, couponOncePerUser, total, stockIssues};
}

// Belirli bir varyant (renk/beden) için kullanılabilir stok adedini döndürür.
// Varyant bulunamazsa toplam stoğa, hiç varyant yoksa 0'a düşer.
function availableStockFor(product, size, color) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return 0;
  const wantSize = (size || "").toString().trim().toLowerCase();
  const wantColor = (color || "").toString().trim().toLowerCase();
  if (wantSize) {
    let vm = variants.find((v) =>
      (v.size || "").toString().trim().toLowerCase() === wantSize &&
      (!wantColor || (v.color || "").toString().trim().toLowerCase() === wantColor));
    if (!vm) vm = variants.find((v) => (v.size || "").toString().trim().toLowerCase() === wantSize);
    if (vm) return Number(vm.stock) || 0;
  }
  return variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
}

// Satın alınan varyantın stoğunu düşer; güncellenmiş variants dizisini döndürür.
function decrementVariantStock(product, size, color, qty) {
  const variants = Array.isArray(product.variants) ? product.variants.map((v) => ({...v})) : [];
  if (!variants.length) return variants;
  const wantSize = (size || "").toString().trim().toLowerCase();
  const wantColor = (color || "").toString().trim().toLowerCase();
  let idx = -1;
  if (wantSize) {
    idx = variants.findIndex((v) =>
      (v.size || "").toString().trim().toLowerCase() === wantSize &&
      (!wantColor || (v.color || "").toString().trim().toLowerCase() === wantColor));
    if (idx < 0) idx = variants.findIndex((v) => (v.size || "").toString().trim().toLowerCase() === wantSize);
  }
  if (idx >= 0) {
    variants[idx].stock = Math.max(0, (Number(variants[idx].stock) || 0) - qty);
  }
  return variants;
}

// Build iyzico basketItems whose prices sum EXACTLY to `total`
// (iyzico requires sum(basketItems.price) === paidPrice).
function buildBasketItems(order) {
  const parts = order.lineItems.map((li) => ({
    id: li.id,
    name: li.variant ? `${li.name} (${li.variant})` : li.name,
    category1: li.category,
    itemType: "PHYSICAL",
    rawPrice: li.lineTotal,
  }));

  if (order.shipping > 0) {
    parts.push({id: "KARGO-01", name: "Kargo Ücreti", category1: "Kargo", itemType: "PHYSICAL", rawPrice: order.shipping});
  }

  const gross = parts.reduce((acc, p) => acc + p.rawPrice, 0);
  // Distribute discount proportionally across the basket.
  let running = 0;
  const basketItems = parts.map((p) => {
    const share = gross > 0 ? (p.rawPrice / gross) : 0;
    const priced = round2(p.rawPrice - order.discount * share);
    running = round2(running + priced);
    return {id: p.id, name: p.name, category1: p.category1, itemType: p.itemType, price: priced.toFixed(2)};
  });

  // Fix any rounding drift on the first item so the sum equals total.
  if (basketItems.length > 0) {
    const drift = round2(order.total - running);
    if (drift !== 0) {
      basketItems[0].price = round2(Number(basketItems[0].price) + drift).toFixed(2);
    }
  }
  return basketItems;
}

function sanitizeString(value, maxLen, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : fallback;
}

// Sipariş onay e-postasının HTML gövdesi (Firebase "Trigger Email" eklentisi
// mail koleksiyonundaki dokümanları gönderir).
// paymentNote: opsiyonel — kapıda ödeme gibi yöntemlerde ek bilgi satırı.
function buildOrderEmailHtml(order, orderNo, paymentNote) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items.map((it) => {
    const variant = it.variant ? ` (${it.variant})` : "";
    const line = (Number(it.price) || 0) * (Number(it.quantity) || 1);
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${(it.quantity || 1)}x ${it.name || "Ürün"}${variant}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${line.toFixed(2)} ₺</td></tr>`;
  }).join("");
  const total = Number(order.totalAmount) || 0;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#2a2a30;border:1px solid #eee;">
    <div style="background:linear-gradient(135deg,#4b1f66,#8e3fc9);padding:28px;text-align:center;">
      <div style="color:#fff;font-size:26px;font-weight:700;letter-spacing:2px;">${BRAND_NAME} <span style="font-weight:400;font-size:13px;letter-spacing:4px;">BUTİK</span></div>
    </div>
    <div style="padding:28px;">
      <h2 style="color:#4b1f66;margin:0 0 8px;">Siparişiniz alındı! 🎉</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 20px;">Merhaba ${order.customerName || ""}, siparişiniz başarıyla oluşturuldu. ${BRAND_NAME}'i tercih ettiğiniz için teşekkür ederiz.</p>
      <div style="background:#f7f4fb;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">Sipariş Numarası</div>
        <div style="font-size:20px;font-weight:700;color:#4b1f66;">${orderNo}</div>
        <div style="font-size:12px;color:#999;margin-top:6px;">Bu numarayı ve e-posta adresinizi kullanarak siparişinizi <b>Kargo Takip</b> sayfasından izleyebilirsiniz.</div>
      </div>
      ${paymentNote ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;margin-bottom:20px;color:#9a3412;font-size:13px;line-height:1.6;">${paymentNote}</div>` : ""}
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
        <tr><td style="padding:12px 0 0;font-weight:700;">Toplam</td><td style="padding:12px 0 0;text-align:right;font-weight:700;color:#4b1f66;">${total.toFixed(2)} ₺</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px;line-height:1.6;">Teslimat adresi: ${order.address || "-"}</p>
    </div>
    <div style="background:#2a1538;padding:18px;text-align:center;color:#c39eed;font-size:12px;">© ${BRAND_NAME}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// createPayment — starts an iyzico checkout with a SERVER-COMPUTED price.
// ---------------------------------------------------------------------------
exports.createPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({error: "Method Not Allowed"});
    }
    if (!(await passesAppCheck(req, res))) return;

    // FAIL-CLOSED: iyzico anahtarları yoksa ödemeyi başlatma (sessizce sandbox'a
    // düşüp bedava sipariş oluşmasını engeller).
    if (!iyzicoReady()) {
      console.error("iyzico anahtarları tanımlı değil (functions/.env).");
      return res.status(500).send({data: {errorMessage: "Ödeme sistemi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin."}});
    }

    const data = (req.body && req.body.data) || {};

    try {
      // Kupon "kişi başı tek kullanım" kontrolü için gerçek müşteri e-postası
      // (mağaza e-postası fallback'i kimlik olarak KULLANILMAZ).
      const buyerEmailForCoupon = sanitizeString(data.email, 254, "").toLowerCase();
      const order = await computeAuthoritativeOrder(data.items, data.couponCode, buyerEmailForCoupon);

      // Stokta olmayan/yetersiz ürün varsa ödemeyi başlatma (aşırı satış önleme).
      if (order.stockIssues && order.stockIssues.length) {
        const list = order.stockIssues
          .map((s) => `${s.name} (kalan: ${s.available})`)
          .join(", ");
        return res.status(409).send({data: {errorMessage:
          `Üzgünüz, şu ürünlerde yeterli stok kalmadı: ${list}. Lütfen sepetinizi güncelleyip tekrar deneyin.`}});
      }

      if (order.lineItems.length === 0 || order.total <= 0) {
        return res.status(400).send({data: {errorMessage: "Sepet geçersiz veya boş."}});
      }

      const safeName = sanitizeString(data.userName, 100, "Müşteri");
      const safeSurname = sanitizeString(data.userSurname, 100, "Soyisim");
      const fullName = `${safeName} ${safeSurname}`;
      const email = sanitizeString(data.email, 254, NOTIFY_EMAIL);
      const gsm = sanitizeString(data.gsmNumber, 20, "+905350000000");
      const city = sanitizeString(data.city, 100, "Istanbul");
      const address = sanitizeString(data.address, 500, "Adres belirtilmedi");
      const identityNumber = sanitizeString(data.identityNumber, 11, "11111111111"); // TC KİMLİK EKLENDİ
      const priceStr = order.total.toFixed(2);
      const conversationId = ORDER_PREFIX + Date.now();

      // KUPON REZERVASYONU (kişi başı tek kullanım) — ödeme başlamadan önce
      // deterministik ID ile transaction içinde rezerve et. Aynı e-posta+kupon
      // ile eşzamanlı (çok-sekme) veya tekrar kullanımı atomik olarak engeller.
      if (order.appliedCoupon && order.couponOncePerUser && buyerEmailForCoupon) {
        const usageRef = admin.firestore().collection("couponUsages").doc(couponUsageId(order.appliedCoupon, buyerEmailForCoupon));
        try {
          await admin.firestore().runTransaction(async (tx) => {
            const snap = await tx.get(usageRef);
            if (snap.exists) {
              const u = snap.data();
              if (u.status === "used") throw new Error("COUPON_USED");
              const reservedAtMs = (u.reservedAt && u.reservedAt.toMillis) ? u.reservedAt.toMillis() : 0;
              if (Date.now() - reservedAtMs < COUPON_RESERVE_WINDOW_MS) throw new Error("COUPON_RESERVED");
            }
            tx.set(usageRef, {
              code: order.appliedCoupon,
              email: buyerEmailForCoupon,
              status: "reserved",
              orderId: conversationId,
              reservedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
        } catch (e) {
          if (e.message === "COUPON_USED" || e.message === "COUPON_RESERVED") {
            return res.status(409).send({data: {errorMessage: "Bu kuponu zaten kullandınız veya kupon şu an başka bir ödemede kullanılıyor. Lütfen kuponu kaldırıp tekrar deneyin."}});
          }
          throw e;
        }
      }

      // Pre-record the order with the AUTHORITATIVE amount.
      await admin.firestore().collection("orders").doc(conversationId).set({
        orderNumber: conversationId,
        totalAmount: order.total,
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        appliedCoupon: order.appliedCoupon,
        userId: sanitizeString(data.userId, 128, "") || null,
        customerName: fullName,
        email: email,
        phone: gsm,
        identityNumber: data.identityNumber || "", // SİPARİŞE TC KİMLİK EKLENDİ
        address: address,
        status: "Ödeme Bekliyor",
        items: order.lineItems.map((li) => ({
          id: li.id, name: li.name, variant: li.variant,
          color: li.color, size: li.size,
          price: li.unitPrice, quantity: li.quantity,
        })),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Bülten aboneliği (opsiyonel) — müşteri işaretlediyse e-postasını kaydet.
      if (data.newsletter && buyerEmailForCoupon) {
        try {
          const nlId = crypto.createHash("sha1").update(buyerEmailForCoupon).digest("hex");
          await admin.firestore().collection("newsletter").doc(nlId).set({
            email: buyerEmailForCoupon,
            subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        } catch (nlErr) {
          console.error("Bülten kaydı yazılamadı:", nlErr);
        }
      }

      const clientIp = (req.headers["x-forwarded-for"] || (req.connection && req.connection.remoteAddress) || "85.34.78.112")
        .toString().split(",")[0].trim();

      const request = {
        locale: "tr",
        conversationId: conversationId,
        price: priceStr,
        paidPrice: priceStr,
        currency: "TRY",
        basketId: conversationId,
        paymentGroup: "PRODUCT",
        callbackUrl: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/paymentCallback`,
        buyer: {
          id: "BY" + Date.now(),
          name: safeName,
          surname: safeSurname,
          gsmNumber: gsm,
          email: email,
          identityNumber: identityNumber, // İYZİCO'YA GERÇEK TC KİMLİK GÖNDERİLDİ
          registrationAddress: address,
          ip: clientIp,
          city: city,
          country: "Turkey",
          zipCode: "34732",
        },
        shippingAddress: {contactName: fullName, city: city, country: "Turkey", address: address, zipCode: "34742"},
        billingAddress: {contactName: fullName, city: city, country: "Turkey", address: address, zipCode: "34742"},
        basketItems: buildBasketItems(order),
      };

      iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
        if (err) {
          console.error("iyzico init error:", err);
          return res.status(502).send({data: {errorMessage: "Ödeme sağlayıcısına ulaşılamadı."}});
        }

        if (result && result.token) {
          try {
            await admin.firestore().collection("orders").doc(conversationId).update({paymentToken: result.token});
          } catch (e) {
            console.error("token yazılamadı:", e);
          }
        }
        return res.status(200).send({data: result});
      });
    } catch (error) {
      console.error("createPayment hata:", error);
      return res.status(500).send({data: {errorMessage: "Ödeme başlatılamadı."}});
    }
  });
});

// ---------------------------------------------------------------------------
// paymentCallback — iyzico redirects here; we VERIFY the payment server-side.
// ---------------------------------------------------------------------------
exports.paymentCallback = functions.https.onRequest((req, res) => {
  const token = req.body && req.body.token;
  const frontendUrl = `${SITE_URL}/odeme-sonucu`;

  if (!token || !iyzicoReady()) {
    return res.redirect(`${frontendUrl}?status=fail`);
  }

  iyzipay.checkoutForm.retrieve({locale: "tr", token: token}, async (err, result) => {
    if (err || !result || result.paymentStatus !== "SUCCESS") {
      return res.redirect(`${frontendUrl}?status=fail`);
    }

    try {
      const db = admin.firestore();
      const paid = Number(result.paidPrice);

      let docId = result.conversationId;
      if (!docId) {
        const snapshot = await db.collection("orders").where("paymentToken", "==", token).limit(1).get();
        if (!snapshot.empty) docId = snapshot.docs[0].id;
      }
      if (!docId) return res.redirect(`${frontendUrl}?status=success`);

      const orderRef = db.collection("orders").doc(docId);

      // Ön-okuma: transaction içinde query çalıştırılamaz; kupon dokümanının
      // referansını önceden çözüyoruz (tutarlılık transaction içinde yeniden
      // doğrulanır).
      const preSnap = await orderRef.get();
      if (!preSnap.exists) return res.redirect(`${frontendUrl}?status=success`);
      const pre = preSnap.data();

      let couponRef = null;
      let usageRef = null;
      if (pre.appliedCoupon) {
        const cq = await db.collection("coupons").where("code", "==", pre.appliedCoupon).limit(1).get();
        if (!cq.empty) couponRef = cq.docs[0].ref;
        if (pre.email) usageRef = db.collection("couponUsages").doc(couponUsageId(pre.appliedCoupon, pre.email));
      }
      const itemRefs = (Array.isArray(pre.items) ? pre.items : [])
        .filter((it) => it && it.id)
        .map((it) => ({it, ref: db.collection("products").doc(String(it.id))}));

      // Stok düşümü + kupon sayımı + sipariş güncellemesi TEK ATOMİK
      // TRANSACTION içinde. soldCounted transaction içinde kontrol edildiği
      // için eşzamanlı/tekrarlı callback ÇİFT stok düşümü / çift kupon sayımı
      // YAPAMAZ (biri commit eder, diğeri retry'da soldCounted=true görür).
      const txResult = await db.runTransaction(async (tx) => {
        const oSnap = await tx.get(orderRef);
        if (!oSnap.exists) return {alreadyProcessed: true};
        const o = oSnap.data();
        if (o.soldCounted) return {alreadyProcessed: true}; // idempotent — zaten işlenmiş

        const expected = Number(o.totalAmount);
        const amountOk = expected > 0 && Math.abs(expected - paid) < 0.02; // #4: expected>0 zorunlu

        // --- ÖNCE TÜM OKUMALAR (Firestore: yazmadan önce tüm read'ler) ---
        const productReads = [];
        if (amountOk) {
          for (const {it, ref} of itemRefs) {
            productReads.push({it, ref, snap: await tx.get(ref)});
          }
        }
        const couponReadSnap = (amountOk && couponRef) ? await tx.get(couponRef) : null;

        // --- SONRA TÜM YAZMALAR ---
        const orderUpdate = {
          status: amountOk ? "Yeni" : "İnceleme Gerekli",
          paidPrice: paid,
          orderNumber: result.paymentId || docId,
          soldCounted: true,
        };

        if (amountOk) {
          const inc = admin.firestore.FieldValue.increment;
          let fulfillmentIssue = false;

          for (const {it, ref, snap} of productReads) {
            if (!snap.exists) continue;
            const product = snap.data();
            const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
            // Stok yetmiyorsa eksiye düşürme (floor 0) + siparişi işaretle.
            if (availableStockFor(product, it.size, it.color) < qty) fulfillmentIssue = true;
            if (Array.isArray(product.variants) && product.variants.length) {
              tx.set(ref, {variants: decrementVariantStock(product, it.size, it.color, qty), soldCount: inc(qty)}, {merge: true});
            } else {
              tx.set(ref, {soldCount: inc(qty)}, {merge: true});
            }
          }
          if (fulfillmentIssue) orderUpdate.fulfillmentIssue = true;

          // Kupon kullanım sayacı + kişi-başı "used" kaydı (aynı transaction).
          if (couponReadSnap && couponReadSnap.exists) {
            tx.set(couponRef, {usedCount: inc(1)}, {merge: true});
          }
          if (usageRef) {
            tx.set(usageRef, {
              code: pre.appliedCoupon,
              email: String(pre.email).toLowerCase(),
              userId: o.userId || null,
              orderId: docId,
              status: "used",
              usedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});
          }
        }

        tx.update(orderRef, orderUpdate);
        return {amountOk, alreadyProcessed: false};
      });

      // Müşteriye gösterilecek sipariş numarası + onay e-postası (yalnızca ilk
      // işlemde). Böylece müşteri numarayı öğrenir ve kargo takibi yapabilir.
      const orderNoForCustomer = result.paymentId || docId;
      if (txResult && txResult.amountOk && !txResult.alreadyProcessed && pre.email) {
        try {
          await db.collection("mail").add({
            to: pre.email,
            message: {
              subject: `Siparişiniz alındı — ${orderNoForCustomer}`,
              html: buildOrderEmailHtml(pre, orderNoForCustomer),
            },
          });
        } catch (mailErr) {
          console.error("Onay e-postası oluşturulamadı:", mailErr);
        }
      }
      return res.redirect(`${frontendUrl}?status=success&order=${encodeURIComponent(orderNoForCustomer)}`);
    } catch (error) {
      console.error("Sipariş güncellenirken hata:", error);
    }

    return res.redirect(`${frontendUrl}?status=success`);
  });
});

// Bearer ID token varsa doğrular ve UID döndürür; yoksa/geçersizse null.
// (Misafir kapıda-ödeme siparişine izin verir; ama giriş yapan kullanıcının
// siparişi GERÇEK UID'sine bağlanır — istemcinin gönderdiği userId'ye güvenmeyiz.)
async function verifyOptionalUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// createCodOrder — "Kapıda Ödeme" siparişi oluşturur (online tahsilat YOK).
// Fiyat/stok/kupon createPayment ile AYNI şekilde sunucuda hesaplanır; ödeme
// teslimatta alınır. Sipariş anında stok düşülür (aşırı satış önlenir).
// ---------------------------------------------------------------------------
exports.createCodOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({error: "Method Not Allowed"});
    }
    if (!(await passesAppCheck(req, res))) return;

    const data = (req.body && req.body.data) || {};

    try {
      const buyerEmail = sanitizeString(data.email, 254, "").toLowerCase();
      const order = await computeAuthoritativeOrder(data.items, data.couponCode, buyerEmail);

      // Stokta olmayan/yetersiz ürün varsa siparişi oluşturma (aşırı satış önleme).
      if (order.stockIssues && order.stockIssues.length) {
        const list = order.stockIssues
          .map((s) => `${s.name} (kalan: ${s.available})`)
          .join(", ");
        return res.status(409).send({data: {errorMessage:
          `Üzgünüz, şu ürünlerde yeterli stok kalmadı: ${list}. Lütfen sepetinizi güncelleyip tekrar deneyin.`}});
      }
      if (order.lineItems.length === 0 || order.total <= 0) {
        return res.status(400).send({data: {errorMessage: "Sepet geçersiz veya boş."}});
      }

      // Kapıda ödeme tutar limiti (sahte sipariş riskine karşı).
      if (order.total > COD_MAX_TOTAL) {
        return res.status(409).send({data: {errorMessage:
          `Kapıda ödeme yalnızca ${COD_MAX_TOTAL.toFixed(2)} ₺ ve altındaki siparişlerde geçerlidir. Lütfen kredi/banka kartı ile ödeme yapın.`}});
      }

      // userId'yi İSTEMCİDEN DEĞİL, doğrulanmış token'dan al.
      const verifiedUid = await verifyOptionalUser(req);

      const safeName = sanitizeString(data.userName, 100, "Müşteri");
      const safeSurname = sanitizeString(data.userSurname, 100, "");
      const fullName = `${safeName} ${safeSurname}`.trim();
      const email = sanitizeString(data.email, 254, "");
      const gsm = sanitizeString(data.gsmNumber, 20, "");
      const city = sanitizeString(data.city, 100, "");
      const address = sanitizeString(data.address, 500, "Adres belirtilmedi");
      const identityNumber = sanitizeString(data.identityNumber, 11, ""); // TC KİMLİK EKLENDİ
      const orderNo = ORDER_PREFIX + Date.now();

      const db = admin.firestore();

      // KUPON REZERVASYONU (kişi başı tek kullanım) — createPayment ile aynı
      // deterministik ID/transaction; eşzamanlı tekrar kullanımı engeller.
      if (order.appliedCoupon && order.couponOncePerUser && buyerEmail) {
        const usageRef = db.collection("couponUsages").doc(couponUsageId(order.appliedCoupon, buyerEmail));
        try {
          await db.runTransaction(async (tx) => {
            const snap = await tx.get(usageRef);
            if (snap.exists) {
              const u = snap.data();
              if (u.status === "used") throw new Error("COUPON_USED");
              const reservedAtMs = (u.reservedAt && u.reservedAt.toMillis) ? u.reservedAt.toMillis() : 0;
              if (Date.now() - reservedAtMs < COUPON_RESERVE_WINDOW_MS) throw new Error("COUPON_RESERVED");
            }
            tx.set(usageRef, {
              code: order.appliedCoupon,
              email: buyerEmail,
              status: "reserved",
              orderId: orderNo,
              reservedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
        } catch (e) {
          if (e.message === "COUPON_USED" || e.message === "COUPON_RESERVED") {
            return res.status(409).send({data: {errorMessage: "Bu kuponu zaten kullandınız veya kupon şu an başka bir ödemede kullanılıyor. Lütfen kuponu kaldırıp tekrar deneyin."}});
          }
          throw e;
        }
      }

      // Kupon dokümanı referansını (sayaç için) önceden çöz — transaction içinde
      // query çalıştırılamaz.
      let couponRef = null;
      let usageRef = null;
      if (order.appliedCoupon) {
        const cq = await db.collection("coupons").where("code", "==", order.appliedCoupon).limit(1).get();
        if (!cq.empty) couponRef = cq.docs[0].ref;
        if (buyerEmail) usageRef = db.collection("couponUsages").doc(couponUsageId(order.appliedCoupon, buyerEmail));
      }

      const itemRefs = order.lineItems.map((li) => ({li, ref: db.collection("products").doc(String(li.id))}));
      const orderRef = db.collection("orders").doc(orderNo);

      // TEK ATOMİK TRANSACTION: stok düş + kupon say + sipariş yaz.
      await db.runTransaction(async (tx) => {
        // --- ÖNCE OKUMALAR ---
        const productReads = [];
        for (const {li, ref} of itemRefs) {
          productReads.push({li, ref, snap: await tx.get(ref)});
        }
        const couponSnap = couponRef ? await tx.get(couponRef) : null;

        // --- SONRA YAZMALAR ---
        const inc = admin.firestore.FieldValue.increment;
        for (const {li, ref, snap} of productReads) {
          if (!snap.exists) continue;
          const product = snap.data();
          const qty = Math.max(1, parseInt(li.quantity, 10) || 1);
          if (Array.isArray(product.variants) && product.variants.length) {
            tx.set(ref, {variants: decrementVariantStock(product, li.size, li.color, qty), soldCount: inc(qty)}, {merge: true});
          } else {
            tx.set(ref, {soldCount: inc(qty)}, {merge: true});
          }
        }

        // Kupon kullanımını siparişte kesinleştir (kapıda ödeme = taahhüt edilmiş sipariş).
        if (couponSnap && couponSnap.exists) {
          tx.set(couponRef, {usedCount: inc(1)}, {merge: true});
        }
        if (usageRef) {
          tx.set(usageRef, {
            code: order.appliedCoupon,
            email: buyerEmail,
            userId: verifiedUid || null,
            orderId: orderNo,
            status: "used",
            usedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        }

        tx.set(orderRef, {
          orderNumber: orderNo,
          totalAmount: order.total,
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          appliedCoupon: order.appliedCoupon,
          paymentMethod: "kapida",
          paymentStatus: "pending", // teslimatta tahsil edilecek
          soldCounted: true, // stok bu akışta düşüldü
          userId: verifiedUid || null,
          guest: !verifiedUid,
          customerName: fullName,
          email: email,
          phone: gsm,
          identityNumber: identityNumber, // SİPARİŞE TC KİMLİK EKLENDİ
          address: address,
          city: city,
          status: "Yeni",
          items: order.lineItems.map((li) => ({
            id: li.id, name: li.name, variant: li.variant,
            color: li.color, size: li.size,
            price: li.unitPrice, quantity: li.quantity,
          })),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Bülten aboneliği (opsiyonel)
      if (data.newsletter && buyerEmail) {
        try {
          const nlId = crypto.createHash("sha1").update(buyerEmail).digest("hex");
          await db.collection("newsletter").doc(nlId).set({
            email: buyerEmail,
            subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        } catch (nlErr) {
          console.error("Bülten kaydı yazılamadı:", nlErr);
        }
      }

      // Onay e-postası (kapıda ödeme notu ile).
      if (email) {
        try {
          const emailOrder = {
            customerName: fullName,
            address: address,
            totalAmount: order.total,
            items: order.lineItems.map((li) => ({
              name: li.name, variant: li.variant, price: li.unitPrice, quantity: li.quantity,
            })),
          };
          const note = `<b>Ödeme yöntemi: Kapıda Ödeme.</b> Sipariş tutarını (${order.total.toFixed(2)} ₺) teslimat sırasında kuryeye ödeyeceksiniz.`;
          await db.collection("mail").add({
            to: email,
            message: {
              subject: `Siparişiniz alındı (Kapıda Ödeme) — ${orderNo}`,
              html: buildOrderEmailHtml(emailOrder, orderNo, note),
            },
          });
        } catch (mailErr) {
          console.error("Kapıda ödeme onay e-postası oluşturulamadı:", mailErr);
        }
      }

      return res.status(200).send({data: {success: true, orderNumber: orderNo, paymentMethod: "kapida"}});
    } catch (error) {
      console.error("createCodOrder hata:", error);
      return res.status(500).send({data: {errorMessage: "Sipariş oluşturulamadı. Lütfen tekrar deneyin."}});
    }
  });
});

// ---------------------------------------------------------------------------
// validateCoupon — lets the cart preview a discount WITHOUT exposing the
// coupons collection to the client (prevents code enumeration).
// ---------------------------------------------------------------------------
exports.validateCoupon = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({error: "Method Not Allowed"});
    }
    if (!(await passesAppCheck(req, res))) return;
    try {
      const data = (req.body && req.body.data) || {};
      const code = sanitizeString(data.code, 40, "").toUpperCase();
      const subtotal = Math.max(0, Number(data.subtotal) || 0);
      const email = sanitizeString(data.email, 254, "").toLowerCase();
      if (!code) {
        return res.status(200).send({data: {valid: false, message: "Kupon kodu boş."}});
      }

      const snap = await admin.firestore().collection("coupons")
        .where("code", "==", code).where("isActive", "==", true).limit(1).get();

      if (snap.empty) {
        return res.status(200).send({data: {valid: false, message: "Geçersiz veya süresi dolmuş kupon kodu."}});
      }

      const couponData = snap.docs[0].data();
      const result = evaluateCoupon(couponData, subtotal);
      if (!result.valid) {
        return res.status(200).send({data: {valid: false, message: result.message}});
      }

      // Kişi başı tek kullanım kontrolü (e-posta biliniyorsa)
      if (couponData.oncePerUser && email && await userAlreadyUsedCoupon(code, email)) {
        return res.status(200).send({data: {valid: false, message: "Bu kuponu daha önce kullandınız."}});
      }

      return res.status(200).send({data: {
        valid: true,
        discount: result.discount,
        discountType: result.discountType,
        discountValue: result.discountValue,
      }});
    } catch (error) {
      console.error("validateCoupon hata:", error);
      return res.status(500).send({data: {valid: false, message: "Kupon kontrol edilemedi."}});
    }
  });
});

// ---------------------------------------------------------------------------
// trackOrder — customer order tracking WITHOUT exposing the orders collection.
// Requires BOTH the order number and the matching e-mail, and returns only
// non-sensitive status/cargo fields (no address, no phone, no full item list).
// ---------------------------------------------------------------------------
exports.trackOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({error: "Method Not Allowed"});
    }
    if (!(await passesAppCheck(req, res))) return;
    try {
      const data = (req.body && req.body.data) || {};
      const orderNumber = sanitizeString(data.orderNumber, 60, "");
      const email = sanitizeString(data.email, 254, "").toLowerCase();

      if (!orderNumber || !email) {
        return res.status(400).send({data: {found: false, message: "Sipariş numarası ve e-posta gereklidir."}});
      }

      const snap = await admin.firestore().collection("orders")
        .where("orderNumber", "==", orderNumber).limit(5).get();

      let match = null;
      snap.forEach((d) => {
        const o = d.data();
        if (!match && typeof o.email === "string" && o.email.toLowerCase() === email) {
          match = o;
        }
      });

      if (!match) {
        return res.status(200).send({data: {found: false, message: "Sipariş bulunamadı. Lütfen bilgileri kontrol edin."}});
      }

      // Only expose what the tracking page needs — never PII.
      return res.status(200).send({data: {
        found: true,
        orderNumber: match.orderNumber || orderNumber,
        status: match.status || "Yeni",
        cargoCompany: match.cargoCompany || "",
        trackingNumber: match.trackingNumber || "",
      }});
    } catch (error) {
      console.error("trackOrder hata:", error);
      return res.status(500).send({data: {found: false, message: "Sistemde bir hata oluştu."}});
    }
  });
});

// ---------------------------------------------------------------------------
// productFeed — Mağazadaki ürünleri Google Merchant / Google Shopping XML
// formatında listeler (iyzico ürün XML linki, Google Merchant Center vb. için).
// Herkese açık; ürünler Firestore'dan CANLI okunur (her istekte güncel).
// URL: https://us-central1-<proje-kimligi>.cloudfunctions.net/productFeed
// ---------------------------------------------------------------------------
function xmlEscape(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

exports.productFeed = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.firestore();
    const site = SITE_URL;
    const snap = await db.collection("products").get();

    const items = [];
    snap.forEach((doc) => {
      const p = doc.data() || {};
      const id = doc.id;
      const name = p.name || "Ürün";
      const desc = (typeof p.description === "string" && p.description.trim()) || name;
      const image = (Array.isArray(p.images) && p.images[0]) || p.imageUrl || "";
      const price = Number(p.price) || 0;
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const totalStock = variants.length
        ? variants.reduce((a, v) => a + (Number(v.stock) || 0), 0)
        : 0;
      const availability = totalStock > 0 ? "in stock" : "out of stock";
      const category = Array.isArray(p.category) ? (p.category[0] || "") : (p.category || "");

      // Görseli veya geçerli fiyatı olmayan ürünleri feed'e ekleme.
      if (!image || !(price > 0)) return;

      items.push(
        "    <item>\n" +
        `      <g:id>${xmlEscape(id)}</g:id>\n` +
        `      <g:title>${xmlEscape(name)}</g:title>\n` +
        `      <g:description>${xmlEscape(desc)}</g:description>\n` +
        `      <g:link>${xmlEscape(site + "/product/" + id)}</g:link>\n` +
        `      <g:image_link>${xmlEscape(image)}</g:image_link>\n` +
        `      <g:availability>${availability}</g:availability>\n` +
        `      <g:price>${price.toFixed(2)} TRY</g:price>\n` +
        `      <g:brand>${BRAND_NAME}</g:brand>\n` +
        `      <g:condition>new</g:condition>\n` +
        (category ? `      <g:product_type>${xmlEscape(category)}</g:product_type>\n` : "") +
        "    </item>",
      );
    });

    const xml =
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
      "<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">\n" +
      "  <channel>\n" +
      `    <title>${BRAND_NAME}</title>\n` +
      `    <link>${site}</link>\n` +
      `    <description>${BRAND_NAME} ürün listesi</description>\n` +
      (items.length ? items.join("\n") + "\n" : "") +
      "  </channel>\n" +
      "</rss>\n";

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    return res.status(200).send(xml);
  } catch (error) {
    console.error("productFeed hata:", error);
    return res.status(500).send("Ürün feed'i oluşturulamadı.");
  }
});

// ---------------------------------------------------------------------------
// ADMIN BİLDİRİM MAİLİ (Yeni Sipariş) - V2 Mimari (Güncellenmiş)
// ---------------------------------------------------------------------------
exports.yeniSiparisMail = onDocumentWritten("orders/{orderId}", async (event) => {
    const after = event.data.after;
    const before = event.data.before;
    
    // Belge silindiyse işlem yapma
    if (!after.exists) return null; 

    const order = after.data();
    const previousStatus = before.exists ? before.data().status : null;

    // ÖNEMLİ KONTROL: Sipariş durumunun İLK KEZ "Yeni" olduğu anı yakala.
    if (order.status !== 'Yeni') return null; 
    if (previousStatus === 'Yeni') return null; 

    const mailOptions = {
        from: `"${BRAND_NAME} Sistem" <${MAIL_USER}>`,
        to: NOTIFY_EMAIL,
        subject: `🔔 Yeni Sipariş Geldi: ${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6d28d9;">${BRAND_NAME} - Yeni Sipariş!</h2>
            <p>Web sitenize yeni bir sipariş düştü. Detaylar aşağıdadır:</p>
            <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 15px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Sipariş No:</td>
                <td style="padding: 10px 0;">${order.orderNumber || 'Bilinmiyor'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Müşteri:</td>
                <td style="padding: 10px 0;">${order.customerName || 'Belirtilmedi'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Tutar:</td>
                <td style="padding: 10px 0; font-weight: bold; color: #059669;">${Number(order.totalAmount).toFixed(2)} ₺</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Ödeme Tipi:</td>
                <td style="padding: 10px 0;">${order.paymentMethod === 'kapida' ? 'Kapıda Ödeme 💵' : 'Kredi Kartı 💳'}</td>
              </tr>
            </table>
            <br/>
            <a href="${SITE_URL}/admin" style="background-color: #111; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin Panele Git</a>
          </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Yeni sipariş e-postası başarıyla gönderildi.");
    } catch (error) {
        console.error("E-posta gönderim hatası:", error);
    }

    return null;
});