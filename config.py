"""Central configuration for the Siraj Mock RAG prototype.

Paths point at the raw CSV datasets (never modified in place). There is no
LLM configuration here by design: retrieval and tool routing are fully
deterministic (see agent/agent.py and tools/_util.py).
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "raw"

LOCATIONS_CSV = DATA_DIR / "dataset1_makkah_haram_locations.csv"
SERVICES_CSV = DATA_DIR / "dataset2_makkah_lost_pilgrim_services.csv"
FAQ_CSV = DATA_DIR / "dataset3_makkah_faq_fatawa.csv"

# How many rows a search_* tool returns by default.
DEFAULT_SEARCH_LIMIT = 5

# Minimum keyword-overlap score below which a match is not returned at all.
MIN_MATCH_SCORE = 1

# search_faq requires at least this many distinct matching terms (unless
# the query matches a whole FAQ question/answer as a phrase) before a
# record counts as a real match. FAQ questions share generic vocabulary
# (e.g. "الطواف", "الحج") much more than location/service names do, so a
# single overlapping keyword there is not reliable evidence of relevance.
FAQ_MIN_DISTINCT_TERMS = 2
