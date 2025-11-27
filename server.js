import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory cache
let cache = { data: null, ts: 0 };
const TTL = 5 * 60 * 1000; // 5 minutes

app.use(express.static('public'));

app.get('/api/fng/latest', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < TTL) {
      return res.json({ cached: true, source: 'alternative.me', data: cache.data });
    }

    const resp = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!resp.ok) throw new Error(`remote responded ${resp.status}`);
    const json = await resp.json();

    cache = { data: json, ts: now };
    return res.json({ cached: false, source: 'alternative.me', data: json });
  } catch (err) {
    console.error('Error fetching FNG:', err);
    return res.status(502).json({ error: 'Failed to fetch remote API', details: err.message });
  }
});

app.listen(PORT, () => console.log(`fng-clone server listening on http://localhost:${PORT}`));
