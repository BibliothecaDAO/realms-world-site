import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const topBar = readFileSync(new URL("../src/components/layout/TopBar.tsx", import.meta.url), "utf8");
const intro = readFileSync(new URL("../src/components/sections/IntroSection.tsx", import.meta.url), "utf8");

test("desktop and mobile navigation no longer link to the marketplace", () => {
  assert.equal(/market\.realms\.world|Marketplace/.test(topBar), false);
});

test("hero links to Realm inventory while retaining three balanced actions", () => {
  assert.equal(/market\.realms\.world|Browse Marketplace/.test(intro), false);
  assert.equal(
    /<a href="https:\/\/account\.realms\.world\/realms" target="_blank" rel="noopener noreferrer">\s*View Your Realms\s*<\/a>/.test(intro),
    true,
  );
  assert.match(intro, /grid-cols-1 gap-3 sm:grid-cols-3/);
  assert.match(intro, /<Link to="\/games">Explore Games<\/Link>/);
  assert.match(intro, /href="https:\/\/account\.realms\.world\/velords"[^>]*>\s*Stake veLORDS/);
});
