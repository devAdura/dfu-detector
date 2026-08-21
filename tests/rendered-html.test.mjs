import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the DFU Explain application", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /DFU Explain — Explainable diabetic foot screening/i);
  assert.match(html, /See the prediction/);
  assert.match(html, /Upload a foot image/);
  assert.match(html, /Research prototype/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("emits product-specific social metadata", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /property="og:title"[^>]+DFU Explain/i);
  assert.match(html, /name="twitter:card"[^>]+summary_large_image/i);
  assert.match(html, /http:\/\/localhost(?::3000)?\/og\.png/);
});
