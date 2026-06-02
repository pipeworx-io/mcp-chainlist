# mcp-chainlist

Chainlist MCP — registry of EVM chains

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_chains` | Browse or filter the EVM chain registry. |
| `get_chain` | Fetch a single chain by chainId (number) or shortName (e.g. "eth", "matic", "arb1"). |
| `find_rpc` | Return RPC endpoints for a chain. https_only=true filters out ws:// + http:// only. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "chainlist": {
      "url": "https://gateway.pipeworx.io/chainlist/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Chainlist data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
