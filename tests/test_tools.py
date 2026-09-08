"""Standalone smoke tests for each tool, run directly (no pytest needed):

    py -3 tests/test_tools.py

Prints the records each tool returns so they can be eyeballed, and asserts
a few basic expectations about the datasets.
"""

import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from tools.faq import search_faq
from tools.locations import get_location_details, search_locations
from tools.services import search_services


def show(title: str, records) -> None:
    print(f"\n=== {title} ===")
    if not records:
        print("(no matches)")
        return
    if isinstance(records, list):
        for r in records:
            print(json.dumps(r, ensure_ascii=False))
    else:
        print(json.dumps(records, ensure_ascii=False, indent=2))


def test_search_locations():
    results = search_locations("أين مقام إبراهيم؟")
    show("search_locations('أين مقام إبراهيم؟')", results)
    ids = {r["location_id"] for r in results}
    assert "MCH-CORE-003" in ids, "expected Maqam Ibrahim in results"

    results_en = search_locations("Zamzam water")
    show("search_locations('Zamzam water')", results_en)
    assert results_en, "expected at least one Zamzam-related location"


def test_get_location_details():
    by_name = get_location_details(name="مقام إبراهيم")
    show("get_location_details(name='مقام إبراهيم')", by_name)
    assert by_name and by_name["location_id"] == "MCH-CORE-003"

    by_id = get_location_details(location_id="MCH-CORE-003")
    show("get_location_details(location_id='MCH-CORE-003')", by_id)
    assert by_id == by_name

    missing = get_location_details(location_id="NOT-A-REAL-ID")
    show("get_location_details(location_id='NOT-A-REAL-ID')", missing)
    assert missing is None


def test_search_services():
    results = search_services("أين أجد خدمة لمساعدة التائهين؟")
    show("search_services('أين أجد خدمة لمساعدة التائهين؟')", results)
    assert results, "expected at least one lost-pilgrim service"
    assert any("إرشاد التائهين" in r["service_name_ar"] for r in results)


def test_search_faq_known_answer():
    results = search_faq("هل يجوز للمرأة أداء الحج بدون محرم؟")
    show("search_faq('هل يجوز للمرأة أداء الحج بدون محرم؟')", results)
    ids = {r["question_id"] for r in results}
    assert "MCH-FAQ-002" in ids


def test_search_faq_no_false_positive_on_generic_keyword():
    # The dataset has no record about forgetting a tawaf circuit. Both
    # rows contain "الطواف" (one in the question, one only in its
    # category label), which used to be enough to falsely match before a
    # multi-term requirement was added to search_faq - a single shared
    # keyword must not be treated as sufficient evidence of relevance.
    results = search_faq("ماذا أفعل إذا نسيت شوطًا في الطواف؟")
    show("search_faq('ماذا أفعل إذا نسيت شوطًا في الطواف؟') [expect empty]", results)
    assert results == []

    results_colloquial = search_faq("نسيت شوطًا في الطواف، إيش أسوي؟")
    show("search_faq('نسيت شوطًا في الطواف، إيش أسوي؟') [expect empty]", results_colloquial)
    assert results_colloquial == []

    # A bare generic question built around the same single keyword should
    # not surface an unrelated FAQ either.
    results_generic = search_faq("ما هو الطواف؟")
    show("search_faq('ما هو الطواف؟') [expect empty]", results_generic)
    assert results_generic == []


if __name__ == "__main__":
    test_search_locations()
    test_get_location_details()
    test_search_services()
    test_search_faq_known_answer()
    test_search_faq_no_false_positive_on_generic_keyword()
    print("\nAll tool-level smoke tests passed.")
