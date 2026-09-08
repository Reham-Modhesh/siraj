"""Lightweight tests of the deterministic tool router in agent/agent.py.

No LLM, no API key, no network - run directly:

    py -3 tests/test_agent.py

Covers: a location question, a lost-pilgrim/services question, a FAQ
question, a question with no matching information in any dataset, and the
FAQ false-positive-rejection cases (a question that only shares one
generic keyword with unrelated FAQ rows must fall back to NO_INFO_MESSAGE
rather than return them).
"""

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from agent.agent import NO_INFO_MESSAGE, ask


def run(label: str, question: str) -> dict:
    print("\n" + "=" * 70)
    print(f"[{label}] Q: {question}")
    result = ask(question, verbose=True)

    print("\n--- retrieved records ---")
    for call in result["tool_calls"]:
        print(f"tool: {call['tool']}  input: {call['input']}  -> {call['result']}")

    print("\n--- final answer ---")
    print(result["answer"])
    return result


def test_location_question():
    result = run("location question", "أين مقام إبراهيم؟")
    assert result["categories"] == ["locations"]
    search_call = next(c for c in result["tool_calls"] if c["tool"] == "search_locations")
    assert any(r["location_id"] == "MCH-CORE-003" for r in search_call["result"])
    assert "مقام إبراهيم" in result["answer"]


def test_location_details_question():
    result = run("location details question", "أعطني تفاصيل مقام إبراهيم")
    assert result["categories"] == ["locations"]
    assert any(call["tool"] == "get_location_details" for call in result["tool_calls"])
    assert "مقام إبراهيم" in result["answer"]


def test_lost_pilgrim_question():
    result = run("lost pilgrim / services question", "أين أجد خدمة لمساعدة التائهين؟")
    assert result["categories"] == ["services"]
    assert "locations" not in result["categories"], "should not also trigger locations on generic 'أين'"
    assert "إرشاد التائهين" in result["answer"]


def test_faq_question():
    result = run("faq/ritual question", "هل يجوز للمرأة أداء الحج بدون محرم؟")
    assert result["categories"] == ["faq"]
    assert "وزارة الحج والعمرة" in result["answer"]
    assert "سؤال شائع تشغيلي" in result["answer"]  # content_type is preserved


def test_multi_tool_question():
    result = run("multi-tool question", "أين مقام إبراهيم، وهل يجوز للمرأة أداء الحج بدون محرم؟")
    assert set(result["categories"]) == {"locations", "faq"}


def test_no_matching_information():
    # Nonsense/unrelated question - no routing keyword should match at all.
    result = run("no matching information", "ما هو لون سيارتك المفضل؟")
    assert result["categories"] == []
    assert result["answer"] == NO_INFO_MESSAGE


def test_routed_but_no_real_answer():
    # The router still matches the FAQ category (via "الطواف"/"شوط"), but
    # search_faq's multi-term requirement rejects the resulting single
    # generic-keyword hits, so the final answer must fall back to
    # NO_INFO_MESSAGE instead of surfacing an unrelated FAQ.
    result = run("routed but no real answer (formal)", "ماذا أفعل إذا نسيت شوطًا في الطواف؟")
    assert "faq" in result["categories"]
    assert result["answer"] == NO_INFO_MESSAGE

    # Same underlying question, colloquial phrasing.
    result2 = run("routed but no real answer (colloquial)", "نسيت شوطًا في الطواف، إيش أسوي؟")
    assert "faq" in result2["categories"]
    assert result2["answer"] == NO_INFO_MESSAGE


def test_generic_keyword_does_not_return_unrelated_faq():
    # A bare question built around one generic ritual keyword should not
    # return whichever FAQ happens to mention that word.
    result = run("generic single-keyword question", "ما هو الطواف؟")
    assert "faq" in result["categories"]
    assert result["answer"] == NO_INFO_MESSAGE


if __name__ == "__main__":
    test_location_question()
    test_location_details_question()
    test_lost_pilgrim_question()
    test_faq_question()
    test_multi_tool_question()
    test_no_matching_information()
    test_routed_but_no_real_answer()
    test_generic_keyword_does_not_return_unrelated_faq()
    print("\nAll agent routing tests passed.")
