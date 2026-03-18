/**
 * PVGIS Proxy API Route
 *
 * Server-side proxy to the EU Joint Research Centre PVGIS v5.2 API.
 * Runs on Vercel edge/serverless — avoids CORS issues from the browser.
 *
 * PVGIS endpoint: https://re.jrc.ec.europa.eu/api/v5_2/PVcalc
 *
 * Query params forwarded from the frontend:
 *   lat        – latitude  (decimal degrees, positive = North)
 *   lon        – longitude (decimal degrees, positive = East)
 *   peakpower  – installed PV power (kWp)
 *   loss       – system losses (%), typically 14–23 %
 *   angle      – panel tilt from horizontal (degrees, 0 = flat)
 *   aspect     – azimuth (0 = south, 90 = west, -90 = east)
 */
export default async function handler(req, res) {
  const { lat, lon, peakpower, loss, angle, aspect } = req.query;

  // Validate required params
  if (!lat || !lon || !peakpower) {
    return res.status(400).json({ error: 'Missing required parameters: lat, lon, peakpower' });
  }

  const params = new URLSearchParams({
    lat:           lat      ?? '21.31',
    lon:           lon      ?? '-157.86',
    peakpower:     peakpower,
    loss:          loss     ?? '14',
    angle:         angle    ?? '20',
    aspect:        aspect   ?? '0',
    outputformat:  'json',
    pvcalculation: '1',        // include monthly breakdown
    pvtechtechnology: 'crystSi',
    mountingplace: 'building',
    optimalangles: '0',
  });

  const url = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?${params.toString()}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      // 10-second timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('PVGIS error response:', text);
      return res.status(upstream.status).json({ error: `PVGIS returned ${upstream.status}`, detail: text });
    }

    const data = await upstream.json();

    // Cache-Control: PVGIS data changes only with climate updates, so 1 hour is safe
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);

  } catch (err) {
    console.error('PVGIS proxy error:', err);
    return res.status(500).json({ error: 'Failed to reach PVGIS API', message: err.message });
  }
}
