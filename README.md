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
- `src/HeroProjectBackdrop.tsx` et `src/hero-project-backdrop.scss` : décors selon l’identifiant du projet (orbites, interfaces, cadrage photo). Les trois couches décoratives restent montées pour permettre les fondus et les changements rapides. La carte flottante conserve son état ; le mode mouvement réduit change directement de décor.
- `src/HeroWorkTransition.tsx` et `src/hero-work-transition.scss` : léger mouvement local de l’aperçu pendant le défilement. Aucun agrandissement plein écran ni calque superposé. Le contexte GSAP restaure les styles lors du démontage ou du passage en mode mouvement réduit.
- `src/useScrollHeader.ts` : navigation sticky selon le sens du défilement, avec seuils anti-tremblement et maintien du focus clavier.
- `src/interaction-polish.scss` : états de navigation, couleurs au survol/focus et finition lumineuse des orbites.
- `src/useGlassMotion.ts` : reflets au pointeur et inclinaison 3D amortie du cadre. Le hero fournit le repère fixe pour éviter les tremblements ; la boucle RAF s’arrête une fois la pose stabilisée. Retour progressif au repos, aucun suivi sur écran tactile ou en mode mouvement réduit.
- `src/ProjectStories.tsx` et `src/project-stories.scss` : chronologies GSAP, correspondance projet/service et dessin de chaque scène.
- `src/ProjectBuilder.tsx` et `src/data.ts` : étapes, validation, stockage local et exports. Ne pas traduire les identifiants enregistrés.
- `src/locales/FR.json` et `src/locales/ENG.json` : textes ; conserver les mêmes clés et variables `{{…}}`.

### Direction visuelle

Le thème emploie les principes généraux du verre dépoli (translucidité, bordures lumineuses et profondeur), avec une composition et du code propres à ce site. Aucun code, modèle 3D, carte de paiement, visuel ou texte de la référence T.RICKS/Webflow n’a été intégré. Les aperçus restent ceux des projets de Lucas. Le flou est limité aux panneaux ; le contenu et les actions restent nets et utilisables sans animation.

## Étude de cas Samantha

La route `#project/samantha` affiche une vraie page intégrée et partageable, compatible avec GitHub Pages sans règle de réécriture. L’accueil et les réalisations utilisent `projectHref` dans `src/data.ts`. Kasa et Nina possèdent également leur étude intégrée, via le même gestionnaire de liens.

`src/SamanthaCaseStudy.tsx` et son SCSS sont chargés à la demande. Les textes viennent des deux catalogues existants. Le formulaire reste géré par `App` ; le CTA de l’étude sélectionne le service `portfolio`. Les effets GSAP sont retirés au démontage et en mode mouvement réduit. Le titre reçoit le focus à l’ouverture, et les liens de retour rejoignent les réalisations.

Les captures `samantha-journal.webp` et `samantha-mobile.webp` proviennent des pages réelles du portfolio de Samantha, consultées le 15 novembre 2026. `samantha-reference-frames-demo.mp4` est extraite du clip fourni par Lucas le 16 novembre 2026 : passage de 00:07 à 00:14, sans audio, recadré sur la démonstration des référentiels pour exclure le curseur et les interfaces de capture/navigateur. Le fichier H.264 est encodé à 60 images/s, avec démarrage rapide ; `samantha-reference-frames-poster.webp` reprend sa première image. La vidéo et son poster sont locaux ; la source n’est affectée qu’après un clic et la lecture reste manuelle (`preload="none"`), sans iframe ni requête vers le portfolio pendant la consultation de l’étude. Le lien « Essayer la démonstration originale » ouvre le vrai site sur demande.

### Chorégraphie de l’étude

`src/useCaseStudyMotion.ts` regroupe les ScrollTriggers : révélation des titres par masques de mots, ouverture de l’aperçu, déplacement vertical du journal dans sa fenêtre, entrée du téléphone et progression de lecture. Les titres gardent leur nom accessible complet avec `aria-label`. Le texte de conception devient sticky en CSS sur les grands écrans, sans pin ni défilement forcé. Les amplitudes sont réduites sur téléphone ; le mode mouvement réduit restaure immédiatement le contenu statique. Le contexte `matchMedia` retire aussi ses attributs et styles lors du démontage, d’un redimensionnement ou d’un changement de langue.

## Étude de cas Kasa

La route `#project/kasa` charge `src/KasaCaseStudy.tsx` à la demande. Kasa est explicitement présenté comme un projet de formation réalisé à partir de maquettes fournies. Les captures locales `kasa-study-*.webp` ont été prises le 15 novembre 2026 sur la vraie application : https://existing-prog.github.io/projet-5/ (sources : https://github.com/existing-prog/projet-5). Elles illustrent le catalogue, une fiche et sa galerie, puis les écrans mobiles ; elles ne simulent pas une réservation ni un paiement.

`src/useKasaMotion.ts` centralise les animations et leur nettoyage : entrée des appareils, titres par mots, progression et changement d’aperçu selon le chapitre visible. À partir de 1024 × 700 px, la scène reste sticky pendant les trois étapes, sans bloquer le scroll natif. Les petits écrans et le mode mouvement réduit affichent les captures dans le flux. Les boutons de la scène permettent aussi de rejoindre chaque étape. Le CTA ouvre le formulaire existant avec le service `website` sélectionné.

`src/CaseWords.tsx` et `src/case-study.scss` partagent les bases accessibles des deux études ; `src/kasa-case-study.scss` définit la composition et la palette propres à Kasa. Les textes FR/ENG restent dans les deux catalogues JSON. Les tests `tests/kasa-case-study.spec.ts` couvrent les dimensions, les langues, les étapes dans les deux sens, le mouvement réduit et le parcours vers le devis.

## Étude de cas Nina Carducci

La route `#project/nina` charge `src/NinaCaseStudy.tsx` à la demande et présente un projet de formation consacré à l’optimisation d’un site existant. Le travail concerne les images WebP, le HTML sémantique, les textes alternatifs et les métadonnées ; la conception photographique initiale n’est pas attribuée à Lucas. Le CTA utilise le formulaire commun avec le service `care` sélectionné.

`src/useNinaMotion.ts` anime le cadrage de la photo d’entrée, l’assemblage de la planche-contact, les titres, les barres décoratives d’audit et les aperçus ordinateur/mobile. Le scroll reste natif, sans pin ni écran superposé. Les amplitudes diminuent sur mobile et toutes les animations sont retirées en mode mouvement réduit. Le contexte GSAP est nettoyé au démontage et au changement de langue.

Les fichiers locaux `nina-study-*.webp` proviennent de la démo https://existing-prog.github.io/projet-4/, consultée le 15 novembre 2026 (sources : https://github.com/existing-prog/projet-4). Les photographies Unsplash conservées sont celles de Ryoji Iwata (`wUZjnOv7t0g`), Aaron Paul (`wnX-fXzB6Cw`), Jakob Owens (`SiniLJkXhMc`) et Nino van Prattenburg (`-443cl1uR_8`). Les captures montrent le site réellement déployé ; aucune page cliente n’est reconstruite pour les aperçus.

Les scores Lighthouse avant/après (performance 56/94, accessibilité 68/100, SEO 73/100) sont repris de l’étude publiée dans le portfolio personnel, avec un lien de source visible. Ils sont explicitement présentés comme des résultats d’audit documentés, pas comme un audit actuel ni une promesse de résultat. Les chiffres restent lisibles sans animation. Les tests `tests/nina-case-study.spec.ts` couvrent les langues et dimensions, le défilement dans les deux sens, le mouvement réduit, la navigation et la sélection du service de maintenance.

## Parcours client et FAQ

La section `#approach` décrit quatre étapes : échange, devis, réalisation avec retours, validation/livraison. Elle précise les éléments à préparer sans imposer un cahier des charges terminé. `src/ProjectQuestions.tsx` contient huit questions traduites dans les catalogues FR/ENG. Les accordéons utilisent `details`/`summary` natifs : clavier et lecture restent disponibles sans animation. Leur apparence et les quatre étapes sont définies dans `src/project-questions.scss`.

## Activer l’envoi direct des demandes

**État actuel : envoi direct configuré en production.** Lucas a fourni le formulaire public `https://formspree.io/f/xbgogapg` le 16 novembre 2026. Le workflow utilise cet identifiant par défaut pour la compilation publiée ; une variable de dépôt `FORMSPREE_FORM_ID` peut le remplacer. La validation du destinataire et la réception effective restent à vérifier depuis le compte Formspree. Aucun message réel n’est envoyé par les tests automatiques. Sans configuration lors d’une compilation locale, la messagerie reste le mode de secours.

Le branchement est défini dans `src/requestDelivery.ts`. Il utilise uniquement l’identifiant public d’un formulaire Formspree, sans clé secrète côté navigateur. Pour l’activer :

1. Créer un formulaire sur https://formspree.io/ avec la boîte de réception souhaitée et valider cette adresse chez le prestataire. Vérifier ses paramètres de protection antispam, ses limites et le traitement des données avant lancement commercial.
2. Copier l’identifiant à la fin de l’URL publique `https://formspree.io/f/IDENTIFIANT`.
3. Dans GitHub → Settings → Secrets and variables → Actions → Variables, créer la variable de dépôt `FORMSPREE_FORM_ID` avec cet identifiant. Ce n’est pas un secret. Pour un autre hébergeur, définir `VITE_FORMSPREE_FORM_ID` au moment de la compilation ; `.env.example` documente le format local.
4. Relancer le workflow Pages via Actions → Run workflow. La compilation de production active alors le bouton d’envoi direct. Le workflow teste les réponses du prestataire avec des requêtes interceptées : aucun message de test n’est réellement envoyé par CI.
5. Envoyer une demande manuelle avec ses propres coordonnées, puis vérifier sa présence dans Formspree et dans la boîte destinataire avant d’annoncer l’ouverture commerciale. L’acceptation du prestataire ne garantit pas à elle seule l’arrivée dans la boîte principale.

Pendant l’envoi, le bouton est désactivé et les retours d’étape sont bloqués. Seule une réponse HTTP réussie avec `ok: true` affiche l’acceptation ; les erreurs, réponses invalides et délais de 15 secondes conservent le brief et proposent la messagerie en secours. Un brouillon sauvegardé reste un brouillon local. Le formulaire explique le transfert à Formspree lorsqu’il est configuré. La future politique de confidentialité devra refléter le service effectivement choisi et les modalités de conservation de l’activité.

Pour désactiver l’envoi direct en production, retirer la valeur par défaut `xbgogapg` du workflow et supprimer la variable de dépôt éventuelle, puis reconstruire le site. Les tests courants vérifient le parcours par messagerie ; pour vérifier le mode connecté localement, construire avec `VITE_FORMSPREE_FORM_ID=testform` puis exécuter `TEST_DIRECT_DELIVERY=1 npm test -- tests/request-delivery.spec.ts` contre ce build. Les requêtes sont interceptées et ne quittent pas le navigateur de test.

## Projet personnel Atelier Pizza

`#project/atelier-pizza` présente le prototype WordPress personnel validé en local : modification d’un prix, masquage d’une pizza, horaires, annonce et média. Le projet est explicitement fictif et ne représente pas un client réel. `AtelierProjectTeaser.tsx` ajoute un lien complémentaire après les trois scènes existantes ; la liste `projects` et les décors de Samantha, Kasa et Nina restent indépendants.

`AtelierPizzaCaseStudy.tsx` et son SCSS sont chargés à la demande. `useAtelierMotion.ts` anime une image illustrative de pizza, générée pour ce projet, découpée en deux zones SVG : le reste et une part. Six états SVG alignés (part entière, quatre bouchées successives et fin) sont affichés par étapes nettes. Chaque état cumule des découpes arrondies ; la part se détache et réagit légèrement à chaque bouchée, sans fondu. Le texte apparaît pendant la séquence. La scène utilise un sticky CSS limité à sa section à partir de 1024 × 700 px ; le scroll reste natif. Les petits écrans présentent directement la pizza et le texte ; le mouvement réduit retire les animations. Les identifiants de masques proviennent de `useId` et le contexte GSAP est nettoyé aux changements de langue, de dimensions et de route.

`atelier-menu-desktop.webp` et `atelier-editor.webp` sont des captures du vrai prototype WordPress local. `atelier-wordpress-demo.mp4` montre une véritable modification et son résultat sur la vitrine ; il est silencieux et ne charge qu’au clic. La vidéo, les captures et les recettes sont des démonstrations. Aucun identifiant ni secret n’est publié. L’administration WordPress n’est pas accessible en ligne.

`public/demos/atelier-pizza.html` fournit un aperçu statique autonome, image et filtres inclus ; il explique que l’édition est réservée au WordPress local. Il ne reçoit aucune commande ni paiement. Son visuel de vitrine est une illustration Unsplash, distincte de la pizza utilisée dans l’animation de l’étude. Le CTA de l’étude ouvre le formulaire avec le service `website` sélectionné.

### Démonstration guidée et détails de l’étude Atelier Pizza

`AtelierGuidedDemo.tsx` compare trois actions : prix, visibilité et annonce de fermeture. Pour chaque action, deux états réels de l’administration et du site ont été capturés depuis le WordPress local, avant et après sauvegarde. Les douze fichiers `atelier-guide-*.webp` ne contiennent aucun identifiant ; les données sont fictives. Les contrôles sélectionnent uniquement des captures, avec un libellé explicite de démonstration guidée, un résultat textuel annoncé et un accès aux images en grand. Aucun appel à WordPress ni enregistrement ne part du site public. Changer d’action revient à l’état « avant » ; changer de langue conserve la sélection. Sur téléphone, les vues s’empilent.

Les petites miettes SVG appartiennent à la même chronologie GSAP que les bouchées. Trois formes par étape apparaissent, tombent légèrement et s’effacent ; le retour au scroll remonte la séquence. En mode mouvement réduit ou sans animation desktop, elles restent invisibles. La conclusion est orientée vers les restaurants ; son bouton conserve le service `website` du formulaire existant.

### Rythme éditorial de la page Atelier Pizza

Les titres de section sont révélés par mots via `CaseWords`, avec un nom accessible complet sur chaque titre. `useAtelierMotion.ts` distingue les conteneurs animés de leurs enfants pour éviter les doubles translations : amorces, paragraphes et CTA sont décalés progressivement ; les points clés sont échelonnés. Le titre de la scène pizza appartient à sa chronologie existante.

La capture principale est contenue dans `.atelier-site-viewport` : une ouverture légère, une inclinaison de 2 degrés et une échelle de 1,025 à 1 accompagnent le scroll sur ordinateur. Aucun contrôle interactif n’est mis à l’échelle. Sur petits écrans, seule une entrée courte en translation et opacité est utilisée ; le mode mouvement réduit restaure titres, images et listes sans effets. La démonstration guidée est animée par son conteneur stable afin que ses changements d’action ne créent pas de ScrollTriggers sur des captures démontées. Le contexte GSAP et les écouteurs sont retirés aux changements de langue, de mode et de route.
