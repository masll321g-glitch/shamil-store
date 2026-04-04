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
