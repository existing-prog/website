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

Pricing is **custom quote after review**. No prices, client testimonials, checkout, confirmed bookings or delivery guarantees are invented.

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
- `src/data.ts`: service and project definitions, draft types and storage loading.
- `src/styles.scss`: responsive styles, motion and locally hosted font declarations.
- `public/assets/`: optimized preview images and favicon.
- `public/fonts/`: variable fonts and their SIL Open Font License texts.
- `tests/storefront.spec.ts`: functional and viewport regression tests.

Samantha Ramsey’s portfolio is a featured project. Kasa and Nina Carducci are explicitly labelled training projects. External links point to the supplied live portfolio and case studies.
