"""Multilingual entry point: ask_multilingual().

Siraj's retrieval and routing engine (agent.agent.ask) remains
deterministic and LLM-free. Multilingual input/output is handled by an
external translation adapter around that engine; end-to-end multilingual
behavior is therefore NOT guaranteed to be deterministic (a translation
provider can phrase the same sentence differently between calls). The
Arabic path (lang="ar") is fully deterministic, since it never touches
the translator - no translator is instantiated and no network call is
made.

agent.agent.ask() and everything under tools/ are unmodified by this
module and remain the single source of truth for categories/tool_calls,
which downstream consumers (e.g. map navigation - "where's Zamzam" ->
nearest-Zamzam routing) rely on. This module only ever translates the
human-readable `answer` string; `categories` and `tool_calls` are passed
through exactly as agent.agent.ask() returned them.
"""

from agent.agent import ask
from i18n.translate import SUPPORTED_LANGUAGES, Translator, get_translator, translate_fixed_answer


def ask_multilingual(question: str, lang: str = "ar", translator: Translator | None = None) -> dict:
    """Run Siraj's Arabic engine for a question in any supported language.

    Args:
        question: the user's question, in `lang`.
        lang: ISO 639-1 code, one of SUPPORTED_LANGUAGES. Always supplied
            explicitly by the caller - this function never guesses/detects
            the language.
        translator: injected Translator (used by tests with a fake, or to
            swap providers); defaults to the shared GoogleFreeTranslator.

    Returns:
        {"answer": str, "categories": [...], "tool_calls": [...], "lang": lang, "question_ar": str}
        `categories`/`tool_calls` are exactly what agent.agent.ask()
        returned - never translated or altered. `question_ar` is
        internal/debug metadata (equal to `question` unchanged when
        lang == "ar"); it is not a stable public field callers should
        depend on.

    Raises:
        ValueError: `lang` is not a supported language code.
        i18n.errors.TranslationError: the translation provider failed.
            Deliberately not caught here - a caller must not receive a
            fabricated or wrong-language Siraj answer when translation is
            unavailable. HTTP-facing callers (e.g. voice_prototype/server.py)
            should catch this and surface a clear "translation unavailable"
            error instead.
    """
    if lang not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language code: {lang!r}. Supported: {sorted(SUPPORTED_LANGUAGES)}")

    if lang == "ar":
        result = ask(question)
        return {**result, "lang": "ar", "question_ar": question}

    translator = translator or get_translator()
    question_ar = translator.translate(question, source=lang, target="ar")
    result = ask(question_ar)
    answer = translate_fixed_answer(result["answer"], lang, translator)

    return {
        "answer": answer,
        "categories": result["categories"],
        "tool_calls": result["tool_calls"],
        "lang": lang,
        "question_ar": question_ar,
    }
