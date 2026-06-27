const getToken = require('./token.js');
const BASE_URL = process.env.BASE_URL;

function getUTCTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

async function callMediaApi(token, imei, method, page_no = 0, page_size = 10) {
  const params = {
    method: method,
    timestamp: getUTCTimestamp(),
    app_key: process.env.APP_KEY,
    sign_method: 'md5',
    v: '0.9',
    format: 'json',
    access_token: token,
    imei,
    camera: '3',
    media_type: '3',
    page_no,
    page_size
  };
  const body = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const resp = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body
  });
  return resp.json();
}

module.exports = async function handler(req, res) {
  const { imei, page_no = 0, page_size = 10 } = req.query;
  if (!imei) return res.status(400).json({ error: 'imei required' });

  try {
    const token = await getToken();

    // প্রথমে 7.38 API চেষ্টা (সকল মিডিয়া)
    let data = await callMediaApi(token, imei, 'jimi.device.jimi.media.URL', page_no, page_size);
    
    // যদি result null বা খালি অ্যারে হয়, তাহলে 7.20 API (রিমোট কমান্ডের মিডিয়া) চেষ্টা করি
    if (!data.result || (Array.isArray(data.result) && data.result.length === 0)) {
      console.log('7.38 API returned empty, trying 7.20...');
      data = await callMediaApi(token, imei, 'jimi.device.media.URL', page_no, page_size);
    }

    // ক্যাশ বন্ধ
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json(data);
  } catch (error) {
    console.error('Media API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};