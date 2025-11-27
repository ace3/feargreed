// Aggregate Fear & Greed index from multiple sources.
// Sources: Alternative.me (implemented) + 3 additional sources (stubs) to be defined.
// Env vars: set API keys/secrets in .env.local; see README and .env.example.

const TTL = 5 * 60 * 1000; // 5 minutes cache
let cache = { data: null, ts: 0 };

// Helper: safe fetch with timeout
async function safeFetch(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...options, signal: controller.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

// Source 1: Alternative.me
async function sourceAlternative() {
  const json = await safeFetch('https://api.alternative.me/fng/?limit=1');
  const item = json?.data?.[0];
  if (!item) throw new Error('alt.me: empty data');
  return {
    name: 'alternative.me',
    value: Number(item.value),
    raw: item,
  };
}

// Source 2: CoinMarketCap Fear & Greed (historical) — use latest value
async function sourceTwo() {
  const key = process.env.CMC_API_KEY;
  if (!key) return null;
  const json = await safeFetch('https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical', {
    headers: {
      'X-CMC_PRO_API_KEY': key,
      'Accept': 'application/json'
    }
  });
  // Expected shape: { data: [ { value: number|string, timestamp: number, ... }, ... ] }
  const arr = json?.data;
  const item = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null; // latest
  if (!item || item.value === undefined) throw new Error('CMC: empty data');
  return {
    name: 'coinmarketcap',
    value: Number(item.value),
    raw: item,
  };
}

// Source 3: Stub (to be defined)
async function sourceThree() {
  // Coinglass Fear & Greed history — use latest
  const key = process.env.COINGLASS_API_KEY;
  if (!key) return null;
  const json = await safeFetch('https://open-api-v4.coinglass.com/api/index/fear-greed-history', {
    headers: {
      'coinglassSecret': key,
      'Accept': 'application/json'
    }
  });
  // Expected shape: { data: [ { value: number|string, time: number, ... }, ... ] } or similar
  const arr = json?.data || json?.result || json?.list;
  const item = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
  if (!item) throw new Error('Coinglass: empty data');
  const val = item.value ?? item.index ?? item.fearGreed ?? item.score;
  if (val === undefined) throw new Error('Coinglass: no value field');
  return {
    name: 'coinglass',
    value: Number(val),
    raw: item,
  };
}

// Source 4: Stub (to be defined)
async function sourceFour() {
  // Coinstats Fear and Greed — placeholder until endpoint provided
  const key = process.env.COINSTATS_API_KEY;
  if (!key) return null;
  // TODO: Replace URL and mapping once provided
  // const json = await safeFetch('https://api.coinstats.app/fear-greed/latest', { headers: { 'Authorization': `Bearer ${key}` } });
  // const val = json?.data?.value;
  // return { name: 'coinstats', value: Number(val), raw: json };
  return null;
}

function aggregate(values) {
  const nums = values.map(v => v.value).filter(v => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / nums.length);
  return avg;
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < TTL) {
      return res.status(200).json({ cached: true, ...cache.data });
    }

    const results = await Promise.allSettled([
      sourceAlternative(),
      sourceTwo(),
      sourceThree(),
      sourceFour(),
    ]);

    // Build a 4-slot sources array, defaulting undefined to value 0 per spec
    const slots = results.map((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        return { name: r.value.name, value: Number(r.value.value) };
      }
      // Default for undefined/missing source
      return { name: `source${idx + 1}` , value: 0 };
    });

    // Aggregate across all 4 sources, even if some are zero
    const sum = slots.reduce((a, b) => a + (Number.isFinite(b.value) ? b.value : 0), 0);
    const agg = Math.round(sum / 4);

    const payload = {
      source_count: 4,
      aggregate_value: agg,
      sources: slots,
    };

    cache = { data: payload, ts: now };
    return res.status(200).json({ cached: false, ...payload });
  } catch (err) {
    console.error('aggregate error:', err);
    return res.status(500).json({ error: 'aggregation_failed', details: err.message });
  }
}
