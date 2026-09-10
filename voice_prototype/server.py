"""Local voice-input prototype for Siraj.

Serves a single page with a microphone button (browser Web Speech API,
7 languages) and a JSON endpoint that feeds the transcribed question
through i18n.service.ask_multilingual() - agent/agent.py and tools/* are
unchanged. Requires the OPENROUTER_API_KEY environment variable to be set
(see .env.example) for any non-Arabic language; the API key is read
server-side only (i18n/translate.py) and is never sent to the browser.

Also serves /speak (i18n/tts.py, openai/gpt-audio via OpenRouter) for
the "listen" buttons in sakina/src/AskSakina.tsx and Home.tsx - reuses
the same OPENROUTER_API_KEY as translation, no separate key needed.

Run:
    python3 voice_prototype/server.py
Then open http://localhost:8787
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from i18n.errors import TranslationError  # noqa: E402
from i18n.service import ask_multilingual  # noqa: E402
from i18n.translate import SUPPORTED_LANGUAGES  # noqa: E402
from i18n.tts import TTSError, synthesize_speech  # noqa: E402

STATIC_DIR = Path(__file__).resolve().parent / "static"
# Built Sakina frontend (sakina/npm run build). Only present after a
# production build - local `npm run dev` never creates this, so local dev
# and Render's two-service setup (render.yaml; backend never builds the
# frontend) keep serving the standalone prototype page below unchanged. A
# same-origin deployment that builds this first would get it served
# directly - no second process/port needed.
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "sakina" / "dist"
MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}
# Hosting platforms (Render, Railway, etc.) assign their own port via $PORT
# and route external HTTPS traffic to it - 8787 stays the local-dev default.
PORT = int(os.environ.get("PORT", 8787))


class Handler(BaseHTTPRequestHandler):
    def _cors_headers(self) -> None:
        # Permissive/local-prototype only: lets other local dev servers
        # (e.g. Sakina on :5174) call /ask cross-origin. Not production-safe
        # (no origin allowlist, no auth) - fine for a same-machine prototype.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        if FRONTEND_DIST.is_dir():
            self._serve_frontend()
            return
        if self.path == "/" or self.path == "/index.html":
            html = (STATIC_DIR / "index.html").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
            return
        self.send_response(404)
        self.end_headers()

    def _serve_frontend(self) -> None:
        # Single-origin deploy: serve the built Sakina app (sakina/dist) for
        # everything that isn't /ask or /speak. Sakina has no client-side
        # router (tab-based, all state-driven - see
        # sakina/src/TabBar.tsx), so any unrecognized path just gets
        # index.html rather than a 404.
        rel = self.path.split("?", 1)[0].lstrip("/") or "index.html"
        candidate = (FRONTEND_DIST / rel).resolve()
        if FRONTEND_DIST.resolve() not in candidate.parents and candidate != FRONTEND_DIST.resolve():
            self.send_response(403)
            self.end_headers()
            return
        if not candidate.is_file():
            candidate = FRONTEND_DIST / "index.html"
        content_type = MIME_TYPES.get(candidate.suffix, "application/octet-stream")
        body = candidate.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path == "/ask":
            self._handle_ask()
        elif self.path == "/speak":
            self._handle_speak()
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_ask(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
            question = str(data.get("question", "")).strip()
            lang = str(data.get("lang", "ar")).strip() or "ar"
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "invalid JSON body"})
            return
        if not question:
            self._send_json(400, {"error": "missing 'question'"})
            return
        if lang not in SUPPORTED_LANGUAGES:
            self._send_json(400, {"error": f"unsupported 'lang': {lang!r}"})
            return
        try:
            result = ask_multilingual(question, lang=lang)
        except TranslationError as exc:
            self._send_json(502, {"error": "translation_unavailable", "detail": str(exc)})
            return
        self._send_json(200, {
            "answer": result["answer"],
            "categories": result["categories"],
            "tool_calls": result["tool_calls"],
            "lang": result["lang"],
            "question_ar": result["question_ar"],
        })

    def _handle_speak(self):
        # Text-to-speech for the "listen" buttons (sakina/src/AskSakina.tsx,
        # Home.tsx) - see i18n/tts.py for the call this wraps. Kept as its own
        # route (not folded into /ask) since the browser's Web Speech API
        # already handles recognition fine; only speech *output* needed a
        # real voice provider once we required languages the OS has none
        # installed for (confirmed: Urdu and Persian on macOS).
        length = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
            text = str(data.get("text", "")).strip()
            lang = str(data.get("lang", "ar")).strip() or "ar"
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "invalid JSON body"})
            return
        if not text:
            self._send_json(400, {"error": "missing 'text'"})
            return
        try:
            audio = synthesize_speech(text, lang)
        except TTSError as exc:
            self._send_json(502, {"error": "tts_unavailable", "detail": str(exc)})
            return
        self.send_response(200)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", str(len(audio)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(audio)

    def log_message(self, fmt, *args):
        print("[voice_prototype]", fmt % args)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Siraj voice prototype: http://localhost:{PORT}")
    server.serve_forever()
