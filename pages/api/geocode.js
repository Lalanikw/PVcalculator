/**
 * pages/api/geocode.js
 *
 * Server-side proxy to OpenStreetMap Nominatim geocoding API.
 * Converts a free-text address into { lat, lon, displayName }.
 *
 * Nominatim is free, requires no API key, and is used by OpenStreetMap.
 * Running it server-side keeps our User-Agent policy clean and avoids CORS.
 *
 * Usage: GET /api/geocode?q=Honolulu+Hawaii
 */
export default async function handler(req, res) {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const params = new URLSearchParams({
    q:              q.trim(),
    format:         'json',
    limit:          '5',
    addressdetails: '1',
  });

  const url = `https://nominatim.openstreetmap.org/search?${params}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        // Nominatim policy: must identify your app
        'User-Agent': 'PVCalculator/1.0 (educational tool; pvgis.jrc.ec.europa.eu)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Nominatim error' });
    }

    const results = await upstream.json();

    if (!results.length) {
      return res.status(404).json({ error: 'No results found for that address' });
    }

    // Return the top 5 candidates so the frontend can show suggestions
    const candidates = results.map(r => ({
      lat:         parseFloat(r.lat),
      lon:         parseFloat(r.lon),
      displayName: r.display_name,
      // Short name: city + country
      shortName:   [r.address?.city || r.address?.town || r.address?.village || r.address?.county,
                    r.address?.country].filter(Boolean).join(', '),
    }));

    res.setHeader('Cache-Control', 's-maxage=86400'); // geocode results stable for 24 h
    return res.status(200).json({ candidates });

  } catch (err) {
    console.error('Geocode error:', err);
    return res.status(500).json({ error: 'Geocoding service unavailable', message: err.message });
  }
}
