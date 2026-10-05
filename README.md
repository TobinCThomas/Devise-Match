# Device Match

A phone and laptop comparison site with weighted priorities, a searchable catalogue, saved devices, shareable comparisons and a live specification analyzer.

## Develop

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Run `npm test` for regression checks and `npm run build` for the typechecked production build. `npm run preview` serves the build locally.

## GitHub Pages

Under **Settings → Pages → Build and deployment**, select **GitHub Actions**. The included workflow tests, builds and publishes every push to `main`. Assets use relative paths, so the same build supports a repository path or a custom domain.

## Data and privacy

- Catalogue data and editorial comparison weights live in `src/devices.ts` and `src/match-state.ts`. Scores are decision aids, not laboratory benchmarks. Featured profiles include manufacturer sources and the date checked.
- Live search and imported specifications are requested directly from Wikipedia and, when necessary, public community feeds. These services must allow cross-origin browser requests; outages or blocked requests show a fallback message while the local catalogue stays usable.
- No backend, API keys or paid services are required. Saved devices stay in the visitor's browser, and comparison links encode the selected devices and priorities.
- Prices are reference values, and regional configurations vary. Confirm purchasing details with the manufacturer or retailer.

This GitHub Pages build was adapted from the published Device Match site. The original Sites deployment is managed separately.
