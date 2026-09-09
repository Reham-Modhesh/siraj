"""Unit tests for OpenRouterTranslator (i18n/translate.py).

Fully offline - never makes a real network call. Monkeypatches either
i18n.translate._post_chat_completion (the one function that talks to
OpenRouter) or urllib.request.urlopen underneath it, so these tests need
neither OPENROUTER_API_KEY nor network access. Run directly:

    py -3 tests/test_openrouter_translator.py

See tests/manual_openrouter_translation_check.py for a real, network- and
API-key-required smoke test of the actual OpenRouter connection.
"""

import io
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

import i18n.translate as translate_mod
from i18n.errors import TranslationError
from i18n.translate import OpenRouterTranslator


class _Patch:
    """Minimal monkeypatch helper: swap one attribute, restore on exit."""

    _MISSING = object()

    def __init__(self, obj, name, value):
        self.obj, self.name, self.value = obj, name, value

    def __enter__(self):
        self.original = getattr(self.obj, self.name, self._MISSING)
        setattr(self.obj, self.name, self.value)
        return self.value

    def __exit__(self, *exc):
        if self.original is self._MISSING:
            delattr(self.obj, self.name)
        else:
            setattr(self.obj, self.name, self.original)


class _EnvSet:
    """Temporarily set (or unset, if value is None) an env var, restoring
    whatever was there before. os.environ needs dict-style get/set/del, not
    the generic attribute-based _Patch above."""

    _MISSING = object()

    def __init__(self, name, value):
        self.name, self.value = name, value

    def __enter__(self):
        self.original = os.environ.get(self.name, self._MISSING)
        if self.value is None:
            os.environ.pop(self.name, None)
        else:
            os.environ[self.name] = self.value

    def __exit__(self, *exc):
        if self.original is self._MISSING:
            os.environ.pop(self.name, None)
        else:
            os.environ[self.name] = self.original


def _with_api_key(key: str = "test-key"):
    return _EnvSet("OPENROUTER_API_KEY", key)


def _no_api_key():
    return _EnvSet("OPENROUTER_API_KEY", None)


def _fake_post_success(content: str):
    calls = []

    def _post(payload, api_key, timeout):
        calls.append((payload, api_key, timeout))
        return {"choices": [{"message": {"content": content}}]}

    _post.calls = calls
    return _post


def _fake_post_raises(exc: Exception):
    def _post(payload, api_key, timeout):
        raise exc

    return _post


def _fake_post_returns(data: dict):
    def _post(payload, api_key, timeout):
        return data

    return _post


def _post_should_not_be_called(payload, api_key, timeout):
    raise AssertionError("network call should not have happened")


# --- OpenRouterTranslator.translate() -------------------------------------


def test_missing_api_key_raises_without_network_call():
    with _no_api_key(), _Patch(translate_mod, "_post_chat_completion", _post_should_not_be_called):
        translator = OpenRouterTranslator()
        try:
            translator.translate("hello", source="en", target="ar")
        except TranslationError:
            pass
        else:
            raise AssertionError("expected TranslationError for missing OPENROUTER_API_KEY")


def test_empty_input_returns_empty_without_network_call():
    with _with_api_key(), _Patch(translate_mod, "_post_chat_completion", _post_should_not_be_called):
        translator = OpenRouterTranslator()
        assert translator.translate("", source="en", target="ar") == ""
        assert translator.translate("   ", source="en", target="ar") == ""


def test_same_source_and_target_returns_text_unchanged_without_network_call():
    with _with_api_key(), _Patch(translate_mod, "_post_chat_completion", _post_should_not_be_called):
        translator = OpenRouterTranslator()
        assert translator.translate("مرحبا", source="ar", target="ar") == "مرحبا"


def test_successful_translation_returns_content_and_sends_expected_payload():
    fake_post = _fake_post_success("أين زمزم؟")
    with _with_api_key("secret-key"), _Patch(translate_mod, "_post_chat_completion", fake_post):
        translator = OpenRouterTranslator()
        result = translator.translate("Where is Zamzam?", source="en", target="ar")

    assert result == "أين زمزم؟"
    assert len(fake_post.calls) == 1
    payload, api_key, timeout = fake_post.calls[0]
    assert api_key == "secret-key"
    assert payload["model"] == "google/gemini-2.5-flash-lite"
    assert payload["temperature"] == 0
    assert payload["reasoning"] == {"enabled": False}
    assert payload["messages"][0]["role"] == "system"
    assert payload["messages"][1] == {"role": "user", "content": "Where is Zamzam?"}
    # target == "ar" -> question-translation prompt, must forbid answering.
    assert "Do not answer the question" in payload["messages"][0]["content"]


def test_answer_translation_uses_the_answer_prompt_not_the_question_prompt():
    fake_post = _fake_post_success("Where is Zamzam?")
    with _with_api_key(), _Patch(translate_mod, "_post_chat_completion", fake_post):
        translator = OpenRouterTranslator()
        translator.translate("أين زمزم؟", source="ar", target="en")

    system_prompt = fake_post.calls[0][0]["messages"][0]["content"]
    assert "Do not answer, expand, interpret, summarize" in system_prompt
    assert "English (en)" in system_prompt


def test_env_model_override_is_respected():
    fake_post = _fake_post_success("hi")
    with _with_api_key(), _EnvSet("OPENROUTER_MODEL", "some/other-model"), _Patch(
        translate_mod, "_post_chat_completion", fake_post
    ):
        translator = OpenRouterTranslator()
        translator.translate("مرحبا", source="ar", target="en")

    assert fake_post.calls[0][0]["model"] == "some/other-model"


def test_translation_error_from_transport_propagates():
    with _with_api_key(), _Patch(
        translate_mod, "_post_chat_completion", _fake_post_raises(TranslationError("boom"))
    ):
        translator = OpenRouterTranslator()
        try:
            translator.translate("hello", source="en", target="ar")
        except TranslationError:
            pass
        else:
            raise AssertionError("expected TranslationError to propagate")


def test_empty_model_response_raises_translation_error():
    with _with_api_key(), _Patch(
        translate_mod, "_post_chat_completion", _fake_post_success("   ")
    ):
        translator = OpenRouterTranslator()
        try:
            translator.translate("hello", source="en", target="ar")
        except TranslationError:
            pass
        else:
            raise AssertionError("expected TranslationError for empty translated content")


def test_malformed_response_shape_raises_translation_error():
    for bad_response in ({}, {"choices": []}, {"choices": [{}]}, {"choices": [{"message": {}}]}):
        with _with_api_key(), _Patch(
            translate_mod, "_post_chat_completion", _fake_post_returns(bad_response)
        ):
            translator = OpenRouterTranslator()
            try:
                translator.translate("hello", source="en", target="ar")
            except TranslationError:
                pass
            else:
                raise AssertionError(f"expected TranslationError for malformed response {bad_response!r}")


# --- _post_chat_completion() itself (the actual HTTP/network handling) ----


class _FakeHTTPResponse:
    def __init__(self, body: bytes):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self.body


def test_post_chat_completion_success():
    def fake_urlopen(request, timeout):
        return _FakeHTTPResponse(b'{"choices": [{"message": {"content": "ok"}}]}')

    with _Patch(urllib.request, "urlopen", fake_urlopen):
        data = translate_mod._post_chat_completion({"model": "x"}, "key", 10)
    assert data == {"choices": [{"message": {"content": "ok"}}]}


def test_post_chat_completion_wraps_http_error():
    def fake_urlopen(request, timeout):
        raise urllib.error.HTTPError(
            url="https://openrouter.ai/api/v1/chat/completions",
            code=401,
            msg="Unauthorized",
            hdrs=None,
            fp=io.BytesIO(b'{"error": "invalid api key"}'),
        )

    with _Patch(urllib.request, "urlopen", fake_urlopen):
        try:
            translate_mod._post_chat_completion({"model": "x"}, "bad-key", 10)
        except TranslationError as exc:
            assert "401" in str(exc)
        else:
            raise AssertionError("expected TranslationError for HTTP 401")


def test_post_chat_completion_wraps_network_error():
    def fake_urlopen(request, timeout):
        raise urllib.error.URLError("connection refused")

    with _Patch(urllib.request, "urlopen", fake_urlopen):
        try:
            translate_mod._post_chat_completion({"model": "x"}, "key", 10)
        except TranslationError:
            pass
        else:
            raise AssertionError("expected TranslationError for network error")


def test_post_chat_completion_wraps_timeout():
    def fake_urlopen(request, timeout):
        raise TimeoutError("timed out")

    with _Patch(urllib.request, "urlopen", fake_urlopen):
        try:
            translate_mod._post_chat_completion({"model": "x"}, "key", 10)
        except TranslationError:
            pass
        else:
            raise AssertionError("expected TranslationError for timeout")


def test_post_chat_completion_wraps_invalid_json():
    def fake_urlopen(request, timeout):
        return _FakeHTTPResponse(b"not json at all")

    with _Patch(urllib.request, "urlopen", fake_urlopen):
        try:
            translate_mod._post_chat_completion({"model": "x"}, "key", 10)
        except TranslationError:
            pass
        else:
            raise AssertionError("expected TranslationError for invalid JSON")


def test_api_key_never_appears_in_error_message():
    def fake_urlopen(request, timeout):
        raise urllib.error.HTTPError(
            url="https://openrouter.ai/api/v1/chat/completions",
            code=403,
            msg="Forbidden",
            hdrs=None,
            fp=io.BytesIO(b"forbidden"),
        )

    with _Patch(urllib.request, "urlopen", fake_urlopen):
        try:
            translate_mod._post_chat_completion({"model": "x"}, "super-secret-key", 10)
        except TranslationError as exc:
            assert "super-secret-key" not in str(exc)
        else:
            raise AssertionError("expected TranslationError")


if __name__ == "__main__":
    test_missing_api_key_raises_without_network_call()
    test_empty_input_returns_empty_without_network_call()
    test_same_source_and_target_returns_text_unchanged_without_network_call()
    test_successful_translation_returns_content_and_sends_expected_payload()
    test_answer_translation_uses_the_answer_prompt_not_the_question_prompt()
    test_env_model_override_is_respected()
    test_translation_error_from_transport_propagates()
    test_empty_model_response_raises_translation_error()
    test_malformed_response_shape_raises_translation_error()
    test_post_chat_completion_success()
    test_post_chat_completion_wraps_http_error()
    test_post_chat_completion_wraps_network_error()
    test_post_chat_completion_wraps_timeout()
    test_post_chat_completion_wraps_invalid_json()
    test_api_key_never_appears_in_error_message()
    print("All OpenRouterTranslator tests passed.")
