/**
 * InputPanel.jsx
 * Location search only. Advanced panel config hidden behind toggle.
 */

import { useState } from 'react';

const C = {
  panel: {
    background: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '22px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  section: {
    paddingBottom: 18,
    marginBottom: 18,
    borderBottom: '1px solid #334155',
  },
  sectionLast: { paddingBottom: 0, marginBottom: 0 },
  sectionTitle: {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#38BDF8', marginBottom: 14,
  },
  sliderRow: { marginBottom: 14 },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  labelText: { fontSize: 12, fontWeight: 600, color: '#94A3B8' },
  valueText: { fontSize: 13, fontWeight: 700, color: '#0EA5E9', fontVariantNumeric: 'tabular-nums' },
};

function Slider({ label, value, min, max, step, unit, display, onChange }) {
  return (
    <div style={C.sliderRow}>
      <div style={C.labelRow}>
        <span style={C.labelText}>{label}</span>
        <span style={C.valueText}>{display ?? value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginTop: 2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function LocationSearch({ location, onLocationChange }) {
  const [query,      setQuery]      = useState('');
  const [searching,  setSearching]  = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [error,      setError]      = useState('');
  const [showList,   setShowList]   = useState(false);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setError(''); setCandidates([]); setShowList(false);
    try {
      const res  = await fetch('/api/geocode?q=' + encodeURIComponent(query));
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Location not found'); return; }
      if (data.candidates.length === 1) pick(data.candidates[0]);
      else { setCandidates(data.candidates); setShowList(true); }
    } catch { setError('Geocoding service unreachable'); }
    finally { setSearching(false); }
  }

  function pick(c) {
    const name = c.shortName || c.displayName.split(',').slice(0, 2).join(',').trim();
    onLocationChange({ lat: c.lat, lon: c.lon, name });
    setQuery(''); setCandidates([]); setShowList(false); setError('');
  }

  return (
    <div>
      <form onSubmit={search} style={{ display: 'flex', gap: 6 }}>
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); setShowList(false); }}
          placeholder="City, address, or region..."
          style={{ flex: 1, background: '#0F172A', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 12, color: '#CBD5E1', outline: 'none' }}
          onFocus={e => (e.target.style.borderColor = '#0EA5E9')}
          onBlur={e => { e.target.style.borderColor = '#64748B'; setTimeout(() => setShowList(false), 200); }}
        />
        <button type="submit" disabled={searching || !query.trim()}
          style={{ background: searching ? '#64748B' : '#0EA5E9', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 11, fontWeight: 700, color: '#FFF', cursor: searching ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
          {searching ? '...' : 'Search'}
        </button>
      </form>

      {showList && candidates.length > 0 && (
        <div style={{ marginTop: 4, background: '#0F172A', border: '1px solid #334155', borderRadius: 6, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
          {candidates.map((c, i) => {
            const short  = c.shortName || c.displayName.split(',').slice(0, 2).join(',').trim();
            const detail = c.displayName.length > 58 ? c.displayName.slice(0, 58) + '...' : c.displayName;
            return (
              <button key={i} onMouseDown={() => pick(c)}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: i < candidates.length - 1 ? '1px solid #334155' : 'none', padding: '8px 10px', fontSize: 11, color: '#94A3B8', cursor: 'pointer', lineHeight: 1.5 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1E293B')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span style={{ color: '#CBD5E1', fontWeight: 600 }}>{short}</span><br />
                <span style={{ color: '#64748B', fontSize: 10 }}>{detail}</span>
              </button>
            );
          })}
        </div>
      )}

      {error && <div style={{ marginTop: 6, fontSize: 11, color: '#F87171' }}>{error}</div>}

      <div style={{ marginTop: 10, background: '#0F172A', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 11, lineHeight: 1.7 }}>
        <span style={{ color: '#38BDF8', fontWeight: 700 }}>📍 {location.name}</span><br />
        <span style={{ color: '#94A3B8' }}>
          {Math.abs(location.lat).toFixed(4)}°{location.lat >= 0 ? 'N' : 'S'}{' · '}
          {Math.abs(location.lon).toFixed(4)}°{location.lon >= 0 ? 'E' : 'W'}
        </span><br />
        <span style={{ color: '#64748B', fontSize: 10 }}>Solar resource via PVGIS v5.2 · EU JRC</span>
      </div>
    </div>
  );
}

export default function InputPanel({ inputs, onChange, location, onLocationChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = key => val => onChange({ ...inputs, [key]: val });

  return (
    <div style={C.panel}>

      {/* Location — only visible section by default */}
      <div style={showAdvanced ? C.section : C.sectionLast}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: '#38BDF8', color: '#0F172A', fontSize: 12, fontWeight: 800,
          }}>1</span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38BDF8' }}>
            Location
          </span>
        </div>
        <LocationSearch location={location} onLocationChange={onLocationChange} />
      </div>

      {/* Advanced panel configuration — hidden by default */}
      <div style={C.sectionLast}>
        <button onClick={() => setShowAdvanced(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', padding: '6px 0',
          fontSize: 11, color: '#64748B',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#38BDF8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
        >
          <span style={{ fontSize: 9 }}>{showAdvanced ? '▲' : '▼'}</span>
          {showAdvanced ? 'Hide panel configuration' : 'Panel configuration (tilt, azimuth, losses)'}
        </button>

        {showAdvanced && (
          <div style={{ marginTop: 12 }}>
            <Slider label="Roof Tilt" value={inputs.tiltAngle} min={0} max={45} step={1} unit="°" onChange={set('tiltAngle')} />
            <Slider label="Azimuth (0 = South)" value={inputs.azimuth} min={-90} max={90} step={5} unit="°"
              display={inputs.azimuth === 0 ? '0° (S)' : inputs.azimuth > 0 ? inputs.azimuth + '° W' : Math.abs(inputs.azimuth) + '° E'}
              onChange={set('azimuth')} />
            <Slider label="System Losses" value={inputs.systemLosses} min={10} max={30} step={1} unit="%" onChange={set('systemLosses')} />
          </div>
        )}
      </div>

    </div>
  );
}
