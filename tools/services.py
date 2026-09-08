"""Tool over dataset2_makkah_lost_pilgrim_services.csv: search_services."""

from functools import lru_cache

import config
from tools._util import load_csv, normalize, search

_SEARCH_FIELDS = ["service_name_ar", "service_name_en", "service_type", "description", "location"]

_PUBLIC_FIELDS = [
    "service_id",
    "service_name_ar",
    "service_name_en",
    "location",
    "service_type",
    "description",
    "contact",
    "working_hours",
    "reliability",
    "source_name",
    "source_url",
    "last_updated",
]


@lru_cache(maxsize=1)
def _load() -> list[dict]:
    return load_csv(config.SERVICES_CSV)


def _project(record: dict) -> dict:
    return {k: record.get(k, "") for k in _PUBLIC_FIELDS}


def search_services(query: str, service_type: str | None = None, limit: int = config.DEFAULT_SEARCH_LIMIT) -> list[dict]:
    """Keyword search over lost-pilgrim / emergency assistance services.

    Args:
        query: free-text question or keyword (Arabic or English), e.g.
            "أين أجد خدمة لمساعدة التائهين؟" or "lost child".
        service_type: optional exact/substring filter on `service_type`.
        limit: max number of matches to return.
    """
    records = _load()
    if service_type:
        norm_type = normalize(service_type)
        records = [r for r in records if norm_type in normalize(r.get("service_type", ""))]

    matches = search(records, query, _SEARCH_FIELDS, limit, config.MIN_MATCH_SCORE)
    return [_project(r) for r in matches]
