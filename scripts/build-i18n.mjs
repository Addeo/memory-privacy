import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const langs = [
  'en', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh-Hans', 'zh-Hant',
  'ar', 'hi', 'tr', 'pl', 'nl', 'id', 'th', 'vi', 'uk',
];

function writeModule(dir, lang, data) {
  const folder = join(root, 'assets', 'i18n', dir);
  mkdirSync(folder, { recursive: true });
  const file = join(folder, `${lang}.js`);
  writeFileSync(file, `export default ${JSON.stringify(data, null, 2)};\n`, 'utf8');
}

function loadJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

for (const lang of langs) {
  const privacyPath = `content/privacy/${lang}.json`;
  const termsPath = `content/terms/${lang}.json`;
  const uiPath = `content/ui/${lang}.json`;
  if (existsSync(join(root, privacyPath))) {
    writeModule('privacy', lang, loadJson(privacyPath));
  }
  if (existsSync(join(root, termsPath))) {
    writeModule('terms', lang, loadJson(termsPath));
  }
  if (existsSync(join(root, uiPath))) {
    writeModule('ui', lang, loadJson(uiPath));
  }
}

console.log('i18n modules built:', langs.join(', '));
