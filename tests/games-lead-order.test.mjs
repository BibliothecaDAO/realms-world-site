import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createElement } from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { createServer } from "vite";
import { generate } from "../scripts/generate-scroll-posts.mjs";
import { games, gameStatusText, pickGames } from "../src/data/games.ts";

const ROOT = process.cwd();
const APP_ENTRY = "virtual:site-render-test-app";
const FRONTIER_LABEL = "Season 0 - November 3-6, 2026";
const FRONTIER_ART = "/games/frontier/settlement-at-dawn.webp";
const BLITZ_ART = "/games/blitz/soldiers-in-rain.webp";
const ETERNUM_ART = "/games/realms-eternum/alpine-war-council.webp";
const FRONTIER_BLURB =
  "Frontier is a free-to-play, PvE roguelite strategy game in which players explore the world, fight beasts, capture resources to upgrade their Realm, and recover $LORDS from ancient ruins. All actions are fully onchain and verifiable, and top-ranked players receive an additional $LORDS prize at the end of the season.";
const FRONTIER_DETAIL =
  "Each player starts with their Realm as a basic settlement and must construct various buildings to establish a steady supply of wheat, labor, and troops. Troops are deployed to explore the map, find additional labor and Essence for construction and upgrades, fight beasts, gain experience, and secure $LORDS. Beware the mist, however. At the end of each in-game day, the mist (and whatever lurks within) consumes and resets the map, wiping out all armies. Realms retain their buildings and upgrades, so strategic and committed players can get a little further each day. Eventually, players can master the mist and access the calamitous alternate reality choking the world, uncovering even greater rewards.";
const TAKEN_DOWN_SLUG = "eternum-agent-first-design";

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

let vite;
let cacheDir;
const pages = {};
let takenDownRoute;
let homeLive;
let gamesLive;
let reorderSlugs = false;
const blitzFirst = {};

// Renders a route through the app's real router, loaders and components.
async function loadRoute(path, app) {
  const router = app.createRouter({
    routeTree: app.routeTree,
    context: { queryClient: app.queryClient },
    history: app.createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return router;
}

async function renderRoute(path, app) {
  const router = await loadRoute(path, app);
  return renderTree(createElement(app.RouterProvider, { router }), app, path);
}

async function renderTree(element, app, name) {
  const errors = [];
  const { prelude } = await prerenderToNodeStream(
    createElement(app.QueryClientProvider, { client: app.queryClient }, element),
    {
      // Without this, React moves large sections to the end of the document.
      progressiveChunkSize: Infinity,
      onError: (error) => {
        errors.push(error);
      },
    }
  );
  let html = "";
  for await (const chunk of prelude) html += chunk;

  assert.deepEqual(errors, [], `Expected ${name} to render without errors`);
  assert.doesNotMatch(html, /<template id="B:/, `Expected no unfinished section on ${name}`);
  return html;
}

before(async () => {
  cacheDir = mkdtempSync(join(tmpdir(), "site-render-test-"));
  vite = await createServer({
    root: ROOT,
    configFile: false,
    cacheDir,
    mode: "production",
    appType: "custom",
    logLevel: "error",
    css: { postcss: { plugins: [] } },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { "@": join(ROOT, "src") } },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    // Resolving these from inside the app gives the same router instance the routes use.
    plugins: [
      {
        name: "site-render-test-app",
        resolveId: (id) => (id === APP_ENTRY ? `\0${APP_ENTRY}` : null),
        load: (id) =>
          id === `\0${APP_ENTRY}`
            ? `export { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
               export { QueryClientProvider } from "@tanstack/react-query";
               export { queryClient } from "/src/lib/queryClient.ts";
               export { routeTree } from "/src/routeTree.gen.ts";`
            : null,
        transform: (code, id) =>
          reorderSlugs && id.endsWith("/src/data/games.ts")
            ? code.replace('["frontier", "blitz", "realms-eternum"]', '["blitz", "frontier", "realms-eternum"]')
            : null,
      },
    ],
  });

  // The staking hook logs on every render, which would bury the test report.
  const log = console.log;
  console.log = () => {};
  try {
    const app = await vite.ssrLoadModule(APP_ENTRY);
    pages.home = await renderRoute("/", app);
    pages.games = await renderRoute("/games", app);
    pages.frontier = await renderRoute("/games/frontier", app);
    pages.blitz = await renderRoute("/games/blitz", app);
    pages.eternum = await renderRoute("/games/realms-eternum", app);
    pages.scroll = await renderRoute("/scroll", app);
    // The home page mounts this section on scroll, so it renders on its own.
    const { EconomicsSection } = await vite.ssrLoadModule("/src/components/sections/EconomicsSection.tsx");
    pages.economics = await renderTree(createElement(EconomicsSection), app, "the economics section");
    takenDownRoute = (await loadRoute(`/scroll/${TAKEN_DOWN_SLUG}`, app)).state;

    // The same route when a newer post, with no art of its own, takes the slot.
    const { scrollPosts } = await vite.ssrLoadModule("/src/generated/scroll-posts.ts");
    const { featureImage: _image, featureImageAlt: _alt, ...plain } = scrollPosts[0];
    scrollPosts.unshift({ ...plain, slug: "newer-dispatch", title: "A Newer Dispatch" });
    pages.scrollPlain = await renderRoute("/scroll", app);
    scrollPosts.shift();

    // The same page after the one-line switch that takes Frontier live.
    const { games: liveGames } = await vite.ssrLoadModule("/src/data/games.ts");
    const frontier = liveGames.find((game) => game.slug === "frontier");
    frontier.isLive = true;
    homeLive = await renderRoute("/", app);
    // /games the same way, with Eternum on the one status no game has today.
    const eternum = liveGames.find((game) => game.slug === "realms-eternum");
    eternum.status = "testnet";
    gamesLive = await renderRoute("/games", app);
    eternum.status = "development";
    frontier.isLive = false;

    // The same pages, freshly loaded, with another game first in the shared list.
    reorderSlugs = true;
    vite.moduleGraph.invalidateAll();
    const reordered = await vite.ssrLoadModule(APP_ENTRY);
    blitzFirst.home = await renderRoute("/", reordered);
    blitzFirst.games = await renderRoute("/games", reordered);
  } finally {
    console.log = log;
  }
});

after(async () => {
  await vite?.close();
  if (cacheDir) rmSync(cacheDir, { recursive: true, force: true });
});

function decode(html) {
  return html
    .replace(/<!-- -->/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

function between(html, start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1, `Expected "${start}" on the page`);
  const to = html.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `Expected "${end}" after "${start}"`);
  return html.slice(from + start.length, to);
}

// The page's group labels and card titles, in the order a visitor reads them.
function listing(html) {
  return [
    ...html.matchAll(/<(h2|h3|p)\b([^>]*)>([^<]*)<\/\1>/g),
  ]
    .filter(([, tag, attrs]) => tag !== "p" || attrs.includes("realm-banner"))
    .map(([, , , text]) => decode(text).trim());
}

function homeGames() {
  return between(pages.home, 'id="games"', 'id="economics"');
}

function gamesDirectory(html = pages.games) {
  return html.slice(html.indexOf("</header>"));
}

// One card's markup: from its opening tag to the next card of the same kind.
function card(html, tag, title) {
  const found = html
    .split(`<${tag} `)
    .slice(1)
    .filter((part) => part.includes(`>${title}</h3>`));
  assert.equal(found.length, 1, `Expected one <${tag}> card titled ${title}`);
  return found[0];
}

// A page's feature: from its Featured Game banner to the first card under it.
function homeFeature(html = homeGames()) {
  return between(html, "Featured Game", "<article ");
}

function gamesFeature() {
  return between(gamesDirectory(), "Featured Game", 'class="grid grid-cols-1 gap-5 md:grid-cols-2');
}

function links(html) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([^<]+)/g)].map(([, href, text]) => [text.trim(), href]);
}

function shownText(html) {
  return [...html.matchAll(/>([^<]+)</g)].map(([, text]) => decode(text).trim());
}

test("/games features Frontier, then Blitz and Eternum, above other studios' games", () => {
  assert.deepEqual(listing(gamesDirectory()), [
    "Realms Games",
    "Featured Game",
    "Realms: Frontier",
    "Realms: Blitz",
    "Realms: Eternum",
    "Games from Other Studios",
    "Loot Survivor",
    "zKube",
    "Pistols at Dawn",
  ]);
});

test("The home page features Frontier, then Blitz and Eternum, above other studios' games", () => {
  assert.deepEqual(listing(homeGames()), [
    "REALMS GAMES",
    "Realms: Frontier",
    "Realms: Blitz",
    "Realms: Eternum",
    "GAMES FROM OTHER STUDIOS",
    "Loot Survivor",
    "zKube",
  ]);
});

test("Both pages lead with the first slug in the shared list", () => {
  const home = between(blitzFirst.home, 'id="games"', 'id="economics"');
  const lead = ["Realms: Blitz", "Realms: Frontier", "Realms: Eternum"];

  assert.deepEqual(listing(home).slice(1, 4), lead);
  assert.ok(shownText(homeFeature(home)).includes("Realms: Blitz"), "Expected Blitz in the home feature");
  assert.deepEqual(listing(blitzFirst.games.slice(blitzFirst.games.indexOf("</header>"))).slice(2, 5), lead);
});

test("Frontier's date shows on both features, with no Live or Play Now", () => {
  for (const feature of [homeFeature(), gamesFeature()]) {
    const shown = shownText(feature);

    assert.ok(shown.includes(FRONTIER_LABEL), `Expected the label among ${shown}`);
    assert.ok(!shown.includes("Live"), "Expected no Live badge");
    assert.doesNotMatch(feature, /Play Now|Enter Frontier/);
  }
});

test("/games features Frontier with both texts and exactly its three tags", () => {
  const feature = gamesFeature();
  const shown = shownText(feature);

  assert.ok(shown.includes("Realms: Frontier"));
  assert.ok(shown.includes(FRONTIER_BLURB), "Expected the blurb");
  assert.ok(shown.includes(FRONTIER_DETAIL), "Expected the explainer");
  assert.deepEqual(
    [...feature.matchAll(/<span class="rounded-md[^"]*">([^<]*)</g)].map(([, tag]) => tag),
    ["PvE", "Roguelite", "Free to play"]
  );
});

test("Frontier's own page lists the same three tags", () => {
  const genres = between(pages.frontier, ">Genres</h3>", "</div>");

  assert.deepEqual(
    shownText(genres).filter(Boolean),
    ["PvE", "Roguelite", "Free to play"]
  );
});

test("The home page features Frontier with the blurb and exact pills, without the explainer", () => {
  const feature = homeFeature();
  const shown = shownText(feature);

  assert.ok(shown.includes("Realms: Frontier"));
  assert.ok(shown.includes(FRONTIER_BLURB), "Expected the blurb");
  assert.ok(!shown.includes(FRONTIER_DETAIL), "Expected the explainer to stay on /games");
  for (const [label, detail] of [
    ["PvE Roguelite", "Explore, fight beasts, and upgrade your Realm"],
    ["Free to Play", "Found your Realm for free"],
    ["Fully Onchain", "All actions verifiable onchain"],
    ["$LORDS Rewards", "Recover $LORDS from ruins; top players win a prize"],
  ]) {
    assert.ok(shown.indexOf(detail) === shown.indexOf(label) + 1, `Expected ${label} with its detail among ${shown}`);
  }
});

test("The home feature's primary action follows isLive", () => {
  assert.deepEqual(links(homeFeature()), [
    ["How to Play", "https://docs.realms.party/frontier"],
    ["Learn More", "/games/frontier"],
  ]);

  const live = homeFeature(between(homeLive, 'id="games"', 'id="economics"'));
  assert.deepEqual(links(live), [
    ["Enter Frontier", "https://play.realms.party"],
    ["Learn More", "/games/frontier"],
  ]);
  assert.ok(shownText(live).includes("Live"));
  assert.ok(!shownText(live).includes(FRONTIER_LABEL));
});

test("Both Frontier features show the settlement at dawn, and the art it replaced is gone", () => {
  for (const art of [
    between(homeGames(), "All Games", "Featured Game"),
    between(gamesDirectory(), "realm-games-feature", "Featured Game"),
  ]) {
    const images = art.match(/<img\b[^>]*>/g);
    assert.equal(images.length, 1);
    assert.match(images[0], new RegExp(`src="${FRONTIER_ART}"`));
    assert.match(images[0], /object-cover/);
  }
  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, /emblem\.png|storm-castle/, `Expected no replaced art on ${name}`);
  }
  assert.equal(existsSync(join(ROOT, "public/games/frontier/emblem.png")), false);
  assert.equal(existsSync(join(ROOT, "public/games/frontier/storm-castle.webp")), false);
  assert.ok(statSync(join(ROOT, `public${FRONTIER_ART}`)).size <= 256000);
});

test("Blitz is an ordinary card, first under each feature", () => {
  const home = card(homeGames(), "article", "Realms: Blitz");
  const directory = card(gamesDirectory(), "button", "Realms: Blitz");

  assert.ok(homeGames().indexOf(">Realms: Blitz</h3>") < homeGames().indexOf(">Realms: Eternum</h3>"));
  assert.ok(gamesDirectory().indexOf(">Realms: Blitz</h3>") < gamesDirectory().indexOf(">Realms: Eternum</h3>"));
  for (const blitz of [home, directory]) {
    assert.match(blitz.match(/<img\b[^>]*>/)[0], new RegExp(`src="${BLITZ_ART}"`));
    assert.match(blitz.match(/<img\b[^>]*>/)[0], /object-cover/);
    assert.ok(shownText(blitz).some((text) => text.startsWith("Blitz is a one-hour onchain RTS")));
  }
  assert.match(home, /Play Now/);
});

test("Blitz's own page shows the soldiers in rain, and nothing renders the old card", () => {
  const images = pages.blitz.match(/<img\b[^>]*>/g);
  assert.ok(images.some((image) => image.includes(`src="${BLITZ_ART}"`)));
  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, /blitz-card/, `Expected no old Blitz card on ${name}`);
  }
  assert.equal(existsSync(join(ROOT, "public/brand/blitz-card.png")), false);
  assert.ok(statSync(join(ROOT, `public${BLITZ_ART}`)).size <= 256000);
});

test("Eternum's cards show the war council, and nothing renders the old cover", () => {
  const home = card(homeGames(), "article", "Realms: Eternum");
  const directory = card(gamesDirectory(), "button", "Realms: Eternum");

  for (const eternum of [home, directory]) {
    assert.match(eternum.match(/<img\b[^>]*>/)[0], new RegExp(`src="${ETERNUM_ART}"`));
    assert.match(eternum.match(/<img\b[^>]*>/)[0], /object-cover/);
  }
  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, /realms-eternum\/cover/, `Expected no old Eternum cover on ${name}`);
  }
  assert.equal(existsSync(join(ROOT, "public/games/realms-eternum/cover.png")), false);
  assert.ok(statSync(join(ROOT, `public${ETERNUM_ART}`)).size <= 256000);
});

test("No rendered page says test LORDS", () => {
  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotMatch(decode(html), /test LORDS/i, `Expected no test LORDS on ${name}`);
  }
  assert.ok(shownText(pages.frontier).includes("Chests pay LORDS from the season's pool into your Realm."));
  assert.ok(
    decode(pages.frontier).includes(
      "A normal day lasts 8 to 24 hours, or 4 to 12 in the Devcon season. The game shows when today ends and how long tomorrow lasts."
    )
  );
});

test("Frontier's date shows on its page chip and Game Status card, with no Play Now", () => {
  const chip = between(pages.frontier, "</h1>", "How to Play");
  const statusCard = between(pages.frontier, "Game Status", 'id="frontier-day"');

  assert.ok(shownText(chip).includes(FRONTIER_LABEL), "Expected the label in the page chip");
  assert.ok(shownText(statusCard).includes(FRONTIER_LABEL), "Expected the label in the Game Status card");
  assert.doesNotMatch(pages.frontier, /Play Now/);
});

test("Other games keep their own status on the same surfaces", () => {
  assert.ok(shownText(card(homeGames(), "article", "Realms: Eternum")).includes("development"));
  assert.ok(shownText(card(gamesDirectory(), "button", "Realms: Eternum")).includes("development"));
  assert.ok(shownText(card(homeGames(), "article", "zKube")).includes("Live"));
});

// A card's status chips: what each says and its background classes.
function chips(html) {
  return [...html.matchAll(/<span class="([^"]*rounded-full border[^"]*)">(?:<span[^>]*><\/span>)?([^<]+)/g)].map(
    ([, classes, text]) => [decode(text).trim(), classes.split(/\s+/).filter((name) => name.startsWith("bg-"))]
  );
}

test("Every status chip on /games sits on the solid ground, whatever art is behind it", () => {
  const SOLID = ["bg-black/80"];
  const expected = (...texts) => texts.map((text) => [text, SOLID]);
  const today = gamesDirectory();
  const live = gamesDirectory(gamesLive);

  assert.deepEqual(chips(card(today, "button", "Realms: Eternum")), expected("development"));
  assert.deepEqual(chips(card(today, "button", "Realms: Blitz")), expected("Live", "mainnet"));
  assert.deepEqual(chips(card(today, "button", "zKube")), expected("Live", "mainnet"));
  assert.deepEqual(chips(gamesFeature()), expected(FRONTIER_LABEL));
  assert.deepEqual(chips(card(live, "button", "Realms: Eternum")), expected("testnet"));
  assert.deepEqual(chips(between(live, "Featured Game", 'class="grid grid-cols-1 gap-5 md:grid-cols-2')), expected("Live", FRONTIER_LABEL));
  assert.deepEqual(chips(today).filter(([, ground]) => ground.join() !== SOLID.join()), []);
});

test("Other studios' games stay in the data", () => {
  const slugs = games.map((game) => game.slug);

  for (const slug of [
    "loot-survivor",
    "zkube",
    "pistols-at-dawn",
    "dark-shuffle",
    "blob-arena",
    "rising-revenant",
  ]) {
    assert.ok(slugs.includes(slug), `Expected ${slug} to stay in games.ts`);
  }
});

test("Product pages do not present AI agents as live", () => {
  for (const path of [
    "src/routes/index.tsx",
    "src/routes/games/index.tsx",
    "src/data/games.ts",
    "src/components/layout/TopBar.tsx",
    "src/components/sections/IntroSection.tsx",
    "src/components/sections/EcosystemAtlasSection.tsx",
  ]) {
    assert.doesNotMatch(
      read(path),
      /\bAI agents?\b|humans and (their )?agents|Agent-Permissive|Agent Game|"agent-native"/i,
      `Expected no live agent claim in ${path}`
    );
  }
});

test("Home game cards never dim a game", () => {
  const atlas = read("src/components/sections/EcosystemAtlasSection.tsx");

  assert.doesNotMatch(homeGames(), /Coming Soon/);
  for (const title of ["Realms: Blitz", "Realms: Eternum", "Loot Survivor", "zKube"]) {
    const articleClass = card(homeGames(), "article", title).match(/class="([^"]*)"/)[1];
    assert.doesNotMatch(articleClass, /opacity-\d/);
  }
  assert.match(atlas.match(/<motion\.article[\s\S]*?>/)[0], /animate=\{\{ opacity: 1, y: 0 \}\}/);
});

test("Home game card links keep a touch-sized target", () => {
  const links = [...homeGames().matchAll(/<a\b[^>]*class="([^"]*)"[^>]*>(Play Now|Details)/g)];

  // Every card has Details, and live games add Play Now.
  assert.ok(links.length >= 4, `Expected a link on every card, found ${links.length}`);
  for (const [, className] of links) {
    assert.match(className, /(^|\s)min-h-11(\s|$)/);
  }
});

test("The hero has two actions and a still gold title", () => {
  const hero = between(pages.home, 'id="hero"', 'id="games"');
  const actions = [...hero.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map(([, text]) => text.trim());
  const title = hero.match(/<h1\b[^>]*class="([^"]*)"[^>]*>([^<]*)<\/h1>/);

  assert.deepEqual(actions, ["Explore Games", "Stake veLORDS"]);
  assert.equal(title[2], "THE NEW FRONTIER OF GAMING");
  assert.ok(title[1].split(/\s+/).includes("text-[#F3D08A]"));
  assert.doesNotMatch(read("src/index.css"), /hero-shimmer|hero-title-shimmer/);
});

test("The hero counts the Realms games", () => {
  const hero = between(pages.home, 'id="hero"', 'id="games"');

  assert.match(hero, />Realms Games<\/[a-z0-9]+>\s*<[a-z0-9]+\b[^>]*>3</);
});

test("The footer does not call the ecosystem autonomous", () => {
  assert.doesNotMatch(read("src/components/sections/FooterSection.tsx"), /autonomous/i);
});

test("Frontier has its season label and is not live yet", () => {
  const [frontier] = pickGames(["frontier"]);

  assert.equal(frontier.statusLabel, FRONTIER_LABEL);
  assert.equal(frontier.status, undefined);
  assert.equal(frontier.isLive, false);
});

test("Only Frontier has a status label, and other games keep their status", () => {
  for (const game of games.filter((entry) => entry.slug !== "frontier")) {
    assert.equal(game.statusLabel, undefined);
    assert.equal(gameStatusText(game), game.status);
  }
});

test("The hero states the approved position, and no page names a year after 2026", () => {
  const hero = between(pages.home, 'id="hero"', 'id="games"');
  const laterYear = /\b20(2[7-9]|[3-9]\d)\b/;

  assert.ok(
    decode(hero).includes(
      ">The AI era is here and fundamentally changing gaming as we know it. The Realms Ecosystem is building for the new age, one where AI and humans can build, strategize, collaborate, and compete. Together. Onchain. Forever.</p>"
    ),
    "Expected the approved paragraph in the hero"
  );
  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotMatch(html, laterYear, `Expected no later year on ${name}`);
  }
  for (const path of ["src/data/games.ts", "src/components/game/FrontierGuide.tsx"]) {
    assert.doesNotMatch(read(path), laterYear, `Expected no later year in ${path}`);
  }
});

test("The home page has no hex section", () => {
  assert.doesNotMatch(pages.home, /id="hex-explorer"|Interactive hex grid explorer|Skip interactive section|<canvas/);
  assert.equal(existsSync(join(ROOT, "src/components/hex-explorer")), false);
  assert.match(pages.home, /id="hero"[\s\S]*id="games"/);
});

function scrollFeature(html) {
  return between(html, "scroll-codex-feature", "scroll-codex-feed");
}

test("/scroll shows the newest lore entry as a feature with its art, alt text and link", () => {
  const feature = scrollFeature(pages.scroll);
  const images = feature.match(/<img\b[^>]*>/g);
  assert.equal(images.length, 1);
  assert.match(images[0], /src="\/lore\/history-of-lost-worlds\/lost-worlds-feature\.webp"/);
  assert.match(
    decode(images[0]),
    /alt="A cloaked figure on a ridge of black basalt reaches toward a dark orb wrapped in blue and orange lightning, beneath falling shards of rock\."/
  );
  const link = pages.scroll.slice(pages.scroll.lastIndexOf("<a ", pages.scroll.indexOf("scroll-codex-feature")));
  assert.match(link.match(/^<a\b[^>]*>/)[0], /href="\/scroll\/history-of-lost-worlds"/);
  assert.ok(shownText(feature).includes("A History of Lost Worlds"));
  assert.ok(existsSync(join(ROOT, "public/lore/history-of-lost-worlds/lost-worlds-feature.webp")));
});

test("/scroll's feature art keeps the post's title first and stays out of the feed", () => {
  const feature = scrollFeature(pages.scroll);
  assert.ok(feature.indexOf("<h2") < feature.indexOf("<img"), "Expected the link to read its title before the alt text");
  assert.doesNotMatch(pages.scroll.slice(pages.scroll.indexOf("scroll-codex-feed")), /lost-worlds-feature\.webp/);
});

test("A newer post with no feature art takes the slot with no image", () => {
  const feature = scrollFeature(pages.scrollPlain);
  assert.ok(shownText(feature).includes("A Newer Dispatch"));
  assert.doesNotMatch(feature, /<img\b/);
  assert.doesNotMatch(pages.scrollPlain, /lost-worlds-feature\.webp/);
});

test("A post cannot set feature art without alt text", async () => {
  const root = mkdtempSync(join(tmpdir(), "scroll-feature-"));
  try {
    mkdirSync(join(root, "content/scroll"), { recursive: true });
    const post = (extra) => `---\ntitle: "T"\nexcerpt: "E"\ndate: "2026-01-01"\ntype: "lore"\nauthor: "A"\ntags: []\npublished: true\n${extra}---\nBody\n`;
    writeFileSync(join(root, "content/scroll/2026-01-01-a.md"), post('featureImage: "/a.webp"\n'));
    await assert.rejects(generate(root), /featureImage needs featureImageAlt/);
    writeFileSync(join(root, "content/scroll/2026-01-01-a.md"), post('featureImage: "/a.webp"\nfeatureImageAlt: "An a"\n'));
    await generate(root);
    assert.match(readFileSync(join(root, "src/generated/scroll-posts.ts"), "utf8"), /"featureImageAlt": "An a"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("/scroll does not list the taken-down post", () => {
  assert.ok(shownText(pages.scroll).includes("The Infrastructure Stack Powering Autonomous Worlds"));
  assert.doesNotMatch(pages.scroll, /eternum-agent-first-design|Agents First|built for them/);
});

test("The taken-down post's old address redirects to /scroll", () => {
  assert.equal(takenDownRoute.redirect?.options.href, "/scroll");
  assert.equal(takenDownRoute.statusCode, 301);
  assert.deepEqual(
    JSON.parse(read("vercel.json")).redirects.find((entry) => entry.source === `/scroll/${TAKEN_DOWN_SLUG}`),
    { source: `/scroll/${TAKEN_DOWN_SLUG}`, destination: "/scroll", permanent: true }
  );
});

test("The taken-down post is not in what the site ships", () => {
  assert.equal(existsSync(join(ROOT, `content/scroll/2026-02-12-${TAKEN_DOWN_SLUG}.md`)), false);
  assert.doesNotMatch(read("src/generated/scroll-posts.ts"), /eternum-agent-first-design|Agents First|built for them/);
  assert.doesNotMatch(read("public/sitemap.xml"), /eternum-agent-first-design/);
});

test("The economics section keeps the flywheel and staking block, with no token supply panel", () => {
  const text = shownText(pages.economics);
  assert.ok(text.includes("$LORDS TOKEN"));
  assert.equal(text.includes("TREASURY"), false);
  // Without the wrap, the two buttons run 41 px past a 390 px screen.
  assert.match(pages.economics, /class="flex flex-wrap shrink-0 gap-3"/);
  assert.ok(text.includes("Stake LORDS"));
  assert.ok(text.includes("Lock LORDS as veLORDS and earn weekly staking rewards."));
  assert.match(pages.economics, /<svg/);
  for (const gone of ["TOKEN SUPPLY", "Total Supply", "Circulating", "Freely liquid"]) {
    assert.equal(text.includes(gone), false, `Expected no "${gone}"`);
  }
});

// What a visitor reads: text nodes, plus alt text, labels and page metadata. Links and art paths are not words.
function readableWords(html) {
  const attributes = [...html.matchAll(/\b(?:alt|title|aria-label|content)="([^"]*)"/g)].map(([, value]) => decode(value));
  return [...shownText(html), ...attributes];
}

const VISITOR_PAGES = ["home", "economics", "games", "frontier", "blitz", "eternum", "scroll"];

// A link or file path stays as written. Any other lowercase "realm", wherever it sits in a sentence, is a word.
const NOT_A_WORD = /^(?:[a-z]+:\/\/\S+|(?:[a-z0-9-]+\.)*realms\.(?:world|party)(?:\/\S*)?|(?:\/[\w-]+)+(?:\.\w+)?)$/;

function lowercaseRealms(text) {
  return text.split(/\s+/).filter((token) => /\brealms?\b/.test(token) && !NOT_A_WORD.test(token));
}

function stringsIn(value) {
  if (typeof value === "string") return [value];
  return value && typeof value === "object" ? Object.values(value).flatMap(stringsIn) : [];
}

test("Realm is capitalized in everything these pages show", () => {
  for (const name of VISITOR_PAGES) {
    // A post's tag is an identifier, shown as "#realms" beside "#lore" and "#loot".
    const html = pages[name].replace(/#<!-- -->realms</g, "#<");
    for (const words of readableWords(html)) {
      assert.deepEqual(lowercaseRealms(words), [], `Expected a capital Realm on ${name}: "${words}"`);
    }
  }
  // Not every game is listed on /games, but each has its own page.
  for (const { slug, ...game } of games) {
    for (const words of stringsIn(game)) {
      assert.deepEqual(lowercaseRealms(words), [], `Expected a capital Realm in ${slug}: "${words}"`);
    }
  }
  assert.ok(shownText(pages.frontier).includes("The mist forgets. Your Realm remembers."));
});

test("Visitor copy uses American spelling", () => {
  const british =
    /\b(maximise|honour|defence|offence|civilisation|travellers?|centres|stabilised|destabilise|towards|outwards|colour|favour|grey|whilst|amongst|cancelled)\b/i;
  for (const name of VISITOR_PAGES) {
    for (const words of readableWords(pages[name])) {
      assert.doesNotMatch(words, british, `Expected American spelling on ${name}: "${words}"`);
    }
  }
  for (const path of ["src/components/lore/history-of-lost-worlds.html", "src/routes/terms.tsx", "src/data/games.ts"]) {
    assert.doesNotMatch(read(path), british, `Expected American spelling in ${path}`);
  }
});
