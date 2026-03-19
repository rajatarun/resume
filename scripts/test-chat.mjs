/**
 * CORS fix verification test using a local mock API server.
 *
 * The mock server replicates the real API's CORS behavior:
 *   - OPTIONS preflight with x-api-key in Access-Control-Request-Headers → no CORS headers (blocks browser)
 *   - OPTIONS preflight without x-api-key → proper CORS headers (allows browser)
 *   - POST → always returns a mock chat response with access-control-allow-origin: *
 */
import puppeteer from "puppeteer";
import http from "http";

const CHROME_PATH = "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";
const PORT_API = 9001;
const PORT_HTML = 9002;

// ── Mock API server ────────────────────────────────────────────────────────────
const mockApiServer = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    const requestedHeaders = (req.headers["access-control-request-headers"] || "").toLowerCase();
    const hasApiKey = requestedHeaders.includes("x-api-key");

    if (hasApiKey) {
      // Simulate real API behavior: no CORS headers → browser blocks the request
      res.writeHead(200, {});
      res.end();
    } else {
      // Proper CORS preflight response
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS,POST",
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Max-Age": "300"
      });
      res.end();
    }
    return;
  }

  if (req.method === "POST") {
    const body = JSON.stringify({
      answer: "Tarun is a skilled software engineer.",
      sources: [],
      confidence: 0.9,
      questionType: "general",
      routingDecision: {}
    });
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(body);
  }
});

// ── HTML page server (simulates same-origin page making cross-origin fetch) ───
const htmlServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`<!DOCTYPE html><html><body>CORS test page</body></html>`);
});

const startServer = (server, port) =>
  new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const stopServer = (server) =>
  new Promise((resolve) => server.close(resolve));

const fetchWithTimeout = async (page, label, options) => {
  console.log(`\n--- ${label} ---`);
  const result = await Promise.race([
    page.evaluate(async (apiUrl, opts) => {
      try {
        const res = await fetch(apiUrl, opts);
        const text = await res.text();
        return { ok: res.ok, status: res.status, snippet: text.slice(0, 120) };
      } catch (e) {
        return { error: e.message, name: e.name };
      }
    }, `http://127.0.0.1:${PORT_API}/chat`, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMED OUT after 5s")), 5000))
  ]).catch((e) => ({ timedOut: true, message: e.message }));

  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
};

(async () => {
  await startServer(mockApiServer, PORT_API);
  await startServer(htmlServer, PORT_HTML);
  console.log(`Mock API on :${PORT_API}, HTML on :${PORT_HTML}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  // Navigate to local page so the fetch is a cross-origin call (port differs)
  await page.goto(`http://127.0.0.1:${PORT_HTML}`);

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`  [browser ${msg.type()}]`, msg.text());
  });

  // ── Test 1: OLD — with x-api-key (CORS preflight will fail) ─────────────────
  const r1 = await fetchWithTimeout(page, "Test 1 (OLD): fetch WITH x-api-key header", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "aUzjadBOca1GEWrlrM1cGIoGhpcEPZ6aEL2ZHavg"
    },
    body: JSON.stringify({ question: "test" })
  });

  // ── Test 2: NEW — without x-api-key (CORS preflight should pass) ────────────
  const r2 = await fetchWithTimeout(page, "Test 2 (NEW): fetch WITHOUT x-api-key header", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "test" })
  });

  await browser.close();
  await stopServer(mockApiServer);
  await stopServer(htmlServer);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  const oldFailed = r1.timedOut || r1.error;
  const newPassed = r2.ok === true;

  if (oldFailed) {
    console.log("CONFIRMED: Old behavior (with x-api-key) → BLOCKED by CORS preflight");
  } else {
    console.log("WARNING: Old behavior did not fail as expected:", r1);
  }

  if (newPassed) {
    console.log("CONFIRMED: New behavior (without x-api-key) → REQUEST SUCCEEDS");
  } else {
    console.log("WARNING: New behavior did not succeed as expected:", r2);
  }

  process.exit(0);
})();
