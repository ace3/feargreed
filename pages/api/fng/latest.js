// Simple Next.js API route that proxies the Alternative.me FNG API and caches the latest value in-memory
let cache = { data: null, ts: 0 };
const TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < TTL) {
      return res.status(200).json({ cached: true, source: 'alternative.me', data: cache.data });
    }

    const r = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!r.ok) throw new Error(`remote responded ${r.status}`);
    const json = await r.json();

    cache = { data: json, ts: now };
    return res.status(200).json({ cached: false, source: 'alternative.me', data: json });
  } catch (err) {
    console.error('Error fetching FNG:', err);
    return res.status(502).json({ error: 'Failed to fetch remote API', details: err.message });
  }
}
