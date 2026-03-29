# شامل ستور — دليل النشر على Vercel

## 📁 هيكل المشروع
```
shaml-store/
├── index.html              ← الموقع الرئيسي
├── api/
│   ├── create-payment.js   ← Stripe (Serverless)
│   ├── paypal-order.js     ← PayPal (Serverless)
│   └── place-order.js      ← SMM Provider (Serverless)
├── vercel.json
├── package.json
└── .env.example            ← نموذج المتغيرات
```

---

## 🚀 خطوات النشر على Vercel

### 1. ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/username/shaml-store.git
git push -u origin main
```

### 2. ادخل على vercel.com
- سجل دخول بحساب GitHub
- اضغط **New Project**
- اختر الـ Repository

### 3. أضف المتغيرات (Environment Variables)
في إعدادات المشروع على Vercel → **Environment Variables**:

| Key | Value |
|-----|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` من Stripe Dashboard |
| `PAYPAL_CLIENT_ID` | من PayPal Developer |
| `PAYPAL_CLIENT_SECRET` | من PayPal Developer |
| `PAYPAL_MODE` | `live` أو `sandbox` |
| `SMM_API_KEY` | مفتاح المورد |
| `SMM_API_URL` | رابط API المورد |

### 4. عدّل index.html
غيّر هذه القيم في قسم `CFG`:
```js
stripeKey: 'pk_live_YOUR_KEY',    // Publishable Key فقط (ليس Secret)
paypalId:  'YOUR_PAYPAL_CLIENT_ID',
whatsapp:  '966XXXXXXXXX',
```

وعدّل رابط PayPal SDK في أعلى الصفحة:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD">
```

### 5. انشر!
اضغط **Deploy** — سيكون موقعك جاهزاً خلال دقيقة.

---

## 💳 الحصول على API Keys

### Stripe
1. stripe.com → سجل حساب
2. Dashboard → Developers → API Keys
3. انسخ **Publishable Key** و **Secret Key**

### PayPal
1. developer.paypal.com → سجل دخول
2. My Apps & Credentials → Create App
3. انسخ **Client ID** و **Client Secret**

### SMM Provider
- اطلب API Key من موردك
- عادةً في إعدادات الحساب → API

---

## ⚡ ملاحظة مهمة
- Secret Keys تذهب فقط في Vercel Environment Variables
- لا تضعها أبداً في index.html
- Publishable Key (Stripe) و Client ID (PayPal) آمنان في الـ Frontend
