// api/stream-url.js
export default async function handler(req, res) {
  const { imei } = req.query;
  if (!imei) return res.status(400).json({ error: 'imei required' });

  // ⚠️ Replace with your actual JWT token (from Step 1)
  const JWT_TOKEN = process.env.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJ0b2tlbiIsImlhdCI6MTc4MjQxNjMyOCwiYWNjb3VudElkIjoiMjE1NzE4NyIsImlzVXNlckZpY3RpdGlvdXMiOiJmYWxzZSIsInVzZXJGaWN0aXRpb3VzUGFyZW50SWQiOiIiLCJyYW5kb21JZCI6IjY4ODEifQ.xMys-Kd9frenS9D39Jt6aRW12EQybkD_YqoKNge6-jU';

  try {
    // Step A: Get stream parameters
    const paramsUrl = `https://bgd.tracksolidpro.com/v3/new/newVideo/getStreamUrlParams?imei=${imei}&channel=0`;
    const paramsRes = await fetch(paramsUrl, {
      headers: { authorization: JWT_TOKEN }
    });
    const paramsData = await paramsRes.json();
    // Example: { devKey, devSecret, appId, userId, ... }

    // Step B: Get live stream URL (contains WebSocket address and token)
    const liveUrl = `https://bgd.tracksolidpro.com/v3/new/newVideo/getLiveStreamUrl?imei=${imei}&channel=0`;
    const liveRes = await fetch(liveUrl, {
      headers: { authorization: JWT_TOKEN }
    });
    const liveData = await liveRes.json();
    // Example: { wsUrl: "wss://bgd-live.tracksolidpro.com:8890/0/....flv?..." }

    // Combine both responses
    res.status(200).json({
      params: paramsData,
      stream: liveData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}