export type HolderRow = {
  chain: "ethereum" | "starknet";
  address: string;
  balance: number;
  pctOfSupply: number;
  rank: number;
  labelType: "treasury" | "bridge" | "cex" | "contract" | "unknown";
};

export type HoldersApiResponse = {
  token: "LORDS";
  tokenSupply: number;
  totals: {
    combinedHolders: number;
    ethereumHolders: number;
    starknetHolders: number;
  };
  buckets: Array<{ label: string; count: number }>;
  topHolders: HolderRow[];
  partial: boolean;
  errors: string[];
  updatedAt: string;
};

export async function getHoldersMap(): Promise<HoldersApiResponse> {
  const response = await fetch("/api/holders");
  if (!response.ok) {
    throw new Error(`Failed to fetch holders map: ${response.status}`);
  }
  return (await response.json()) as HoldersApiResponse;
}
