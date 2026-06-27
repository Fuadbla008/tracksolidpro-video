const getToken = require('./token.js');
const BASE_URL = process.env.BASE_URL;

function getUTCTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

module.exports = async function handler(req, res) {
  const { imei, page_no = 0, page_size = 10 } = req.query;
  if (!imei) return res.status(400).json({ error: 'imei required' });

  try {
    const token = await getToken();

    const params = {
      method: 'jimi.device.jimi.media.URL',   // 7.38 API – সব ধরনের মিডিয়া
      timestamp: getUTCTimestamp(),
      app_key: process.env.APP_KEY,
      sign_method: 'md5',
      v: '0.9',
      format: 'json',
      access_token: token,
      imei,
      camera: '3',            // 3 = both front & inward
      media_type: '3',        // 3 = both photo & video
      page_no,
      page_size
    };

    const formBody = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: formBody
    });

    const data = await response.json();

    // ক্যাশ প্রতিরোধ
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json(data);
  } catch (error) {
    console.error('Media API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};