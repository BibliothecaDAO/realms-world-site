import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

test("Holders map: query options include a dedicated holdersMap query", () => {
  const queryOptionsPath = "src/lib/query-options.ts";
  const queryOptions = read(queryOptionsPath);

  assert.match(
    queryOptions,
    /getHoldersMap/,
    "Expected query options to import getHoldersMap fetcher"
  );
  assert.match(
    queryOptions,
    /export const holdersMapQueryOptions = \(\) =>/,
    "Expected holdersMapQueryOptions helper"
  );
  assert.match(
    queryOptions,
    /queryKey:\s*\["holdersMap"\]/,
    "Expected dedicated holdersMap query cache key"
  );
});

test("Holders map: client fetcher exists and calls /api/holders", () => {
  const fetcherPath = join(ROOT, "src", "lib", "getHoldersMap.ts");
  assert.equal(
    existsSync(fetcherPath),
    true,
    "Expected src/lib/getHoldersMap.ts to exist"
  );

  const fetcher = read("src/lib/getHoldersMap.ts");
  assert.match(
    fetcher,
    /fetch\(["']\/api\/holders["']\)/,
    "Expected holders fetcher to call /api/holders"
  );
  assert.match(
    fetcher,
    /export async function getHoldersMap\(/,
    "Expected getHoldersMap export"
  );
});

test("Economics section: tokenomics UI includes holders map content", () => {
  const economics = read("src/components/sections/EconomicsSection.tsx");

  assert.match(
    economics,
    /holdersMapQueryOptions/,
    "Expected EconomicsSection to use holdersMapQueryOptions"
  );
  assert.match(
    economics,
    /Holders Map/,
    "Expected a Holders Map block heading"
  );
  assert.match(
    economics,
    /Cross-Chain Holders/,
    "Expected holders KPI for cross-chain total"
  );
  assert.match(
    economics,
    /Ethereum Holders/,
    "Expected holders KPI for Ethereum holders"
  );
  assert.match(
    economics,
    /Starknet Holders/,
    "Expected holders KPI for Starknet holders"
  );
  assert.match(
    economics,
    /Top Holders/,
    "Expected top holders list/table in tokenomics UI"
  );
});
