import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generate } from "../scripts/generate-scroll-posts.mjs";

test("Published lore resolves to the native history route with a bundled cover", async () => {
  const root = await mkdtemp(join(tmpdir(), "scroll-lore-"));
  const filename = "2026-10-16-history-of-lost-worlds.md";
  try {
    await mkdir(join(root, "content/scroll"), { recursive: true });
    await copyFile(join("content/scroll", filename), join(root, "content/scroll", filename));
    await generate(root);
    const module = await readFile(join(root, "src/generated/scroll-posts.ts"), "utf8");
    const [post] = JSON.parse(module.match(/export const scrollPosts: ScrollPost\[\] = ([\s\S]*);/)[1]);
    assert.equal(post.slug, "history-of-lost-worlds");
    assert.equal(post.title, "A History of Lost Worlds");
    assert.equal(post.type, "lore");
    assert.equal(post.published, true);
    assert.equal(Object.hasOwn(post, "externalUrl"), false);
    assert.match(post.coverImage, /^\/lore\/history-of-lost-worlds\//);
    await access(join("public", post.coverImage));
    await access(join("src/routes/scroll", `${post.slug}.tsx`));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
