import { useEffect, useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  async function fetchLatest() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/fng/aggregate');
      if (!resp.ok) throw new Error('Network error');
      const body = await resp.json();
      if (typeof body.aggregate_value !== 'number') throw new Error('Unexpected response');
      setPayload({ body });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(id);
  }, []);

  const getLabel = (value) => {
    if (value <= 25) return 'EXTREME FEAR';
    if (value <= 45) return 'FEAR';
    if (value <= 55) return 'NEUTRAL';
    if (value <= 75) return 'GREED';
    return 'EXTREME GREED';
  };

  const getColor = (value) => {
    if (value <= 25) return '#dc4433';
    if (value <= 45) return '#f5a89c';
    if (value <= 55) return '#d1d1d1';
    if (value <= 75) return '#a8d5a8';
    return '#4caf50';
  };

  return (
    <main style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif', 
      padding: '40px 24px', 
      maxWidth: 1200, 
      margin: '0 auto',
      backgroundColor: '#fff'
    }}>
      <h1 style={{ 
        fontSize: 48, 
        fontWeight: 700, 
        margin: 0, 
        marginBottom: 8,
        color: '#000'
      }}>
        Fear & Greed Index
      </h1>
      
      <p style={{ 
        fontSize: 18, 
        color: '#000', 
        margin: 0,
        marginBottom: 32 
      }}>
        What emotion is driving the market now?
      </p>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
          Loading latest index…
        </div>
      )}

      {error && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: 8,
          color: '#c33' 
        }}>
          Failed to load latest index: {error}
        </div>
      )}

      {payload && (
        <div>
          {/* Main gauge display */}
          <div style={{ 
            position: 'relative',
            width: '100%',
            maxWidth: 600,
            margin: '0 auto 48px',
            padding: '40px 0'
          }}>
            {/* Gauge background */}
            <svg viewBox="0 0 200 120" style={{ width: '100%', height: 'auto' }}>
              {/* Background segments */}
              <path 
                d="M 20 100 A 80 80 0 0 1 50 30" 
                fill="#ffd4d4" 
                stroke="#cc0000" 
                strokeWidth="1"
              />
              <path 
                d="M 50 30 A 80 80 0 0 1 100 10" 
                fill="#ffe4e4" 
                stroke="#999" 
                strokeWidth="0.5"
              />
              <path 
                d="M 100 10 A 80 80 0 0 1 150 30" 
                fill="#f5f5f5" 
                stroke="#999" 
                strokeWidth="0.5"
              />
              <path 
                d="M 150 30 A 80 80 0 0 1 180 100" 
                fill="#f0f0f0" 
                stroke="#999" 
                strokeWidth="0.5"
              />
              
              {/* Labels */}
              <text x="35" y="90" fontSize="10" fill="#666" fontWeight="600" transform="rotate(-45 35 90)">
                EXTREME
              </text>
              <text x="28" y="100" fontSize="10" fill="#666" fontWeight="600" transform="rotate(-45 28 100)">
                FEAR
              </text>
              <text x="60" y="40" fontSize="10" fill="#999" fontWeight="600" transform="rotate(-20 60 40)">
                FEAR
              </text>
              <text x="100" y="20" fontSize="10" fill="#999" fontWeight="600" textAnchor="middle">
                NEUTRAL
              </text>
              <text x="140" y="40" fontSize="10" fill="#999" fontWeight="600" transform="rotate(20 140 40)">
                GREED
              </text>
              <text x="165" y="85" fontSize="10" fill="#999" fontWeight="600" transform="rotate(45 165 85)">
                EXTREME
              </text>
              <text x="172" y="100" fontSize="10" fill="#999" fontWeight="600" transform="rotate(45 172 100)">
                GREED
              </text>
              
              {/* Needle */}
              <line 
                x1="100" 
                y1="100" 
                x2={100 + 70 * Math.cos((180 - payload.body.aggregate_value * 1.8) * Math.PI / 180)} 
                y2={100 - 70 * Math.sin((180 - payload.body.aggregate_value * 1.8) * Math.PI / 180)}
                stroke="#000" 
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="4" fill="#000" />
              
              {/* Scale markers */}
              <text x="20" y="115" fontSize="10" fill="#999">0</text>
              <text x="48" y="115" fontSize="10" fill="#999">25</text>
              <text x="97" y="115" fontSize="10" fill="#999" textAnchor="middle">50</text>
              <text x="148" y="115" fontSize="10" fill="#999">75</text>
              <text x="175" y="115" fontSize="10" fill="#999">100</text>
            </svg>
            
            {/* Center value display */}
            <div style={{ 
              position: 'absolute',
              bottom: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: 64, 
                fontWeight: 700,
                color: '#000',
                lineHeight: 1
              }}>
                {payload.body.aggregate_value}
              </div>
              <div style={{ 
                fontSize: 14,
                color: getColor(payload.body.aggregate_value),
                fontWeight: 600,
                marginTop: 8,
                letterSpacing: '0.5px'
              }}>
                {getLabel(payload.body.aggregate_value)}
              </div>
            </div>
          </div>

          {/* Historical comparison */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Previous close</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{getLabel(payload.body.aggregate_value)}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: getColor(payload.body.aggregate_value) }}>
                {payload.body.aggregate_value}
              </div>
            </div>
          </div>

          {/* Meta information */}
          <div style={{ 
            marginTop: 32,
            padding: 20,
            backgroundColor: '#f9f9f9',
            borderRadius: 8,
            fontSize: 13,
            color: '#666'
          }}>
            <div style={{ marginBottom: 8 }}>
              Aggregate of {payload.body.source_count} sources
            </div>
            <div style={{ marginBottom: 8 }}>
              {payload.body.cached ? 'Served from server cache' : 'Fresh aggregation'}
            </div>
            <div>
              Includes Alternative.me + additional sources (with attribution shown where applicable).
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
