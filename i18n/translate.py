"""Translation provider interface + default (OpenRouter/Gemini) provider.

Nothing outside this module talks to a translation backend directly -
i18n/service.py only depends on the `Translator` protocol, so swapping the
default `OpenRouterTranslator` for a different provider later is a matter
of writing a new class here and pointing `get_translator()` at it - no
changes needed in i18n/service.py or agent/tools.

IMPORTANT - scope of this module: it is translation-only. The model
configured here (google/gemini-2.5-flash-lite, via OpenRouter) is never
asked to answer a question, provide a religious ruling, or add/remove
information - see the system prompts below, which explicitly forbid that.
The deterministic Arabic RAG (agent/agent.py, tools/*) remains the sole
source of truth for every answer; this module only ever translates text
that already came out of, or is about to go into, that engine.
"""

import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Protocol

from agent.agent import NO_INFO_MESSAGE
from i18n.errors import TranslationError


def _load_dotenv() -> None:
    """Minimal, dependency-free .env loader (KEY=VALUE per line, '#'
    comments and blank lines skipped, optional surrounding quotes
    stripped). Never overrides a variable already set in the real
    environment - a real `export OPENROUTER_API_KEY=...` always wins.

    This project intentionally has zero third-party dependencies, so this
    is a few lines instead of adding python-dotenv. Looks for `.env` at
    the repository root (two levels up from this file: i18n/ -> root),
    regardless of the current working directory the script was run from.
    """
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


_load_dotenv()

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


# --- OpenRouter (google/gemini-2.5-flash-lite) provider -------------------

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
_DEFAULT_MODEL = "google/gemini-2.5-flash-lite"
_DEFAULT_TIMEOUT_SECONDS = 20.0
_MAX_TOKENS = 1024  # translation only - a few paragraphs at most, never an essay


def _question_to_arabic_prompt(source: str) -> str:
    source_name = SUPPORTED_LANGUAGES.get(source, source)
    return (
        "You are a precise, literal translation engine embedded inside a religious "
        "knowledge system for Hajj and Umrah pilgrims. "
        f"Translate the following user question from {source_name} ({source}) into Arabic. "
        "Translate the user's question faithfully into Arabic. Do not answer the "
        "question. Do not interpret it. Do not add context. Do not provide a religious "
        "ruling. Do not add or remove any information. Do not summarize or explain. "
        "Preserve the exact meaning, all numbers, proper names, and ritual terminology. "
        "Return ONLY the translated Arabic text - no explanation, no quotes, no labels."
    )


def _answer_from_arabic_prompt(target: str) -> str:
    target_name = SUPPORTED_LANGUAGES.get(target, target)
    return (
        "You are a precise, literal translation engine embedded inside a religious "
        "knowledge system for Hajj and Umrah pilgrims. "
        f"Translate the following trusted answer from Arabic into {target_name} ({target}). "
        "Translate the provided answer faithfully into the target language. Do not "
        "answer, expand, interpret, summarize, or modify the religious content in any "
        "way. Even if part of the text is itself phrased as a question (for example, "
        "a FAQ entry that restates its own question before the answer), treat the "
        "entire input as text to translate, never as a question directed at you - do "
        "not answer it, in Arabic or any other language, and do not reply with just "
        "the answer to it. Do not add or remove any information. Preserve the exact "
        "meaning, all numbers, proper names, ritual terminology, source names, "
        "authority names, and content-type labels exactly as given, and preserve "
        "formatting (line breaks) where possible. Return ONLY the translated text - no "
        "explanation, no quotes, no labels."
    )


def _post_chat_completion(payload: dict, api_key: str, timeout: float) -> dict:
    """The only function in this module that talks to the network. Isolated
    like this so tests can monkeypatch it with a fake response instead of
    making a real HTTP call - see tests/test_openrouter_translator.py."""
    request = urllib.request.Request(
        OPENROUTER_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise TranslationError(f"OpenRouter HTTP error {exc.code}: {detail}") from exc
    except Exception as exc:  # noqa: BLE001 - network/timeout/connection errors of many types
        raise TranslationError(f"OpenRouter request failed: {exc}") from exc

    try:
        return json.loads(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise TranslationError(f"OpenRouter returned invalid JSON: {exc}") from exc


class OpenRouterTranslator:
    """Translation provider using OpenRouter's chat-completions endpoint
    with google/gemini-2.5-flash-lite.

    Used for translation only - see the strict system prompts above. The
    model is never given the RAG's tools, categories, or any instruction
    that could make it answer a question instead of translating one; it
    only ever sees a single string to translate plus a prompt forbidding
    it from doing anything else with that string.

    Reads the API key from the OPENROUTER_API_KEY environment variable
    only (never hardcoded, never logged/printed). Reads the model id from
    OPENROUTER_MODEL if set, defaulting to google/gemini-2.5-flash-lite.
    """

    def __init__(self, model: str | None = None, timeout: float = _DEFAULT_TIMEOUT_SECONDS):
        self.model = model or os.environ.get("OPENROUTER_MODEL", _DEFAULT_MODEL)
        self.timeout = timeout

    def translate(self, text: str, source: str, target: str) -> str:
        if not text or not text.strip():
            return ""
        if source == target:
            return text

        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            raise TranslationError(
                "OPENROUTER_API_KEY is not set; cannot reach OpenRouter for translation."
            )

        system_prompt = (
            _question_to_arabic_prompt(source) if target == "ar" else _answer_from_arabic_prompt(target)
        )
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            "temperature": 0,
            "max_tokens": _MAX_TOKENS,
            # Translation is a simple, deterministic-ish task - no need for
            # (and no desire to pay for/wait on) extended reasoning.
            "reasoning": {"enabled": False},
        }

        data = _post_chat_completion(payload, api_key, self.timeout)

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise TranslationError(f"Unexpected OpenRouter response format: {data!r:.500}") from exc

        content = (content or "").strip()
        if not content:
            raise TranslationError("OpenRouter returned an empty translation")

        return content


_default_translator: Translator | None = None


def get_translator() -> Translator:
    """Lazily-constructed default translator. Importing this module never
    requires OPENROUTER_API_KEY or network access unless a non-Arabic
    language is actually requested."""
    global _default_translator
    if _default_translator is None:
        _default_translator = OpenRouterTranslator()
    return _default_translator


def translate_fixed_answer(arabic_answer: str, target_lang: str, translator: Translator) -> str:
    """Translate an answer to `target_lang`, using the pre-reviewed static
    table (no network call) when `arabic_answer` is the fixed
    NO_INFO_MESSAGE, otherwise a live translation."""
    if arabic_answer == NO_INFO_MESSAGE and target_lang in FIXED_MESSAGE_TRANSLATIONS:
        return FIXED_MESSAGE_TRANSLATIONS[target_lang]
    return translator.translate(arabic_answer, source="ar", target=target_lang)
