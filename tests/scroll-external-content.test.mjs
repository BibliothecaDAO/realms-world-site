import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generate } from "../scripts/generate-scroll-posts.mjs";

async function generateFixture({ type = "lore", externalUrl } = {}) {
  const root = mkdtempSync(join(tmpdir(), "scroll-content-"));
  try {
    mkdirSync(join(root, "content/scroll"), { recursive: true });
    writeFileSync(join(root, "content/scroll/2026-10-16-history.md"), `---
title: "A History of Lost Worlds"
excerpt: "Follow the four ages."
date: "2026-10-16"
type: ${JSON.stringify(type)}
author: "Realms World"
tags: ["lore"]
published: true
canonicalUrl: "https://example.com/canonical"
${externalUrl === undefined ? "" : `externalUrl: ${JSON.stringify(externalUrl)}`}
---
`);
    await generate(root);
    const generated = readFileSync(join(root, "src/generated/scroll-posts.ts"), "utf8");
    const json = generated.match(/export const scrollPosts: ScrollPost\[\] = ([\s\S]*);/)[1];
    return JSON.parse(json);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("Scroll generator preserves lore links separately from canonical metadata", async () => {
  for (const protocol of ["http", "https"]) {
    const destination = `${protocol}://example.com/history`;
    const posts = await generateFixture({ externalUrl: destination });
    assert.equal(posts.length, 1);
    assert.equal(posts[0].type, "lore");
    assert.equal(posts[0].externalUrl, destination);
    assert.equal(posts[0].canonicalUrl, "https://example.com/canonical");
    assert.equal(posts[0].html, "");
  }
});

test("Scroll generator keeps ordinary entries internal when externalUrl is absent", async () => {
  const posts = await generateFixture({ type: "update" });
  assert.equal(Object.hasOwn(posts[0], "externalUrl"), false);
});

test("Scroll generator rejects unsafe, relative, and malformed destinations", async () => {
  for (const externalUrl of ["javascript:alert(1)", "data:text/html,hello", "ftp://example.com/history", "/history", "not a URL"]) {
    await assert.rejects(generateFixture({ externalUrl }), /Invalid frontmatter.*externalUrl/);
  }
});

test("Scroll generator still rejects unknown entry types", async () => {
  await assert.rejects(generateFixture({ type: "unknown" }), /Invalid frontmatter.*type/);
});
