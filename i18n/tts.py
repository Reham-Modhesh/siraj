"""Text-to-speech via OpenRouter's openai/gpt-audio model (streamed).

Originally called Gemini's native audio-output modality directly against
Google's Generative Language API. Switched to OpenRouter's gpt-audio
(confirmed working with a live streamed request) after Gemini's free-tier
key hit its rate limit (HTTP 429) with no guaranteed reset time before a
time-critical demo. This reuses OPENROUTER_API_KEY - the same key
i18n/translate.py already depends on for text translation - so no
separate key is needed.

gpt-audio is a chat model, not a pure TTS engine: without instruction it
answers conversationally ("Sure, I'll say: ...") instead of just reading
the text. The system prompt below forces verbatim narration - confirmed
by checking the returned transcript matches the input exactly.

Audio-output responses from this model require stream:true, and under
streaming the only supported audio.format is pcm16 (not wav) - confirmed
by testing; the wav-under-streaming combination fails with a 400.

Same caveat tier as i18n/translate.py::OpenRouterTranslator: prototype-
grade, unreviewed beyond this module's own manual check, and swappable
behind synthesize_speech()'s signature without touching callers
(voice_prototype/server.py's /speak route, in turn called by
sakina/src/AskSakina.tsx's and Home.tsx's "listen" buttons) if the
provider ever changes again.
"""

import base64
import json
import os
import struct
import urllib.request

_MODEL = "openai/gpt-audio"
_VOICE = "alloy"
_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
_SAMPLE_RATE = 24000
_DEFAULT_TIMEOUT_SECONDS = 30.0

_SYSTEM_PROMPT = (
    "You are a text-to-speech engine. Read the user's message aloud "
    "exactly as written, verbatim, in the same language. Do not add any "
    "words, commentary, greeting, or acknowledgement of any kind."
)


class TTSError(Exception):
    """Raised when speech synthesis can't be reached or returns something
    this module doesn't know how to turn into audio."""


def synthesize_speech(text: str, lang: str) -> bytes:
    """Return WAV-encoded audio bytes for `text`.

    `lang` isn't used to pick a model/voice - gpt-audio reads whatever
    language the text itself is written in - it's kept in the signature
    only so voice_prototype/server.py's /speak route and its callers
    don't need to change. Raises TTSError (never silently returns empty
    audio) on any failure - callers turn that into a 502 the frontend
    already shows a clear message for.
    """
    if not text or not text.strip():
        raise TTSError("No text to speak")

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise TTSError("OPENROUTER_API_KEY is not set; cannot reach the speech model.")

    payload = {
        "model": _MODEL,
        "stream": True,
        "modalities": ["text", "audio"],
        "audio": {"voice": _VOICE, "format": "pcm16"},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    }
    request = urllib.request.Request(
        _ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    audio_chunks = []
    try:
        with urllib.request.urlopen(request, timeout=_DEFAULT_TIMEOUT_SECONDS) as response:
            while True:
                raw_line = response.readline()
                if not raw_line:
                    break
                line = raw_line.decode("utf-8", errors="ignore").strip()
                if not line.startswith("data: "):
                    continue
                data = line[len("data: "):]
                if data == "[DONE]":
                    break
                try:
                    event = json.loads(data)
                except json.JSONDecodeError:
                    continue
                delta = (event.get("choices") or [{}])[0].get("delta", {})
                audio = delta.get("audio")
                if audio and audio.get("data"):
                    audio_chunks.append(audio["data"])
    except Exception as exc:  # network error, HTTP error, timeout
        raise TTSError(f"Speech request failed: {exc}") from exc

    if not audio_chunks:
        raise TTSError("Speech response contained no audio")

    pcm = base64.b64decode("".join(audio_chunks))
    return _pcm_to_wav(pcm, sample_rate=_SAMPLE_RATE)


def _pcm_to_wav(pcm: bytes, sample_rate: int, channels: int = 1, bits_per_sample: int = 16) -> bytes:
    """gpt-audio's pcm16 stream is headerless 16-bit signed little-endian
    PCM - browsers can't play that directly, so wrap it in a minimal WAV header."""
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVE"
    header += b"fmt " + struct.pack("<IHHIIHH", 16, 1, channels, sample_rate, byte_rate, block_align, bits_per_sample)
    header += b"data" + struct.pack("<I", len(pcm))
    return header + pcm
