# Pairloom — Legal (GitHub Pages)

Static **Privacy Policy** and **Terms of Use** for **Pairloom** (`game.memory.cards`). Languages: **English** and **Russian**. No build step — plain HTML + CSS.

## Site map

| Page | URL path |
|------|----------|
| Home (EN) | `/` or `/index.html` |
| Home (RU) | `/index-ru.html` |
| Privacy (EN) | `/privacy.html` |
| Privacy (RU) | `/privacy-ru.html` |
| Terms (EN) | `/terms.html` |
| Terms (RU) | `/terms-ru.html` |

## Deploy on GitHub Pages

1. Create a **public** repository (e.g. `memory-privacy` or `pairloom-legal`).
2. Push this folder to the repo root.
3. **Settings → Pages → Build and deployment → Source**: branch `main`, folder **/ (root)**.
4. After deploy, URLs look like:
   - `https://<username>.github.io/<repo>/privacy.html`
   - `https://<username>.github.io/<repo>/privacy-ru.html`

Optional: use a repo named `<username>.github.io` to drop `<repo>` from the path.

## Links for the app

Use **HTTPS** URLs in `environment`, App Store Connect, and Google Play.

**English (default for stores):**

```
https://<username>.github.io/<repo>/privacy.html
https://<username>.github.io/<repo>/terms.html
```

**Russian (in-app locale or RU store listing):**

```
https://<username>.github.io/<repo>/privacy-ru.html
https://<username>.github.io/<repo>/terms-ru.html
```

Example Angular `environment`:

```ts
export const environment = {
  privacyPolicyUrl: 'https://sergejkosilov.github.io/memory-privacy/privacy.html',
  privacyPolicyUrlRu: 'https://sergejkosilov.github.io/memory-privacy/privacy-ru.html',
  termsOfUseUrl: 'https://sergejkosilov.github.io/memory-privacy/terms.html',
  termsOfUseUrlRu: 'https://sergejkosilov.github.io/memory-privacy/terms-ru.html',
};
```

Pick the URL by user locale in the app, or always use English for store metadata.

## Before you publish

1. Re-read the legal text; adjust if your practices differ (analytics, crash reporting, business registration).
2. This is **not legal advice**; consider a lawyer for store / subscription compliance.

## Files

- `assets/site.css` — shared layout, dark mode, language nav
- `.nojekyll` — allows paths without Jekyll processing
