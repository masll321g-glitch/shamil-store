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
