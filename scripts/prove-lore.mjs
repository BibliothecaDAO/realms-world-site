import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { generate } from "./generate-scroll-posts.mjs";

const output = resolve(process.env.LORE_PROOF_DIR ?? "artifacts/lore-proof");
const chapters = [
  ["blitz", "The struggle for what remained"],
  ["frontier", "The last lights of the world"],
  ["eternum", "The return to greatness"],
  ["dominion", "The first adventurer"],
];
const results = [];
let browser;
let server;

try {
  await mkdir(output, { recursive: true });
  await generate(process.cwd());
  server = await createServer({ server: { host: "127.0.0.1", port: 0, open: false } });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true });

  for (const [name, viewport, reducedMotion] of [
    ["desktop", { width: 1440, height: 1000 }, "no-preference"],
    ["mobile", { width: 390, height: 844 }, "reduce"],
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion });
    await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      const response = await page.goto(`${origin}/scroll`);
      assert.equal(response.status(), 200);
      await page.getByRole("link", { name: /A History of Lost Worlds/ }).first().click();
      await page.waitForURL("**/scroll/history-of-lost-worlds");
      assert.equal(await page.locator(".lore-chronicle h1").textContent(), "A History of Lost Worlds");
      await page.evaluate(() => document.fonts.ready);
      const fonts = await page.evaluate(() => [...document.fonts]
        .filter((font) => ["Exo 2 Local", "Cinzel Local", "IM Fell English SC", "Realms Titling"].includes(font.family.replaceAll('"', "")))
        .filter((font) => font.status === "loaded")
        .map((font) => font.family.replaceAll('"', "")));
      for (const family of ["Exo 2 Local", "Cinzel Local", "IM Fell English SC", "Realms Titling"]) {
        assert.ok(fonts.includes(family), `${family} must load without Google Fonts`);
      }
      await page.screenshot({ path: resolve(output, `${name}-hero.png`) });

      await page.getByRole("link", { name: "Enter the chronicle" }).click();
      await page.waitForFunction(() => document.activeElement?.id === "story");
      assert.equal(new URL(page.url()).hash, "#story");

      for (const [id, title] of chapters) {
        await page.locator(`.age-index a[href="#${id}"]`).click();
        await page.waitForFunction((chapter) => {
          const target = document.getElementById(chapter);
          const header = document.querySelector(".lore-chronicle .topbar");
          return document.activeElement === target &&
            Math.abs(target.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 16) < 3;
        }, id);
        assert.equal(await page.locator(`#${id} h2`).textContent(), title);
        assert.equal(await page.locator(`.age-index a[href="#${id}"]`).getAttribute("aria-current"), "location");
        assert.ok((await page.locator(`#${id} .prose`).innerText()).length > 300);
        await page.locator(`#${id}`).screenshot({ path: resolve(output, `${name}-${id}.png`) });

        if (id !== "dominion") {
          const artwork = page.locator(`#${id} .art-open`);
          await artwork.press("Enter");
          await page.waitForFunction(() => document.querySelector(".art-dialog")?.open);
          assert.equal(await page.locator("#art-title").textContent(), id[0].toUpperCase() + id.slice(1));
          await page.waitForFunction(() => {
            const image = document.querySelector(".dialog-image");
            return image.complete && image.naturalWidth > 0;
          });
          assert.equal(await page.locator(".art-close").evaluate((el) => el === document.activeElement), true);
          await page.keyboard.press("Escape");
          await page.waitForFunction(() => !document.querySelector(".art-dialog")?.open);
          assert.equal(await artwork.evaluate((el) => el === document.activeElement), true);
        }
      }

      for (const title of ["Story and gameplay", "Questions the world has not answered"]) {
        const summary = page.locator("summary").filter({ hasText: title });
        await summary.press("Enter");
        assert.equal(await summary.evaluate((el) => el.parentElement.open), true);
      }
      await page.getByRole("link", { name: "The world", exact: true }).click();
      await page.waitForFunction(() => {
        const notes = document.getElementById("notes");
        const header = document.querySelector(".lore-chronicle .topbar");
        return Math.abs(notes.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 16) < 3;
      });
      await page.locator("#notes").screenshot({ path: resolve(output, `${name}-notes.png`) });
      await writeFile(resolve(output, `${name}-transcript.txt`), await page.locator(".lore-chronicle main").innerText());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Page overflows horizontally");

      await page.goto(`${origin}/scroll/history-of-lost-worlds#frontier`);
      await page.waitForFunction(() => {
        const target = document.getElementById("frontier");
        const header = document.querySelector(".lore-chronicle .topbar");
        return target && header && Math.abs(target.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 16) < 3;
      });
      await page.goto(`${origin}/scroll/history-of-lost-worlds`);
      await page.locator(".lore-chronicle h1").waitFor();
      await page.keyboard.press("Tab");
      assert.equal(await page.locator(".skip").evaluate((el) => el === document.activeElement), true);
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.activeElement?.id === "story");
      if (name === "mobile") {
        for (const size of [{ width: 320, height: 700 }, { width: 390, height: 600 }]) {
          await page.setViewportSize(size);
          await page.goto(`${origin}/scroll/history-of-lost-worlds`);
          await page.locator(".lore-chronicle h1").waitFor();
          await page.evaluate(() => document.fonts.ready);
          const layout = await page.evaluate(() => {
            const copy = document.querySelector(".hero-copy").getBoundingClientRect();
            const footer = document.querySelector(".hero-bottom").getBoundingClientRect();
            const hero = document.querySelector(".hero").getBoundingClientRect();
            return {
              overflow: document.documentElement.scrollWidth > window.innerWidth,
              clipped: copy.top < hero.top || copy.bottom > footer.top,
            };
          });
          assert.deepEqual(layout, { overflow: false, clipped: false }, `Hero must fit at ${size.width}×${size.height}`);
          await page.screenshot({ path: resolve(output, `mobile-${size.width}x${size.height}-hero.png`) });
        }
      }
      assert.deepEqual(errors, [], "Browser runtime errors");
      results.push({ name, viewport, reducedMotion, fonts, result: "passed" });
    } finally {
      await context.close();
    }
  }
  await writeFile(resolve(output, "result.json"), JSON.stringify(results, null, 2));
  console.log(`Lore proof passed on desktop and mobile. Evidence: ${output}`);
} finally {
  await browser?.close();
  await server?.close();
}
