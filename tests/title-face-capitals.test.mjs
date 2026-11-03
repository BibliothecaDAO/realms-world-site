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

// Every block with its own declarations, nested blocks left out: @layer, @theme, @media and nested rules included.
function cssRules(source) {
  const rules = [];
  const open = [];
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] !== "{" && css[i] !== "}") continue;
    const text = css.slice(start, i);
    if (css[i] === "{") {
      if (open.length) open.at(-1).body += text.slice(0, text.lastIndexOf(";") + 1);
      open.push({ selector: text.slice(text.lastIndexOf(";") + 1).trim(), body: "" });
    } else {
      const block = open.pop();
      if (!block) throw new Error(`Unbalanced "}" in CSS at ${i}`);
      block.body += text;
      rules.push(block);
    }
    start = i + 1;
  }
  return rules;
}

// Index of the first comma outside parentheses, or the text's length.
function topLevelComma(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) return i;
  }
  return text.length;
}

// The family a font or font-family value draws first: the first in its list. When that is a var(), the variable
// decides, or its fallback's first family when it is unset. Later families in the stack never count.
function firstFamilies(value) {
  let head = value.slice(0, topLevelComma(value));
  const families = [];
  for (let at = head.indexOf("var("); at !== -1; at = head.indexOf("var(")) {
    let close = at + 4;
    for (let depth = 1; depth > 0 && close < head.length; close++) depth += { "(": 1, ")": -1 }[head[close]] ?? 0;
    const inner = head.slice(at + 4, close - 1);
    const comma = topLevelComma(inner);
    families.push(inner.slice(0, comma).trim());
    if (comma < inner.length) families.push(...firstFamilies(inner.slice(comma + 1)));
    head = head.slice(0, at) + head.slice(close);
  }
  return [head.trim(), ...families].filter(Boolean);
}

function setsFace(body, pattern) {
  return [...body.matchAll(/(?:^|;)\s*font(?:-family)?\s*:\s*([^;]+)/g)].some((m) => firstFamilies(m[1]).some((f) => pattern.test(f)));
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
