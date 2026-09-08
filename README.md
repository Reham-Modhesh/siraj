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

config.py               paths, search tuning
tests/
  test_tools.py         tool-level tests
  test_agent.py          router/end-to-end tests
```

No `llm/` directory and no LLM/provider dependency exist in this project -
`agent/agent.py` imports only `tools/*` and the Python standard library.

## Datasets

| File | Rows | Key columns | Notes |
|---|---|---|---|
| `dataset1_makkah_haram_locations.csv` | 50 | `location_id, name_ar, name_en, category, latitude, longitude, floor, description, opening_hours, accessibility, reliability, source_name, source_url, last_updated` | `latitude`/`longitude` are empty for 47/50 rows (most sources don't give coordinates) - do not assume every location is mappable yet. `reliability` is a free-text confidence note from data collection, not a dataset guarantee. |
| `dataset2_makkah_lost_pilgrim_services.csv` | 16 | `service_id, service_name_ar, service_name_en, location, service_type, description, contact, working_hours, reliability, source_name, source_url, last_updated` | No missing values. Includes both dedicated lost-pilgrim services and general emergency numbers (112/999/997/998). |
| `dataset3_makkah_faq_fatawa.csv` | 37 | `question_id, question_ar, answer_ar, category, authority, content_type, source_name, source_url, last_updated` | Two distinct `authority` values mixed in one file: the Ministry of Hajj and Umrah (operational FAQs, `content_type` = "سؤال شائع تشغيلي") and Islamweb's Fatwa Center (religious rulings, `content_type` = "فتوى شرعية محكّمة ..."), a general Sunni reference and **not** a Saudi government body. Both `authority` and `content_type` are always preserved in the formatted answer so the two are never blurred. |

## Setup

No external dependencies - standard library only.

```bash
py -3 tests/test_tools.py
py -3 tests/test_agent.py
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

## Tests

```bash
py -3 tests/test_tools.py    # tool-level tests
py -3 tests/test_agent.py    # router + end-to-end tests
```

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
