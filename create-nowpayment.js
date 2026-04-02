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
