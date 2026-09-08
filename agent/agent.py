"""Deterministic, rule-based tool router for Siraj's Mock RAG prototype.

No LLM is used anywhere in this module (or anywhere in the project). A
fixed set of Arabic keyword rules decides which tool(s) to call for a
given question; the tools then do plain keyword search over the trusted
CSV datasets (see tools/_util.py); and the final answer is built entirely
by formatting exactly what the tools returned - nothing is generated,
inferred, or invented beyond that.

Flow: user question -> route() picks tool categories by keyword match ->
the matching tools search the datasets -> ask() formats the returned
records into a plain-text answer, or returns a fixed "not found" message
if nothing relevant turned up.
"""

from tools._util import normalize
from tools.faq import search_faq
from tools.locations import get_location_details, search_locations
from tools.services import search_services

NO_INFO_MESSAGE = "لم نجد إجابة موثوقة لهذا السؤال ضمن المصادر المتاحة."

# Trigger words for "give me the full details of this place" - when present
# alongside a locations match, get_location_details is used instead of the
# raw search_locations results.
_DETAIL_MARKERS = ["تفاصيل", "معلومات عن", "معلومات كاملة", "معلومات كامله"]

# Keyword lists are deliberately specific (real place names / dataset
# vocabulary) rather than generic interrogatives like "أين" - a generic
# "where" word appears in location AND service questions alike (e.g. "أين
# أجد خدمة للتائهين؟"), so routing on it would blur the two categories.
_LOCATION_KEYWORDS = [
    "موقع", "بوابة", "ابواب", "باب", "مقام", "المطاف", "الكعبة", "الحجر الاسود",
    "المسعى", "الصفا", "المروة", "زمزم", "مصلى", "مصعد", "احداثيات", "خريطة",
    "ممر", "مدخل", "مخرج", "دورة مياه", "دورات مياه",
]

_SERVICE_KEYWORDS = [
    "تائه", "ضاع", "ضايع", "فقدان", "فقدت", "مفقود", "مفقودات", "طوارئ",
    "اسعاف", "الهلال الاحمر", "شرطة", "دفاع مدني", "بلاغ", "ارشاد التائه",
    "ضيوف الرحمن", "حادث", "نجدة",
]

_FAQ_KEYWORDS = [
    "حكم", "فتوى", "يجوز", "نسك", "الحج", "العمرة", "شرط", "واجب", "ركن",
    "محظور", "تصريح", "تسجيل", "حجز", "تأشيرة", "تاشيرة", "هدي", "اضحية",
    "أضحية", "ميقات", "احرام", "إحرام", "الطواف", "شوط", "محرم", "تطبيق نسك",
]

_CATEGORY_KEYWORDS = {
    "locations": _LOCATION_KEYWORDS,
    "services": _SERVICE_KEYWORDS,
    "faq": _FAQ_KEYWORDS,
}


def _count_hits(normalized_query: str, keywords: list[str]) -> int:
    return sum(1 for kw in keywords if normalize(kw) in normalized_query)


def route(question: str) -> list[str]:
    """Return the tool categories ("locations"/"services"/"faq") whose
    keywords matched the question, via plain substring/keyword rules - no
    model, no scoring beyond a simple keyword count. Empty list means no
    rule matched anything."""
    q = normalize(question)
    return [name for name, keywords in _CATEGORY_KEYWORDS.items() if _count_hits(q, keywords) > 0]


def _wants_details(question: str) -> bool:
    q = normalize(question)
    return any(normalize(marker) in q for marker in _DETAIL_MARKERS)


def _format_location(r: dict) -> str:
    title = r["name_ar"] + (f" ({r['name_en']})" if r.get("name_en") else "")
    lines = [title]
    if r.get("floor"):
        lines.append(f"الموقع داخل الحرم: {r['floor']}")
    if r.get("description"):
        lines.append(r["description"])
    if r.get("opening_hours"):
        lines.append(f"أوقات العمل: {r['opening_hours']}")
    if r.get("accessibility"):
        lines.append(f"إمكانية الوصول: {r['accessibility']}")
    if r.get("source_name"):
        lines.append(f"المصدر: {r['source_name']}")
    if r.get("reliability"):
        lines.append(f"الموثوقية: {r['reliability']}")
    return "\n".join(lines)


def _format_service(r: dict) -> str:
    title = r["service_name_ar"] + (f" ({r['service_name_en']})" if r.get("service_name_en") else "")
    lines = [title]
    if r.get("location"):
        lines.append(f"الموقع: {r['location']}")
    if r.get("description"):
        lines.append(r["description"])
    if r.get("contact"):
        lines.append(f"التواصل: {r['contact']}")
    if r.get("working_hours"):
        lines.append(f"أوقات العمل: {r['working_hours']}")
    if r.get("source_name"):
        lines.append(f"المصدر: {r['source_name']}")
    if r.get("reliability"):
        lines.append(f"الموثوقية: {r['reliability']}")
    return "\n".join(lines)


def _format_faq(r: dict) -> str:
    lines = [r["question_ar"], r["answer_ar"]]
    lines.append(f"النوع: {r.get('content_type', '')}")
    lines.append(f"الجهة: {r.get('authority', '')}")
    lines.append(f"المصدر: {r.get('source_name', '')}")
    return "\n".join(lines)


def _format_location_details(r: dict) -> str:
    return _format_location(r)


def ask(question: str, verbose: bool = False) -> dict:
    """Run the deterministic tool-routing pipeline for one question.

    Returns {"answer": str, "categories": [...], "tool_calls": [{"tool", "input", "result"}]}.
    The answer is built solely from what the tools returned; if routing
    finds no matching category, or every matched tool comes back empty,
    the fixed NO_INFO_MESSAGE is returned instead of guessing.
    """
    categories = route(question)
    tool_calls = []
    answer_blocks = []

    if verbose:
        print(f"[route] question -> categories={categories}")

    if "locations" in categories:
        results = search_locations(question)
        tool_calls.append({"tool": "search_locations", "input": {"query": question}, "result": results})

        if _wants_details(question) and results:
            top = results[0]
            detail = get_location_details(location_id=top["location_id"])
            tool_calls.append(
                {"tool": "get_location_details", "input": {"location_id": top["location_id"]}, "result": detail}
            )
            if detail:
                answer_blocks.append(_format_location_details(detail))
        else:
            answer_blocks.extend(_format_location(r) for r in results)

    if "services" in categories:
        results = search_services(question)
        tool_calls.append({"tool": "search_services", "input": {"query": question}, "result": results})
        answer_blocks.extend(_format_service(r) for r in results)

    if "faq" in categories:
        results = search_faq(question)
        tool_calls.append({"tool": "search_faq", "input": {"query": question}, "result": results})
        answer_blocks.extend(_format_faq(r) for r in results)

    if verbose:
        for call in tool_calls:
            count = len(call["result"]) if isinstance(call["result"], list) else (1 if call["result"] else 0)
            print(f"[tool_call] {call['tool']}({call['input']}) -> {count} result(s)")

    if not answer_blocks:
        return {"answer": NO_INFO_MESSAGE, "categories": categories, "tool_calls": tool_calls}

    return {"answer": "\n\n".join(answer_blocks), "categories": categories, "tool_calls": tool_calls}
