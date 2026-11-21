import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

let vite;
let handler;

before(async () => {
  vite = await createServer({
    configFile: false,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
    esbuild: { jsx: "automatic" },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  handler = (await vite.ssrLoadModule("/api/og.tsx")).default;
});

after(async () => {
  await vite?.close();
});

async function render(url) {
  const response = await handler(new Request(url));
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

for (const [name, url] of [
  ["with no parameters", "http://localhost/api/og"],
  [
    "with a title and a description",
    "http://localhost/api/og?title=Realms.World%20%7C%20Games&description=Play%20the%20games%20built%20on%20Realms",
  ],
]) {
  test(`The share-image handler returns a PNG ${name}`, async () => {
    const { response, body } = await render(url);

    assert.equal(response.status, 200, body.subarray(0, 200).toString());
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.deepEqual([...body.subarray(0, 8)], PNG_SIGNATURE);
  });
}
