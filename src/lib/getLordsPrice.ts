export interface EthplorerToken {
  address: string;
  decimals: string;
  symbol: string;
  name: string;
  price?: {
    rate: string;
    diff7d?: string;
    marketCapUsd?: string;
    volume24h?: string;
  };
}

const FALLBACK_LORDS_INFO: EthplorerToken = {
  address: "0x686f2404e77ab0d9070a46cdfb0b7fecdd2318b0",
  decimals: "18",
  symbol: "LORDS",
  name: "LORDS",
};

export async function getLordsInfo(): Promise<EthplorerToken> {
  try {
    const response = await fetch("/api/lords-info");
    if (!response.ok) {
      return FALLBACK_LORDS_INFO;
    }
    const data = (await response.json()) as EthplorerToken;
    return data;
  } catch {
    return FALLBACK_LORDS_INFO;
  }
}
