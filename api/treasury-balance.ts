interface EthplorerAddressInfoResponse {
  ETH?: {
    price?: {
      rate?: string;
      ts?: number;
    };
    rawBalance?: string;
  };
  address?: string;
  error?: {
    code: number;
    message: string;
  };
  tokens?: EthplorerToken[];
}

interface EthplorerToken {
  tokenInfo: {
    address: string;
    decimals: string;
    symbol: string;
    name: string;
    price?: {
      rate?: string;
    };
  };
  balance: number;
  rawBalance: string;
}

interface TokenBalance {
  amount: number;
  usdValue: number;
}

interface TokenTotals {
  LORDS: TokenBalance;
  WETH: TokenBalance;
  ETH: TokenBalance;
  USDC: TokenBalance;
  STRK: TokenBalance;
  EKUBO: TokenBalance;
  SURVIVOR: TokenBalance;
}

const STARKNET_RPC = "https://api.cartridge.gg/x/starknet/mainnet";
const STARKNET_DAO_WALLET =
  "0x049FB4281D13E1f5f488540Cd051e1507149E99CC2E22635101041Ec5E4e4557";

const STARKNET_TOKENS: Record<
  string,
  { address: string; decimals: number; coingeckoId: string }
> = {
  LORDS: {
    address: "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49",
    decimals: 18,
    coingeckoId: "lords",
  },
  ETH: {
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
    coingeckoId: "ethereum",
  },
  STRK: {
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
    coingeckoId: "starknet",
  },
  EKUBO: {
    address: "0x075afe6402ad5a5c20dd25e10ec3b3986acaa647b77e4ae24b0cbc9a54a27a87",
    decimals: 18,
    coingeckoId: "ekubo-protocol",
  },
  SURVIVOR: {
    address: "0x042dd777885ad2c116be96d4d634abc90a26a790ffb5871e037dd5ae7d2ec86b",
    decimals: 18,
    coingeckoId: "survivor-2",
  },
};

const BALANCE_OF_SELECTOR =
  "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e";

const DAO_ADDRESSES = [
  "0xA8e6EFaf015D424c626Cf3C23546Fcb3BD2C9f1a",
  "0x439d859B391c38160227AEB5636Df52da789CFC1",
  "0xBbae2e00bcc495913546Dfaf0997Fb18BF0F20fe",
  "0xf92A1536Fec97360F674C15e557Ff60a2DBFbcDc",
];

function methodNotAllowed() {
  return new Response(
    JSON.stringify({
      error: "Method Not Allowed",
      allowed: ["GET"],
    }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Allow: "GET",
      },
    }
  );
}

async function fetchStarknetBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<bigint> {
  const res = await fetch(STARKNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "starknet_call",
      params: [
        {
          contract_address: tokenAddress,
          entry_point_selector: BALANCE_OF_SELECTOR,
          calldata: [walletAddress],
        },
        "latest",
      ],
      id: 1,
    }),
  });

  const data = await res.json();
  if (data.error || !data.result?.length) return 0n;

  const low = BigInt(data.result[0] || "0");
  const high = BigInt(data.result[1] || "0");
  return low + (high << 128n);
}

async function getStarknetPrices(): Promise<Record<string, number>> {
  const ids = [...new Set(Object.values(STARKNET_TOKENS).map((t) => t.coingeckoId))].join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  );
  const data = await res.json();

  const prices: Record<string, number> = {};
  for (const [symbol, config] of Object.entries(STARKNET_TOKENS)) {
    prices[symbol] = data[config.coingeckoId]?.usd ?? 0;
  }
  return prices;
}

async function fetchEthplorerAddressInfo(
  address: string,
  apiKey: string
): Promise<EthplorerAddressInfoResponse | null> {
  const url = `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=${apiKey}&chainId=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as EthplorerAddressInfoResponse;
}

function mergeEthplorerData(
  totals: TokenTotals,
  ethData: Array<EthplorerAddressInfoResponse | null>
) {
  for (const account of ethData) {
    if (!account || account.error) continue;

    const ethAmount = parseFloat(account.ETH?.rawBalance || "0") / 1e18;
    const ethUsdValue = ethAmount * parseFloat(account.ETH?.price?.rate || "0");
    totals.ETH.amount += ethAmount;
    totals.ETH.usdValue += ethUsdValue;

    account.tokens?.forEach((token) => {
      const symbol = token.tokenInfo.symbol;
      const decimals = parseInt(token.tokenInfo.decimals, 10);
      const balance = parseFloat(token.rawBalance || "0") / Math.pow(10, decimals);
      const usdValue = balance * parseFloat(token.tokenInfo.price?.rate || "0");

      if (symbol in totals && symbol !== "ETH") {
        const key = symbol as keyof TokenTotals;
        totals[key].amount += balance;
        totals[key].usdValue += usdValue;
      }
    });
  }
}

async function mergeStarknetData(totals: TokenTotals) {
  const [prices, ...balances] = await Promise.all([
    getStarknetPrices(),
    ...Object.entries(STARKNET_TOKENS).map(async ([symbol, config]) => {
      const raw = await fetchStarknetBalance(config.address, STARKNET_DAO_WALLET);
      const amount = Number(raw) / Math.pow(10, config.decimals);
      return { symbol, amount };
    }),
  ]);

  for (const { symbol, amount } of balances) {
    if (symbol in totals) {
      const key = symbol as keyof TokenTotals;
      totals[key].amount += amount;
      totals[key].usdValue += amount * (prices[symbol] ?? 0);
    }
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  const totals: TokenTotals = {
    LORDS: { amount: 0, usdValue: 0 },
    WETH: { amount: 0, usdValue: 0 },
    ETH: { amount: 0, usdValue: 0 },
    USDC: { amount: 0, usdValue: 0 },
    STRK: { amount: 0, usdValue: 0 },
    EKUBO: { amount: 0, usdValue: 0 },
    SURVIVOR: { amount: 0, usdValue: 0 },
  };
  const apiKey = process.env.ETHPLORER_APIKEY;

  const ethPromise = apiKey
    ? Promise.all(DAO_ADDRESSES.map((address) => fetchEthplorerAddressInfo(address, apiKey)))
    : Promise.resolve([]);

  const [ethResult, starknetResult] = await Promise.allSettled([
    ethPromise,
    mergeStarknetData(totals),
  ]);

  if (ethResult.status === "fulfilled") {
    mergeEthplorerData(totals, ethResult.value);
  }

  if (starknetResult.status === "rejected") {
    // Keep ETH-only values if Starknet providers are temporarily unavailable.
  }

  return new Response(JSON.stringify(totals), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
