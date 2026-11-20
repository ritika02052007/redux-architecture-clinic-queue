# Redux Architecture | Clinic Queue
Patient queue dashboard. React + Vite + Redux Toolkit.

## Run
`npm install` · `npm run dev` · `npm test` · `npm run lint` · `npm run build`
## Architecture
- `app/store.js`: store, localStorage persistence with corruption fallback
- `features/queue`: `queueSlice` (async thunks via fake API), `queueSelectors`, `queueApi`
- `features/ui`: search and filter state
- `utils`: `sanitize` (XSS), `validate`, `analytics`
## Deploy
Push to GitHub, import the repo in Vercel or Netlify (build `npm run build`, output `dist`).
