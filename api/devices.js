const getToken = require('./token.js');
const BASE_URL = process.env.BASE_URL;
const USER_ID = process.env.USER_ID;

function getUTCTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

module.exports = async function handler(req, res) {
  try {
    const token = await getToken();
    const params = {
      method: 'jimi.user.device.location.list',
      timestamp: getUTCTimestamp(),
      app_key: process.env.APP_KEY,
      sign_method: 'md5',
      v: '0.9',
      format: 'json',
      access_token: token,
      target: USER_ID,
      map_type: ''
    };
    const body = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const resp = await fetch(BASE_URL, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body });
    const data = await resp.json();
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};