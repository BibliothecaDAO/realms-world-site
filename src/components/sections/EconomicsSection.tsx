import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  holdersMapQueryOptions,
  lordsInfoQueryOptions,
  treasuryBalanceQueryOptions,
} from "@/lib/query-options";
import { useVelords } from "@/hooks/use-velords";
import { StarknetProvider } from "@/hooks/starknet-provider";
import { LORDS_TOTAL_SUPPLY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Coins,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { LordsFlywheel } from "@/components/ui/LordsFlywheel";

export function EconomicsSection() {
  return (
    <StarknetProvider>
      <EconomicsSectionContent />
    </StarknetProvider>
  );
}

function EconomicsSectionContent() {
  const { currentAPY, tokensThisWeek, lordsLocked, tvl } = useVelords();
  const { data: lordsInfo } = useQuery(lordsInfoQueryOptions());
  const { data: treasuryBalance } = useQuery(treasuryBalanceQueryOptions());
  const {
    data: holdersMap,
    isLoading: holdersMapLoading,
    isError: holdersMapError,
  } = useQuery(holdersMapQueryOptions());

  const treasuryLords = treasuryBalance?.LORDS.amount || 0;
  const treasuryPercentage = (
    (treasuryLords / LORDS_TOTAL_SUPPLY) *
    100
  ).toFixed(1);
  const marketPercentage = (100 - parseFloat(treasuryPercentage)).toFixed(1);

  const totalTreasuryBalance = treasuryBalance
    ? Object.values(treasuryBalance).reduce((sum, t) => sum + t.usdValue, 0)
    : 0;

  const treasuryData = [
    {
      name: "LORDS",
      value: treasuryBalance?.LORDS.usdValue ?? 0,
      amount: treasuryBalance?.LORDS.amount ?? 0,
      color: "bg-primary",
    },
    {
      name: "ETH + WETH",
      value:
        (treasuryBalance?.ETH.usdValue ?? 0) +
        (treasuryBalance?.WETH.usdValue ?? 0),
      amount:
        (treasuryBalance?.ETH.amount ?? 0) +
        (treasuryBalance?.WETH.amount ?? 0),
      color: "bg-blue-500",
    },
    {
      name: "STRK",
      value: treasuryBalance?.STRK.usdValue ?? 0,
      amount: treasuryBalance?.STRK.amount ?? 0,
      color: "bg-purple-500",
    },
    {
      name: "EKUBO",
      value: treasuryBalance?.EKUBO.usdValue ?? 0,
      amount: treasuryBalance?.EKUBO.amount ?? 0,
      color: "bg-cyan-500",
    },
    {
      name: "SURVIVOR",
      value: treasuryBalance?.SURVIVOR.usdValue ?? 0,
      amount: treasuryBalance?.SURVIVOR.amount ?? 0,
      color: "bg-red-500",
    },
    {
      name: "USDC",
      value: treasuryBalance?.USDC.usdValue ?? 0,
      amount: treasuryBalance?.USDC.amount ?? 0,
      color: "bg-green-500",
    },
  ].filter((asset) => asset.value > 0 || asset.amount > 0);

  const heroMetrics = [
    {
      label: "LORDS Price",
      value: lordsInfo?.price?.rate
        ? `$${parseFloat(lordsInfo.price.rate).toFixed(4)}`
        : "—",
      highlight: false,
    },
    {
      label: "Staking APY",
      value: currentAPY ? `${currentAPY.toFixed(1)}%` : "—",
      highlight: true,
    },
    {
      label: "Total Value Locked",
      value: tvl
        ? `$${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : "—",
      highlight: false,
    },
  ];

  const holdersKpis = [
    {
      label: "Cross-Chain Holders",
      value: holdersMapLoading
        ? "Syncing..."
        : holdersMap?.totals.combinedHolders.toLocaleString() ?? "—",
      sub: "Ethereum + Starknet",
    },
    {
      label: "Ethereum Holders",
      value: holdersMapLoading
        ? "Syncing..."
        : holdersMap?.totals.ethereumHolders.toLocaleString() ?? "—",
      sub: "Mainnet wallets",
    },
    {
      label: "Starknet Holders",
      value: holdersMapLoading
        ? "Syncing..."
        : holdersMap?.totals.starknetHolders.toLocaleString() ?? "—",
      sub: "L2 wallets",
    },
  ];

  const holdersBuckets = holdersMap?.buckets ?? [];
  const topHolders = holdersMap?.topHolders.slice(0, 6) ?? [];
  const maxBucketCount = Math.max(...holdersBuckets.map((bucket) => bucket.count), 1);

  const formatAddress = (address: string) =>
    address.length > 16 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address;

  return (
    <section className="realm-section container mx-auto px-4 py-16 md:py-24">
      <motion.div
        className="space-y-8 md:space-y-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto space-y-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <p className="realm-banner">Economics</p>
          <h2 className="realm-title text-3xl sm:text-4xl md:text-5xl">
            $LORDS Token & Treasury
          </h2>
          <p className="realm-subtitle text-base sm:text-lg">
            A liquid token model designed for gameplay economies, governance, and
            long-term ecosystem alignment.
          </p>
        </motion.div>

        {/* Hero Metrics */}
        <motion.div
          className="grid grid-cols-3 rounded-2xl border border-primary/20 bg-black/30 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {heroMetrics.map((metric, i) => (
            <div
              key={metric.label}
              className={`p-4 sm:p-6 md:p-8 text-center ${
                i > 0 ? "border-l border-primary/10" : ""
              }`}
            >
              <p className="realm-sigil mb-2">{metric.label}</p>
              <p
                className={`text-xl sm:text-2xl md:text-4xl font-bold tabular-nums tracking-tight ${
                  metric.highlight ? "text-primary" : "text-foreground/95"
                }`}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* LORDS Flywheel with embedded data */}
        <LordsFlywheel
          metrics={{
            weeklyRewards: tokensThisWeek
              ? `${tokensThisWeek.toLocaleString(undefined, { maximumFractionDigits: 0 })} LORDS`
              : undefined,
            lordsLocked: lordsLocked
              ? lordsLocked.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })
              : undefined,
            currentAPY: currentAPY
              ? `${currentAPY.toFixed(1)}%`
              : undefined,
          }}
        />

        {/* Token & Treasury — full width */}
        <motion.div
          className="realm-panel realm-edge-brackets rounded-2xl border border-primary/20 bg-black/30 backdrop-blur-sm p-5 sm:p-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left: Supply snapshot */}
            <div className="space-y-4">
              <h3 className="realm-banner">Token Supply</h3>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    {
                      label: "Total Supply",
                      value: "300M",
                      sub: "$LORDS",
                      icon: Coins,
                    },
                    {
                      label: "Treasury",
                      value:
                        treasuryLords > 0 ? `${treasuryPercentage}%` : "~40%",
                      sub: treasuryLords > 0 ? "Onchain" : "Estimated",
                      icon: Landmark,
                    },
                    {
                      label: "Circulating",
                      value:
                        treasuryLords > 0 ? `${marketPercentage}%` : "~60%",
                      sub: "Freely liquid",
                      icon: TrendingUp,
                    },
                  ] as const
                ).map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-primary/15 bg-black/40 p-3.5"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <item.icon className="h-3 w-3 text-primary/60" />
                      <p className="realm-sigil">{item.label}</p>
                    </div>
                    <p className="text-lg font-bold tabular-nums tracking-tight text-foreground/95">
                      {item.value}
                    </p>
                    <p className="text-[10px] text-foreground/60 mt-1">
                      {item.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Treasury composition */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="realm-banner">DAO Treasury</h3>
                <p className="text-xl font-bold text-primary tabular-nums">
                  {totalTreasuryBalance > 0
                    ? `$${(totalTreasuryBalance / 1_000_000).toFixed(2)}M`
                    : "—"}
                </p>
              </div>

              {/* Stacked bar */}
              <div className="space-y-3">
                <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden flex">
                  {treasuryData.map((asset) => {
                    const percentage =
                      totalTreasuryBalance > 0
                        ? (asset.value / totalTreasuryBalance) * 100
                        : 0;
                    return (
                      <motion.div
                        key={asset.name}
                        className={`h-full ${asset.color} first:rounded-l-full last:rounded-r-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {treasuryData.map((asset) => {
                    const percentage =
                      totalTreasuryBalance > 0
                        ? (asset.value / totalTreasuryBalance) * 100
                        : 0;
                    return (
                      <div
                        key={asset.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${asset.color}`}
                        />
                        <span className="font-medium text-foreground/75">
                          {asset.name}
                        </span>
                        <span className="tabular-nums text-foreground/50">
                          {asset.amount.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="font-bold tabular-nums text-foreground/70">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Holders map */}
        <motion.div
          className="realm-panel rounded-2xl border border-primary/20 bg-black/30 backdrop-blur-sm p-5 sm:p-6 space-y-5"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="realm-banner">Holders Map</h3>
              <p className="text-sm text-foreground/65 mt-1">
                Live cross-chain holder distribution across Ethereum and Starknet.
              </p>
            </div>
            <p className="text-xs text-foreground/50">
              {holdersMap?.updatedAt
                ? `Updated ${new Date(holdersMap.updatedAt).toLocaleString()}`
                : "Awaiting holder snapshot"}
            </p>
          </div>

          {holdersMap?.partial ? (
            <p className="rounded-lg border border-yellow-400/25 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
              Partial data: one chain provider is currently unavailable.
            </p>
          ) : null}
          {holdersMapError && !holdersMap ? (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              Holder data is temporarily unavailable. Retry shortly.
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {holdersKpis.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-primary/15 bg-black/40 p-3.5"
              >
                <p className="realm-sigil">{item.label}</p>
                <p className="mt-2 text-xl font-bold tabular-nums text-foreground/95">
                  {item.value}
                </p>
                <p className="mt-1 text-[10px] text-foreground/55 uppercase tracking-[0.14em]">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary/15 bg-black/35 p-4 space-y-3">
              <h4 className="realm-banner">Holder Buckets</h4>
              {holdersBuckets.length === 0 ? (
                <p className="text-sm text-foreground/55">No holder bucket data yet.</p>
              ) : (
                holdersBuckets.map((bucket) => {
                  const width = `${Math.max(
                    6,
                    Math.round((bucket.count / maxBucketCount) * 100)
                  )}%`;
                  return (
                    <div key={bucket.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/70">{bucket.label}</span>
                        <span className="tabular-nums text-foreground/55">
                          {bucket.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-primary/80" style={{ width }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="rounded-xl border border-primary/15 bg-black/35 p-4 space-y-3">
              <h4 className="realm-banner">Top Holders</h4>
              {topHolders.length === 0 ? (
                <p className="text-sm text-foreground/55">No top holder rows yet.</p>
              ) : (
                <div className="space-y-2">
                  {topHolders.map((holder) => (
                    <div
                      key={`${holder.chain}-${holder.address}`}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-primary/10 bg-black/25 px-3 py-2 text-xs"
                    >
                      <span className="rounded-full border border-primary/25 px-2 py-0.5 uppercase text-[10px] text-foreground/65">
                        {holder.chain}
                      </span>
                      <span className="font-mono text-foreground/75">
                        {formatAddress(holder.address)}
                      </span>
                      <span className="tabular-nums text-foreground/70">
                        {holder.pctOfSupply.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stake CTA Bar */}
        <motion.div
          className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div>
            <p className="text-lg sm:text-xl font-bold">
              Earn{" "}
              <span className="text-primary">
                {currentAPY ? `${currentAPY.toFixed(1)}%` : "—"}
              </span>{" "}
              APY
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              Lock LORDS as veLORDS — earn weekly protocol fees and vote on
              treasury allocation.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button size="lg" variant="war" asChild>
              <a
                href="https://staking.realms.world"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stake LORDS
              </a>
            </Button>
            <Button size="lg" variant="oath" asChild>
              <a
                href="https://snapshot.box/#/sn:0x07bd3419669f9f0cc8f19e9e2457089cdd4804a4c41a5729ee9c7fd02ab8ab62"
                target="_blank"
                rel="noopener noreferrer"
              >
                Governance
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
