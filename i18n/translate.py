"""Translation provider interface + default (prototype-grade) provider.

Nothing outside this module talks to a translation library directly -
i18n/service.py only depends on the `Translator` protocol, so swapping the
default `GoogleFreeTranslator` for an official provider (Google Cloud
Translation, Azure Translator, DeepL, ...) later is a matter of writing a
new class here and pointing `get_translator()` at it - no changes needed
in i18n/service.py or agent/tools.
"""

from typing import Protocol

from agent.agent import NO_INFO_MESSAGE
from i18n.errors import TranslationError

# ISO 639-1 codes used throughout the i18n layer and by callers (e.g. the
# voice prototype). These are NOT speech/locale identifiers (ar-SA,
# en-US, ...) - see voice_prototype/static/index.html for that separate
# mapping.
SUPPORTED_LANGUAGES: dict[str, str] = {
    "ar": "العربية",
    "en": "English",
    "ur": "اردو",
    "id": "Bahasa Indonesia",
    "tr": "Türkçe",
    "fr": "Français",
    "fa": "فارسی",
}

# Pre-translated fixed message so the single most common answer (nothing
# matched) never needs a live translation call. TODO: verify wording with
# a native speaker of each language before production use.
FIXED_MESSAGE_TRANSLATIONS: dict[str, str] = {
    "en": "We couldn't find a reliable answer to this question in the available sources.",
    "ur": "ہمیں دستیاب ذرائع میں اس سوال کا کوئی قابلِ اعتماد جواب نہیں ملا۔",
    "id": "Kami tidak menemukan jawaban yang dapat diandalkan untuk pertanyaan ini dalam sumber yang tersedia.",
    "tr": "Bu soruya mevcut kaynaklar icinde guvenilir bir yanit bulamadik.",
    "fr": "Nous n'avons pas trouve de reponse fiable a cette question dans les sources disponibles.",
    "fa": "ما پاسخ قابل اعتمادی برای این سؤال در منابع موجود پیدا نکردیم.",
}


class Translator(Protocol):
    def translate(self, text: str, source: str, target: str) -> str:
        """Translate `text` from `source` to `target` (ISO 639-1 codes).
        Empty/whitespace-only input should return "" without a network
        call. Must raise i18n.errors.TranslationError on provider/network
        failure - never return a silently wrong or empty result."""
        ...


class GoogleFreeTranslator:
    """Development/prototype translation provider.

    Uses Google Translate's unofficial public endpoint via the
    `deep-translator` package - no API key required, but also no SLA: it
    can be rate-limited, blocked, or changed without notice by Google.
    This is NOT approved for production traffic. It exists so
    multilingual support can be built and tested today; swap in an
    official provider (Google Cloud Translation API, Azure Translator,
    ...) by implementing `Translator` in a new class once the team has
    budget/approval for one - i18n/service.py does not need to change.
    """

    def translate(self, text: str, source: str, target: str) -> str:
        if not text or not text.strip():
            return ""
        try:
            from deep_translator import GoogleTranslator
        except ImportError as exc:  # pragma: no cover - env misconfiguration
            raise TranslationError(
                "deep-translator is not installed; run `pip install -r requirements.txt`"
            ) from exc
        try:
            return GoogleTranslator(source=source, target=target).translate(text)
        except Exception as exc:  # noqa: BLE001 - provider can raise many exception types
            raise TranslationError(
                f"GoogleFreeTranslator failed translating {source}->{target}: {exc}"
            ) from exc


_default_translator: Translator | None = None


def get_translator() -> Translator:
    """Lazily-constructed default translator. Importing this module never
    requires deep-translator or network access unless a non-Arabic
    language is actually requested."""
    global _default_translator
    if _default_translator is None:
        _default_translator = GoogleFreeTranslator()
    return _default_translator


def translate_fixed_answer(arabic_answer: str, target_lang: str, translator: Translator) -> str:
    """Translate an answer to `target_lang`, using the pre-reviewed static
    table (no network call) when `arabic_answer` is the fixed
    NO_INFO_MESSAGE, otherwise a live translation."""
    if arabic_answer == NO_INFO_MESSAGE and target_lang in FIXED_MESSAGE_TRANSLATIONS:
        return FIXED_MESSAGE_TRANSLATIONS[target_lang]
    return translator.translate(arabic_answer, source="ar", target=target_lang)
