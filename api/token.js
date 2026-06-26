const BASE_URL = process.env.BASE_URL;
const APP_KEY = process.env.APP_KEY;
const USER_ID = process.env.USER_ID;
const USER_PWD_MD5 = process.env.USER_PWD_MD5;
const kv = require('@vercel/kv');

// ইউটিসি টাইমস্ট্যাম্প জেনারেটর (yyyy-MM-dd HH:mm:ss)
function getUTCTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

async function fetchNewToken() {
  const params = {
    method: 'jimi.oauth.token.get',
    timestamp: getUTCTimestamp(),
    app_key: APP_KEY,
    sign_method: 'md5',
    v: '0.9',               // no signature
    format: 'json',
    user_id: USER_ID,
    user_pwd_md5: USER_PWD_MD5,
    expires_in: 7200
  };
  const body = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const resp = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body
  });
  const data = await resp.json();
  if (data.code === 0) {
    return data.result.accessToken;
  }
  throw new Error(`Token error: ${data.message}`);
}

module.exports = async function getToken() {
  const cacheKey = 'access_token';
  let token = await kv.get(cacheKey);
  if (token) return token;

  token = await fetchNewToken();
  // expires_in 7200 সেকেন্ড, তবে আমরা ১ ঘণ্টা পর নতুন টোকেন নেব (নিরাপদ)
  await kv.set(cacheKey, token, { ex: 3600 }); // 1 hour expiry in KV
  return token;
};