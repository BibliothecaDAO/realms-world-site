type HolderRow = {
  chain: "ethereum" | "starknet";
  address: string;
  balance: number;
  pctOfSupply: number;
  rank: number;
  labelType: "treasury" | "bridge" | "cex" | "contract" | "unknown";
};

type HoldersApiResponse = {
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

const LORDS_TOTAL_SUPPLY = 300_000_000;

function createStubPayload(): HoldersApiResponse {
  return {
    token: "LORDS",
    tokenSupply: LORDS_TOTAL_SUPPLY,
    totals: {
      combinedHolders: 0,
      ethereumHolders: 0,
      starknetHolders: 0,
    },
    buckets: [
      { label: "<100", count: 0 },
      { label: "100-1k", count: 0 },
      { label: "1k-10k", count: 0 },
      { label: "10k+", count: 0 },
    ],
    topHolders: [],
    partial: false,
    errors: [],
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
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

  const payload = createStubPayload();
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
    },
  });
}
