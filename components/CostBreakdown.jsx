/**
 * CostBreakdown.jsx
 * Install cost inputs + incentives + loan calculator.
 * $/Wp and tariff sliders live here (moved from InputPanel).
 */

import { useState } from 'react';

const LOAN_TERMS = [10, 15, 20, 25];

function isHawaii(location) {
  if (!location) return false;
  const n = (location.name ?? '').toLowerCase();
  if (['hawaii', 'oahu', 'maui', 'kauai', 'lanai', 'molokai', 'hilo', 'honolulu'].some(k => n.includes(k))) return true;
  const { lat, lon } = location;
  return lat > 18.9 && lat < 22.3 && lon > -161.0 && lon < -154.7;
}

function monthlyPayment(principal, annualRatePct, termYears) {
  const n = termYears * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function Slider({ label, value, min, max, step, display, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: '#94A3B8', fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#0EA5E9', fontWeight: 700 }}>{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
    </div>
  );
}

function CostBox({ label, value, sub, color, highlight }) {
  return (
    <div style={{ background: highlight ? '#162032' : '#0F172A', border: '1px solid ' + (highlight ? '#0EA5E940' : '#64748B'), borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function BarLegend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748B' }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

export default function CostBreakdown({ inputs, onChange, location }) {
  const [loanRate,    setLoanRate]    = useState(6.5);
  const [loanTermIdx, setLoanTermIdx] = useState(1);

  const set = key => val => onChange({ ...inputs, [key]: val });

  const grossCost    = inputs.systemKwp * 1000 * inputs.costPerWp;
  const federalITC   = grossCost * 0.30;
  const inHawaii     = isHawaii(location);
  const hawaiiCredit = inHawaii ? Math.min(grossCost * 0.35, 5000) : 0;
  const netCost      = grossCost - federalITC - hawaiiCredit;
  const savingsPct   = Math.round(((federalITC + hawaiiCredit) / grossCost) * 100);

  const netPct = (netCost / grossCost) * 100;
  const fedPct = (federalITC / grossCost) * 100;
  const hiPct  = (hawaiiCredit / grossCost) * 100;

  const termYears    = LOAN_TERMS[loanTermIdx];
  const monthly      = monthlyPayment(netCost, loanRate, termYears);
  const totalPaid    = monthly * termYears * 12;
  const totalInterest = totalPaid - netCost;

  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: '20px 24px' }}>

      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#38BDF8', marginBottom: 18 }}>
        Cost & Incentives
      </div>

      {/* ── Cost inputs ─────────────────────────────────── */}
      <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <Slider label="Install Cost" value={inputs.costPerWp} min={2.0} max={6.0} step={0.1}
          display={'$' + inputs.costPerWp.toFixed(2) + ' / Wp'} onChange={set('costPerWp')} />
        <Slider label="Electricity Tariff" value={inputs.tariff} min={0.20} max={0.60} step={0.01}
          display={'$' + inputs.tariff.toFixed(2) + ' / kWh'} onChange={set('tariff')} />
      </div>

      {/* ── Cost breakdown boxes ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <CostBox label="Gross Install Cost" color="#CBD5E1"
          value={'$' + Math.round(grossCost).toLocaleString()}
          sub={inputs.systemKwp.toFixed(1) + ' kWp × $' + inputs.costPerWp.toFixed(2) + '/Wp'} />
        <CostBox label="Federal ITC (30%)" color="#34D399"
          value={'− $' + Math.round(federalITC).toLocaleString()}
          sub="All US states · Inflation Reduction Act" />
        {inHawaii ? (
          <CostBox label="Hawaii State Credit" color="#6366F1"
            value={'− $' + Math.round(hawaiiCredit).toLocaleString()}
            sub="HRS §235-12.5 · capped at $5,000" />
        ) : (
          <CostBox label="State Incentives" color="#94A3B8"
            value="Varies" sub="Check dsireusa.org for your state" />
        )}
        <CostBox label="Net Out-of-Pocket" color="#0EA5E9" highlight
          value={'$' + Math.round(netCost).toLocaleString()}
          sub={'You save ' + savingsPct + '% vs gross cost'} />
      </div>

      {/* ── Savings bar ─────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', height: 18, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
          <div style={{ width: netPct + '%', background: '#0EA5E9', transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {netPct > 18 && <span style={{ fontSize: 9, color: '#FFF', fontWeight: 700 }}>{Math.round(netPct)}%</span>}
          </div>
          <div style={{ width: fedPct + '%', background: '#34D399', transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {fedPct > 12 && <span style={{ fontSize: 9, color: '#111827', fontWeight: 700 }}>{Math.round(fedPct)}%</span>}
          </div>
          {inHawaii && (
            <div style={{ width: hiPct + '%', background: '#6366F1', transition: 'width 0.5s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hiPct > 8 && <span style={{ fontSize: 9, color: '#FFF', fontWeight: 700 }}>{Math.round(hiPct)}%</span>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
          <BarLegend color="#0EA5E9" label={'You pay · $' + Math.round(netCost).toLocaleString()} />
          <BarLegend color="#34D399" label={'Federal ITC · $' + Math.round(federalITC).toLocaleString()} />
          {inHawaii && <BarLegend color="#6366F1" label={'HI State · $' + Math.round(hawaiiCredit).toLocaleString()} />}
        </div>
      </div>

      {/* ── Loan calculator ─────────────────────────────── */}
      <div style={{ background: '#0F172A', borderRadius: 8, padding: '14px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#E8C84A', marginBottom: 14 }}>
          Financing Calculator
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 14, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 5 }}>
              <span>Interest Rate</span>
              <span style={{ color: '#0EA5E9', fontWeight: 700 }}>{loanRate.toFixed(1)}% APR</span>
            </div>
            <input type="range" min={3} max={12} step={0.5} value={loanRate}
              onChange={e => setLoanRate(parseFloat(e.target.value))} style={{ width: '100%' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginTop: 2 }}>
              <span>3%</span><span>12%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>Term</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {LOAN_TERMS.map((t, i) => (
                <button key={i} onClick={() => setLoanTermIdx(i)} style={{
                  padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                  background: loanTermIdx === i ? '#0EA5E9' : '#64748B',
                  border: 'none', color: loanTermIdx === i ? '#FFF' : '#94A3B8', cursor: 'pointer',
                }}>
                  {t} yr
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #334155', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#E8C84A', letterSpacing: '-0.02em' }}>
              ${Math.round(monthly).toLocaleString()}
            </span>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>/month for {termYears} years</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: '#94A3B8', flexWrap: 'wrap' }}>
            <span>Total paid: <strong style={{ color: '#CBD5E1' }}>${Math.round(totalPaid).toLocaleString()}</strong></span>
            <span>Interest: <strong style={{ color: '#F87171' }}>${Math.round(totalInterest).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: '#64748B', lineHeight: 1.6 }}>
        {inHawaii ? 'Hawaii HRS §235-12.5 · ' : ''}Federal ITC per IRS Form 5695 · Consult a tax professional before filing
      </div>
    </div>
  );
}
