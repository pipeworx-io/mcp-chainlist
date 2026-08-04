# @pipeworx/chainlist

Chainlist MCP — registry of EVM chains with RPC URLs, chain IDs, native currency, explorers, faucets. Sourced from chainid.network. No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `list_chains(testnet?, name?)` — browse / search the chain list
- `get_chain(chain_id_or_short_name)` — full chain record by chainId or shortName
- `find_rpc(chain_id_or_short_name, https_only?)` — RPC URLs for a given chain

## Data source

`https://chainid.network/chains.json` — community-maintained list (also mirrored at chainlist.org).

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

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

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
