/**
 * ResultsGrid.jsx
 *
 * 3 plain-language hero cards for homeowners (Option A+C):
 *   1. What will it cost?   → net cost after incentives + savings badge
 *   2. Will it cover my bill? → % coverage + visual bar + status badge
 *   3. When do I break even? → payback years + fast/typical/slow badge
 *
 * "Show technical details" expander reveals the full 9 PV metrics for installers.
 */

import { useState } from 'react';

// ── Badge helpers ─────────────────────────────────────────────────────────────

function paybackBadge(pbt) {
  if (!pbt || !isFinite(pbt)) return null;
  if (pbt <= 7)  return { label: '⚡ Fast payback',    color: '#34D399', bg: '#34D39918' };
  if (pbt <= 12) return { label: '✓ Typical',          color: '#38BDF8', bg: '#38BDF818' };
  if (pbt <= 20) return { label: '~ Longer term',      color: '#E8C84A', bg: '#E8C84A18' };
  return           { label: '✗ Very long',             color: '#F87171', bg: '#F8717118' };
}

function coverageBadge(pct) {
  if (!pct) return null;
  if (pct >= 95) return { label: '🌟 Net zero',       color: '#34D399', bg: '#34D39918' };
  if (pct >= 70) return { label: '✓ Great coverage',  color: '#34D399', bg: '#34D39918' };
  if (pct >= 40) return { label: '~ Good offset',     color: '#38BDF8', bg: '#38BDF818' };
  return           { label: '◐ Partial offset',       color: '#E8C84A', bg: '#E8C84A18' };
}

function Badge({ badge }) {
  if (!badge) return null;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color,
      border: '1px solid ' + badge.color + '40',
    }}>
      {badge.label}
    </span>
  );
}

// ── Hero card ─────────────────────────────────────────────────────────────────

function HeroCard({ question, label, value, sub, color, loading, badge, children, compact }) {
  return (
    <div style={{
      background: '#1E293B', border: '1px solid #334155', borderRadius: 12,
      padding: compact ? '14px 16px 12px' : '20px 20px 18px',
      position: 'relative', overflow: 'hidden', flex: compact ? 'none' : 1,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: color, borderRadius: '12px 12px 0 0', opacity: loading ? 0.2 : 1,
      }} />

      {/* Question */}
      <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', marginBottom: 6, marginTop: 2 }}>
        {question}
      </div>

      {/* Label */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 10 }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: compact ? 28 : 36, fontWeight: 800, color: loading ? '#334155' : color,
        letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8,
      }}>
        {loading
          ? <span style={{ display: 'inline-block', width: '60%', height: 32, background: '#334155', borderRadius: 4 }} />
          : (value ?? '—')}
      </div>

      {/* Badge */}
      {!loading && badge && <div style={{ marginBottom: 10 }}><Badge badge={badge} /></div>}

      {/* Sub-line */}
      {sub && <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>{sub}</div>}

      {/* Extra content (e.g. coverage bar) */}
      {children}
    </div>
  );
}

// ── Coverage bar ──────────────────────────────────────────────────────────────

function CoverageBar({ pct }) {
  const clamped = Math.min(pct, 100);
  const color = pct >= 70 ? '#34D399' : pct >= 40 ? '#38BDF8' : '#E8C84A';
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ background: '#0F172A', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <div style={{
          width: clamped + '%', height: '100%', background: color,
          borderRadius: 99, transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginTop: 4 }}>
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  );
}

// ── Technical metric row (for the expander) ───────────────────────────────────

const TECH_METRICS = [
  { key: 'Y',   label: 'Energy Yield',    format: v => Math.round(v).toLocaleString() + ' kWh/kWp', color: '#34D399' },
  { key: 'CF',  label: 'Capacity Factor', format: v => v.toFixed(1) + '%',                           color: '#0EA5E9' },
  { key: 'PR',  label: 'Perf. Ratio',     format: v => v.toFixed(1) + '%',                           color: '#6366F1' },
  { key: 'I',   label: 'Irradiation',     format: v => Math.round(v).toLocaleString() + ' kWh/m²',  color: '#38BDF8' },
  { key: 'E',   label: 'Annual Energy',   format: v => Math.round(v).toLocaleString() + ' kWh/yr',  color: '#34D399' },
  { key: 'AI',  label: 'Annual Savings',  format: v => '$' + Math.round(v).toLocaleString() + '/yr', color: '#E8C84A' },
];

function TechMetric({ metric, value }) {
  return (
    <div style={{ background: '#0F172A', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {metric.label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: value != null ? metric.color : '#334155' }}>
        {value != null ? metric.format(value) : '—'}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function isHawaii(location) {
  if (!location) return false;
  const n = (location.name ?? '').toLowerCase();
  if (['hawaii', 'oahu', 'maui', 'kauai', 'lanai', 'molokai', 'hilo', 'honolulu'].some(k => n.includes(k))) return true;
  const { lat, lon } = location;
  return lat > 18.9 && lat < 22.3 && lon > -161.0 && lon < -154.7;
}

// stack=true → vertical column (sidebar use); stack=false → horizontal row (full-width)
export default function ResultsGrid({ results, loading, stack = false, location }) {
  const [showTech, setShowTech] = useState(false);

  const grossCost   = results?.C ?? null;
  const federalITC  = grossCost ? grossCost * 0.30 : 0;
  const hawaiiCredit = (grossCost && isHawaii(location)) ? Math.min(grossCost * 0.35, 5000) : 0;
  const netCost     = grossCost ? grossCost - federalITC - hawaiiCredit : null;
  const totalSavings = federalITC + hawaiiCredit;
  const coverage    = results?.P;
  const pbt         = results?.PBT;

  return (
    <div>

      {/* ── 3 HERO CARDS ────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: stack ? 'column' : 'row', gap: stack ? 10 : 14, marginBottom: 14, flexWrap: stack ? 'nowrap' : 'wrap' }}>

        <HeroCard
          question="What will it cost me?"
          label="Install Cost"
          value={netCost ? '$' + Math.round(netCost / 1000) + 'k' : null}
          sub={grossCost ? `$${Math.round(grossCost / 1000)}k gross · incentives save $${Math.round(totalSavings / 1000)}k` : null}
          color="#E8C84A"
          loading={loading}
          compact={stack}
        />

        <HeroCard
          question="When does it pay for itself?"
          label="Payback Time"
          value={pbt && isFinite(pbt) ? pbt.toFixed(1) + ' yrs' : null}
          sub={pbt && isFinite(pbt) ? 'then ~25 years of free electricity' : 'set tariff in Cost & Incentives'}
          color="#F472B6"
          loading={loading}
          badge={pbt && isFinite(pbt) ? paybackBadge(pbt) : null}
          compact={stack}
        />

      </div>

      {/* ── TECHNICAL DETAILS EXPANDER ──────────────────── */}
      <div style={{ textAlign: 'right', marginBottom: showTech ? 10 : 0 }}>
        <button
          onClick={() => setShowTech(s => !s)}
          style={{
            background: 'none', border: '1px solid #334155', borderRadius: 6,
            padding: '4px 14px', fontSize: 11, color: '#64748B', cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.color = '#38BDF8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748B'; }}
        >
          {showTech ? '▲ Hide technical details' : '▼ Show technical details'}
        </button>
      </div>

      {showTech && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {TECH_METRICS.map(m => (
            <TechMetric key={m.key} metric={m} value={results?.[m.key] ?? null} />
          ))}
        </div>
      )}

    </div>
  );
}
