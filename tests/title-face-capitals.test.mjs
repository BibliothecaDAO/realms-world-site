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

// Every custom property's declared values, from every CSS file and block: a property declared in :root and again in
// .dark can take either value.
const properties = new Map();
for (const file of sourceFiles("src", /\.css$/))
  for (const { body } of cssRules(read(file)))
    for (const [, name, value] of body.matchAll(/(?:^|;)\s*(--[\w-]+)\s*:\s*([^;]*)/g))
      properties.set(name, [...(properties.get(name) ?? []), value.trim()]);

// The index after the parenthesis that closes the one at `open`, quotes skipped.
function closing(value, open) {
  let depth = 0;
  let quote = "";
  for (let i = open; i < value.length; i++) {
    const c = value[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")" && --depth === 0) return i + 1;
  }
  return value.length;
}

// The value's parts between commas outside parentheses and quotes.
function topLevelParts(value) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") i = closing(value, i) - 1;
    else if (value[i] === '"' || value[i] === "'") {
      const end = value.indexOf(value[i], i + 1);
      i = end < 0 ? value.length : end;
    } else if (value[i] === ",") {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...parts, value.slice(start).trim()];
}

// Every value `value` can compute to: each var() becomes each declared value of its property, cycles left out, and its
// fallback, since the table does not know where each declaration applies. A var() with neither stays as written.
function resolveValue(value, seen = []) {
  const at = value.search(/(?<![-\w])var\(/);
  if (at < 0) return [value];
  const end = closing(value, at + 3);
  const [name, ...fallback] = topLevelParts(value.slice(at + 4, end - 1));
  const declared = seen.includes(name) ? [] : (properties.get(name) ?? []);
  const replacements = [
    ...declared.flatMap((v) => resolveValue(v, [...seen, name])),
    ...(fallback.length ? resolveValue(fallback.join(", "), seen) : []),
  ];
  if (!replacements.length) replacements.push(value.slice(at, end));
  const rests = resolveValue(value.slice(end), seen);
  return [...new Set(replacements.flatMap((r) => rests.map((rest) => value.slice(0, at) + r + rest)))];
}

// A font or font-family value sets a face when its first part names it once resolved: the first family, or for the font
// shorthand the size and first family. Later families in the stack never count.
function namesFace(value, pattern) {
  return resolveValue(value).some((v) => pattern.test(topLevelParts(v)[0]));
}

function setsFace(body, pattern) {
  return [...body.matchAll(/(?:^|;)\s*font(?:-family)?\s*:\s*([^;]+)/g)].some((m) => namesFace(m[1], pattern));
}

// The families markup sets: inline fontFamily styles, and arbitrary Tailwind classes such as font-[family-name:var(--x)]
// and [font-family:var(--x)], "_" for a space.
const markupFamilies = (line) => [
  ...[...line.matchAll(/fontFamily:\s*(?:(["'`])(.*?)\1|([^,}]+))/g)].map((m) => m[2] ?? m[3]),
  ...[...line.matchAll(/(?:font-\[(?:family-name:)?|\[font-family:)([^\]\s]+)\]/g)].map((m) => m[1].replaceAll("_", " ")),
];

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
        if (!selector.startsWith("@theme")) continue;
        for (const [, key, value] of body.matchAll(/(?:^|;)\s*(--font-[\w-]+)\s*:\s*([^;]+)/g))
          if (key === face.themeKey || namesFace(value, face.pattern)) offenders.push(`${file}: ${key}`);
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
          if (face.pattern.test(line) || markupFamilies(line).some((v) => namesFace(v, face.pattern)))
            offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        });
    }
    assert.deepEqual(offenders, [], `Use the ${face.className} class, which sets the face with its capitals`);
  });
}
