# Lucas Berdy — Freelance frontend services

A responsive, animated website for portfolio creation, business websites and website maintenance. Built with HTML, CSS and vanilla JavaScript, without a dependency install or build step.

## Publish on GitHub Pages

1. Open [Settings → Pages](https://github.com/existing-prog/website/settings/pages).
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Open **Actions → Deploy website to GitHub Pages** and run the workflow, or push a change to `main`.
4. After a successful deployment, the site is available at **https://existing-prog.github.io/website/**.

The repository is private. GitHub Pages support for private repositories depends on your GitHub plan and organization policy. If Pages is unavailable, connect the repository to Vercel or Netlify as a static site (no build command; publish the repository root). Do not change repository visibility unless you want the source to become public. A public Pages deployment makes website assets publicly available even when the source repository is private.

## Contact flow

The form validates the visitor's details and creates an email addressed to **lucasberdy@gmail.com**, the contact address on the supplied portfolio. The visitor sends the email from their own email application. The page does not submit or store enquiries on a server, and never claims an enquiry has been sent. A copyable project brief is available if an email app is not configured; clipboard failures reveal a selectable text fallback.

Service buttons preselect the requested service. All three services are quoted individually; there are no invented prices, client testimonials or delivery guarantees.

## Edit

- `index.html`: services, project links, contact address and text.
- `styles.css`: palette, layouts, mobile breakpoints and animations.
- `app.js`: navigation, service selection, scroll reveals and email brief.
- `assets/`: optimized project screenshots from Lucas's supplied portfolio, Samantha Ramsey’s portfolio preview artwork and an SVG favicon.

Change the email in both `index.html` and `app.js` if needed. Kasa and Nina Carducci are explicitly identified as training work; Samantha Ramsey’s academic portfolio is featured separately. External portfolio links are retained for full case studies.

## Local preview

From this directory run `python3 -m http.server 8000`, then visit `http://localhost:8000`.

## Accessibility and behavior

Includes semantic landmarks, labeled fields, native form validation, keyboard focus styles, a skip link, mobile menu with Escape handling, expandable FAQ answers, and reduced-motion support. Content remains visible without JavaScript. The email brief and menu enhancement require JavaScript. Google Fonts is optional; system fonts provide a fallback.

## Checks

`node --check app.js`

The Pages workflow checks JavaScript syntax and deploys only the static website files, excluding repository documentation and workflow configuration.

Decorative and navigation icons use inline SVG (and an SVG mask for service bullets), so iOS Safari cannot substitute emoji artwork. Motion preferences are still respected.
