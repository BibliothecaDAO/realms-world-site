import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

// IM Fell English SC is a small-caps face: mixed-case text shows a capital, then small capitals. Every title set in it
// is shown in full capitals, by CSS, so the source keeps its case and screen readers read words.
const TITLE_FACE = /--font-title|--realm-font-title|IM Fell English/;

function sourceFiles(dir, pattern) {
  const base = join(ROOT, dir);
  if (!existsSync(base)) return [];
  return readdirSync(base, { recursive: true })
    .filter((name) => pattern.test(name))
    .map((name) => join(dir, name));
}

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

// Innermost blocks only: a selector and its declarations, with nesting such as @layer and statements such as @import
// left out.
function cssRules(css) {
  const rules = [];
  for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    rules.push({ selector: match[1].split(";").at(-1).trim(), body: match[2] });
  }
  return rules;
}

function setsTitleFace(body) {
  return [...body.matchAll(/(?:^|;)\s*font(?:-family)?\s*:\s*([^;]+)/g)].some((m) => TITLE_FACE.test(m[1]));
}

test("Title face: every CSS rule that sets IM Fell English also sets text-transform: uppercase", () => {
  const found = [];
  const missing = [];
  for (const file of sourceFiles("src", /\.css$/)) {
    for (const { selector, body } of cssRules(read(file))) {
      if (selector.startsWith("@font-face") || !setsTitleFace(body)) continue;
      found.push(selector);
      if (!/(?:^|;)\s*text-transform\s*:\s*uppercase\b/.test(body)) missing.push(`${file}: ${selector}`);
    }
  }
  assert.ok(found.includes(".realm-title"), "Expected .realm-title to set the title face");
  assert.ok(found.some((s) => s.includes(".lore-chronicle h1")), "Expected the lore page's headings to set the title face");
  assert.deepEqual(missing, [], "Each of these sets the title face without text-transform: uppercase");
});

test("Title face: no Tailwind theme key makes a title-font utility without capitals", () => {
  const offenders = [];
  for (const file of sourceFiles("src", /\.css$/)) {
    for (const { selector, body } of cssRules(read(file))) {
      if (selector.startsWith("@theme") && /(?:^|;)\s*--font-title\s*:/.test(body)) offenders.push(file);
    }
  }
  assert.deepEqual(offenders, [], "A --font-title theme key creates a font-title utility that skips the capitals");
});

test("Title face: markup sets it only through a CSS class, never an arbitrary-value class or inline style", () => {
  const files = [
    ...sourceFiles("src", /\.(tsx?|jsx?|html|mdx?)$/),
    ...sourceFiles("content", /\.(mdx?|mdoc|json|ya?ml)$/),
    "index.html",
  ];
  const offenders = [];
  for (const file of files) {
    read(file)
      .split("\n")
      .forEach((line, i) => {
        if (TITLE_FACE.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }
  assert.deepEqual(offenders, [], "Use the realm-title class, which sets the face with its capitals");
});
