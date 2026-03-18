/**
 * SizingGuide.jsx
 *
 * Non-technical home profile builder — 2-column layout.
 * Left: home profile pickers (bedrooms, cooling, water, EV, pool)
 * Right: estimated consumption + coverage target + sizing results
 */

import { useState, useEffect } from 'react';

// ── Consumption model (kWh/month) ─────────────────────────────────────────────

const BASE_BY_BEDS = {
  1: 380,
  2: 530,
  3: 690,
  4: 880,
  5: 1080,
};

const COOLING_DELTA = { none: -80, window: 0, central: +210 };
const WATER_DELTA   = { electric: 0, heatpump: -150, gas: -200 };
const EV_DELTA      = { 0: 0, 1: +250, 2: +500 };
const POOL_DELTA    = { none: 0, pool: 150, hottub: 100 };

const PANEL_OPTIONS = [
  { label: 'Budget',    desc: '300 W · more panels', wp: 300, areaSqm: 1.65 },
  { label: 'Standard',  desc: '400 W · most common',  wp: 400, areaSqm: 1.72 },
  { label: 'Premium',   desc: '500 W · fewer panels', wp: 500, areaSqm: 1.80 },
];

// ── Compact option picker row ─────────────────────────────────────────────────

function OptionRow({ label, options, value, onChange, compact }) {
  return (
    <div style={{ marginBottom: compact ? 10 : 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: compact ? 5 : 7,
        textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: compact ? 4 : 6, flexWrap: 'nowrap' }}>
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
                gap: compact ? 2 : 3, padding: compact ? '5px 4px' : '8px 12px',
                borderRadius: 8, cursor: 'pointer',
                border: '1px solid ' + (active ? (opt.color || '#0EA5E9') : '#64748B'),
                background: active ? ((opt.color || '#0EA5E9') + '18') : '#0F172A',
                color: active ? (opt.color || '#0EA5E9') : '#94A3B8',
                transition: 'all 0.15s', minWidth: 0,
              }}
            >
              <span style={{ fontSize: compact ? 16 : 22 }}>{opt.icon}</span>
              <span style={{ fontSize: compact ? 10 : 12, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {opt.label}
              </span>
              {opt.sub && (
                <span style={{ fontSize: compact ? 9 : 10, color: active ? (opt.color || '#0EA5E9') : '#94A3B8', opacity: 0.85, whiteSpace: 'nowrap' }}>
                  {opt.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultBox({ label, value, unit, color, big }) {
  return (
    <div style={{ background: '#111827', borderRadius: 8, padding: big ? '14px 10px' : '10px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 5, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
      <div style={{ fontSize: big ? 24 : 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{unit}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SizingGuide({ results, inputs, onConsumptionChange, onSystemSizeChange }) {
  const [beds,        setBeds]        = useState(3); // min is now 2
  const [cooling,     setCooling]     = useState('window');
  const [water,       setWater]       = useState('electric');
  const [evs,         setEvs]         = useState(0);
  const [pool,        setPool]        = useState('none');
  const [coveragePct, setCoveragePct] = useState(80);
  const [panelIdx,    setPanelIdx]    = useState(1); // Standard 400 Wp default

  const monthlyKwh = Math.round(
    BASE_BY_BEDS[beds]
    + COOLING_DELTA[cooling]
    + WATER_DELTA[water]
    + EV_DELTA[evs]
    + POOL_DELTA[pool]
  );
  const annualKwh = monthlyKwh * 12;

  useEffect(() => {
    if (onConsumptionChange) onConsumptionChange(annualKwh);
  }, [annualKwh]);

  const energyYield    = results?.Y ?? null;
  const panel          = PANEL_OPTIONS[panelIdx];
  const recommendedKwp = energyYield ? (annualKwh * coveragePct / 100) / energyYield : null;
  const panelCount     = recommendedKwp ? Math.ceil(recommendedKwp * 1000 / panel.wp) : null;
  const roofAreaM2     = panelCount ? (panelCount * panel.areaSqm).toFixed(1) : null;
  const roofAreaFt2    = roofAreaM2 ? Math.round(roofAreaM2 * 10.764) : null;

  const actualCoverage = results ? (results.E / annualKwh) * 100 : null;
  const isUndersized   = recommendedKwp && inputs.systemKwp < recommendedKwp * 0.95;
  const isOversized    = recommendedKwp && inputs.systemKwp > recommendedKwp * 1.05;

  useEffect(() => {
    if (!onSystemSizeChange || !recommendedKwp) return;
    if (!isFinite(recommendedKwp) || recommendedKwp < 0.5 || recommendedKwp > 100) return;
    const rounded = Math.round(recommendedKwp * 10) / 10;
    if (Math.abs(rounded - inputs.systemKwp) >= 0.2) {
      onSystemSizeChange(rounded);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedKwp]);

  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: '20px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: '#38BDF8', color: '#0F172A', fontSize: 12, fontWeight: 800,
        }}>2</span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38BDF8' }}>
          How Much Solar Do I Need?
        </span>
      </div>

      {/* ── 2-COLUMN BODY ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT — Home profile pickers */}
        <div>
          <OptionRow label="Bedrooms" value={beds} onChange={setBeds} options={[
            { value: 2, icon: '🛏', label: '2 beds',  sub: '~530 kWh' },
            { value: 3, icon: '🏠', label: '3 beds',  sub: '~690 kWh', color: '#0EA5E9' },
            { value: 4, icon: '🏡', label: '4 beds',  sub: '~880 kWh' },
            { value: 5, icon: '🏘', label: '5+ beds', sub: '~1,080 kWh' },
          ]} />

          <OptionRow label="Cooling" value={cooling} onChange={setCooling} options={[
            { value: 'none',    icon: '🌀', label: 'Fans only',   sub: 'saves ~80 kWh' },
            { value: 'window',  icon: '🪟', label: 'Window A/C',  sub: 'typical', color: '#0EA5E9' },
            { value: 'central', icon: '❄️', label: 'Central A/C', sub: '+210 kWh' },
          ]} />

          <OptionRow label="Water Heater" value={water} onChange={setWater} options={[
            { value: 'electric',  icon: '🔌', label: 'Electric',      sub: 'standard' },
            { value: 'heatpump',  icon: '♻️', label: 'Heat Pump',     sub: 'saves 150 kWh', color: '#34D399' },
            { value: 'gas',       icon: '🔥', label: 'Gas/Propane',   sub: 'saves 200 kWh', color: '#34D399' },
          ]} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <OptionRow label="Electric Vehicle" value={evs} onChange={setEvs} compact options={[
              { value: 0, icon: '🚶', label: 'No EV',  sub: '—' },
              { value: 1, icon: '🚗', label: '1 EV',   sub: '+250' },
              { value: 2, icon: '🚙', label: '2 EVs',  sub: '+500' },
            ]} />
            <OptionRow label="Pool or Hot Tub" value={pool} onChange={setPool} compact options={[
              { value: 'none',   icon: '🚫', label: 'None',    sub: '—' },
              { value: 'pool',   icon: '🏊', label: 'Pool',    sub: '+150' },
              { value: 'hottub', icon: '🛁', label: 'Hot Tub', sub: '+100' },
            ]} />
          </div>
        </div>

        {/* RIGHT — Consumption + Coverage + Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Estimated consumption */}
          <div style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8,
            padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 5 }}>Estimated usage</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#CBD5E1', letterSpacing: '-0.02em' }}>
                  ~{monthlyKwh.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: '#94A3B8', marginLeft: 5 }}>kWh / month</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                  ~{annualKwh.toLocaleString()} kWh/yr
                </div>
              </div>
            </div>
          </div>

          {/* Coverage target */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>I want solar to cover…</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#0EA5E9' }}>
                {coveragePct}%
                <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', marginLeft: 4 }}>of my bill</span>
              </span>
            </div>
            <input type="range" min={10} max={100} step={5} value={coveragePct}
              onChange={e => setCoveragePct(parseInt(e.target.value))}
              style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 3 }}>
              <span>10% — small offset</span><span>50% — half</span><span>100% — net zero</span>
            </div>
          </div>

          {/* Panel type */}
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Panel type</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
              Higher-rated panels produce more per panel — so you need fewer of them.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {PANEL_OPTIONS.map((p, i) => {
                const active = panelIdx === i;
                return (
                  <button key={i} onClick={() => setPanelIdx(i)} style={{
                    flex: 1, padding: '9px 6px', borderRadius: 7, cursor: 'pointer', textAlign: 'center',
                    background: active ? '#0EA5E918' : '#0F172A',
                    border: '1px solid ' + (active ? '#0EA5E9' : '#64748B'),
                    color: active ? '#0EA5E9' : '#94A3B8',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, marginBottom: 3 }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: active ? '#38BDF8' : '#94A3B8' }}>{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizing results */}
          {recommendedKwp ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <ResultBox label="System Size"   value={recommendedKwp.toFixed(1)} unit="kWp"               color="#34D399" big />
                <ResultBox label="Panels"        value={panelCount}                 unit={panel.label + ' ea'} color="#0EA5E9" big />
                <ResultBox label="Roof Area"     value={roofAreaFt2 + ' ft²'}       unit={'≈ ' + roofAreaM2 + ' m²'} color="#E8C84A" big />
              </div>
              <div style={{ background: '#0F172A', borderRadius: 7, padding: '9px 12px', fontSize: 11, lineHeight: 1.55 }}>
                {isUndersized && (
                  <span style={{ color: '#E8C84A' }}>
                    ↑ Current {inputs.systemKwp} kWp covers ~{actualCoverage?.toFixed(0)}% — increase to {recommendedKwp.toFixed(1)} kWp for {coveragePct}% target.
                  </span>
                )}
                {isOversized && (
                  <span style={{ color: '#38BDF8' }}>
                    → {inputs.systemKwp} kWp exceeds the {coveragePct}% target — surplus exports to grid.
                  </span>
                )}
                {!isUndersized && !isOversized && (
                  <span style={{ color: '#34D399' }}>
                    ✓ {inputs.systemKwp} kWp matches your {coveragePct}% coverage target.
                  </span>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748B', fontSize: 12 }}>
              Waiting for solar data…
            </div>
          )}

          <div style={{ fontSize: 9, color: '#64748B', lineHeight: 1.5 }}>
            Estimates based on Hawaii EIA residential data
            {energyYield ? ' · ' + Math.round(energyYield) + ' kWh/kWp/yr at this location' : ''}
          </div>
        </div>

      </div>
    </div>
  );
}
