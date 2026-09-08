"""MANUAL, NETWORK-REQUIRED - never run this in CI or the automated test
suite (tests/test_i18n.py is the automated, offline equivalent).

Exercises the real GoogleFreeTranslator end-to-end for a handful of
Hajj/Umrah questions - including terminology-heavy ones drawn from
i18n/glossary.py::KEY_TERMS - so a human reviewer can eyeball actual
translation quality before the multilingual feature is trusted for
production. For each question, prints:

    original question -> Arabic intermediate -> Arabic Siraj answer -> translated final answer

Run by hand (needs `pip install -r requirements.txt` first):

    py -3 tests/manual_live_translation_check.py
"""

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from i18n.service import ask_multilingual
from i18n.translate import GoogleFreeTranslator

# (label, lang, question) - mix of generic and terminology-heavy questions,
# across a spread of the 6 non-Arabic supported languages.
CASES = [
    ("generic / en", "en", "Where is Zamzam water?"),
    ("generic / fr", "fr", "Comment puis-je signaler un enfant perdu ?"),
    ("terminology / en", "en", "What should I do if I forget a round (shawt) during Tawaf?"),
    ("terminology / ur", "ur", "احرام کب باندھنا چاہیے؟"),  # "When should Ihram be worn?"
    ("terminology / tr", "tr", "Tavaf-ul İfada nedir?"),  # "What is Tawaf al-Ifadah?"
    ("terminology / fa", "fa", "میقات کجاست؟"),  # "Where is the Miqat?"
    ("terminology / id", "id", "Berapa jumlah putaran Sa'i?"),  # "How many rounds is Sa'i?"
    ("no-match / en", "en", "What's your favorite color?"),
]


def main():
    translator = GoogleFreeTranslator()
    for label, lang, question in CASES:
        print("\n" + "=" * 70)
        print(f"[{label}] lang={lang}")
        print(f"Q ({lang}): {question}")
        result = ask_multilingual(question, lang=lang, translator=translator)
        print(f"Q (ar, translated): {result['question_ar']}")
        print(f"categories: {result['categories']}")
        print(f"A ({lang}, translated back): {result['answer']}")


if __name__ == "__main__":
    main()
