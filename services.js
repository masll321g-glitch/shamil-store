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
