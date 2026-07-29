from open_webui.utils.request_features import (
    is_sessionless_native_web_search,
    restrict_builtin_tools,
    should_force_web_search,
    should_use_builtin_tools,
)


def test_legacy_browser_request_forces_web_search():
    assert should_force_web_search(
        {
            'session_id': 'browser-session',
            'params': {'function_calling': 'legacy'},
        }
    )


def test_ordinary_native_direct_request_retains_forced_web_search():
    assert should_force_web_search(
        {
            'params': {'function_calling': 'native'},
        }
    )


def test_explicit_native_direct_request_uses_only_web_search_builtins():
    metadata = {
        'params': {'function_calling': 'native'},
        'features': {
            'web_search': True,
            'web_search_mode': 'native',
        },
    }
    tools = {'search_web': 1, 'fetch_url': 2, 'search_chats': 3}

    assert is_sessionless_native_web_search(metadata)
    assert not should_force_web_search(metadata)
    assert should_use_builtin_tools(metadata)
    assert restrict_builtin_tools(metadata, tools) == {
        'search_web': 1,
        'fetch_url': 2,
    }


def test_native_browser_request_uses_builtin_web_search_tool():
    metadata = {
        'session_id': 'browser-session',
        'params': {'function_calling': 'native'},
    }
    tools = {'search_web': 1, 'search_chats': 2}

    assert not is_sessionless_native_web_search(metadata)
    assert not should_force_web_search(metadata)
    assert should_use_builtin_tools(metadata)
    assert restrict_builtin_tools(metadata, tools) == tools
