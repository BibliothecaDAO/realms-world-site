interface TokenBalance {
  amount: number;
  usdValue: number;
}

export interface TokenTotals {
  LORDS: TokenBalance;
  WETH: TokenBalance;
  ETH: TokenBalance;
  USDC: TokenBalance;
  STRK: TokenBalance;
  EKUBO: TokenBalance;
  SURVIVOR: TokenBalance;
}

const EMPTY_TOTALS: TokenTotals = {
  LORDS: { amount: 0, usdValue: 0 },
  WETH: { amount: 0, usdValue: 0 },
  ETH: { amount: 0, usdValue: 0 },
  USDC: { amount: 0, usdValue: 0 },
  STRK: { amount: 0, usdValue: 0 },
  EKUBO: { amount: 0, usdValue: 0 },
  SURVIVOR: { amount: 0, usdValue: 0 },
};

export async function getTreasuryBalance(): Promise<TokenTotals> {
  try {
    const response = await fetch("/api/treasury-balance");
    if (!response.ok) {
      return EMPTY_TOTALS;
    }
    return (await response.json()) as TokenTotals;
  } catch {
    return EMPTY_TOTALS;
  }
}
