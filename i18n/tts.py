"""Text-to-speech via the Gemini API's native audio-output modality.

Separate from i18n/translate.py's OpenRouter-routed *text* translation -
audio output isn't a capability OpenRouter's chat-completions endpoint
exposes for Gemini, so this calls Google's own Generative Language API
directly and reads its own key, GEMINI_API_KEY (Google AI Studio),
never OPENROUTER_API_KEY.

Same caveat tier as i18n/translate.py::OpenRouterTranslator: prototype-
grade, unreviewed beyond this module's own manual check, and swappable
behind synthesize_speech()'s signature without touching callers
(voice_prototype/server.py's /speak route, in turn called by
sakina/src/AskSakina.tsx's "listen" button) if the provider ever changes.
"""

import base64
import json
import os
import struct
import urllib.request

_DEFAULT_MODEL = "gemini-2.5-flash-preview-tts"
_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_DEFAULT_TIMEOUT_SECONDS = 30.0

# One prebuilt Gemini voice per language. All currently point at the same
# general-purpose voice - swap individually once someone has actually
# listened to per-language quality (see manual check note below).
_VOICE_BY_LANG = {
    "ar": "Kore", "en": "Kore", "ur": "Kore", "id": "Kore",
    "tr": "Kore", "fr": "Kore", "fa": "Kore",
}


class TTSError(Exception):
    """Raised when Gemini speech synthesis can't be reached or returns
    something this module doesn't know how to turn into audio."""


def synthesize_speech(text: str, lang: str) -> bytes:
    """Return WAV-encoded audio bytes for `text`, spoken in `lang`.

    Raises TTSError (never silently returns empty audio) if GEMINI_API_KEY
    is unset, the request fails, or the response shape is unexpected -
    callers (voice_prototype/server.py) turn that into a 502 the frontend
    already knows how to show a clear message for, matching how
    TranslationError is handled on the /ask route.
    """
    if not text or not text.strip():
        raise TTSError("No text to speak")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise TTSError("GEMINI_API_KEY is not set; cannot reach Gemini for speech synthesis.")

    model = os.environ.get("GEMINI_TTS_MODEL", _DEFAULT_MODEL)
    voice = _VOICE_BY_LANG.get(lang, "Kore")
    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }
    url = _ENDPOINT.format(model=model) + "?key=" + api_key
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=_DEFAULT_TIMEOUT_SECONDS) as response:
            data = json.loads(response.read())
    except Exception as exc:  # network error, HTTP error, timeout, bad JSON
        raise TTSError(f"Gemini TTS request failed: {exc}") from exc

    try:
        part = data["candidates"][0]["content"]["parts"][0]["inlineData"]
        audio_b64 = part["data"]
        mime_type = part.get("mimeType", "audio/L16;rate=24000")
    except (KeyError, IndexError, TypeError) as exc:
        raise TTSError(f"Unexpected Gemini TTS response format: {data!r:.500}") from exc

    pcm = base64.b64decode(audio_b64)
    sample_rate = _sample_rate_from_mime(mime_type)
    return _pcm_to_wav(pcm, sample_rate=sample_rate)


def _sample_rate_from_mime(mime_type: str) -> int:
    # Gemini's audio mimeType looks like "audio/L16;codec=pcm;rate=24000" -
    # 24000 is the documented default if the rate parameter is missing.
    for token in mime_type.split(";"):
        token = token.strip()
        if token.startswith("rate="):
            try:
                return int(token.split("=", 1)[1])
            except ValueError:
                pass
    return 24000


def _pcm_to_wav(pcm: bytes, sample_rate: int, channels: int = 1, bits_per_sample: int = 16) -> bytes:
    """Gemini returns headerless 16-bit signed little-endian PCM - browsers
    can't play that directly, so wrap it in a minimal WAV header."""
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVE"
    header += b"fmt " + struct.pack("<IHHIIHH", 16, 1, channels, sample_rate, byte_rate, block_align, bits_per_sample)
    header += b"data" + struct.pack("<I", len(pcm))
    return header + pcm
