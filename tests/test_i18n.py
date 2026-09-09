"""Tests for the i18n multilingual adapter (i18n/service.py).

Fully offline and deterministic - never calls OpenRouter or any network
service. Run directly, same convention as the rest of the suite:

    py -3 tests/test_i18n.py

Uses an injected FakeTranslator so these tests do not depend on
OPENROUTER_API_KEY being set or on network access. See
tests/test_openrouter_translator.py for offline tests of the real
OpenRouterTranslator's request/response/error handling (also mocked), and
tests/manual_live_translation_check.py /
tests/manual_openrouter_translation_check.py for network-required, manual
sanity checks of the real translation provider.
"""

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from agent.agent import NO_INFO_MESSAGE, ask
from i18n.errors import TranslationError
from i18n.service import ask_multilingual
from i18n.translate import FIXED_MESSAGE_TRANSLATIONS, SUPPORTED_LANGUAGES


class FakeTranslator:
    """Deterministic in-memory translator - never touches the network.

    `overrides` pins exact (text, source, target) -> translation for the
    calls a test cares about (typically the question -> Arabic leg, so
    routing is predictable). Any other call falls back to a tagged
    `"[target] text"` transformation, so tests don't need to hardcode the
    (long, dataset-derived) Arabic answer text just to assert the answer
    got "translated". Mirrors OpenRouterTranslator's empty-input
    short-circuit so that behavior is covered without hitting a real
    provider.
    """

    def __init__(self, overrides: dict[tuple[str, str, str], str] | None = None):
        self.overrides = overrides or {}
        self.calls: list[tuple[str, str, str]] = []

    def translate(self, text: str, source: str, target: str) -> str:
        self.calls.append((text, source, target))
        if not text or not text.strip():
            return ""
        key = (text, source, target)
        if key in self.overrides:
            return self.overrides[key]
        return f"[{target}] {text}"


class AlwaysFailTranslator:
    """Simulates a translation provider that is down/unreachable."""

    def translate(self, text: str, source: str, target: str) -> str:
        raise TranslationError("simulated provider failure")


def test_arabic_bypasses_translation_entirely():
    translator = FakeTranslator()
    result = ask_multilingual("أين مقام إبراهيم؟", lang="ar", translator=translator)
    assert translator.calls == [], "translator must never be called for lang='ar'"
    assert result["categories"] == ["locations"]
    assert result["question_ar"] == "أين مقام إبراهيم؟"
    # Arabic path must match agent.agent.ask() exactly (byte-for-byte passthrough).
    direct = ask("أين مقام إبراهيم؟")
    assert result["answer"] == direct["answer"]
    assert result["tool_calls"] == direct["tool_calls"]


def test_all_seven_languages_supported():
    assert set(SUPPORTED_LANGUAGES) == {"ar", "en", "ur", "id", "tr", "fr", "fa"}


def test_invalid_language_code_raises_value_error():
    try:
        ask_multilingual("test", lang="xx", translator=FakeTranslator())
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError for unsupported language code")


def test_english_question_reaches_correct_category():
    translator = FakeTranslator(overrides={
        ("Where is Maqam Ibrahim?", "en", "ar"): "أين مقام إبراهيم؟",
    })
    result = ask_multilingual("Where is Maqam Ibrahim?", lang="en", translator=translator)
    assert result["categories"] == ["locations"]
    assert result["question_ar"] == "أين مقام إبراهيم؟"
    assert any(r["location_id"] == "MCH-CORE-003" for r in result["tool_calls"][0]["result"])
    assert result["answer"].startswith("[en] "), "answer must have gone through translation"


def test_urdu_question_reaches_correct_category():
    translator = FakeTranslator(overrides={
        ("Lost pilgrim help?", "ur", "ar"): "أين أجد خدمة لمساعدة التائهين؟",
    })
    result = ask_multilingual("Lost pilgrim help?", lang="ur", translator=translator)
    assert result["categories"] == ["services"]
    assert result["answer"].startswith("[ur] ")


def test_indonesian_question_reaches_correct_category():
    translator = FakeTranslator(overrides={
        ("Di mana Zamzam?", "id", "ar"): "أين مقام إبراهيم؟",
    })
    result = ask_multilingual("Di mana Zamzam?", lang="id", translator=translator)
    assert result["categories"] == ["locations"]
    assert result["answer"].startswith("[id] ")


def test_turkish_question_reaches_correct_category():
    translator = FakeTranslator(overrides={
        ("Kayip hacilar icin yardim nerede?", "tr", "ar"): "أين أجد خدمة لمساعدة التائهين؟",
    })
    result = ask_multilingual("Kayip hacilar icin yardim nerede?", lang="tr", translator=translator)
    assert result["categories"] == ["services"]
    assert result["answer"].startswith("[tr] ")


def test_french_question_reaches_correct_category():
    translator = FakeTranslator(overrides={
        ("Ou puis-je trouver de l'aide pour les pelerins perdus ?", "fr", "ar"): "أين أجد خدمة لمساعدة التائهين؟",
    })
    result = ask_multilingual(
        "Ou puis-je trouver de l'aide pour les pelerins perdus ?", lang="fr", translator=translator
    )
    assert result["categories"] == ["services"]
    assert result["answer"].startswith("[fr] ")


def test_persian_question_reaches_correct_category():
    translator = FakeTranslator(overrides={
        ("زائران گمشده را کجا پیدا کنم؟", "fa", "ar"): "أين أجد خدمة لمساعدة التائهين؟",
    })
    result = ask_multilingual("زائران گمشده را کجا پیدا کنم؟", lang="fa", translator=translator)
    assert result["categories"] == ["services"]
    assert result["answer"].startswith("[fa] ")


def test_translated_answer_preserves_categories_and_tool_calls():
    translator = FakeTranslator(overrides={
        ("Where is Maqam Ibrahim?", "en", "ar"): "أين مقام إبراهيم؟",
    })
    result = ask_multilingual("Where is Maqam Ibrahim?", lang="en", translator=translator)
    direct = ask("أين مقام إبراهيم؟")
    assert result["categories"] == direct["categories"]
    assert result["tool_calls"] == direct["tool_calls"], "structured data (e.g. location_id) must pass through untouched"


def test_structured_metadata_fields_are_never_translated():
    # Explicitly checks the individual fields the task calls out - not just
    # blanket tool_calls equality - so a future refactor that reformats
    # tool_calls but still "matches direct ask()" can't hide a regression.
    translator = FakeTranslator(overrides={
        ("Where is Maqam Ibrahim?", "en", "ar"): "أين مقام إبراهيم؟",
    })
    result = ask_multilingual("Where is Maqam Ibrahim?", lang="en", translator=translator)
    location_call = next(c for c in result["tool_calls"] if c["tool"] == "search_locations")
    record = location_call["result"][0]
    assert record["location_id"] == "MCH-CORE-003"
    assert record["name_ar"] == "مقام إبراهيم"  # untranslated Arabic, not "[ar] ..."
    assert record["source_name"] == "معرفة عامة موثقة"

    faq_translator = FakeTranslator(overrides={
        ("Can a woman perform Hajj without a mahram?", "en", "ar"): "هل يجوز للمرأة أداء الحج بدون محرم؟",
    })
    faq_result = ask_multilingual(
        "Can a woman perform Hajj without a mahram?", lang="en", translator=faq_translator
    )
    faq_call = next(c for c in faq_result["tool_calls"] if c["tool"] == "search_faq")
    faq_record = next(r for r in faq_call["result"] if r["question_id"] == "MCH-FAQ-002")
    assert faq_record["authority"] == "وزارة الحج والعمرة (جهة حكومية رسمية)"
    assert faq_record["content_type"] == "سؤال شائع تشغيلي (FAQ)"
    assert faq_record["source_name"] == "haj.gov.sa - الأسئلة الشائعة"


def test_empty_input():
    translator = FakeTranslator()
    result = ask_multilingual("", lang="en", translator=translator)
    assert result["categories"] == []
    assert result["answer"] == FIXED_MESSAGE_TRANSLATIONS["en"]


def test_whitespace_only_input():
    translator = FakeTranslator()
    result = ask_multilingual("   ", lang="fr", translator=translator)
    assert result["categories"] == []
    assert result["answer"] == FIXED_MESSAGE_TRANSLATIONS["fr"]


def test_no_info_message_uses_fixed_table_not_live_translation():
    translator = FakeTranslator(overrides={
        ("random nonsense", "en", "ar"): "ما هو لون سيارتك المفضل؟",
    })
    result = ask_multilingual("random nonsense", lang="en", translator=translator)
    assert result["categories"] == []
    assert result["answer"] == FIXED_MESSAGE_TRANSLATIONS["en"]
    # Only the question->Arabic call should have happened; the fixed
    # NO_INFO_MESSAGE must NOT trigger a second (live) translator call.
    assert translator.calls == [("random nonsense", "en", "ar")]


def test_translator_failure_propagates_as_translation_error():
    try:
        ask_multilingual("Where is Zamzam?", lang="en", translator=AlwaysFailTranslator())
    except TranslationError:
        pass
    else:
        raise AssertionError("expected TranslationError to propagate, not be swallowed")


def test_fake_translator_output_is_what_actually_gets_routed():
    # Proves the pipeline order: the Arabic text the translator produces
    # for the question is exactly what gets fed into agent.agent.ask(),
    # not the original-language question.
    translator = FakeTranslator(overrides={
        ("lost pilgrim service?", "ur", "ar"): "أين أجد خدمة لمساعدة التائهين؟",
    })
    result = ask_multilingual("lost pilgrim service?", lang="ur", translator=translator)
    assert result["question_ar"] == "أين أجد خدمة لمساعدة التائهين؟"
    assert result["categories"] == ["services"]
    assert "locations" not in result["categories"]


if __name__ == "__main__":
    test_arabic_bypasses_translation_entirely()
    test_all_seven_languages_supported()
    test_invalid_language_code_raises_value_error()
    test_english_question_reaches_correct_category()
    test_urdu_question_reaches_correct_category()
    test_indonesian_question_reaches_correct_category()
    test_turkish_question_reaches_correct_category()
    test_french_question_reaches_correct_category()
    test_persian_question_reaches_correct_category()
    test_translated_answer_preserves_categories_and_tool_calls()
    test_structured_metadata_fields_are_never_translated()
    test_empty_input()
    test_whitespace_only_input()
    test_no_info_message_uses_fixed_table_not_live_translation()
    test_translator_failure_propagates_as_translation_error()
    test_fake_translator_output_is_what_actually_gets_routed()
    print("All i18n tests passed.")
