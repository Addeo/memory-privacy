export const LANGS = [
  { code: 'en', label: 'English', native: 'English', hreflang: 'en' },
  { code: 'ru', label: 'Russian', native: 'Русский', hreflang: 'ru' },
  { code: 'es', label: 'Spanish', native: 'Español', hreflang: 'es' },
  { code: 'fr', label: 'French', native: 'Français', hreflang: 'fr' },
  { code: 'de', label: 'German', native: 'Deutsch', hreflang: 'de' },
  { code: 'it', label: 'Italian', native: 'Italiano', hreflang: 'it' },
  { code: 'pt', label: 'Portuguese', native: 'Português', hreflang: 'pt' },
  { code: 'ja', label: 'Japanese', native: '日本語', hreflang: 'ja' },
  { code: 'ko', label: 'Korean', native: '한국어', hreflang: 'ko' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)', native: '简体中文', hreflang: 'zh-Hans' },
  { code: 'zh-Hant', label: 'Chinese (Traditional)', native: '繁體中文', hreflang: 'zh-Hant' },
  { code: 'ar', label: 'Arabic', native: 'العربية', hreflang: 'ar', rtl: true },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', hreflang: 'hi' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', hreflang: 'tr' },
  { code: 'pl', label: 'Polish', native: 'Polski', hreflang: 'pl' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', hreflang: 'nl' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', hreflang: 'id' },
  { code: 'th', label: 'Thai', native: 'ไทย', hreflang: 'th' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', hreflang: 'vi' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська', hreflang: 'uk' },
];

const ALIASES = {
  zh: 'zh-Hans',
  'zh-cn': 'zh-Hans',
  'zh-sg': 'zh-Hans',
  'zh-tw': 'zh-Hant',
  'zh-hk': 'zh-Hant',
  'zh-mo': 'zh-Hant',
  'pt-br': 'pt',
  'pt-pt': 'pt',
};

export function resolveLang(input) {
  if (!input) {
    return 'en';
  }
  const raw = String(input).trim();
  const lower = raw.toLowerCase();
  if (ALIASES[lower]) {
    return ALIASES[lower];
  }
  const exact = LANGS.find((l) => l.code.toLowerCase() === lower);
  if (exact) {
    return exact.code;
  }
  const short = lower.split('-')[0];
  const byShort = LANGS.find((l) => l.code.toLowerCase() === short);
  return byShort?.code ?? 'en';
}

export function detectLang() {
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param) {
    return resolveLang(param);
  }
  const stored = localStorage.getItem('pairloom-legal-lang');
  if (stored) {
    return resolveLang(stored);
  }
  const browser = navigator.languages?.[0] || navigator.language || 'en';
  return resolveLang(browser);
}

export function langMeta(code) {
  return LANGS.find((l) => l.code === code) ?? LANGS[0];
}
