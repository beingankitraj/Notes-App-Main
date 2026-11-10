# Notes

Single-page note-taking app. Express REST API + vanilla JS frontend, ready for Vercel.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/notes` (or `/notes`) | List notes, newest first |
| POST | `/api/notes` | Create a note: `{ title, content, color }` |
| DELETE | `/api/notes/:id` | Delete one note |
| GET | `/api/health` | Reports the storage mode |

## Run locally

```bash
npm install
npm start        # http://localhost:3000
```

Notes are saved to `data/notes.json`.

## Deploy to Vercel

1. Push this folder to a GitHub repo and import it in Vercel (no build settings needed).
2. In the project, open **Storage** and add an **Upstash Redis** database from the Marketplace, then connect it to the project. This sets the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables.
3. Redeploy.

Working Link - https://notes-app-hazel-tau.vercel.app/


Vercel functions have a read-only, short-lived filesystem, so a JSON file cannot persist notes there. Without step 2 the app still works, but notes live in `/tmp` and may vanish (the app shows a banner when this is the case).

Or from the CLI: `npm i -g vercel && vercel --prod`.
