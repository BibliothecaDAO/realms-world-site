import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

// IM Fell English SC (titles) and Cinzel (labels and buttons) draw lowercase as small capitals: mixed-case text shows a
// capital, then small capitals. Everything set in either face is shown in full capitals, by CSS, so the source keeps its
// case and screen readers read words. Markup reaches each face through one class that carries the capitals.
const FACES = [
  { name: "Title face", pattern: /--font-title|--realm-font-title|IM Fell English/, themeKey: "--font-title", className: "realm-title", rules: [".realm-title", ".lore-chronicle h1"] },
  { name: "UI face", pattern: /--font-ui|Cinzel/, themeKey: "--font-ui", className: "realm-label", rules: [".realm-label", ".lore-chronicle .topbar nav"] },
];

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

function setsFace(body, pattern) {
  return [...body.matchAll(/(?:^|;)\s*font(?:-family)?\s*:\s*([^;]+)/g)].some((m) => pattern.test(m[1]));
}

for (const face of FACES) {
  test(`${face.name}: every CSS rule that sets it also sets text-transform: uppercase`, () => {
    const found = [];
    const missing = [];
    for (const file of sourceFiles("src", /\.css$/)) {
      for (const { selector, body } of cssRules(read(file))) {
        if (selector.startsWith("@font-face") || !setsFace(body, face.pattern)) continue;
        found.push(selector);
        if (!/(?:^|;)\s*text-transform\s*:\s*uppercase\b/.test(body)) missing.push(`${file}: ${selector}`);
      }
    }
    for (const rule of face.rules) assert.ok(found.some((s) => s.includes(rule)), `Expected ${rule} to set the face`);
    assert.deepEqual(missing, [], "Each of these sets the face without text-transform: uppercase");
  });

  test(`${face.name}: no Tailwind theme key makes a font utility without capitals`, () => {
    const offenders = [];
    for (const file of sourceFiles("src", /\.css$/)) {
      for (const { selector, body } of cssRules(read(file))) {
        if (selector.startsWith("@theme") && new RegExp(`(?:^|;)\\s*${face.themeKey}\\s*:`).test(body)) offenders.push(file);
      }
    }
    assert.deepEqual(offenders, [], `A ${face.themeKey} theme key creates a font utility that skips the capitals`);
  });

  test(`${face.name}: markup sets it only through a CSS class, never an arbitrary-value class or inline style`, () => {
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
          if (face.pattern.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        });
    }
    assert.deepEqual(offenders, [], `Use the ${face.className} class, which sets the face with its capitals`);
  });
}
