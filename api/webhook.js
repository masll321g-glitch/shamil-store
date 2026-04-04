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
