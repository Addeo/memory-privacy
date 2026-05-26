import { LANGS, detectLang, langMeta, resolveLang } from './lang-config.js';

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'p') {
        return `<p>${block.html}</p>`;
      }
      if (block.type === 'h2') {
        return `<h2>${escapeHtml(block.text)}</h2>`;
      }
      if (block.type === 'ul') {
        const items = block.items.map((item) => `<li>${item}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      return '';
    })
    .join('\n');
}

function buildLangSelect(current, pageName) {
  const options = LANGS.map((lang) => {
    const selected = lang.code === current ? ' selected' : '';
    return `<option value="${lang.code}"${selected}>${lang.native}</option>`;
  }).join('');
  return `<label class="lang-select-label"><span class="visually-hidden">Language</span><select id="lang-select" class="lang-select" aria-label="Language">${options}</select></label>`;
}

function pageUrl(pageName, lang) {
  const file = pageName === 'terms' ? 'terms.html' : pageName === 'privacy' ? 'privacy.html' : 'index.html';
  const url = new URL(file, window.location.href);
  if (lang && lang !== 'en') {
    url.searchParams.set('lang', lang);
  } else {
    url.searchParams.delete('lang');
  }
  return url.pathname + url.search;
}

function renderHeader(ui, currentLang, pageName) {
  const homeHref = pageUrl('index', currentLang);
  const privacyHref = pageUrl('privacy', currentLang);
  const termsHref = pageUrl('terms', currentLang);
  const navLabel = ui.navLabel || 'Language';

  let docLinks = '';
  if (pageName === 'index') {
    docLinks = '';
  } else if (pageName === 'privacy') {
    docLinks = `<li><a href="${privacyHref}" aria-current="page">${ui.navPrivacy}</a></li>`;
  } else if (pageName === 'terms') {
    docLinks = `<li><a href="${termsHref}" aria-current="page">${ui.navTerms}</a></li>`;
  }

  return `
    <header class="site-header">
      <p class="site-brand"><strong>Pairloom</strong> · <code>game.memory.cards</code></p>
      <nav class="lang-nav" aria-label="${escapeHtml(navLabel)}">
        <ul class="lang-nav-list">
          <li><a href="${homeHref}">${ui.navHome}</a></li>
          ${pageName !== 'privacy' ? `<li><a href="${privacyHref}">${ui.navPrivacy}</a></li>` : ''}
          ${pageName !== 'terms' ? `<li><a href="${termsHref}">${ui.navTerms}</a></li>` : ''}
          ${docLinks}
          <li class="lang-select-item">${buildLangSelect(currentLang, pageName)}</li>
        </ul>
      </nav>
    </header>
  `;
}

function renderFooter(ui, currentLang, pageName) {
  const privacyHref = pageUrl('privacy', currentLang);
  const termsHref = pageUrl('terms', currentLang);
  const homeHref = pageUrl('index', currentLang);
  const parts = [];

  if (pageName === 'privacy') {
    parts.push(`<a href="${termsHref}">${ui.footerTerms}</a>`);
  } else if (pageName === 'terms') {
    parts.push(`<a href="${privacyHref}">${ui.footerPrivacy}</a>`);
  }

  parts.push(`<a href="${homeHref}">${ui.footerAll}</a>`);

  return `<nav class="doc-nav" aria-label="${escapeHtml(ui.footerNavLabel)}">${parts.join(' · ')}</nav>`;
}

function applyDocumentLang(lang) {
  const meta = langMeta(lang);
  document.documentElement.lang = meta.hreflang;
  document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
}

function updateHreflang(pageName) {
  const head = document.head;
  head.querySelectorAll('link[data-i18n-alternate]').forEach((node) => node.remove());

  LANGS.forEach((lang) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang.hreflang;
    link.href = new URL(pageUrl(pageName, lang.code), window.location.origin).href;
    link.dataset.i18nAlternate = '1';
    head.appendChild(link);
  });

  const xDefault = document.createElement('link');
  xDefault.rel = 'alternate';
  xDefault.hreflang = 'x-default';
  xDefault.href = new URL(pageUrl(pageName, 'en'), window.location.origin).href;
  xDefault.dataset.i18nAlternate = '1';
  head.appendChild(xDefault);
}

async function loadUi(lang) {
  const code = resolveLang(lang);
  try {
    const uiMod = await import(`./i18n/ui/${code}.js`);
    return { ui: uiMod.default, code };
  } catch {
    const uiMod = await import(`./i18n/ui/en.js`);
    return { ui: uiMod.default, code: 'en' };
  }
}

async function loadBundle(pageName, lang) {
  const code = resolveLang(lang);
  if (pageName === 'index') {
    const uiBundle = await loadUi(code);
    return { content: null, ui: uiBundle.ui, code: uiBundle.code };
  }
  try {
    const [contentMod, uiMod] = await Promise.all([
      import(`./i18n/${pageName}/${code}.js`),
      import(`./i18n/ui/${code}.js`),
    ]);
    return { content: contentMod.default, ui: uiMod.default, code };
  } catch {
    const [contentMod, uiMod] = await Promise.all([
      import(`./i18n/${pageName}/en.js`),
      import(`./i18n/ui/en.js`),
    ]);
    return { content: contentMod.default, ui: uiMod.default, code: 'en' };
  }
}

export async function initLegalPage(pageName) {
  const root = document.getElementById('legal-root');
  if (!root) {
    return;
  }

  let currentLang = detectLang();
  applyDocumentLang(currentLang);
  updateHreflang(pageName);

  async function render(lang) {
    currentLang = resolveLang(lang);
    localStorage.setItem('pairloom-legal-lang', currentLang);
    applyDocumentLang(currentLang);

    const { content, ui, code } = await loadBundle(pageName, currentLang);
    currentLang = code;

    const params = new URLSearchParams(window.location.search);
    if (currentLang === 'en') {
      params.delete('lang');
    } else {
      params.set('lang', currentLang);
    }
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState({}, '', newUrl);

    if (pageName === 'index') {
      document.title = ui.indexTitle;
      root.innerHTML = `
        ${renderHeader(ui, currentLang, pageName)}
        <h1>${ui.indexHeading}</h1>
        <p class="index-intro muted">${ui.indexIntro}</p>
        ${renderIndexDocs(ui, currentLang)}
      `;
    } else {
      document.title = content.pageTitle;
      root.innerHTML = `
        ${renderHeader(ui, currentLang, pageName)}
        <h1>${content.h1}</h1>
        <p class="meta">${content.metaHtml}</p>
        ${renderBlocks(content.blocks)}
        ${renderFooter(ui, currentLang, pageName)}
      `;
    }

    const select = document.getElementById('lang-select');
    if (select) {
      select.value = currentLang;
      select.addEventListener('change', () => {
        render(select.value);
      });
    }

    updateHreflang(pageName);
  }

  await render(currentLang);
}

function renderIndexDocs(ui, lang) {
  const privacyHref = pageUrl('privacy', lang);
  const termsHref = pageUrl('terms', lang);
  return `
    <h2>${ui.indexDocsHeading}</h2>
    <ul class="doc-list">
      <li><a href="${privacyHref}">${ui.indexPrivacyLink}</a></li>
      <li><a href="${termsHref}">${ui.indexTermsLink}</a></li>
    </ul>
    <p class="meta">${ui.indexContactLabel} <a href="mailto:supp0rt.serg@yandex.com">supp0rt.serg@yandex.com</a></p>
  `;
}
