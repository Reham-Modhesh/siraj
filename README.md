# Siraj - Mock RAG Prototype

A prototype of Siraj's knowledge component: a **deterministic, tool-based
Mock RAG** system over three small, structured Hajj/Umrah datasets. No LLM
is used anywhere in this prototype - tool routing and answer generation are
both plain, rule-based Python. This is scoped to the RAG/knowledge piece
only - no frontend, backend, auth, database, 3D guide, map, or voice system.

## Why deterministic, tool-based retrieval - not an LLM, not embeddings

The three datasets are small (50, 16, and 37 rows) and already structured
with clean columns. At this scale:

- **No LLM**: a fixed set of Arabic keyword rules is enough to decide which
  dataset a question is about, and the answer is just the matching
  record(s) formatted as text - nothing needs to be *generated*.
- **No embeddings / vector DB / semantic search**: substring/keyword
  matching over normalized Arabic + English text is sufficient and fully
  deterministic (same question always produces the same answer).

```
User Question
      |
      v
  route()  (agent/agent.py - keyword/rule-based, deterministic)
      |  picks tool categories: locations / services / faq
      v
tools/locations.py | tools/services.py | tools/faq.py
      |  keyword-matches against data/raw/*.csv
      v
  Relevant records (plain dicts)
      |
      v
  Answer built ONLY from those records + source/authority
  (or a fixed "not found" message if nothing matched)
```

## Project structure

```
data/raw/                                  original datasets (never modified)
  dataset1_makkah_haram_locations.csv
  dataset2_makkah_lost_pilgrim_services.csv
  dataset3_makkah_faq_fatawa.csv

tools/
  _util.py            shared CSV loading + Arabic/English keyword matching
  locations.py         search_locations, get_location_details
  services.py          search_services
  faq.py                search_faq

agent/
  agent.py              deterministic keyword router + answer formatting (no LLM)

i18n/                   multilingual adapter around agent/ (see below) - agent/tools unaware of it
  translate.py           Translator interface, default provider, fixed-message table
  service.py              ask_multilingual() entry point
  errors.py                TranslationError
  glossary.py               terminology QA term list (not enforced automatically)

config.py               paths, search tuning
.env.example            OPENROUTER_API_KEY / OPENROUTER_MODEL template (copy to .env, never commit .env)
tests/
  test_tools.py         tool-level tests
  test_agent.py          router/end-to-end tests
  test_i18n.py            multilingual adapter tests (offline, FakeTranslator)
  test_openrouter_translator.py  OpenRouterTranslator unit tests (offline, mocked HTTP)
  manual_live_translation_check.py   manual, network + API key required
  manual_openrouter_translation_check.py  manual, minimal OpenRouter smoke test
  manual_terminology_check.md          manual QA checklist, not code
```

No `llm/` directory and no LLM/provider dependency exist in `agent/` or
`tools/` - `agent/agent.py` imports only `tools/*` and the Python standard
library. `i18n/` is a separate, optional adapter layer (see "Multilingual
support" below); nothing in `agent/`/`tools/` imports from it.

## Datasets

| File | Rows | Key columns | Notes |
|---|---|---|---|
| `dataset1_makkah_haram_locations.csv` | 50 | `location_id, name_ar, name_en, category, latitude, longitude, floor, description, opening_hours, accessibility, reliability, source_name, source_url, last_updated` | `latitude`/`longitude` are empty for 47/50 rows (most sources don't give coordinates) - do not assume every location is mappable yet. `reliability` is a free-text confidence note from data collection, not a dataset guarantee. |
| `dataset2_makkah_lost_pilgrim_services.csv` | 16 | `service_id, service_name_ar, service_name_en, location, service_type, description, contact, working_hours, reliability, source_name, source_url, last_updated` | No missing values. Includes both dedicated lost-pilgrim services and general emergency numbers (112/999/997/998). |
| `dataset3_makkah_faq_fatawa.csv` | 37 | `question_id, question_ar, answer_ar, category, authority, content_type, source_name, source_url, last_updated` | Two distinct `authority` values mixed in one file: the Ministry of Hajj and Umrah (operational FAQs, `content_type` = "سؤال شائع تشغيلي") and Islamweb's Fatwa Center (religious rulings, `content_type` = "فتوى شرعية محكّمة ..."), a general Sunni reference and **not** a Saudi government body. Both `authority` and `content_type` are always preserved in the formatted answer so the two are never blurred. |

## Setup

The whole project is **standard library only - no `pip install` needed**
for any of it, including multilingual support (`i18n/` calls OpenRouter
over `urllib.request`, already in the standard library). Running the
original Arabic-only engine (`agent.agent.ask`) never needs any
environment variable either.

Multilingual support (`i18n/`, see below) needs one environment variable
at runtime - `OPENROUTER_API_KEY` - only when calling
`i18n.service.ask_multilingual` with a non-Arabic `lang`:

```bash
cp .env.example .env   # then fill in OPENROUTER_API_KEY
# On Windows PowerShell: $env:OPENROUTER_API_KEY = "sk-or-..."

py -3 tests/test_tools.py
py -3 tests/test_agent.py
py -3 tests/test_i18n.py                     # offline, no key needed (FakeTranslator)
py -3 tests/test_openrouter_translator.py    # offline, no key needed (mocked HTTP)

# Optional, needs a real OPENROUTER_API_KEY and makes real network calls:
py -3 tests/manual_openrouter_translation_check.py
py -3 tests/manual_live_translation_check.py
```

## How routing works (agent/agent.py)

`route(question)` normalizes the question (Arabic hamza/alef folding,
diacritic stripping - see `tools/_util.py`) and checks it against three
fixed keyword lists:

- **locations**: dataset-grounded place nouns - `موقع`, `بوابة`, `مقام`,
  `المطاف`, `المسعى`, `الصفا`, `المروة`, `زمزم`, `مصعد`, ... Deliberately
  excludes generic interrogatives like "أين" (where), since that word alone
  also appears in service questions ("أين أجد خدمة...") and would blur the
  two categories.
- **services**: `تائه`, `ضاع`, `فقدان`, `مفقود`, `طوارئ`, `اسعاف`, `بلاغ`, ...
- **faq**: `حكم`, `فتوى`, `يجوز`, `احرام`, `الطواف`, `شوط`, `تصريح`,
  `تسجيل`, `حجز`, `هدي`, `اضحية`, `ميقات`, ...

A question can match more than one category (e.g. a question that asks
about a location *and* a ritual rule), in which case every matched tool is
called and all results are included in the answer. If a location question
also contains a "details" trigger word (`تفاصيل`, `معلومات عن`, ...), the
router follows up the `search_locations` match with `get_location_details`
to return the full record.

If no category matches at all, or every matched tool returns nothing
relevant, `agent.agent.ask()` returns the fixed message:

```
لم نجد إجابة موثوقة لهذا السؤال ضمن المصادر المتاحة.
```

The answer text itself is only ever a formatted concatenation of the
records the tools returned (name, description, hours, source, authority,
content_type, etc.) - nothing is generated, summarized, or invented beyond
what's literally in the CSVs.

## Running the tools directly

```python
from tools.locations import search_locations, get_location_details
from tools.services import search_services
from tools.faq import search_faq

search_locations("أين مقام إبراهيم؟")
get_location_details(name="مقام إبراهيم")
search_services("أين أجد خدمة لمساعدة التائهين؟")
search_faq("هل يجوز للمرأة أداء الحج بدون محرم؟")
```

## Running the agent

```python
from agent.agent import ask

result = ask("أين مقام إبراهيم؟")
print(result["answer"])       # final answer, built only from tool results
print(result["categories"])   # which category/categories the router matched
print(result["tool_calls"])   # which tool(s) were called, with inputs/records
```

## Multilingual support (`i18n/`)

Siraj's Arabic engine (`agent/agent.py`, `tools/*`) is unchanged and
remains deterministic and LLM-free. Multilingual input/output for 7
languages (Arabic, English, Urdu, Indonesian, Turkish, French, Persian -
`i18n.translate.SUPPORTED_LANGUAGES`) is handled by a translation adapter
that sits *around* that engine, not inside it:

```
question (any of 7 langs) + explicit lang code (caller-supplied, never auto-detected)
      |
      v
  lang == "ar"?  --yes--> agent.agent.ask(question)   [zero translator calls, zero network]
      |no
      v
  translate question -> Arabic     (i18n/translate.py)
      |
      v
  agent.agent.ask(question_ar)      <-- unchanged, still deterministic
      |
      v
  translate answer -> target lang
```

**Determinism note:** the Arabic engine itself remains deterministic and
LLM-free. End-to-end multilingual behavior is **not** guaranteed to be
deterministic, since a translation provider can phrase the same sentence
differently between calls. Only the `lang="ar"` path is fully
deterministic (it never touches the translator).

```python
from i18n.service import ask_multilingual

result = ask_multilingual("Where is Maqam Ibrahim?", lang="en")
print(result["answer"])       # translated answer
print(result["categories"])   # identical to what agent.agent.ask() would return - untouched
print(result["tool_calls"])   # identical, untouched - e.g. location_id/lat/long for map use
```

`categories` and `tool_calls` are always passed through byte-identical to
what `agent.agent.ask()` returned - only the human-readable `answer`
string is ever translated. This matters because that structured data
already drives other decisions downstream (e.g. map navigation to the
nearest matching location).

**Translation provider:** the default `OpenRouterTranslator`
(`i18n/translate.py`) calls OpenRouter's chat-completions endpoint
(`https://openrouter.ai/api/v1/chat/completions`) with model
`google/gemini-2.5-flash-lite` (`OPENROUTER_MODEL`, overridable),
authenticated via `OPENROUTER_API_KEY`. It uses `urllib.request` from the
standard library - no HTTP/SDK dependency was added for this. The model is
given a strict system prompt that forbids it from answering, interpreting,
summarizing, or adding/removing information - it is only ever asked to
translate one string of text (either the incoming question into Arabic, or
the Arabic answer into the target language) and told to return nothing
else. Reasoning/thinking is explicitly disabled (`"reasoning": {"enabled":
false}`) since translation doesn't need it. The `Translator` protocol
decouples `i18n/service.py` from any specific provider, so swapping to a
different one later is a new class, not a rewrite. The API key is read
server-side only (`os.environ["OPENROUTER_API_KEY"]` inside
`i18n/translate.py`) - never hardcoded, logged, or sent to/read from the
browser; `voice_prototype/server.py` is the only HTTP-facing consumer and
it runs entirely server-side.

**Failure behavior:** if translation fails, `ask_multilingual` raises
`i18n.errors.TranslationError` rather than returning a fabricated or
wrong-language answer. Callers must handle this explicitly.

**Terminology QA:** `i18n/glossary.py::KEY_TERMS` lists the Hajj/Umrah
terms (الصفا، المروة، الطواف، السعي، الإحرام، الميقات، الشوط، التحلل،
طواف الإفاضة، طواف الوداع، الهدي، الفدية) that need human sign-off across
all 7 languages before production use - see
`tests/manual_terminology_check.md` and
`tests/manual_live_translation_check.py`. This is QA support, not an
automated translation-quality guarantee.

## Demo: voice + Sakina 3D map

Two servers run side by side; both stay on your machine, and the
OpenRouter API key never leaves the Python process.

```bash
# 1. Backend: translation + RAG, serves POST /ask on :8787.
#    Needs OPENROUTER_API_KEY in .env for non-Arabic languages (copy
#    .env.example -> .env and fill it in). Arabic works with no key at all.
py -3 voice_prototype/server.py

# 2. Frontend: Sakina's 3D Haram/journey map, in a second terminal.
cd sakina
npm install   # first time only
npm run dev   # prints the local URL, normally http://localhost:5173
```

Open the printed Sakina URL in a browser. The floating "سراج" button
(bottom of the map) opens the voice panel: pick a language, tap the mic
(or type a question and press Enter), and watch the map navigate when the
question resolves to a known location (e.g. "Where is Zamzam water?").
`voice_prototype/static/index.html` (served at `http://localhost:8787`,
opened automatically when the backend starts) is a second, standalone
voice UI over the same `/ask` endpoint, without the 3D map.

If the backend isn't running, the voice panel shows a clear "couldn't
reach Siraj" message instead of crashing; the rest of the map keeps
working normally.

## Tests

```bash
py -3 tests/test_tools.py    # tool-level tests
py -3 tests/test_agent.py    # router + end-to-end tests
py -3 tests/test_i18n.py     # multilingual adapter tests (offline, FakeTranslator)
```

`tests/manual_live_translation_check.py` and
`tests/manual_terminology_check.md` are manual, network-required checks -
never run as part of the automated suite above.

`test_agent.py` covers: a location question, a location-details question, a
lost-pilgrim/services question (verifying it does *not* also trigger the
locations category via the generic "أين"), a FAQ question (verifying
`authority`/`content_type` are preserved in the answer), a question needing
two categories at once, a question with no matching information at all
(verifying the fixed fallback message), and the FAQ false-positive-rejection
cases described below.

## Avoiding false-positive FAQ matches

FAQ questions share generic vocabulary ("الطواف", "الحج", "العمرة", ...)
far more than location/service names do, so a single overlapping keyword is
not reliable evidence that a retrieved FAQ actually answers the question.
`search_faq` (`tools/faq.py` -> `tools/_util.py::search`) therefore requires
either:

- the **whole normalized question matches as a phrase** inside a FAQ
  question/answer (a real, specific match), **or**
- **at least 2 distinct meaningful terms** (`config.FAQ_MIN_DISTINCT_TERMS`)
  from the question are found in the record.

A record with only one shared keyword and no phrase match is dropped
entirely rather than returned as a weak/unrelated hit - `search_faq` then
returns `[]` and `agent.agent.ask()` falls back to `NO_INFO_MESSAGE`. For
example, "نسيت شوطًا في الطواف، إيش أسوي؟" shares only "الطواف" with two
unrelated rows (one via the question text, one only via its category
label) and now correctly returns no result, instead of surfacing either
row. `search_locations`/`search_services` are unaffected - they keep the
original single-keyword threshold, since a lone strong keyword (e.g.
"زمزم") is normal and sufficient there.

## Design notes / limitations

- **No LLM, no embeddings, no vector DB, no external knowledge** - by
  design, per the scope of this prototype. All retrieval and routing is
  deterministic keyword/rule matching (`tools/_util.py`, `agent/agent.py`).
- **Grounding**: the answer is built exclusively from what the matched
  tools returned. `source_name`, `authority`, and `content_type` are always
  passed through unmodified from the dataset.
- **Not built here**: frontend, backend/API, auth, persistent database, 3D
  guide, maps, voice - all out of scope for this prototype.
- **Multilingual support is the one intentional exception** to "no
  external dependencies": `i18n/` calls OpenRouter (an external network
  service) for translation only, isolated from `agent/`/`tools/`. See
  "Multilingual support" above for the full trade-off (external network
  call and non-deterministic end-to-end behavior for non-Arabic languages,
  terminology QA still pending human sign-off).
