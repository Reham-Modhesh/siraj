"""Terminology QA support - NOT a translation engine.

deep-translator has no glossary/terminology-enforcement hook, so this list
is not applied automatically anywhere in the translation pipeline. It
exists so a human reviewer can systematically check that these
Hajj/Umrah-specific terms come back correctly across all 7 supported
languages before the multilingual feature is trusted in production - see
tests/manual_terminology_check.md and
tests/manual_live_translation_check.py, which both consume this list.

Do not invent or assume translations for these terms; verify with a
qualified/native speaker per language.
"""

KEY_TERMS: list[str] = [
    "الصفا",
    "المروة",
    "الطواف",
    "السعي",
    "الإحرام",
    "الميقات",
    "الشوط",
    "التحلل",
    "طواف الإفاضة",
    "طواف الوداع",
    "الهدي",
    "الفدية",
]
