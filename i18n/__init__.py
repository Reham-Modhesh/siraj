"""Multilingual adapter layer around Siraj's Arabic-only deterministic
engine (agent/agent.py, tools/*).

Nothing in agent/ or tools/ imports from this package, and this package
never modifies their behavior - it only translates questions in and
answers out. See i18n/service.py for the entry point (ask_multilingual).
"""
