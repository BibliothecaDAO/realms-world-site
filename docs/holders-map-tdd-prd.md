# PRD: Cross-Chain Holders Map (ETH + Starknet) - TDD Plan

## 1. Document Control
- Product: `realms-world-site`
- Owner: Product + Frontend Engineering
- Date: February 24, 2026
- Status: Draft (Ready for implementation)
- Branch: `ponderingdemocritus/holders-map-scope`

## 2. Problem Statement
We need a live holders map for `$LORDS` that reflects token ownership across Ethereum mainnet and Starknet mainnet.

Today, the site has token price and treasury panels, but no holder-distribution visibility. This creates a trust and transparency gap for users evaluating ecosystem depth.

## 3. Goals
1. Display a unified cross-chain holders view on the landing site.
2. Show chain split (ETH vs Starknet), top holders, and distribution buckets.
3. Keep provider API keys server-only.
4. Ship with a strict TDD workflow (test fails first, then minimal implementation).

## 4. Non-Goals
1. Wallet identity resolution across chains.
2. Geographic map of holders (onchain addresses are not geo-attributed).
3. Full historical indexer in v1.
4. Real-time streaming updates.

## 5. Product Scope (v1)

### 5.1 User-Facing
1. New "Holders Map" block under economics surfaces:
   - Total holders (cross-chain sum)
   - ETH holders
   - Starknet holders
   - Top holders list (chain, short address, balance, % supply)
   - Distribution buckets (e.g. `<100`, `100-1k`, `1k-10k`, `10k+`)
2. Loading and degraded states:
   - Loading skeleton
   - Partial-data warning if one chain provider fails
   - Hard-failure fallback copy if both fail

### 5.2 Backend/API
1. Add server endpoint: `GET /api/holders`
2. Endpoint responsibilities:
   - Fetch holder data from ETH + Starknet providers
   - Normalize to a shared schema
   - Compute aggregates and buckets
   - Return cache-friendly response with `updatedAt`

## 6. Technical Approach

### 6.1 Runtime + Hosting
1. Server: Vercel Serverless Function (`api/holders.ts`).
2. Client fetches only `/api/holders`.
3. No provider keys in browser-exposed `VITE_*` vars.

### 6.2 Data Providers
1. Ethereum: Etherscan token holder endpoints (preferred), Ethplorer as fallback path.
2. Starknet: Voyager token holder endpoint (preferred), replaceable provider adapter if contract/API changes.

### 6.3 Normalized Response Contract
```ts
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
  updatedAt: string; // ISO
};
```

### 6.4 Caching + Reliability
1. Endpoint cache headers target: 5-15 minute edge cache.
2. In-function timeout per upstream call.
3. Partial-success behavior:
   - If one chain fails, return other chain + `partial: true`.
   - If both fail, return `5xx` with stable error payload.

## 7. TDD Delivery Plan

## 7.1 Rule
`NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`

### 7.2 Slice A: API Contract (RED -> GREEN -> REFACTOR)
1. RED tests:
   - `tests/holders-api-contract.test.mjs`
   - Assert endpoint file exists, exports default handler, and returns required keys in schema.
   - Assert no `VITE_` env keys are read inside server handler.
2. GREEN implementation:
   - Add `api/holders.ts` with minimal valid payload and status `200`.
3. REFACTOR:
   - Extract response types/helpers to `src/lib/holders-map/types.ts`.

### 7.3 Slice B: Normalization + Aggregation
1. RED tests:
   - `tests/holders-normalization.test.mjs`
   - Assert ETH and Starknet raw rows map to canonical `HolderRow`.
   - Assert `combinedHolders`, chain totals, and bucket counts are correct.
   - Assert deterministic sort by `balance desc`.
2. GREEN implementation:
   - Add pure functions in `src/lib/holders-map/normalize.ts`.
3. REFACTOR:
   - Move bucket thresholds to constants and add focused helper tests.

### 7.4 Slice C: Partial Failure Behavior
1. RED tests:
   - `tests/holders-partial-failure.test.mjs`
   - Assert one-provider failure returns `200`, `partial: true`, and includes error message.
   - Assert both-provider failure returns `502`/`503`.
2. GREEN implementation:
   - Wrap providers in `Promise.allSettled` and apply fallback rules.
3. REFACTOR:
   - Centralize error mapping and logging format.

### 7.5 Slice D: React Query Integration
1. RED tests:
   - `tests/holders-query-options.test.mjs`
   - Assert new query key exists and stale/cache timings are defined.
2. GREEN implementation:
   - Add fetcher in `src/lib/getHoldersMap.ts`.
   - Add query options in `src/lib/query-options.ts`.
3. REFACTOR:
   - Reuse shared fetch helpers and narrow response typing.

### 7.6 Slice E: UI Section Integration
1. RED tests:
   - `tests/holders-section.test.mjs`
   - Assert economics/home section renders holders labels/cards/chart hooks.
   - Assert loading and partial-state copy exists.
2. GREEN implementation:
   - Add `src/components/sections/HoldersMapSection.tsx`.
   - Insert in [src/components/sections/EconomicsSection.tsx](/Users/os/conductor/workspaces/realms-world-site/louisville-v2/src/components/sections/EconomicsSection.tsx) or homepage route flow.
3. REFACTOR:
   - Extract presentation subcomponents (`HoldersKpis`, `HoldersTable`, `HoldersBuckets`).

## 8. Test Execution Gates
For each slice:
1. Run the new targeted test file and confirm fail.
2. Implement minimal code.
3. Re-run targeted file and confirm pass.
4. Run full checks:
   - `pnpm lint`
   - `pnpm build`
   - `node --test tests/*.test.mjs` (or targeted changed tests if full sweep is too heavy)

## 9. Acceptance Criteria
1. `/api/holders` returns normalized ETH+Starknet payload with `updatedAt`.
2. Holders UI block renders chain counts, top holders, and buckets.
3. One-chain outage still returns partial data and visible warning state.
4. No provider secrets exposed to client bundle.
5. All newly added tests pass, with each slice verified in RED then GREEN order.

## 10. Risks and Mitigations
1. Provider schema drift or rate limits.
   - Mitigation: provider adapters + graceful partial responses.
2. Misleading holder interpretation (contracts/bridges/CEX wallets).
   - Mitigation: explicit `labelType` and UI copy disclaimers.
3. Slow upstream APIs.
   - Mitigation: cache headers + request timeouts + fallback behavior.

## 11. Open Questions
1. Final source of truth for Starknet holder endpoint (Voyager vs internal indexer adapter)?
2. How many top holders should be shown by default (`10` vs `25`)?
3. Should treasury/known ecosystem addresses be excluded from "market holders" metrics or only labeled?
4. Should v1 ship only inside `EconomicsSection`, or also as a standalone route (`/holders`)?
