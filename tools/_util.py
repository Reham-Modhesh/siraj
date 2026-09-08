"""Shared CSV loading and Arabic/English keyword-matching helpers.

The three datasets are small (<100 rows each), so a simple keyword-overlap
score over normalized text is enough for this prototype - no embeddings or
vector search needed.
"""

import csv
import re

# Arabic letter variants that should collapse to one form for matching, e.g.
# "إبراهيم" / "ابراهيم" / "أبراهيم" all query the same way.
_ALEF_VARIANTS = re.compile("[آأإا]")  # آ أ إ ا -> ا
_TASHKEEL = re.compile("[ً-ٰٟۖ-ۭ]")  # diacritics/tatweel marks
_TATWEEL = re.compile("ـ")
_PUNCT = re.compile(r"[^\w\s]", re.UNICODE)

# Common function words that carry no search signal on their own. Without
# filtering these, a query like "ماذا أفعل إذا نسيت شوطًا؟" would spuriously
# match any record containing "إذا" or "في", masking genuine no-match cases.
_STOPWORDS = {
    "من", "في", "على", "الى", "إلى", "عن", "ما", "ماذا", "هل", "ان", "أن", "إن",
    "لا", "لم", "لن", "كان", "هذا", "هذه", "ذلك", "التي", "الذي", "او", "أو",
    "ثم", "قد", "كل", "بعد", "قبل", "عند", "حتي", "حتى", "لو", "لكن", "غير",
    "بين", "حول", "فوق", "تحت", "انا", "أنا", "هو", "هي", "هم", "انت", "أنت",
    "انتم", "نحن", "سوف", "يكون", "تكون", "افعل", "أفعل", "اذا", "إذا", "يا",
    "the", "a", "an", "is", "are", "in", "on", "at", "of", "to", "and", "or",
    "what", "where", "how", "do", "does", "i", "my", "for", "with",
}


def normalize(text: str) -> str:
    """Lowercase + fold Arabic letter variants so substring matching works
    regardless of hamza/alef spelling, diacritics, or punctuation."""
    if not text:
        return ""
    text = text.strip().lower()
    text = _TASHKEEL.sub("", text)
    text = _TATWEEL.sub("", text)
    text = _ALEF_VARIANTS.sub("ا", text)
    text = text.replace("ى", "ي").replace("ة", "ه")  # ى->ي, ة->ه
    text = _PUNCT.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text: str) -> list[str]:
    return [t for t in normalize(text).split(" ") if len(t) >= 2 and t not in _STOPWORDS]


def load_csv(path) -> list[dict]:
    with open(path, encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def score_record(query: str, record: dict, fields: list[str]) -> tuple[int, int, bool]:
    """Keyword-overlap score of `query` against the given fields of `record`.

    Returns (score, distinct_term_hits, phrase_match):
    - phrase_match: the whole normalized query appears as a substring
      (handles exact or near-exact matches like "مقام إبراهيم"); contributes
      +10 to `score`.
    - distinct_term_hits: how many distinct query tokens (>=2 chars, not a
      stopword) were found in the record; each contributes +1 to `score`.

    `score` alone ranks matches; callers that need to reject a record on a
    single incidental keyword (see `search(min_distinct_terms=...)`) should
    use `distinct_term_hits` and `phrase_match` directly, since a high
    `score` can still come from just one very common token.
    """
    haystack = normalize(" ".join(str(record.get(f, "")) for f in fields))
    norm_query = normalize(query)
    if not norm_query or not haystack:
        return 0, 0, False

    phrase_match = norm_query in haystack
    hits = {token for token in tokenize(query) if token in haystack}
    score = (10 if phrase_match else 0) + len(hits)

    return score, len(hits), phrase_match


def search(
    records: list[dict],
    query: str,
    fields: list[str],
    limit: int,
    min_score: int,
    min_distinct_terms: int = 1,
):
    """Rank `records` by `score_record` and return the top `limit`.

    `min_distinct_terms` guards against a single generic/overlapping
    keyword being treated as sufficient evidence: a record is only kept if
    it either matches the whole query as a phrase (a real, specific match)
    or has at least `min_distinct_terms` distinct query tokens in it. This
    matters most for search_faq, where two unrelated questions can easily
    share one common word (e.g. "الطواف") without actually being related.
    """
    scored = []
    for record in records:
        score, hits, phrase_match = score_record(query, record, fields)
        if score < min_score:
            continue
        if not phrase_match and hits < min_distinct_terms:
            continue
        scored.append((score, record))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [r for _, r in scored[:limit]]
