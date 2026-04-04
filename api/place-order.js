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
