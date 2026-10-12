# CLAUDE.md — Custom Domain QR Code Relinking (POC)

## Goal

Build a demo site that shows **QR code relinking**: one QR code is printed once, and the place it leads to can be changed at any time without reprinting.

- The QR code encodes a link on a URL **we control** (a stable "relink" URL).
- Behind that URL, a routing step decides where the visitor lands, based on a setting we control (the "BE").
- This is a proof of concept, so the "BE" logic lives in the front end, with a **toggle** that switches the active destination.

## Scope

### Page 1 — Control panel / QR page (`#/`)
- Displays the QR code (encodes the stable relink URL, e.g. `<site>/#/go`).
- Shows the URL in text, with a "Copy link" button.
- A toggle / radio group to choose the active destination:
  - Booking page
  - Event flyer
  - (optional) Custom URL — http(s) only
- Shows which destination is currently active.
- "Simulate scan" button that opens the relink URL in a new tab (stand-in for a phone camera).
- Optional: small scan log (time + destination).

### Relink route (`#/go`)
- This is what the QR code opens.
- Asks the fake backend where to go, then forwards the visitor to the active destination.
- Short "Taking you to …" screen before the redirect.

### Dummy target 1 — Booking page (`#/book`)
- Looks like a page where clients book a meeting with us.
- Pick a day and time slot, enter name and email, confirm.
- Nothing is sent anywhere; the confirmation is local only.

### Dummy target 2 — Event flyer (`#/event`)
- A single-page flyer for an event (title, date, place, highlights, call to action).
- Print/poster-like look.

Both target pages carry a small "demo page — back to control panel" banner.

## Tech decisions

- **React + Vite** (light, fast build, static output).
- **react-router-dom with `HashRouter`** — GitHub Pages is static hosting without server-side rewrites, so hash routes avoid 404s on refresh and on scan.
- **`qrcode.react`** for rendering the QR code.
- Plain CSS, no UI framework.
- **Vite `base: './'`** so the build works on `https://<user>.github.io/<repo>/` and on a custom domain without config changes.
- Build the QR URL from `window.location` at runtime (`new URL('#/go', location.href.split('#')[0])`) so it is correct on localhost, github.io and custom domains.

## Fake backend (front end only)

Keep all routing logic in **one module**: `src/backend/routingBackend.js`. Use localStorage and expose a small, async-friendly API shaped like a real backend, so it can be swapped later:

| Function | Purpose |
|---|---|
| `getConfig()` / `setConfig(patch)` | Admin side: which destination is active |
| `resolveScan()` | Called by `#/go` on every scan; returns the target |
| `logScan()` / `getScans()` | Scan analytics |
| `subscribe(cb)` | Reacts to changes made in other tabs |

Rules:
- Custom URLs must be validated: **http/https only** (reject `javascript:`, `data:`, etc.).
- If the custom URL is invalid, fall back to the first preset so a scan never dead-ends.
- UI components never read localStorage directly; they go through this module.

**Known POC limitation:** localStorage is per browser, so a phone scanning the QR will not see the toggle set on the laptop. Say so in the UI footer. Fix = real backend (see below).

## Replacing the fake backend (next step, not part of the POC)

Cheapest options for a cross-device demo or production:
1. **Small API** (Cloudflare Worker + KV, or Supabase) holding `{ activeId, customUrl }`; `#/go` fetches it.
2. **Server-side redirect on our own domain**, e.g. `go.ourdomain.com/qr1` → target, using a 302 (not 301, because the target changes and 301s get cached by browsers).
3. **Existing platform** — see research below.

## Deployment (GitHub Pages)

- Workflow at `.github/workflows/deploy.yml`: on push to `main`, `npm ci` → `npm run build` → upload `dist` → `actions/deploy-pages`.
- One-time setup in the repo: **Settings → Pages → Source: GitHub Actions**.
- Add `public/.nojekyll`.
- Custom domain later: add `public/CNAME` containing the domain, set DNS, enable HTTPS in Pages settings. No code changes needed because of the relative base and runtime-built QR URL.
- Commit `package-lock.json` (the workflow uses `npm ci`).

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Conventions

- Plain JavaScript (JSX), function components, hooks.
- Keep it small: no state library, no CSS framework, no extra dependencies without a reason.
- Accessible by default: labelled form controls, `aria-live` for the "currently active" status, keyboard-usable toggle.
- Mobile-first layout — the target pages are opened from a phone camera.
- Demo copy uses a fictional company ("Acme Studio"); no real brands or logos.

## Research notes: who can do relinking out of the box?

Principle: a **dynamic QR code** encodes a short redirect URL, not the final destination. The destination is edited server-side, so the printed code never changes. Static codes bake the final URL into the pattern.

**Shopify**
- Has no dedicated "dynamic QR" product, but the mechanism works natively: print a QR for a stable path on your own domain (e.g. `/scan`) and map it under **Online Store → Navigation → URL redirects**. Change the redirect target whenever you like.
- Native redirects are fairly basic (no scan counters, no bulk tools, limited path/wildcard matching); third-party apps such as SC Easy Redirects add those.
- Risk: QR codes generated by Shopify pointing at temporary preview URLs break permanently. Always encode a URL on your own domain.
- Reports of phones showing stale destinations after redirect changes exist, which supports using temporary (302) redirects.

**Hosted dynamic-QR platforms** (editable destination, analytics, usually paid for custom domain)
- QRStuff — custom domain as redirect base, analytics.
- QR Code Generator PRO — white-label/own-domain only on higher plans.
- Hovercode — custom redirect domain, bulk short links.
- short-code.io — editable destinations on every plan, custom domain on Pro.
- Linkly — free dynamic QR per short link.
- Caveat: dynamic codes stop working if the subscription lapses, unless you own the domain the QR points to.

**Self-hosted / own domain** (best fit for "custom domain")
- Shlink, YOURLS, Dub (open source, QR generation included), Sink (runs on Cloudflare Workers/Pages).
- Or plain redirect rules on the domain's own DNS/CDN (e.g. Cloudflare redirect rules).

**Takeaway:** the QR code must point at a URL on a domain we own. Whatever sits behind that URL (Shopify redirect, Shlink, Cloudflare rule, own API) can change freely.

## Definition of done (POC)

- [ ] QR code renders on the control panel and encodes the stable `#/go` URL.
- [ ] Toggle changes where `#/go` lands, without changing the QR code.
- [ ] Booking page and event flyer both exist and look presentable on mobile.
- [ ] Invalid custom URLs are rejected with a visible hint.
- [ ] `npm run build` succeeds; push to `main` deploys via GitHub Pages with no further config.
- [ ] README explains the one-time Pages setting and the localStorage limitation.