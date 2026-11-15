# Lucas Berdy Studio

A React + TypeScript storefront for independent frontend services, with SCSS, a guided project-request planner and a browser-local project desk. Published at https://existing-prog.github.io/website/.

## What works today

- Responsive storefront, subtle motion with reduced-motion support, SVG icons, and locally hosted fonts.
- Three service directions, interactive project previews, project filters, and real portfolio links.
- Four-step planner for service, scope, options, project brief and contact details.
- Native validation, review, downloadable text brief, clipboard copy and an email handoff addressed to `lucasberdy@gmail.com`.
- Explicitly saved drafts in localStorage: resume, edit, update and delete. The UI explains that these are local drafts, not submitted orders. Storage failure is reported; a downloadable brief remains available.
- Browser tests for responsive widths from 320–1920px, navigation, project filtering, draft persistence, export, validation, focus return, corrupted storage and reduced motion.

## Placeholders and production boundaries

Pricing follows **request a quote → approve the scope**, as requested by the owner. Published indicative guides are €600–€1,200 for a focused portfolio, €1,200–€2,400 for a small brochure/business site, and €45/hour for frontend care. These are proposed starter budgets, not fixed prices or market averages for complete projects. Final scope, price, timing, any taxes and external costs are confirmed in a written quote before approval. No checkout, confirmed bookings, testimonials or delivery guarantees are fabricated.

The website has **no backend** at this stage. The project desk is not an authenticated client account; drafts do not sync across devices. Email requests open the visitor's email application and still require the visitor to press Send. The UI never marks a request as received or paid.

To accept real on-site orders, the next implementation needs:

1. The business's approved services, scope, prices/currency, billing identity and terms.
2. A backend with authenticated customer accounts, a database, ownership checks and server-side validation.
3. A transactional email provider and an order/request submission endpoint.
4. A payment provider with server-created checkout sessions and verified payment webhooks, if direct payments are desired.
5. An owner dashboard and authenticated client views for real order states, messages and deliverables.

Keep secret keys out of `VITE_*` variables, frontend code and GitHub Pages. GitHub Pages serves static files; server functions must run on a separate supported backend. These integrations are intentionally not simulated by local draft statuses.

## Development

```sh
npm ci
npm run dev
```

Visit the URL printed by Vite, with `/website/` as the path. The repository uses a `/website/` base for GitHub Pages. Change `base` in `vite.config.ts` when deploying at another path.

```sh
npm run build
npm run preview
```

The build typechecks the application and emits hashed files in `dist/`.

## Tests

```sh
npx playwright install --with-deps chromium
npm run build
npm test
```

Tests start the production preview automatically. Set `CHROMIUM_PATH` to use an existing Chromium executable. Set `TEST_WEBKIT=1` to also test WebKit after installing it with `npx playwright install --with-deps webkit`. `TEST_URL` can point tests at an already running deployment.

## GitHub Pages

Settings → Pages must use **GitHub Actions**. Pushes to `main` install dependencies, typecheck, build, run Chromium regression tests and deploy `dist/`. No manual source copying is needed.

## Main files

- `src/main.tsx`: storefront, navigation and project desk.
- `src/ProjectBuilder.tsx`: accessible native-dialog project planner.
- `src/ProjectStories.tsx` and `src/project-stories.scss`: scroll-driven project sequence, per-case artwork, filters and service-matched quote buttons.
- `src/data.ts`: service and project definitions, draft types and storage loading.
- `src/styles.scss`: responsive styles, motion and locally hosted font declarations.
- `public/assets/`: optimized preview images and favicon.
- `public/fonts/`: variable fonts and their SIL Open Font License texts.
- `tests/storefront.spec.ts`: functional and viewport regression tests.

Samantha Ramsey’s portfolio is a featured project. Kasa and Nina Carducci are explicitly labelled training projects. External links point to the supplied live portfolio and case studies.

## Pricing basis (15 November 2026)

The owner requested rates appropriate for a new frontend freelancer based in France. [Malt’s French frontend rate barometer](https://www.malt.fr/t/barometre-tarifs/tech/developpeur-frontend) lists **€300/day** for 0–2 years of experience on the date checked. This is a marketplace benchmark, not an affiliation with Malt. The portfolio range assumes a focused 2–4 development-day scope; the small business site assumes 4–8 days. The €45/hour care guide rounds a seven-hour-day equivalent of that daily basis. These effort assumptions are our suggested offer structure, not figures reported by the benchmark. Larger scopes and selected options do not produce an automatic total; they require a tailored quote.

## Project sequence

GSAP ScrollTrigger drives three illustrative scenes: Neptune and drawn orbital paths for Samantha, assembling interface previews and a real mobile screenshot for Kasa, and a contact-sheet reveal for Nina. At widths of at least 1024px and heights of at least 650px, with motion permitted, a CSS sticky stage follows the three chapters. Scrolling stays native; there is no scroll locking or required hover interaction.

Smaller screens use independent inline scenes. Reduced-motion mode uses static visuals and disables the sticky stage. Filters, skip-to-services, project links and quote buttons work in every mode. MatchMedia listeners, timelines, image listeners and ScrollTriggers are cleaned up on filter changes, viewport changes and unmount.

The Kasa phone preview is optimized from Lucas’s portfolio screenshot at `/projects/kasa-mobile.png`. The three Nina photo thumbnails come from the existing training site at `https://existing-prog.github.io/projet-4/`, retaining its Unsplash images: Aaron Paul (`wnX-fXzB6Cw`), Hannah Busing (`RvF2R_qMpRk`) and Nino van Prattenburg (`-443cl1uR_8`). The Neptune backdrop is a decorative CSS illustration, not a scientific simulation.
