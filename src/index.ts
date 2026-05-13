interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Chainlist MCP — registry of EVM chains
 *
 * One JSON file lists every EVM chain with chainId, shortName, RPCs,
 * explorers, native currency, faucets. We cache the file per worker
 * isolate for 1 hour (the data updates slowly).
 *
 * Source: https://chainid.network/chains.json
 */


const CHAINS_URL = 'https://chainid.network/chains.json';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface Chain {
  name: string;
  chain: string;
  shortName: string;
  chainId: number;
  networkId?: number;
  nativeCurrency?: { name: string; symbol: string; decimals: number };
  rpc?: string[];
  explorers?: { name: string; url: string; standard?: string }[];
  faucets?: string[];
  infoURL?: string;
  status?: string; // active | deprecated | incubating
}

let CACHE: { chains: Chain[]; expires_at: number } | null = null;

const tools: McpToolExport['tools'] = [
  {
    name: 'list_chains',
    description: 'Browse or filter the EVM chain registry.',
    inputSchema: {
      type: 'object',
      properties: {
        testnet: { type: 'boolean', description: 'Include testnets only (true) / mainnets only (false). Default: all.' },
        name: { type: 'string', description: 'Case-insensitive substring filter on chain name' },
        active: { type: 'boolean', description: 'Restrict to active chains (default true — excludes deprecated)' },
      },
    },
  },
  {
    name: 'get_chain',
    description: 'Fetch a single chain by chainId (number) or shortName (e.g. "eth", "matic", "arb1").',
    inputSchema: {
      type: 'object',
      properties: {
        chain_id_or_short_name: { type: 'string', description: 'Chain id as string or shortName' },
      },
      required: ['chain_id_or_short_name'],
    },
  },
  {
    name: 'find_rpc',
    description: 'Return RPC endpoints for a chain. https_only=true filters out ws:// + http:// only.',
    inputSchema: {
      type: 'object',
      properties: {
        chain_id_or_short_name: { type: 'string' },
        https_only: { type: 'boolean', description: 'Default true' },
      },
      required: ['chain_id_or_short_name'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const chains = await getChains();
  switch (name) {
    case 'list_chains': {
      const wantTestnet = args.testnet as boolean | undefined;
      const nameFilter = (args.name as string | undefined)?.toLowerCase();
      const onlyActive = args.active !== false;
      const filtered = chains.filter((c) => {
        if (onlyActive && c.status && c.status !== 'active' && c.status !== 'incubating') return false;
        if (nameFilter && !c.name.toLowerCase().includes(nameFilter)) return false;
        if (wantTestnet !== undefined) {
          const looksTestnet = /testnet|sepolia|holesky|goerli|mumbai|fuji/i.test(c.name);
          if (wantTestnet && !looksTestnet) return false;
          if (!wantTestnet && looksTestnet) return false;
        }
        return true;
      });
      return {
        count: filtered.length,
        chains: filtered.map(summarize),
      };
    }
    case 'get_chain': {
      const id = reqStr(args, 'chain_id_or_short_name', '"eth"');
      const chain = findChain(chains, id);
      if (!chain) throw new Error(`Chainlist: no chain matching "${id}"`);
      return chain;
    }
    case 'find_rpc': {
      const id = reqStr(args, 'chain_id_or_short_name', '"eth"');
      const httpsOnly = args.https_only !== false;
      const chain = findChain(chains, id);
      if (!chain) throw new Error(`Chainlist: no chain matching "${id}"`);
      const rpcs = (chain.rpc ?? [])
        .map((r) => r.replace(/\$\{[^}]+\}/g, '')) // strip ${INFURA_API_KEY} placeholders
        .filter((r) => r && (!httpsOnly || r.startsWith('https://')));
      return { chain_id: chain.chainId, short_name: chain.shortName, rpcs };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function getChains(): Promise<Chain[]> {
  if (CACHE && CACHE.expires_at > Date.now()) return CACHE.chains;
  const res = await fetch(CHAINS_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Chainlist error: ${res.status} ${t.slice(0, 200)}`);
  }
  const chains = (await res.json()) as Chain[];
  CACHE = { chains, expires_at: Date.now() + CACHE_TTL_MS };
  return chains;
}

function findChain(chains: Chain[], id: string): Chain | undefined {
  const lower = id.toLowerCase();
  if (/^\d+$/.test(id)) {
    const n = Number(id);
    return chains.find((c) => c.chainId === n);
  }
  return chains.find((c) => c.shortName.toLowerCase() === lower);
}

function summarize(c: Chain) {
  return {
    chainId: c.chainId,
    name: c.name,
    shortName: c.shortName,
    nativeCurrency: c.nativeCurrency,
    rpc_count: c.rpc?.length ?? 0,
    explorers: c.explorers?.map((e) => e.url) ?? [],
    status: c.status ?? 'active',
  };
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
