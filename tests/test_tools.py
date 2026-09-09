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


def test_search_faq_generic_modal_verb_is_not_enough_evidence():
    # Found via a live multilingual test (Urdu -> Arabic): "متى يجب ارتداء
    # الإحرام؟" (when must Ihram be worn?) used to match MCH-FTW-003 (why
    # someone doing Umrah after Hajj must exit to Tan'im) - a completely
    # different question - because {"يجب", "الإحرام"} cleared the 2-term
    # threshold. "يجب" (must/should) recurs in nearly every ruling
    # regardless of topic, so it's now a stopword and doesn't count as a
    # meaningful term on its own.
    results = search_faq("متى يجب ارتداء الإحرام؟")
    show("search_faq('متى يجب ارتداء الإحرام؟') [expect empty]", results)
    assert results == []


def test_search_faq_finds_ritual_term_without_definite_article():
    # "طواف الإفاضة" (Tawaf al-Ifadah) is defined (as one of Hajj's
    # pillars) in MCH-FTW-001's answer text, but the word appears without
    # the definite article "ال" - confirms the FAQ tool itself can find it
    # via plain substring matching (the routing-layer fix that makes
    # agent.agent actually call search_faq for such questions is tested in
    # tests/test_agent.py).
    results = search_faq("ما هو طواف الإفاضة؟")
    show("search_faq('ما هو طواف الإفاضة؟')", results)
    ids = {r["question_id"] for r in results}
    assert "MCH-FTW-001" in ids


def test_search_faq_no_false_positive_on_generic_count_question():
    # The dataset has no record stating how many rounds Sa'i has.
    # MCH-FAQ-019 ("كم عدد المرافقين المسموح بتسجيلهم معًا؟" - an unrelated
    # question about companion registration limits) used to match via the
    # generic {"كم", "عدد"} ("how many"/"number") pair, which recurs across
    # unrelated operational FAQs - now stopworded, same rationale as "يجب".
    results = search_faq("كم عدد أشواط السعي؟")
    show("search_faq('كم عدد أشواط السعي؟') [expect empty]", results)
    assert results == []


def test_search_faq_tangential_mention_is_not_enough_for_a_location_question():
    # MCH-FTW-001 mentions "الميقات" once, in passing, while listing Hajj
    # obligations - it never states where a Miqat actually is. That single
    # topical word is not enough distinct-term evidence, so this correctly
    # stays empty rather than answering a "where" question with a record
    # that isn't about location at all.
    results = search_faq("أين الميقات؟")
    show("search_faq('أين الميقات؟') [expect empty]", results)
    assert results == []


if __name__ == "__main__":
    test_search_locations()
    test_get_location_details()
    test_search_services()
    test_search_faq_known_answer()
    test_search_faq_no_false_positive_on_generic_keyword()
    test_search_faq_generic_modal_verb_is_not_enough_evidence()
    test_search_faq_finds_ritual_term_without_definite_article()
    test_search_faq_no_false_positive_on_generic_count_question()
    test_search_faq_tangential_mention_is_not_enough_for_a_location_question()
    print("\nAll tool-level smoke tests passed.")
