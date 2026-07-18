# LocaleHost — landing page

Astro landing page for LocaleHost, positioned against typical Irish room-share
platforms on trust and fee handling.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Structure

- `src/layouts/Layout.astro` — fonts (Space Grotesk / Inter / IBM Plex Mono), meta tags
- `src/components/` — one file per section (Header, Hero, Comparison, HowItWorks, Trust, Pricing, Newsletter, Footer)
- `src/components/BoardingPass.astro` — the signature visual: an airline-style
  boarding pass representing the check-in-window concept (fee held until both
  sides reconfirm ~a week before move-in)
- `src/styles/global.css` — design tokens (color, type, spacing) — change the
  palette or fonts here and it cascades everywhere

## Newsletter signup

`src/components/Newsletter.astro` posts to `/api/newsletter` and falls back
to a friendly success message if that endpoint doesn't exist yet, so the page
still demos cleanly with no backend wired up.

To make it real, you have two options:

1. **Point it at an external service** — swap the `fetch("/api/newsletter", ...)`
   call for your ESP (Resend, Mailchimp, Buttondown, etc.) or a Google Sheet
   webhook. Simplest to ship first.
2. **Wire it to your own backend** — since this site builds as static HTML by
   default, a same-origin `/api/newsletter` route needs Astro's server
   output. Add an adapter (`npx astro add node` or `vercel`/`netlify`) and
   set `output: "server"` (or `"hybrid"`) in `astro.config.mjs`, then create
   `src/pages/api/newsletter.ts` that inserts into your Postgres `subscribers`
   table, keyed by `email` + `audience` ("host" | "guest").

Either way, keep the two audiences distinct — hosts and guests want
different launch emails.

## Next steps mentioned in the brief

- Blog for SEO sits at a future `src/pages/blog/` or a separate subdomain —
  footer already has a "coming soon" slot for it.
- Full app is assumed to live at `app.localehost.ie`; this site links out to
  it in the footer.
