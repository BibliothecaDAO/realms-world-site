import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

test("LORDS price client fetcher uses internal API route (no direct Ethplorer call)", () => {
  const source = read("src/lib/getLordsPrice.ts");

  assert.match(
    source,
    /fetch\(["']\/api\/lords-info["']\)/,
    "Expected getLordsInfo to fetch via /api/lords-info"
  );
  assert.doesNotMatch(
    source,
    /api\.ethplorer\.io/,
    "Client fetcher should not call Ethplorer directly"
  );
  assert.doesNotMatch(
    source,
    /VITE_ETHPLORER_APIKEY/,
    "Client fetcher should not read VITE_ETHPLORER_APIKEY"
  );
});

test("Treasury client fetcher uses internal API route (no direct Ethplorer call)", () => {
  const source = read("src/lib/getTreasuryBalance.ts");

  assert.match(
    source,
    /fetch\(["']\/api\/treasury-balance["']\)/,
    "Expected getTreasuryBalance to fetch via /api/treasury-balance"
  );
  assert.doesNotMatch(
    source,
    /api\.ethplorer\.io/,
    "Client treasury fetcher should not call Ethplorer directly"
  );
  assert.doesNotMatch(
    source,
    /VITE_ETHPLORER_APIKEY/,
    "Client treasury fetcher should not read VITE_ETHPLORER_APIKEY"
  );
});

test("Server API endpoints exist for Ethplorer-backed data", () => {
  const lordsInfoPath = join(ROOT, "api", "lords-info.ts");
  const treasuryPath = join(ROOT, "api", "treasury-balance.ts");

  assert.equal(
    existsSync(lordsInfoPath),
    true,
    "Expected api/lords-info.ts to exist"
  );
  assert.equal(
    existsSync(treasuryPath),
    true,
    "Expected api/treasury-balance.ts to exist"
  );

  const lordsInfoSource = read("api/lords-info.ts");
  const treasurySource = read("api/treasury-balance.ts");

  assert.match(
    lordsInfoSource,
    /process\.env\.ETHPLORER_APIKEY/,
    "Expected server route to read ETHPLORER_APIKEY from process.env"
  );
  assert.match(
    treasurySource,
    /process\.env\.ETHPLORER_APIKEY/,
    "Expected treasury server route to read ETHPLORER_APIKEY from process.env"
  );
});
