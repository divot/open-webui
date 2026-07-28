from open_webui.utils.request_features import should_force_web_search


def test_legacy_browser_request_forces_web_search():
    assert should_force_web_search(
        {
            'session_id': 'browser-session',
            'params': {'function_calling': 'legacy'},
        }
    )


def test_native_direct_request_forces_web_search():
    assert should_force_web_search(
        {
            'params': {'function_calling': 'native'},
        }
    )


def test_native_browser_request_uses_builtin_web_search_tool():
    assert not should_force_web_search(
        {
            'session_id': 'browser-session',
            'params': {'function_calling': 'native'},
        }
    )
