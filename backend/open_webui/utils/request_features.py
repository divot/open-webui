from collections.abc import Mapping
from typing import Any

_SESSIONLESS_NATIVE_WEB_SEARCH_TOOLS = frozenset({'search_web', 'fetch_url'})


def is_sessionless_native_web_search(metadata: Mapping[str, Any]) -> bool:
    """Return whether a direct caller explicitly requested native web search."""
    if metadata.get('session_id'):
        return False

    params = metadata.get('params')
    features = metadata.get('features')
    return (
        isinstance(params, Mapping)
        and params.get('function_calling') == 'native'
        and isinstance(features, Mapping)
        and features.get('web_search') is True
        and features.get('web_search_mode') == 'native'
    )


def should_force_web_search(metadata: Mapping[str, Any]) -> bool:
    """Return whether web search must run before the provider request."""
    params = metadata.get('params')
    function_calling = params.get('function_calling') if isinstance(params, Mapping) else None
    return function_calling == 'legacy' or (
        not metadata.get('session_id') and not is_sessionless_native_web_search(metadata)
    )


def should_use_builtin_tools(metadata: Mapping[str, Any]) -> bool:
    """Return whether native builtin tools are allowed for this request."""
    return bool(metadata.get('session_id')) or is_sessionless_native_web_search(metadata)


def restrict_builtin_tools(
    metadata: Mapping[str, Any],
    tools: Mapping[str, Any],
) -> dict[str, Any]:
    """Limit explicit sessionless native search to its requested builtins."""
    if not is_sessionless_native_web_search(metadata):
        return dict(tools)
    return {name: tool for name, tool in tools.items() if name in _SESSIONLESS_NATIVE_WEB_SEARCH_TOOLS}
