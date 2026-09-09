"""MANUAL, NETWORK-REQUIRED, NEEDS OPENROUTER_API_KEY.

A minimal smoke test of the OpenRouter connection itself - separate from
tests/manual_live_translation_check.py's broader terminology sweep. Makes
one small translation request and reports only whether it succeeded and
the translated text. Never prints the API key.

Not part of the automated/offline test suite (tests/test_i18n.py,
tests/test_openrouter_translator.py) - those never call OpenRouter.

Run by hand (needs OPENROUTER_API_KEY set - see .env.example):

    py -3 tests/manual_openrouter_translation_check.py
"""

import io
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from i18n.errors import TranslationError
from i18n.translate import OpenRouterTranslator


def main() -> None:
    if not os.environ.get("OPENROUTER_API_KEY"):
        print("FAILED: OPENROUTER_API_KEY is not set (see .env.example).")
        sys.exit(1)

    translator = OpenRouterTranslator()

    print("--- one small translation request (en -> ar) ---")
    try:
        result = translator.translate("Hello, where is Zamzam?", source="en", target="ar")
    except TranslationError as exc:
        print(f"FAILED: {exc}")
        sys.exit(1)

    print("SUCCEEDED")
    print(f"translated text: {result}")


if __name__ == "__main__":
    main()
