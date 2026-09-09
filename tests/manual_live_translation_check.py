"""MANUAL, NETWORK-REQUIRED, NEEDS OPENROUTER_API_KEY - never run this in
CI or the automated test suite (tests/test_i18n.py and
tests/test_openrouter_translator.py are the automated, offline
equivalents - they never call OpenRouter).

Exercises the real OpenRouterTranslator (google/gemini-2.5-flash-lite, via
OpenRouter) end-to-end for a handful of Hajj/Umrah questions - including
terminology-heavy ones drawn from i18n/glossary.py::KEY_TERMS - so a human
reviewer can eyeball actual translation quality before the multilingual
feature is trusted for production. For each question, prints:

    original question -> Arabic intermediate -> Arabic Siraj answer -> translated final answer

Run by hand (needs OPENROUTER_API_KEY set - see .env.example):

    py -3 tests/manual_live_translation_check.py
"""

import io
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from i18n.service import ask_multilingual
from i18n.translate import OpenRouterTranslator

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
    # From the OpenRouter integration task: the canonical
    # English -> Arabic RAG -> English round trip for a lost-pilgrim question.
    ("services round-trip / en", "en", "Where can I find assistance for lost pilgrims?"),
]


def main():
    if not os.environ.get("OPENROUTER_API_KEY"):
        print("OPENROUTER_API_KEY is not set - see .env.example. Nothing to run.")
        return

    translator = OpenRouterTranslator()
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
