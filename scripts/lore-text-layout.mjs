// Runs in the browser against rendered text, including expanded world notes.
export function auditLoreTextLayout() {
  const root = document.querySelector(".lore-chronicle");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const splitWords = [];
  const overflow = [];
  const clipped = [];
  let wordCount = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element.checkVisibility() || element.closest(".skip, script, style")) continue;
    let container = element;
    while (container !== root && getComputedStyle(container).display === "inline") {
      container = container.parentElement;
    }
    const bounds = container.getBoundingClientRect();
    const label = element.closest("[id]")?.id ?? element.className ?? element.tagName;
    const clippingBounds = [];
    for (let parent = element; parent && root.contains(parent); parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const x = ["hidden", "clip"].includes(style.overflowX);
      const y = ["hidden", "clip"].includes(style.overflowY);
      if (x || y) clippingBounds.push({ x, y, bounds: parent.getBoundingClientRect() });
    }
    for (const match of node.textContent.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
      if (!rects.length) continue;
      wordCount++;
      if (rects.some((rect) => Math.abs(rect.top - rects[0].top) > 2)) {
        splitWords.push({ section: label, word: match[0] });
      }
      if (rects.some((rect) => rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.left < -1 || rect.right > innerWidth + 1)) {
        overflow.push({ section: label, word: match[0] });
      }
      if (clippingBounds.some(({ x, y, bounds }) => rects.some((rect) =>
        (x && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) ||
        (y && (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1))))) {
        clipped.push({ section: label, word: match[0] });
      }
    }
  }
  return { wordCount, splitWords, overflow, clipped };
}
