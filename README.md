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
- `src/i18n.ts`, `src/LanguageSwitch.tsx`, `src/locales/FR.json` and `src/locales/ENG.json`: French/English localization and persistent language controls.
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

## French / English

The site uses i18next and react-i18next, with two bundled catalogs: `src/locales/FR.json` and `src/locales/ENG.json`. Their matching keys are readable English phrases; special export and metadata templates use explicit keys. Preserve the `{{placeholder}}` names when editing translations. No translation API or external translation request is used.

A first visit follows the browser language (French for `fr-*`, English otherwise); an explicit FR/ENG choice is stored independently under `lb-language` when browser storage is available. The selector appears in the header and the project planner. Document language, title, metadata, UI labels, accessibility labels, dates, indicative EUR formatting, email subjects and exported briefs update with the selection.

Draft service IDs, page counts, timeline values and selected options remain canonical and independent of the display language, including existing drafts. User-written text is retained exactly as entered. Switching language does not reset the planner step or discard a draft. Language preference storage failure does not prevent switching for the current page.

## Maintenance et lisibilité

Le code utilise une indentation de **2 espaces**, avec des règles partagées dans `.editorconfig` et `.prettierrc.json`. Après une modification :

```sh
npm run format
npm run format:check
npm run build
npm test
```

Le contrôle de formatage fait aussi partie du déploiement GitHub Actions. Les commentaires expliquent les contrats et les mécanismes importants : nettoyage des animations et observateurs, retour du focus sans déplacement de la page, valeurs de brouillon indépendantes de la langue et distinction entre sauvegarde locale et envoi réel.

### Où modifier quoi ?

- `src/styles.scss` : dimensions, typographie, dispositions et points de rupture. Les règles de parité FR/ENG du hero sont regroupées en fin de fichier.
- `src/glass-theme.scss` : palette anthracite/argent, surfaces dépolies, bordures et lumières. Importé après les styles structurels ; éviter d’y changer les dimensions du hero.
- `src/HeroWorkTransition.tsx` et `src/hero-work-transition.scss` : léger mouvement local de l’aperçu pendant le défilement. Aucun agrandissement plein écran ni calque superposé. Le contexte GSAP restaure les styles lors du démontage ou du passage en mode mouvement réduit.
- `src/useScrollHeader.ts` : navigation sticky selon le sens du défilement, avec seuils anti-tremblement et maintien du focus clavier.
- `src/interaction-polish.scss` : états de navigation, couleurs au survol/focus et finition lumineuse des orbites.
- `src/useGlassMotion.ts` : reflets au pointeur et inclinaison 3D amortie du cadre. Le hero fournit le repère fixe pour éviter les tremblements ; la boucle RAF s’arrête une fois la pose stabilisée. Retour progressif au repos, aucun suivi sur écran tactile ou en mode mouvement réduit.
- `src/ProjectStories.tsx` et `src/project-stories.scss` : chronologies GSAP, correspondance projet/service et dessin de chaque scène.
- `src/ProjectBuilder.tsx` et `src/data.ts` : étapes, validation, stockage local et exports. Ne pas traduire les identifiants enregistrés.
- `src/locales/FR.json` et `src/locales/ENG.json` : textes ; conserver les mêmes clés et variables `{{…}}`.

### Direction visuelle

Le thème emploie les principes généraux du verre dépoli (translucidité, bordures lumineuses et profondeur), avec une composition et du code propres à ce site. Aucun code, modèle 3D, carte de paiement, visuel ou texte de la référence T.RICKS/Webflow n’a été intégré. Les aperçus restent ceux des projets de Lucas. Le flou est limité aux panneaux ; le contenu et les actions restent nets et utilisables sans animation.
