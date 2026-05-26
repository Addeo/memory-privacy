#!/usr/bin/env python3
"""Generate privacy/terms/ui JSON for all supported languages from English source."""

from __future__ import annotations

import json
import re
import time
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"

LANGS = [
    "en", "ru", "es", "fr", "de", "it", "pt", "ja", "ko", "zh-Hans", "zh-Hant",
    "ar", "hi", "tr", "pl", "nl", "id", "th", "vi", "uk",
]

TRANSLATOR_MAP = {
    "en": "en",
    "ru": "ru",
    "es": "es",
    "fr": "fr",
    "de": "de",
    "it": "it",
    "pt": "pt",
    "ja": "ja",
    "ko": "ko",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW",
    "ar": "ar",
    "hi": "hi",
    "tr": "tr",
    "pl": "pl",
    "nl": "nl",
    "id": "id",
    "th": "th",
    "vi": "vi",
    "uk": "uk",
}

SKIP_LANGS = {"en", "ru"}

PROTECTED = [
    ("Pairloom", "[[PAIRLOOM]]"),
    ("game.memory.cards", "[[APPID]]"),
    ("Sergey Kosilov", "[[DEV]]"),
    ("Косилов Сергей", "[[DEV]]"),
    ("supp0rt.serg@yandex.com", "[[EMAIL]]"),
    ("RevenueCat", "[[RC]]"),
    ("Capacitor Preferences", "[[CAP]]"),
    ("localStorage", "[[LS]]"),
    ("Apple App Store", "[[APPSTORE]]"),
    ("App Store", "[[APPSTORE]]"),
    ("Google Play", "[[GPLAY]]"),
    ("Apple", "[[APPLE]]"),
    ("Google", "[[GOOGLE]]"),
    ('href="https://www.apple.com/legal/privacy/"', "[[AHREF]]"),
    ('href="https://policies.google.com/privacy"', "[[GHREF]]"),
    ('href="https://www.revenuecat.com/privacy"', "[[RHREF]]"),
    ('rel="noopener noreferrer"', "[[REL]]"),
    ("mailto:supp0rt.serg@yandex.com", "[[MAILTO]]"),
]

DATE_BY_LANG = {
    "en": "April 4, 2026",
    "ru": "4 апреля 2026 г.",
    "es": "4 de abril de 2026",
    "fr": "4 avril 2026",
    "de": "4. April 2026",
    "it": "4 aprile 2026",
    "pt": "4 de abril de 2026",
    "ja": "2026年4月4日",
    "ko": "2026년 4월 4일",
    "zh-Hans": "2026年4月4日",
    "zh-Hant": "2026年4月4日",
    "ar": "4 أبريل 2026",
    "hi": "4 अप्रैल 2026",
    "tr": "4 Nisan 2026",
    "pl": "4 kwietnia 2026",
    "nl": "4 april 2026",
    "id": "4 April 2026",
    "th": "4 เมษายน 2569",
    "vi": "4 tháng 4 năm 2026",
    "uk": "4 квітня 2026 р.",
}

META_LABELS = {
    "en": ("memory card game", "App ID", "Last updated"),
    "ru": ("игра на запоминание", "идентификатор приложения", "Обновлено"),
    "es": ("juego de memoria", "ID de la app", "Última actualización"),
    "fr": ("jeu de mémoire", "ID de l’app", "Dernière mise à jour"),
    "de": ("Gedächtnisspiel", "App-ID", "Zuletzt aktualisiert"),
    "it": ("gioco di memoria", "ID app", "Ultimo aggiornamento"),
    "pt": ("jogo de memória", "ID do app", "Atualizado em"),
    "ja": ("記憶カードゲーム", "アプリ ID", "最終更新"),
    "ko": ("메모리 카드 게임", "앱 ID", "최종 업데이트"),
    "zh-Hans": ("记忆卡牌游戏", "应用 ID", "更新日期"),
    "zh-Hant": ("記憶卡牌遊戲", "應用程式 ID", "更新日期"),
    "ar": ("لعبة الذاكرة", "معرّف التطبيق", "آخر تحديث"),
    "hi": ("मेमोरी कार्ड गेम", "ऐप ID", "अंतिम अपडेट"),
    "tr": ("hafıza kart oyunu", "Uygulama kimliği", "Son güncelleme"),
    "pl": ("gra pamięciowa", "ID aplikacji", "Ostatnia aktualizacja"),
    "nl": ("geheugenspel", "App-ID", "Laatst bijgewerkt"),
    "id": ("permainan memori", "ID aplikasi", "Terakhir diperbarui"),
    "th": ("เกมจับคู่ความจำ", "รหัสแอป", "อัปเดตล่าสุด"),
    "vi": ("trò chơi trí nhớ", "ID ứng dụng", "Cập nhật lần cuối"),
    "uk": ("гра на запам’ятовування", "ідентифікатор застосунку", "Оновлено"),
}

UI_STRINGS = {
    "navLabel": "Language",
    "navHome": "Home",
    "navPrivacy": "Privacy Policy",
    "navTerms": "Terms of Use",
    "footerPrivacy": "Privacy Policy",
    "footerTerms": "Terms of Use",
    "footerAll": "All documents",
    "footerNavLabel": "Related documents",
    "indexTitle": "Pairloom — Legal documents",
    "indexHeading": "Legal documents",
    "indexIntro": "Privacy Policy and Terms of Use for <strong>Pairloom</strong> (memory card game). Operator: <strong>Sergey Kosilov</strong> (indie developer).",
    "indexDocsHeading": "Documents",
    "indexPrivacyLink": "Privacy Policy",
    "indexTermsLink": "Terms of Use",
    "indexContactLabel": "Contact:",
}


def protect(text: str) -> str:
    for src, token in PROTECTED:
        text = text.replace(src, token)
    return text


def unprotect(text: str) -> str:
    for src, token in PROTECTED:
        text = text.replace(token, src)
    return text


class Translator:
    def __init__(self) -> None:
        from deep_translator import GoogleTranslator  # type: ignore

        self._cls = GoogleTranslator
        self._cache: dict[tuple[str, str], str] = {}

    def translate(self, text: str, lang: str) -> str:
        if not text.strip() or lang == "en":
            return text
        key = (lang, text)
        if key in self._cache:
            return self._cache[key]
        target = TRANSLATOR_MAP[lang]
        try:
            out = self._cls(source="en", target=target).translate(protect(text))
        except Exception:
            time.sleep(0.5)
            out = self._cls(source="en", target=target).translate(protect(text))
        if out is None:
            out = text
        out = unprotect(out)
        self._cache[key] = out
        time.sleep(0.08)
        return out


def privacy_meta(lang: str, tr: Translator) -> str:
    date = DATE_BY_LANG[lang]
    if lang in META_LABELS:
        game, app_id, updated = META_LABELS[lang]
    else:
        game, app_id, updated = (
            tr.translate("memory card game", lang),
            tr.translate("App ID", lang),
            tr.translate("Last updated", lang),
        )
    return (
        f"<strong>Pairloom</strong> ({game}) · {app_id} <code>game.memory.cards</code> · {updated}: "
        f'<time datetime="2026-04-04">{date}</time>'
    )


def translate_doc(doc: dict, lang: str, tr: Translator) -> dict:
    if lang == "en":
        return deepcopy(doc)
    out = deepcopy(doc)
    out["pageTitle"] = tr.translate(doc["pageTitle"], lang)
    out["h1"] = tr.translate(doc["h1"], lang)
    out["metaHtml"] = privacy_meta(lang, tr)
    blocks = []
    for block in doc["blocks"]:
        nb = deepcopy(block)
        if block["type"] == "h2":
            nb["text"] = tr.translate(block["text"], lang)
        elif block["type"] == "p":
            nb["html"] = tr.translate(block["html"], lang)
        elif block["type"] == "ul":
            nb["items"] = [tr.translate(item, lang) for item in block["items"]]
        blocks.append(nb)
    out["blocks"] = blocks
    return out


def translate_ui(lang: str, tr: Translator) -> dict:
    if lang == "en":
        return dict(UI_STRINGS)
    return {k: tr.translate(v, lang) for k, v in UI_STRINGS.items()}


def lang_done(lang: str) -> bool:
    return (CONTENT / "privacy" / f"{lang}.json").exists() and (CONTENT / "terms" / f"{lang}.json").exists()


def main() -> None:
    tr = Translator()
    privacy_en = json.loads((CONTENT / "privacy" / "en.json").read_text(encoding="utf-8"))
    terms_en = json.loads((CONTENT / "terms" / "en.json").read_text(encoding="utf-8"))

    for lang in LANGS:
        if lang in SKIP_LANGS:
            continue
        if lang_done(lang):
            print(f"Skipping {lang} (already exists).")
            continue
        print(f"Translating {lang}...")
        privacy = translate_doc(privacy_en, lang, tr)
        terms = translate_doc(terms_en, lang, tr)
        ui = translate_ui(lang, tr)
        for folder, data in (("privacy", privacy), ("terms", terms), ("ui", ui)):
            path = CONTENT / folder / f"{lang}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  saved {lang}")

    print("Done.")


if __name__ == "__main__":
    main()
