"""Tools over dataset1_makkah_haram_locations.csv: search_locations and
get_location_details.
"""

from functools import lru_cache

import config
from tools._util import load_csv, normalize, search

_SEARCH_FIELDS = ["name_ar", "name_en", "category", "description"]

# Keys returned to the agent. Kept close to the raw dataset columns so
# source/authority information is never dropped or rewritten.
_PUBLIC_FIELDS = [
    "location_id",
    "name_ar",
    "name_en",
    "category",
    "latitude",
    "longitude",
    "floor",
    "description",
    "opening_hours",
    "accessibility",
    "reliability",
    "source_name",
    "source_url",
    "last_updated",
]


@lru_cache(maxsize=1)
def _load() -> list[dict]:
    return load_csv(config.LOCATIONS_CSV)


def _project(record: dict) -> dict:
    return {k: record.get(k, "") for k in _PUBLIC_FIELDS}


def search_locations(query: str, category: str | None = None, limit: int = config.DEFAULT_SEARCH_LIMIT) -> list[dict]:
    """Keyword search over Haram locations by name/category/description.

    Args:
        query: free-text question or keyword (Arabic or English).
        category: optional exact/substring filter on the `category` column.
        limit: max number of matches to return.
    """
    records = _load()
    if category:
        norm_cat = normalize(category)
        records = [r for r in records if norm_cat in normalize(r.get("category", ""))]

    matches = search(records, query, _SEARCH_FIELDS, limit, config.MIN_MATCH_SCORE)
    return [_project(r) for r in matches]


def get_location_details(location_id: str | None = None, name: str | None = None) -> dict | None:
    """Return the full record for one specific location.

    Args:
        location_id: exact dataset id, e.g. "MCH-CORE-003".
        name: Arabic or English name (exact or substring match) - used when
            location_id is not known.
    """
    records = _load()

    if location_id:
        for r in records:
            if r.get("location_id", "").strip().lower() == location_id.strip().lower():
                return _project(r)
        return None

    if name:
        norm_name = normalize(name)
        # Prefer an exact name match before falling back to substring.
        for r in records:
            if normalize(r.get("name_ar", "")) == norm_name or normalize(r.get("name_en", "")) == norm_name:
                return _project(r)
        best = search(records, name, ["name_ar", "name_en"], limit=1, min_score=config.MIN_MATCH_SCORE)
        return _project(best[0]) if best else None

    return None
