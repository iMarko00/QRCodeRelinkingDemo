# QR Code Relinking — Demo (Acme Studio)

One QR code, printed once. Where it leads can be changed at any time without reprinting.

The QR code encodes a stable relink URL (`<site>/#/go`). That route asks a routing "backend" where to send
the visitor and forwards them there. In this proof of concept the backend is a front-end module backed by
`localStorage`, with a toggle on the control panel.

## Pages

| Route | What it is |
|---|---|
| `#/` | Control panel: QR code, copy link, destination toggle, custom URL, simulate scan, scan log |
| `#/go` | What the QR code opens. Shows "Taking you to …", then redirects |
| `#/book` | Dummy target: book a meeting (local only, nothing is sent) |
| `#/event` | Dummy target: event flyer |

## Run locally

```bash
npm install
npm run dev       # local dev server
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

To scan from a phone during development, run `npm run dev -- --host` and open the control panel via the
LAN address so the QR code encodes a URL the phone can reach.

## Deploy (GitHub Pages)

1. Push to a GitHub repo.
2. **One-time:** repo **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` builds and deploys via `.github/workflows/deploy.yml`.

The site works at `https://<user>.github.io/<repo>/` with no config: Vite uses a relative `base` and the QR
URL is built from `window.location` at runtime.

**Custom domain later:** add `public/CNAME` with the domain, set the DNS records, and enable HTTPS in Pages
settings. No code changes needed.

## Known limitation: localStorage

The active destination is stored in the browser's `localStorage`. A phone scanning the QR code has its own
storage, so it **will not** see the destination you picked on your laptop — it lands on the default
(Booking page). To demo switching, use **Simulate scan** in the same browser, or open the control panel on
the phone itself.

The fix is a real backend. All routing logic lives in `src/backend/routingBackend.js` behind an async API
(`getConfig`, `setConfig`, `resolveScan`, `logScan`, `getScans`, `subscribe`), so swapping it for a small API
(e.g. Cloudflare Worker + KV, or Supabase) only touches that file. For production, a server-side `302`
redirect on our own domain (not `301`, which browsers cache) is the simplest option.

See `Claude.md` for the full spec and research notes on hosted alternatives.
