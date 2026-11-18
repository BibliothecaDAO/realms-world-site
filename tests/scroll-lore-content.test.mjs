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

test("Each of the four Aspect cards shows its four Orders, crest and name", async () => {
  const html = await readFile("src/components/lore/history-of-lost-worlds.html", "utf8");
  const lists = [...html.matchAll(/<ul class="orders"[^>]*>([\s\S]*?)<\/ul>/g)].map(([, list]) =>
    [...list.matchAll(/<li><img src="([^"]+)"[^>]*><b>([^<]+)<\/b><\/li>/g)].map(([, src, name]) => [src, name])
  );
  const names = lists.map((list) => list.map(([, name]) => name));

  assert.deepEqual(names, [
    ["Perfection", "Protection", "Enlightenment", "Brilliance"],
    ["Fury", "Rage", "Vitriol", "Anger"],
    ["Power", "Giants", "Titans", "Skill"],
    ["The Twins", "Reflection", "The Fox", "Detection"],
  ]);
  for (const [src] of lists.flat()) {
    assert.match(src, /^\/lore\/history-of-lost-worlds\/orders\/[a-z]+\.webp$/);
    await access(join("public", src));
  }
});
