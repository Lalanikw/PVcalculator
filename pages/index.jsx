/**
 * pages/index.jsx — PV Calculator
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import InputPanel    from '../components/InputPanel';
import ResultsGrid   from '../components/ResultsGrid';
import MonthlyChart  from '../components/MonthlyChart';
import ComparisonBar from '../components/ComparisonBar';
import SizingGuide   from '../components/SizingGuide';
import CostBreakdown from '../components/CostBreakdown';
import { fallbackCalc } from '../lib/pvFormulas';

const DEFAULT_LOCATION = { lat: 21.31, lon: -157.86, name: 'Oahu, Hawaii' };

const DEFAULT_INPUTS = {
  systemKwp:         3,
  costPerWp:         3.50,
  annualConsumption: 8280,   // 690 kWh/month × 12 — matches 3-bed default
  tariff:            0.40,
  tiltAngle:         20,
  azimuth:           0,
  systemLosses:      14,
};

// pvgisKwp = the systemKwp that was actually used for the current pvgisTotals fetch.
// We track this separately so that Y (kWh/kWp/yr) stays STABLE while systemKwp
// changes between fetches — otherwise Y = E_y/currentKwp creates a runaway loop
// in SizingGuide where recommendedKwp keeps growing until it hits Infinity.
function computeResults(totals, inp, pvgisKwp) {
  if (!totals) return null;
  const safeKwp  = pvgisKwp > 0 ? pvgisKwp : inp.systemKwp;
  const scale    = safeKwp > 0 ? inp.systemKwp / safeKwp : 1;   // linear scaling
  const C   = inp.systemKwp * 1000 * inp.costPerWp;
  const E   = totals.E_y * scale;          // scaled to current system size
  const I   = totals['H(i)_y'];
  const P   = (E / inp.annualConsumption) * 100;
  const Y   = totals.E_y / safeKwp;        // kWh/kWp/yr — location yield, STABLE
  const CF  = (Y / 8760) * 100;
  const PR  = (totals.PR ?? (1 - inp.systemLosses / 100)) * 100;
  const AI  = E * inp.tariff;
  const PBT = C / AI;
  return { C, E, I, P, Y, CF, PR, AI, PBT };
}

export default function Dashboard() {
  const [inputs,        setInputs]        = useState(DEFAULT_INPUTS);
  const [location,      setLocation]      = useState(DEFAULT_LOCATION);
  const [pvgisTotals,   setPvgisTotals]   = useState(null);
  const [pvgisKwp,      setPvgisKwp]      = useState(DEFAULT_INPUTS.systemKwp); // systemKwp used for current fetch
  const [monthly,       setMonthly]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastFetch,     setLastFetch]     = useState(null);

  useEffect(() => {
    const t = setTimeout(() => fetchPVGIS(inputs, location), 650);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.systemKwp, inputs.tiltAngle, inputs.azimuth, inputs.systemLosses,
      location.lat, location.lon]);

  async function fetchPVGIS(inp, loc) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: loc.lat, lon: loc.lon,
        peakpower: inp.systemKwp, loss: inp.systemLosses,
        angle: inp.tiltAngle,    aspect: inp.azimuth,
      });
      const res  = await fetch('/api/pvgis?' + params);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPvgisTotals(data.outputs.totals.fixed);
      setPvgisKwp(inp.systemKwp);           // record which size this E_y belongs to
      setMonthly(data.outputs.monthly?.fixed ?? []);
      setUsingFallback(false);
      setLastFetch(new Date());
    } catch (err) {
      console.warn('PVGIS unavailable:', err.message);
      const fb = fallbackCalc(inp.systemKwp, inp.systemLosses, inp.tiltAngle);
      setPvgisTotals(fb);
      setPvgisKwp(inp.systemKwp);           // record which size this E_y belongs to
      setMonthly(fb.monthly ?? []);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }

  function handleLocationChange(newLoc) {
    setLocation(newLoc);
    setPvgisTotals(null);
    setMonthly([]);
  }

  // SizingGuide pushes estimated consumption whenever home profile changes
  function handleConsumptionChange(annualKwh) {
    setInputs(prev => ({ ...prev, annualConsumption: annualKwh }));
  }

  // SizingGuide auto-sets system size from its recommendation
  function handleSystemSizeChange(kwp) {
    setInputs(prev => ({ ...prev, systemKwp: kwp }));
  }

  const results = computeResults(pvgisTotals, inputs, pvgisKwp);

  const statusStyle = {
    background:   usingFallback ? '#1A1525' : '#0F172A',
    border:       '1px solid ' + (usingFallback ? '#7C3AED' : '#64748B'),
    borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 600,
    color: loading ? '#94A3B8' : usingFallback ? '#A78BFA' : '#34D399',
  };

  return (
    <>
      <Head>
        <title>PV Calculator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Interactive solar PV performance and payback calculator — powered by PVGIS (EU JRC)." />
      </Head>

      <div style={{ minHeight: '100vh', background: '#111827', padding: '10px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 12px' }}>

          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>☀️</span>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFF', letterSpacing: '-0.02em', margin: 0 }}>
                PV Calculator
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 20, padding: '5px 14px', fontSize: 11, color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📍 {location.name}</span>
                <span style={{ color: '#64748B', fontWeight: 400 }}>·</span>
                <span style={{ color: '#94A3B8', fontWeight: 400 }}>{location.lat.toFixed(2)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lon).toFixed(2)}°{location.lon >= 0 ? 'E' : 'W'}</span>
              </div>
              <div style={statusStyle}>
                {loading ? '⏳ Fetching PVGIS…'
                  : usingFallback ? '⚠ Estimated (offline)'
                  : '✓ Live PVGIS' + (lastFetch ? ' · ' + lastFetch.toLocaleTimeString() : '')}
              </div>
            </div>
          </div>

          {/* INTRO */}
          <p style={{ margin: '0 0 22px', fontSize: 15, color: '#CBD5E1', lineHeight: 1.6, maxWidth: 680 }}>
            Enter your location and home profile below to estimate solar output, system cost, and payback time.
            Solar resource data is pulled live from <a href="https://re.jrc.ec.europa.eu/pvg_tools/" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'none' }}>PVGIS v5.2</a> (EU Joint Research Centre satellite data).
          </p>

          {/* SECTION 1 — Location + Key metrics (left) | How Much Solar Do I Need? (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>

            {/* LEFT — Location + hero tiles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputPanel
                inputs={inputs} onChange={setInputs}
                location={location} onLocationChange={handleLocationChange}
              />
              {loading && (
                <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', fontSize: 11, color: '#38BDF8', textAlign: 'center' }}>
                  ⏳ Fetching solar data for {location.name}…
                </div>
              )}
              <ResultsGrid results={results} loading={loading} stack={true} location={location} />
            </div>

            {/* RIGHT — Sizing guide */}
            <SizingGuide
              results={results}
              inputs={inputs}
              onConsumptionChange={handleConsumptionChange}
              onSystemSizeChange={handleSystemSizeChange}
            />
          </div>

          {/* SECTION 2 — Cost & Incentives | Monthly chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20, alignItems: 'start' }}>
            <CostBreakdown
              inputs={inputs}
              onChange={setInputs}
              location={location}
            />
            {monthly.length > 0
              ? <MonthlyChart monthly={monthly} />
              : <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 12 }}>
                  Monthly chart will appear after solar data loads.
                </div>
            }
          </div>

          {/* SECTION 4 — Global comparison */}
          <div style={{ marginBottom: 20 }}>
            <ComparisonBar liveYield={results?.Y} locationName={location.name} />
          </div>

          {/* FOOTER */}
          <div style={{ paddingTop: 16, borderTop: '1px solid #334155', fontSize: 10, color: '#64748B', textAlign: 'center', lineHeight: 1.8 }}>
            Solar resource via{' '}
            <a href="https://re.jrc.ec.europa.eu/pvg_tools/" target="_blank" rel="noreferrer" style={{ color: '#64748B' }}>PVGIS v5.2</a>
            {' '}(EU JRC) · Geocoding via OpenStreetMap Nominatim · Consumption estimates: Hawaii EIA data ·
            Incentives: IRS Form 5695 + HRS §235-12.5 · For educational use only
          </div>

        </div>
      </div>
    </>
  );
}

function QuickTile({ label, value, sub, color, loading }) {
  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '10px 10px 0 0', opacity: loading ? 0.2 : 1 }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8, marginTop: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: loading ? '#334155' : color, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {loading ? <span style={{ display: 'inline-block', width: '70%', height: 22, background: '#334155', borderRadius: 4 }} /> : value}
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

