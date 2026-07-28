from collections.abc import Mapping
from typing import Any


def should_force_web_search(metadata: Mapping[str, Any]) -> bool:
    """Return whether web search must run before the provider request."""
    params = metadata.get('params')
    function_calling = (
        params.get('function_calling') if isinstance(params, Mapping) else None
    )
    return function_calling == 'legacy' or not metadata.get('session_id')
