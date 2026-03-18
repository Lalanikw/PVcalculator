/**
 * MonthlyChart.jsx
 * SVG bar chart showing monthly AC energy production (kWh).
 * No external chart library — pure SVG for zero bundle cost.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BAR_FILL   = '#0EA5E9';
const PEAK_FILL  = '#38BDF8';
const LABEL_COL  = '#CBD5E1';
const MUTED_COL  = '#94A3B8';

export default function MonthlyChart({ monthly }) {
  if (!monthly || monthly.length === 0) return null;

  const values = monthly.map(m => m.E_m);
  const maxVal  = Math.max(...values);
  const minVal  = Math.min(...values);
  const peakIdx = values.indexOf(maxVal);
  const annual  = values.reduce((a, b) => a + b, 0);

  // SVG canvas
  const W       = 700;
  const H       = 200;
  const padL    = 48;
  const padR    = 12;
  const padT    = 24;
  const padB    = 32;
  const chartW  = W - padL - padR;
  const chartH  = H - padT - padB;
  const barW    = (chartW / 12) * 0.65;
  const barGap  = (chartW / 12) * 0.35;
  const barSlot = chartW / 12;

  // Y-axis grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid #334155',
      borderRadius: 12,
      padding: '20px 20px 16px',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 14,
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: '#38BDF8',
        }}>
          Monthly AC Production (kWh)
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: MUTED_COL }}>
          <span>Annual total: <strong style={{ color: '#34D399' }}>{Math.round(annual).toLocaleString()} kWh</strong></span>
          <span>Peak: <strong style={{ color: PEAK_FILL }}>{MONTHS[peakIdx]} ({Math.round(maxVal)} kWh)</strong></span>
          <span>Low: <strong style={{ color: '#64748B' }}>{MONTHS[values.indexOf(minVal)]} ({Math.round(minVal)} kWh)</strong></span>
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible' }}
      >
        {/* Grid lines */}
        {gridLines.map((frac, i) => {
          const y = padT + chartH * (1 - frac);
          return (
            <g key={i}>
              <line
                x1={padL} y1={y} x2={W - padR} y2={y}
                stroke="#334155" strokeWidth={1}
              />
              {frac > 0 && (
                <text x={padL - 6} y={y + 4} textAnchor="end" fill={MUTED_COL} fontSize={9}>
                  {Math.round(maxVal * frac)}
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {monthly.map((m, i) => {
          const heightRatio = m.E_m / maxVal;
          const barH   = chartH * heightRatio;
          const x      = padL + i * barSlot + barGap / 2;
          const y      = padT + chartH - barH;
          const isPeak = i === peakIdx;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={x} y={y}
                width={barW} height={barH}
                rx={3}
                fill={isPeak ? PEAK_FILL : BAR_FILL}
                opacity={isPeak ? 1 : 0.75}
              />
              {/* Value label (only for peak + min, others get crowded) */}
              {(isPeak || i === values.indexOf(minVal)) && (
                <text
                  x={x + barW / 2} y={y - 4}
                  textAnchor="middle"
                  fill={isPeak ? PEAK_FILL : MUTED_COL}
                  fontSize={9}
                  fontWeight={700}
                >
                  {Math.round(m.E_m)}
                </text>
              )}
              {/* Month label */}
              <text
                x={x + barW / 2} y={H - 4}
                textAnchor="middle"
                fill={MUTED_COL}
                fontSize={9}
              >
                {MONTHS[i]}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        <text
          x={10} y={padT + chartH / 2}
          textAnchor="middle"
          fill={MUTED_COL}
          fontSize={9}
          transform={`rotate(-90, 10, ${padT + chartH / 2})`}
        >
          kWh
        </text>
      </svg>
    </div>
  );
}
