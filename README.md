# AURALIS

Premium, mobile-first music discovery and playback UI.

## Deployment options

### Option 1 — GitHub repository → Vercel (recommended)
This is the full production deployment. Import the repository into Vercel and set `YOUTUBE_API_KEY` as a Vercel Environment Variable. The `/api/youtube/search` serverless endpoint keeps the API key server-side.

### Option 2 — GitHub Pages frontend
The repository includes `.github/workflows/pages.yml` for GitHub Pages. GitHub Pages is static and cannot execute the included Vercel serverless function. To keep YouTube API calls working without exposing the key in the browser, deploy the `/api` folder on Vercel and set the GitHub repository variable `VITE_API_BASE_URL` to that Vercel project URL. The GitHub Pages frontend will then call that secure API endpoint.

Do **not** put `YOUTUBE_API_KEY` into `VITE_*` variables. Vite exposes `VITE_*` values to the client bundle.

## Local development

```bash
npm ci
npm run dev
```

Local music is bundled under `public/music/` and imported music is stored in IndexedDB.

## YouTube API

Enable YouTube Data API v3 in Google Cloud and add `YOUTUBE_API_KEY` to Vercel Environment Variables.

## GitHub Pages setup

1. Push the repository to GitHub with the default branch `main`.
2. In GitHub: Settings → Pages → Source: **GitHub Actions**.
3. If YouTube search should work on GitHub Pages, create a Vercel deployment for this repository and set `YOUTUBE_API_KEY` there.
4. In GitHub repository Variables, create `VITE_API_BASE_URL` with the Vercel deployment URL, for example `https://your-project.vercel.app`.
5. Push to `main`; the Pages workflow builds and deploys automatically.

If `VITE_API_BASE_URL` is empty, the Vercel deployment uses its own same-origin `/api/youtube/search` endpoint.
