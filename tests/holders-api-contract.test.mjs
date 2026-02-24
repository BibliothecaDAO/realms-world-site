import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const endpointPath = join(ROOT, "api", "holders.ts");

function readEndpoint() {
  return readFileSync(endpointPath, "utf8");
}

test("Holders API: endpoint file exists and exports a default handler", () => {
  assert.equal(
    existsSync(endpointPath),
    true,
    "Expected api/holders.ts to exist"
  );

  const source = readEndpoint();
  assert.match(
    source,
    /export\s+default\s+async\s+function\s+handler\s*\(/,
    "Expected api/holders.ts to export a default async handler"
  );
});

test("Holders API: response contract includes required top-level keys", () => {
  const source = readEndpoint();

  for (const key of [
    "token",
    "tokenSupply",
    "totals",
    "buckets",
    "topHolders",
    "partial",
    "errors",
    "updatedAt",
  ]) {
    assert.match(
      source,
      new RegExp(`\\b${key}\\b`),
      `Expected holders API payload to include '${key}'`
    );
  }
});

test("Holders API: server code does not read VITE-prefixed env vars", () => {
  const source = readEndpoint();

  assert.doesNotMatch(
    source,
    /process\.env\.VITE_[A-Z0-9_]+/,
    "Server endpoint must not read VITE_* env vars"
  );
  assert.doesNotMatch(
    source,
    /import\.meta\.env\.VITE_[A-Z0-9_]+/,
    "Server endpoint must not read import.meta.env.VITE_* vars"
  );
});
