# ScholarGuide

ScholarGuide is an internal admin scholarship tracker. The frontend is a static site deployed with GitHub Pages; the Express/PostgreSQL API must run on a Node-capable host.

## Local run

1. In `backend`, install dependencies: `npm install`.
2. Copy `.env.example` to `.env` and fill in PostgreSQL connection values plus a private random `JWT_SECRET`.
3. Run `npm start` from `backend`.
4. Open `http://localhost:5000` (the backend serves the frontend locally).

## GitHub Pages

The included Actions workflow deploys the `frontend` folder whenever you push to `main`. In the repository, enable Pages with **GitHub Actions** as the build and deployment source. Configure `frontend/api-config.js` with the public HTTPS base URL for the deployed backend (no trailing `/api`). Deploy the backend separately and set `FRONTEND_ORIGINS` on it to your GitHub Pages origin (for example `https://OWNER.github.io`). Set database and JWT values as host environment variables; never commit `.env`.

Pages hosts only static HTML/CSS/JS. The Express API and PostgreSQL database must remain on a backend/database host that is reachable over HTTPS.
