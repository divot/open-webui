import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

from open_webui.utils.mcp.client import MCPClient


def make_client_with_tool(input_schema: dict) -> MCPClient:
    client = MCPClient()
    client.session = AsyncMock()
    client.session.list_tools.return_value = SimpleNamespace(
        tools=[
            SimpleNamespace(
                name='HassTurnOff',
                description='Turns off a device or entity.',
                inputSchema=input_schema,
                outputSchema=None,
            )
        ]
    )
    return client


def test_list_tool_specs_omits_strict_by_default_and_preserves_schema():
    async def run_test():
        input_schema = {
            'type': 'object',
            'properties': {'name': {'type': 'string'}},
        }
        client = make_client_with_tool(input_schema)

        specs = await client.list_tool_specs()

        assert specs == [
            {
                'name': 'HassTurnOff',
                'description': 'Turns off a device or entity.',
                'parameters': input_schema,
            }
        ]

    asyncio.run(run_test())


def test_list_tool_specs_applies_explicit_strict_modes():
    async def run_test():
        input_schema = {
            'type': 'object',
            'properties': {'name': {'type': 'string'}},
        }

        false_specs = await make_client_with_tool(input_schema).list_tool_specs(strict=False)
        true_specs = await make_client_with_tool(input_schema).list_tool_specs(strict=True)

        assert false_specs[0]['strict'] is False
        assert true_specs[0]['strict'] is True

    asyncio.run(run_test())


def test_list_tool_specs_ignores_non_boolean_strict_values():
    async def run_test():
        client = make_client_with_tool({'type': 'object', 'properties': {}})

        specs = await client.list_tool_specs(strict='false')

        assert 'strict' not in specs[0]

    asyncio.run(run_test())


def test_call_tool_forwards_arguments_unchanged():
    async def run_test():
        client = MCPClient()
        client.session = AsyncMock()
        client.session.call_tool.return_value = SimpleNamespace(
            isError=False,
            model_dump=lambda mode: {'content': [{'type': 'text', 'text': 'ok'}]},
        )
        arguments = {'name': 'Main'}

        result = await client.call_tool('HassTurnOff', arguments)

        client.session.call_tool.assert_awaited_once_with('HassTurnOff', arguments)
        assert result == [{'type': 'text', 'text': 'ok'}]

    asyncio.run(run_test())
