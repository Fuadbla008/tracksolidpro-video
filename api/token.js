const { kv } = require('@vercel/kv');

const BASE_URL = process.env.BASE_URL;
const APP_KEY = process.env.APP_KEY;
const USER_ID = process.env.USER_ID;
const USER_PWD_MD5 = process.env.USER_PWD_MD5;

const CACHE_KEY = 'access_token';

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
    v: '0.9',
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
  try {
    // KV থেকে টোকেন পাওয়ার চেষ্টা
    let token = await kv.get(CACHE_KEY);
    if (token) return token;

    // না পেলে নতুন টোকেন আনুন
    token = await fetchNewToken();

    // টোকেন KV-তে ১ ঘণ্টার জন্য জমা রাখুন (3600 সেকেন্ড)
    await kv.set(CACHE_KEY, token, { ex: 3600 });

    return token;
  } catch (error) {
    // যদি KV ডাউন থাকে বা কানেক্ট করতে না পারে, তবুও টোকেন জেনারেট করে দিন
    console.error('KV error, fallback to no cache:', error);
    return fetchNewToken();
  }
};