"""Domain-level errors for the i18n adapter layer."""


class TranslationError(Exception):
    """Raised when a translation provider fails or is unreachable.

    Carries an internal, developer-facing message (the original
    provider/network error is chained via `raise ... from exc`). Callers
    must not paper over this with a fabricated or wrong-language answer -
    see i18n/service.py::ask_multilingual for the defined failure
    contract.
    """
