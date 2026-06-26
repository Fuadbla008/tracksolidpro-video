const getToken = require('./token.js');
const BASE_URL = process.env.BASE_URL;

function getUTCTimestamp() { /* ওপরের মতো */ }

module.exports = async function handler(req, res) {
  const { imei } = req.query;
  if (!imei) return res.status(400).json({ error: 'imei required' });
  try {
    const token = await getToken();
    const params = {
      method: 'jimi.device.live.page.url',
      timestamp: getUTCTimestamp(),
      app_key: process.env.APP_KEY,
      sign_method: 'md5',
      v: '0.9',
      format: 'json',
      access_token: token,
      imei,
      type: '1',    // real-time video
      voice: '1'
    };
    const body = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const resp = await fetch(BASE_URL, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body });
    const data = await resp.json();
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};