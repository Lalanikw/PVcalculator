/**
 * pvFormulas.js
 *
 * Offline fallback calculations used when the PVGIS API is unreachable.
 * Numbers are calibrated to Oahu (GHI ≈ 2,050 kWh/m²/yr).
 *
 * These are simplified models — the live PVGIS call is always preferred.
 */

// Oahu long-term mean GHI from NSRDB (kWh/m²/yr)
const OAHU_GHI = 2050;

// Approximate monthly GHI distribution for Oahu (sums to 2050)
const OAHU_MONTHLY_GHI = [130, 135, 175, 180, 190, 195, 205, 200, 175, 165, 150, 150];

/**
 * Estimate annual PV outputs for a given system on Oahu.
 *
 * @param {number} systemKwp   - installed capacity (kWp)
 * @param {number} lossPercent - system losses 0–100 (default 14)
 * @param {number} tilt        - panel tilt in degrees (default 20)
 * @returns {{ E_y, 'H(i)_y', PR, monthly }}
 */
export function fallbackCalc(systemKwp, lossPercent = 14, tilt = 20) {
  // Rough tilt correction: optimal tilt for Oahu is ~21° (= latitude).
  // Gain/loss ~0.4 % per degree deviation from optimal.
  const tiltDelta = Math.abs(tilt - 21);
  const tiltFactor = 1 - 0.004 * tiltDelta;

  const irradiation = OAHU_GHI * tiltFactor;        // kWh/m²/yr on tilted plane
  const PR          = 1 - lossPercent / 100;
  const E_y         = systemKwp * irradiation * PR;  // kWh/yr

  // Synthetic monthly breakdown (scale GHI distribution by annual ratio)
  const annualGhiSum = OAHU_MONTHLY_GHI.reduce((a, b) => a + b, 0);
  const monthly = OAHU_MONTHLY_GHI.map((ghiMonth, i) => {
    const monthFactor = (ghiMonth / annualGhiSum) * 12; // relative to mean month
    const E_m = (E_y / 12) * monthFactor;
    return { month: i + 1, E_m: parseFloat(E_m.toFixed(1)) };
  });

  return {
    E_y:        parseFloat(E_y.toFixed(1)),
    'H(i)_y':  parseFloat(irradiation.toFixed(1)),
    PR:         parseFloat(PR.toFixed(4)),
    monthly,
  };
}

/**
 * Derive PVGIS `loss` parameter from a desired Performance Ratio.
 * PVGIS loss ≈ (1 - PR) × 100  (not exact, but a good seed value)
 */
export function prToLoss(pr) {
  return parseFloat(((1 - pr) * 100).toFixed(1));
}

/**
 * Format a number with thousands separator.
 */
export function fmt(n, decimals = 0) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
