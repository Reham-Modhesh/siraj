"""Tool over dataset3_makkah_faq_fatawa.csv: search_faq.

Two very different kinds of rows live in this dataset - operational FAQs
from the Ministry of Hajj and Umrah, and religious fatwas from Islamweb's
Fatwa Center (a general Sunni reference, not a Saudi government body). Both
`authority` and `content_type` are always returned so the agent can tell
the difference and must not present one as the other.
"""

from functools import lru_cache

import config
from tools._util import load_csv, normalize, search

_SEARCH_FIELDS = ["question_ar", "answer_ar", "category"]

_PUBLIC_FIELDS = [
    "question_id",
    "question_ar",
    "answer_ar",
    "category",
    "authority",
    "content_type",
    "source_name",
    "source_url",
    "last_updated",
]


@lru_cache(maxsize=1)
def _load() -> list[dict]:
    return load_csv(config.FAQ_CSV)


def _project(record: dict) -> dict:
    return {k: record.get(k, "") for k in _PUBLIC_FIELDS}


def search_faq(query: str, category: str | None = None, limit: int = config.DEFAULT_SEARCH_LIMIT) -> list[dict]:
    """Keyword search over the FAQ / Fatwa dataset.

    Args:
        query: the pilgrim's free-text question (Arabic).
        category: optional exact/substring filter on `category`.
        limit: max number of matches to return.
    """
    records = _load()
    if category:
        norm_cat = normalize(category)
        records = [r for r in records if norm_cat in normalize(r.get("category", ""))]

    matches = search(
        records,
        query,
        _SEARCH_FIELDS,
        limit,
        config.MIN_MATCH_SCORE,
        min_distinct_terms=config.FAQ_MIN_DISTINCT_TERMS,
    )
    return [_project(r) for r in matches]
