import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

test("CI compat: lint script uses a non-stylish formatter", () => {
  const pkg = JSON.parse(read("package.json"));
  const lintScript = pkg?.scripts?.lint ?? "";

  assert.match(
    lintScript,
    /--format\s+json|--format=json/,
    "Expected lint script to use a formatter that does not depend on util.styleText"
  );
});

test("CI compat: hex explorer keyboard handler avoids useless null assignment", () => {
  const source = read("src/components/hex-explorer/useHexExplorerInput.ts");

  assert.doesNotMatch(
    source,
    /let\s+dir:\s*HexDirection\s*\|\s*null\s*=\s*null\s*;/,
    "Expected no-useless-assignment-safe dir declaration in keyboard handler"
  );
});
