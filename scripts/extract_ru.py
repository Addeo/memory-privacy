#!/usr/bin/env python3
"""One-off: build ru.json from legacy static HTML files."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def extract(path: Path) -> dict:
    html = path.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
    h1 = re.search(r"<h1>(.*?)</h1>", html, re.S).group(1)
    meta = re.search(r'<p class="meta">(.*?)</p>', html, re.S).group(1).strip()
    body = re.search(r"</header>\s*(.*)\s*<nav class=\"doc-nav\"", html, re.S).group(1)
    blocks = []
    tokens = re.split(r"(<h2>.*?</h2>)", body, flags=re.S)
    for token in tokens:
        token = token.strip()
        if not token:
            continue
        if token.startswith("<h2>"):
            blocks.append({"type": "h2", "text": re.sub(r"</?h2>", "", token)})
            continue
        for p in re.findall(r"<p>(.*?)</p>", token, re.S):
            blocks.append({"type": "p", "html": p.strip()})
        for ul in re.findall(r"<ul>(.*?)</ul>", token, re.S):
            items = re.findall(r"<li>(.*?)</li>", ul, re.S)
            blocks.append({"type": "ul", "items": [i.strip() for i in items]})
    return {"pageTitle": title, "h1": h1, "metaHtml": meta, "blocks": blocks}


def main() -> None:
    privacy = extract(ROOT / "privacy-ru.html")
    terms = extract(ROOT / "terms-ru.html")
    (ROOT / "content/privacy/ru.json").write_text(
        json.dumps(privacy, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (ROOT / "content/terms/ru.json").write_text(
        json.dumps(terms, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    ui = {
        "navLabel": "Язык",
        "navHome": "Главная",
        "navPrivacy": "Политика конфиденциальности",
        "navTerms": "Условия использования",
        "footerPrivacy": "Политика конфиденциальности",
        "footerTerms": "Условия использования",
        "footerAll": "Все документы",
        "footerNavLabel": "Связанные документы",
        "indexTitle": "Pairloom — Юридические документы",
        "indexHeading": "Юридические документы",
        "indexIntro": "Политика конфиденциальности и Условия использования приложения Pairloom (игра на запоминание). Оператор: Косилов Сергей (инди-разработчик).",
        "indexDocsHeading": "Документы",
        "indexPrivacyLink": "Политика конфиденциальности",
        "indexTermsLink": "Условия использования",
        "indexContactLabel": "Контакт:",
    }
    (ROOT / "content/ui/ru.json").write_text(
        json.dumps(ui, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("ru.json extracted")


if __name__ == "__main__":
    main()
