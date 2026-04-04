module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, serviceId, serviceName, link, quantity } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount مطلوب' });

  try {
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': '9b4c4496-6610-4de7-b61e-a3798826fa75',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdtsol',
        order_id: `PS-${serviceId || 'PKG'}-${Date.now()}`,
        order_description: `${serviceName || 'باقة'} | ${quantity || ''} | ${link || ''}`,
        success_url: `${req.headers.origin || 'https://shamil-store-na86.vercel.app'}/?payment=success`,
        cancel_url: `${req.headers.origin || 'https://shamil-store-na86.vercel.app'}/?payment=cancelled`,
        is_fixed_rate: false,
        is_fee_paid_by_user: false,
      }),
    });

    const data = await response.json();

    if (data.invoice_url) {
      return res.status(200).json({ success: true, paymentUrl: data.invoice_url });
    } else {
      return res.status(400).json({ error: data.message || 'فشل إنشاء رابط الدفع' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// api/create-payment.js
// Stripe Payment Intent — Vercel Serverless Function

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, currency = 'usd', serviceId, link, qty } = req.body;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      metadata: { serviceId: String(serviceId), link, qty: String(qty) },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};

// api/order.js
// إرسال الطلب لـ Peakerr وإرجاع رقم الطلب

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { serviceId, link, quantity } = req.body;

  if (!serviceId || !link || !quantity) {
    return res.status(400).json({ error: 'serviceId و link و quantity مطلوبة' });
  }

  try {
    const params = new URLSearchParams({
      key: '346f420a26ad2c4c0fdd716d669a4417',
      action: 'add',
      service: serviceId,
      link,
      quantity,
    });

    const response = await fetch('https://peakerr.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.order) {
      return res.status(200).json({ success: true, orderId: data.order });
    } else {
      return res.status(400).json({ error: data.error || 'فشل إرسال الطلب للمورد' });
    }
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
};

// api/paypal-order.js
// PayPal Order Create & Capture — Vercel Serverless Function

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, amount, orderId } = req.body;

  try {
    const token = await getAccessToken();

    if (action === 'create') {
      // Create PayPal order
      const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ amount: { currency_code: 'USD', value: amount.toFixed(2) } }],
        }),
      });
      const data = await r.json();
      return res.status(200).json({ id: data.id });
    }

    if (action === 'capture') {
      // Capture PayPal order after approval
      const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await r.json();
      return res.status(200).json(data);
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('PayPal error:', err);
    res.status(500).json({ error: err.message });
  }
};

// api/place-order.js
// Submit order to SMM Provider after payment confirmed

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { serviceId, link, quantity } = req.body;

  if (!serviceId || !link || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch(process.env.SMM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.SMM_API_KEY,
        action: 'add',
        service: serviceId,
        link,
        quantity,
      }),
    });

    const data = await response.json();

    if (data.order) {
      return res.status(200).json({ success: true, orderId: data.order });
    } else {
      return res.status(500).json({ error: data.error || 'SMM provider error' });
    }
  } catch (err) {
    console.error('SMM error:', err);
    res.status(500).json({ error: err.message });
  }
};

// api/services.js
// جلب جميع الخدمات من Peakerr

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const params = new URLSearchParams({
      key: '346f420a26ad2c4c0fdd716d669a4417',
      action: 'services',
    });

    const response = await fetch('https://peakerr.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const services = await response.json();

    // تصنيف الخدمات حسب المنصة
    const platforms = {
      instagram: [], tiktok: [], snapchat: [],
      twitter: [], facebook: [], youtube: [], other: []
    };

    const keywords = {
      instagram: ['instagram', 'insta', 'ig'],
      tiktok: ['tiktok', 'tik tok'],
      snapchat: ['snapchat', 'snap'],
      twitter: ['twitter', 'tweet', 'x.com'],
      facebook: ['facebook', 'fb'],
      youtube: ['youtube', 'yt'],
    };

    for (const svc of services) {
      const name = (svc.name + ' ' + svc.category).toLowerCase();
      let matched = false;
      for (const [platform, keys] of Object.entries(keywords)) {
        if (keys.some(k => name.includes(k))) {
          platforms[platform].push({
            id: svc.service,
            name: svc.name,
            category: svc.category,
            rate: parseFloat(svc.rate),          // سعر المورد لكل 1000
            min: parseInt(svc.min),
            max: parseInt(svc.max),
            type: svc.type,
          });
          matched = true;
          break;
        }
      }
      if (!matched) platforms.other.push({ id: svc.service, name: svc.name, rate: parseFloat(svc.rate), min: parseInt(svc.min), max: parseInt(svc.max) });
    }

    res.status(200).json({ success: true, platforms });
  } catch (err) {
    console.error('Services error:', err);
    res.status(500).json({ error: err.message });
  }
};

// api/status.js
// متابعة حالة الطلب + رصيد الحساب

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, orderId, orderIds } = req.body;

  try {
    let params;

    if (action === 'balance') {
      params = new URLSearchParams({ key: '346f420a26ad2c4c0fdd716d669a4417', action: 'balance' });
    } else if (action === 'status' && orderId) {
      params = new URLSearchParams({ key: '346f420a26ad2c4c0fdd716d669a4417', action: 'status', order: orderId });
    } else if (action === 'multi_status' && orderIds) {
      params = new URLSearchParams({ key: '346f420a26ad2c4c0fdd716d669a4417', action: 'status', orders: orderIds.join(',') });
    } else if (action === 'cancel' && orderIds) {
      params = new URLSearchParams({ key: '346f420a26ad2c4c0fdd716d669a4417', action: 'cancel', orders: orderIds.join(',') });
    } else {
      return res.status(400).json({ error: 'action غير صحيح' });
    }

    const response = await fetch('https://peakerr.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: err.message });
  }
};

// api/webhook.js
// يستقبل إشعارات NOWPayments ويرسل الطلبات لـ Peakerr

const PEAKERR_KEY = '346f420a26ad2c4c0fdd716d669a4417';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'GET') return res.status(200).json({ status: 'webhook active' });
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const data = req.body;
    console.log('Webhook received:', JSON.stringify(data));

    // تحقق من حالة الدفع
    const status = data.payment_status;
    if (status !== 'finished' && status !== 'partially_paid' && status !== 'confirmed') {
      return res.status(200).json({ received: true, action: 'ignored', status });
    }

    // استخراج معلومات الطلب من order_description
    const orderId = data.order_id || '';
    const description = data.order_description || '';

    console.log('Payment confirmed! Order:', orderId, 'Description:', description);

    // تنفيذ الطلبات في Peakerr
    // نحاول نقرأ الطلبات من order_description
    // Format: "serviceName | quantity | link"
    const parts = description.split('|').map(p => p.trim());
    
    if (parts.length >= 3) {
      const link = parts[2];
      const quantity = parseInt(parts[1]) || 1000;
      
      // استخراج service ID من order_id
      // Format: PS-{serviceId}-{timestamp} or PS-PKG-{timestamp}
      const orderParts = orderId.split('-');
      const serviceIdStr = orderParts[1] || '';
      
      if (serviceIdStr && serviceIdStr !== 'PKG') {
        // خدمة منفردة
        const serviceId = parseInt(serviceIdStr);
        if (serviceId) {
          await placeOrder(serviceId, link, quantity);
        }
      }
    }

    return res.status(200).json({ received: true, processed: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
};

async function placeOrder(serviceId, link, quantity) {
  try {
    const params = new URLSearchParams({
      key: PEAKERR_KEY,
      action: 'add',
      service: serviceId,
      link: link,
      quantity: quantity,
    });

    const response = await fetch('https://peakerr.com/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    console.log('Peakerr order result:', data);
    return data;
  } catch (err) {
    console.error('Peakerr order error:', err);
  }
}
