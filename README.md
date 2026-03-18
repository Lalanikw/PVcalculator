# ☀️ Oahu PV Calculator

Interactive solar PV performance and payback dashboard for Oahu, Hawaii.
Built for the **Hawaiian Electric Energy Forecasting** curriculum.

Solar resource data is fetched live from [PVGIS v5.2](https://re.jrc.ec.europa.eu/pvg_tools/)
(EU Joint Research Centre / NSRDB satellite data for Hawaii).

---

## What it calculates

| Symbol | Indicator | Description |
|--------|-----------|-------------|
| **C**  | Install Cost | System size × $/Wp |
| **E**  | Annual Energy | AC output from PVGIS (kWh/yr) |
| **I**  | Irradiation | In-plane solar resource H(i) (kWh/m²/yr) |
| **P**  | % Consumption | Fraction of annual load covered |
| **Y**  | Energy Yield | E ÷ kWp (kWh/kWp/yr) |
| **CF** | Capacity Factor | E ÷ (kWp × 8760 h) |
| **PR** | Performance Ratio | AC/DC quality factor from PVGIS |
| **AI** | Annual Income | E × electricity tariff |
| **PBT**| Payback Time | Install cost ÷ annual income (years) |

---

## Getting started (local)

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
# → open http://localhost:3000
```

Requires **Node.js 18+**.

---

## Deploy to Vercel (one click)

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Accept all defaults → **Deploy**.

No environment variables required — PVGIS is a public API.

Vercel will automatically:
- Run `npm run build`
- Serve `pages/api/pvgis.js` as a serverless function (handles CORS)
- Cache PVGIS responses for 1 hour (`s-maxage=3600`)

---

## Project structure

```
oahu-pv-dashboard/
├── pages/
│   ├── _app.jsx            ← global CSS import
│   ├── index.jsx           ← main dashboard UI + state management
│   └── api/
│       └── pvgis.js        ← server-side PVGIS proxy (avoids CORS)
├── components/
│   ├── InputPanel.jsx      ← all sliders / user inputs
│   ├── ResultsGrid.jsx     ← 3×3 grid of indicator cards
│   ├── MonthlyChart.jsx    ← SVG monthly production bars
│   └── ComparisonBar.jsx   ← Oahu vs world cities yield chart
├── lib/
│   └── pvFormulas.js       ← offline fallback formulas
├── styles/
│   └── globals.css         ← dark navy theme + slider styles
├── package.json
├── next.config.js
└── .gitignore
```

---

## How PVGIS is called

The browser never contacts PVGIS directly (CORS restriction).
Instead, `pages/api/pvgis.js` acts as a server-side proxy:

```
Browser slider change
  → GET /api/pvgis?lat=21.31&lon=-157.86&peakpower=3&...
    → Vercel function → PVGIS v5.2 API → returns JSON
  → Dashboard updates all 9 indicators
```

If PVGIS is unreachable, the app falls back to `lib/pvFormulas.js`
(offline estimates based on Oahu's long-term GHI of 2,050 kWh/m²/yr).

---

## Customisation

- **Change location**: edit `OAHU` lat/lon in `pages/index.jsx` and update the `REFERENCE_LOCS` array in `ComparisonBar.jsx`.
- **Change financial defaults**: edit `DEFAULT_INPUTS` in `pages/index.jsx`.
- **Add more metrics**: extend `METRICS` in `ResultsGrid.jsx` and `computeResults()` in `index.jsx`.

---

## Data sources & credits

- **PVGIS**: Huld, T. et al. (2012). *A new solar radiation database...* Solar Energy.
  [https://re.jrc.ec.europa.eu/pvg_tools/](https://re.jrc.ec.europa.eu/pvg_tools/)
- **NSRDB**: NREL National Solar Radiation Database for Hawaii
- **CO₂ factor**: US EPA eGRID 2022 national average (386 g CO₂/kWh)
- **HECO tariff**: Schedule R residential rate ~2024

*For educational use only — not a substitute for a professional solar energy assessment.*
