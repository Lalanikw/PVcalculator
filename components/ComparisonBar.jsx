/**
 * ComparisonBar.jsx
 * Horizontal bar chart placing the selected location's live yield in global context.
 */

// Reference locations — typical energy yields (kWh/kWp/yr) via PVGIS / IRENA
const REFERENCE_LOCS = [
  { name: 'Oslo, Norway',   yield: 820,  color: '#64748B', flag: '🇳🇴' },
  { name: 'London, UK',     yield: 950,  color: '#64748B', flag: '🇬🇧' },
  { name: 'Paris, France',  yield: 1007, color: '#6366F1', flag: '🇫🇷', isRef: true },
  { name: 'Tokyo, Japan',   yield: 1100, color: '#64748B', flag: '🇯🇵' },
  { name: 'Madrid, Spain',  yield: 1500, color: '#64748B', flag: '🇪🇸' },
  { name: 'Phoenix, AZ',    yield: 1860, color: '#64748B', flag: '🇺🇸' },
  { name: 'Dubai, UAE',     yield: 1950, color: '#64748B', flag: '🇦🇪' },
];

const PARIS_YIELD = 1007;

export default function ComparisonBar({ liveYield, locationName }) {
  const liveVal  = liveYield ?? 1600;
  const dispName = locationName ?? 'Selected Location';

  // Build list: reference cities + the live location (sorted by yield)
  const locs = [
    ...REFERENCE_LOCS,
    { name: dispName, yield: liveVal, color: '#0EA5E9', flag: '📍', isLive: true },
  ].sort((a, b) => a.yield - b.yield);

  const maxYield = Math.max(...locs.map(l => l.yield));
  const diffVsParis = Math.round(((liveVal / PARIS_YIELD) - 1) * 100);

  return (
    <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: '20px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#38BDF8' }}>
          Energy Yield — Global Context (kWh/kWp/yr)
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8' }}>
          Paris reference: <strong style={{ color: '#6366F1' }}>1,007 kWh/kWp</strong>
          &nbsp;·&nbsp;
          {dispName}:{' '}
          <strong style={{ color: diffVsParis >= 0 ? '#34D399' : '#F87171' }}>
            {diffVsParis >= 0 ? '+' : ''}{diffVsParis}%
          </strong>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {locs.map((loc, i) => {
          const pct    = (loc.yield / maxYield) * 100;
          const isLive = loc.isLive;
          const isRef  = loc.isRef;

          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: isLive ? '#CBD5E1' : '#64748B', fontWeight: isLive ? 700 : isRef ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>{loc.flag}</span>
                  {loc.name}
                  {isLive && (
                    <span style={{ fontSize: 9, background: '#0EA5E920', border: '1px solid #0EA5E940', color: '#0EA5E9', borderRadius: 10, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.06em' }}>
                      LIVE
                    </span>
                  )}
                  {isRef && (
                    <span style={{ fontSize: 9, background: '#6366F120', border: '1px solid #6366F140', color: '#6366F1', borderRadius: 10, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.06em' }}>
                      REF
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12, fontWeight: isLive ? 700 : 400, color: isLive ? '#0EA5E9' : isRef ? '#6366F1' : '#94A3B8', fontVariantNumeric: 'tabular-nums', minWidth: 55, textAlign: 'right' }}>
                  {Math.round(loc.yield).toLocaleString()}
                </span>
              </div>

              <div style={{ background: '#64748B', borderRadius: 4, height: isLive ? 10 : 7, overflow: 'hidden' }}>
                <div style={{
                  width: pct + '%',
                  height: '100%',
                  borderRadius: 4,
                  background: loc.color,
                  opacity: isLive ? 1 : isRef ? 0.8 : 0.5,
                  transition: 'width 0.5s ease',
                  boxShadow: isLive ? '0 0 8px rgba(14,165,233,0.4)' : 'none',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 10, color: '#64748B', lineHeight: 1.6 }}>
        Reference yields from PVGIS / IRENA Solar Atlas · Live value updates with slider inputs and location changes
      </div>
    </div>
  );
}
