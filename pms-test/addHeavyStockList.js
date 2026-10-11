// build-universe.mjs
// Usage:
//   node build-universe.mjs                 → build + ingest
//   node build-universe.mjs --dry-run       → build only, no POSTs
//   node build-universe.mjs --skip-build    → ingest existing universe.json
//   node build-universe.mjs --retry-failed  → re-ingest only failed-records.json
//
// Env:
//   SECURITY_MASTER_BASE_URL   default [http://localhost:8081](http://localhost:8081)
//   INGEST_CONCURRENCY         default 5
//   INGEST_BATCH_DELAY_MS      default 250

import fs from "node:fs/promises";
import axios from "axios";

// ═══════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════
const MASTER_URL   = process.env.SECURITY_MASTER_BASE_URL ?? "http://localhost:8081";
const CONCURRENCY  = Number(process.env.INGEST_CONCURRENCY ?? 5);
const BATCH_DELAY  = Number(process.env.INGEST_BATCH_DELAY_MS ?? 250);

const ARGS         = new Set(process.argv.slice(2));
const DRY_RUN      = ARGS.has("--dry-run");
const SKIP_BUILD   = ARGS.has("--skip-build");
const RETRY_FAILED = ARGS.has("--retry-failed");

// assetId per instrument class — adjust to match your asset table
const ASSET_ID = {
  EQUITY: 2,
  ETF:    2,   // change if ETFs live under a different assetId
};

const SOURCES = {
  nseEquity: "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
  nseSme:    "https://nsearchives.nseindia.com/content/equities/SME_EQUITY_L.csv",
  nseEtf:    "https://nsearchives.nseindia.com/content/equities/eq_etfseclist.csv",

};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "text/csv,application/json,*/*",
  "Referer": "https://www.nseindia.com/",
};

const client = axios.create({ timeout: 30_000 });

// ═══════════════════════════════════════════════════════
//  GICS MAPPING  (abridged here — keep your full map)
// ═══════════════════════════════════════════════════════
const GICS_MAP = {
  "IT - SOFTWARE":              { gics: "45102010", industry: "IT Consulting & Other Services", sector: "Information Technology" },
  "BANKS":                      { gics: "40101010", industry: "Diversified Banks",              sector: "Financials" },
  "FINANCE":                    { gics: "40202010", industry: "Consumer Finance",               sector: "Financials" },
  "INSURANCE":                  { gics: "40301020", industry: "Life & Health Insurance",        sector: "Financials" },
  "CAPITAL MARKETS":            { gics: "40203020", industry: "Investment Banking & Brokerage", sector: "Financials" },
  "PHARMACEUTICALS & BIOTECHNOLOGY": { gics: "35202010", industry: "Pharmaceuticals",           sector: "Health Care" },
  "HEALTHCARE SERVICES":        { gics: "35102020", industry: "Health Care Facilities",         sector: "Health Care" },
  "AUTOMOBILES":                { gics: "25102010", industry: "Automobile Manufacturers",       sector: "Consumer Discretionary" },
  "AUTO COMPONENTS":            { gics: "25101010", industry: "Automotive Parts & Equipment",   sector: "Consumer Discretionary" },
  "FERROUS METALS":             { gics: "15104050", industry: "Steel",                          sector: "Materials" },
  "NON - FERROUS METALS":       { gics: "15104020", industry: "Diversified Metals & Mining",    sector: "Materials" },
  "CEMENT & CEMENT PRODUCTS":   { gics: "15102010", industry: "Construction Materials",         sector: "Materials" },
  "CHEMICALS & PETROCHEMICALS": { gics: "15101050", industry: "Specialty Chemicals",            sector: "Materials" },
  "FERTILIZERS & AGROCHEMICALS":{ gics: "15101030", industry: "Fertilizers & Agricultural Chemicals", sector: "Materials" },
  "POWER":                      { gics: "55101010", industry: "Electric Utilities",             sector: "Utilities" },
  "GAS":                        { gics: "55102010", industry: "Gas Utilities",                  sector: "Utilities" },
  "PETROLEUM PRODUCTS":         { gics: "10102030", industry: "Oil & Gas Refining & Marketing", sector: "Energy" },
  "OIL":                        { gics: "10102020", industry: "Oil & Gas Exploration & Production", sector: "Energy" },
  "CONSUMABLE FUELS":           { gics: "10102050", industry: "Coal & Consumable Fuels",        sector: "Energy" },
  "FOOD PRODUCTS":              { gics: "30202030", industry: "Packaged Foods & Meats",         sector: "Consumer Staples" },
  "BEVERAGES":                  { gics: "30201030", industry: "Soft Drinks & Non-alcoholic Beverages", sector: "Consumer Staples" },
  "DIVERSIFIED FMCG":           { gics: "30302010", industry: "Personal Care Products",         sector: "Consumer Staples" },
  "CONSTRUCTION":               { gics: "20103010", industry: "Construction & Engineering",     sector: "Industrials" },
  "ELECTRICAL EQUIPMENT":       { gics: "20104010", industry: "Electrical Components & Equipment", sector: "Industrials" },
  "INDUSTRIAL MANUFACTURING":   { gics: "20106020", industry: "Industrial Machinery & Supplies & Components", sector: "Industrials" },
  "AEROSPACE & DEFENSE":        { gics: "20101010", industry: "Aerospace & Defense",            sector: "Industrials" },
  "TRANSPORT SERVICES":         { gics: "20301010", industry: "Air Freight & Logistics",        sector: "Industrials" },
  "CONSUMER DURABLES":          { gics: "25201040", industry: "Household Appliances",           sector: "Consumer Discretionary" },
  "TEXTILES & APPARELS":        { gics: "25203010", industry: "Apparel, Accessories & Luxury Goods", sector: "Consumer Discretionary" },
  "RETAILING":                  { gics: "25503030", industry: "Broadline Retail",               sector: "Consumer Discretionary" },
  "LEISURE SERVICES":           { gics: "25301020", industry: "Hotels, Resorts & Cruise Lines", sector: "Consumer Discretionary" },
  "TELECOM - SERVICES":         { gics: "50102010", industry: "Wireless Telecommunication Services", sector: "Communication Services" },
  "MEDIA":                      { gics: "50201010", industry: "Broadcasting",                   sector: "Communication Services" },
  "REALTY":                     { gics: "60102520", industry: "Real Estate Development",        sector: "Real Estate" },
  "DIVERSIFIED":                { gics: "20105010", industry: "Industrial Conglomerates",       sector: "Industrials" },
};
const FALLBACK = { gics: "99999999", industry: "Unclassified", sector: "Unclassified" };

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function unwrapList(response) {
  const body = response.data;
  const rows = body?.data ?? body;
  if (!Array.isArray(rows)) throw new Error("Expected a list response from the backend.");
  return rows;
}

async function fetchText(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

function parseCsvLine(line) {
  const out = []; let cur = ""; let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]).map((h) => h.toUpperCase().trim());
  return lines.slice(1).map((l) => {
    const cells = parseCsvLine(l);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  });
}

function isValidIsin(isin) {
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)) return false;
  const digits = isin.slice(0, 11).split("")
    .map((c) => (/\d/.test(c) ? c : (c.charCodeAt(0) - 55).toString())).join("");
  let sum = 0, dbl = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = +digits[i];
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10 === +isin[11];
}

const classify = (raw) => GICS_MAP[(raw || "").toUpperCase().trim()] || FALLBACK;

// ═══════════════════════════════════════════════════════
//  LOADERS
// ═══════════════════════════════════════════════════════
async function loadNseEquity() {
  return parseCsv(await fetchText(SOURCES.nseEquity))
    .filter((r) => ["EQ", "BE", "BZ"].includes(r["SERIES"]))
    .map((r) => ({
      symbol: r["SYMBOL"], name: r["NAME OF COMPANY"], exchange: "NSE",
      isin: r["ISIN NUMBER"], ...FALLBACK, country: "India",
      equityCategory: "SMALL_CAP", _market: "MAINBOARD",
    }));
}

async function loadNseSme() {
  return parseCsv(await fetchText(SOURCES.nseSme)).map((r) => ({
    symbol: r["SYMBOL"], name: r["NAME OF COMPANY"], exchange: "NSE",
    isin: r["ISIN NUMBER"], ...FALLBACK, country: "India",
    equityCategory: "MICRO_CAP", _market: "SME",
  }));
}

async function loadNseEtf() {
  return parseCsv(await fetchText(SOURCES.nseEtf)).map((r) => ({
    symbol: r["SYMBOL"],
    name: r["SECURITY NAME"] || r["NAME OF COMPANY"] || r["UNDERLYING"],
    exchange: "NSE", isin: r["ISIN NUMBER"] || r["ISIN"],
    gics: "40203010", industry: "Exchange Traded Fund", sector: "Financial Services",
    country: "India", equityCategory: null, assetKey: "Equity ETF|Index ETF",
    _market: "ETF",
  }));
}

async function loadBse() {
  const json = JSON.parse(await fetchText(SOURCES.bseScrips));
  const rows = Array.isArray(json) ? json : json.Table || [];
  return rows.filter((r) => r.ISIN_NUMBER && r.Status === "Active").map((r) => ({
    symbol: r.scrip_id, name: r.Issuer_Name || r.Scrip_Name, exchange: "BSE",
    isin: r.ISIN_NUMBER, ...classify(r.Industry || r.INDUSTRY), country: "India",
    equityCategory: "SMALL_CAP", _market: "BSE_MAINBOARD",
    _mktCapCr: parseFloat(r.Mktcap) || null,
  }));
}

async function enrichNse(records, batchSize = 10, delayMs = 2000) {
  for (let i = 0; i < records.length; i += batchSize) {
    await Promise.allSettled(records.slice(i, i + batchSize).map(async (rec) => {
      try {
        const j = JSON.parse(await fetchText(
          `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(rec.symbol)}`
        ));
        const ind = j?.metadata?.industry || j?.info?.industry;
        if (ind) Object.assign(rec, classify(ind));
        const px = j?.priceInfo?.lastPrice, sz = j?.securityInfo?.issuedSize;
        if (px && sz) rec._mktCapCr = (px * sz) / 1e7;
      } catch { /* leave Unclassified */ }
    }));
    console.log(`     enriched ${Math.min(i + batchSize, records.length)}/${records.length}`);
    await sleep(delayMs);
  }
}

function assignCapBuckets(records) {
  const ranked = records.filter((r) => r.equityCategory !== null && r._mktCapCr)
    .sort((a, b) => b._mktCapCr - a._mktCapCr);
  ranked.forEach((r, i) => {
    if (r._market === "SME") { r.equityCategory = "MICRO_CAP"; return; }
    r.equityCategory = i < 100 ? "LARGE_CAP" : i < 250 ? "MID_CAP"
                     : i < 1000 ? "SMALL_CAP" : "MICRO_CAP";
  });
}

function dedupe(lists, preferExchange = "NSE") {
  const byIsin = new Map(), bySymbol = new Set(), rejected = [];
  for (const list of lists) for (const rec of list) {
    const isin = (rec.isin || "").toUpperCase();
    const symKey = `${rec.exchange}:${rec.symbol}`.toUpperCase();
    if (!isin || !isValidIsin(isin)) { rejected.push({ reason: "INVALID_ISIN", record: rec }); continue; }
    if (bySymbol.has(symKey))        { rejected.push({ reason: "DUPLICATE_SYMBOL", record: rec }); continue; }
    const existing = byIsin.get(isin);
    if (existing) {
      if (existing.exchange !== preferExchange && rec.exchange === preferExchange) {
        byIsin.set(isin, rec); bySymbol.add(symKey);
        rejected.push({ reason: "CROSS_LISTED_REPLACED", record: existing });
      } else {
        rejected.push({ reason: "CROSS_LISTED_DUPLICATE", record: rec });
      }
      continue;
    }
    byIsin.set(isin, rec); bySymbol.add(symKey);
  }
  return { merged: [...byIsin.values()], rejected };
}

// ═══════════════════════════════════════════════════════
//  STAGE 7 — INGESTION INTO SECURITY MASTER
// ═══════════════════════════════════════════════════════
async function postWithRetry(url, payload, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.post(url, payload);
    } catch (e) {
      const status = e.response?.status;
      const retryable = !status || status === 429 || status >= 500;
      if (!retryable || attempt === maxRetries) throw e;
      const wait = 500 * 2 ** attempt;
      console.warn(`     retry ${attempt + 1}/${maxRetries} for ${payload.symbol} after ${wait}ms (HTTP ${status ?? "network"})`);
      await sleep(wait);
    }
  }
}

function describeError(e) {
  const status = e.response?.status;
  const body = e.response?.data;
  const msg = typeof body === "string" ? body : body?.message ?? body?.error ?? e.message;
  return status ? `HTTP ${status} — ${msg}` : e.message;
}

async function ingest(records) {
  console.log(`\n7/7  Ingesting into ${MASTER_URL}${DRY_RUN ? "  [DRY RUN]" : ""}`);

  // ── Pull existing rows once, index for O(1) lookup ──
  let existingSymbols = new Set();
  let existingIsins = new Set();
  try {
    const currentStocks = unwrapList(
      await client.get(`${MASTER_URL}/api/stock-watchlist/all-stocks`)
    );
    existingSymbols = new Set(currentStocks.map((r) => String(r.symbol).toUpperCase()));
    existingIsins   = new Set(currentStocks.filter((r) => r.isin).map((r) => String(r.isin).toUpperCase()));
    console.log(`     existing rows in DB: ${currentStocks.length}`);
  } catch (e) {
    console.error(`     could not read existing stocks: ${describeError(e)}`);
    console.error(`     aborting — refusing to ingest without a dedupe baseline.`);
    process.exit(1);
  }

  // ── Partition ──
  const toInsert = [];
  const skipped = [];
  for (const rec of records) {
    const sym = String(rec.symbol).toUpperCase();
    const isin = String(rec.isin ?? "").toUpperCase();
    if (existingSymbols.has(sym))            { skipped.push({ symbol: rec.symbol, reason: "SYMBOL_EXISTS" }); continue; }
    if (isin && existingIsins.has(isin))     { skipped.push({ symbol: rec.symbol, reason: "ISIN_EXISTS" }); continue; }
    toInsert.push(rec);
    existingSymbols.add(sym);
    if (isin) existingIsins.add(isin);       // guard against intra-batch dupes
  }

  console.log(`     to insert: ${toInsert.length}   skipped: ${skipped.length}`);
  if (DRY_RUN) {
    await fs.writeFile("ingest-plan.json", JSON.stringify({ toInsert, skipped }, null, 2));
    console.log(`     dry run — plan written to ingest-plan.json`);
    return { added: 0, failed: [], skipped };
  }

  // ── Concurrent pool ──
  const failed = [];
  let added = 0;
  let cursor = 0;

  async function worker(id) {
    while (cursor < toInsert.length) {
      const idx = cursor++;
      const stock = toInsert[idx];

      // strip internal fields before POST
      const { _market, _mktCapCr, _bseCode, ...clean } = stock;
      const payload = {
        ...clean,
        assetId: clean.equityCategory === null ? ASSET_ID.ETF : ASSET_ID.EQUITY,
      };

      try {
        await postWithRetry(`${MASTER_URL}/api/stock-watchlist/add-stock`, payload);
        added++;
        if (added % 100 === 0) console.log(`     progress ${added}/${toInsert.length}`);
      } catch (e) {
        const detail = describeError(e);
        failed.push({ symbol: stock.symbol, isin: stock.isin, error: detail, payload });
        console.error(`     failed ${stock.symbol}: ${detail}`);
      }
      if (BATCH_DELAY) await sleep(BATCH_DELAY);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  if (failed.length) {
    await fs.writeFile("failed-records.json", JSON.stringify(failed, null, 2));
    console.log(`     ${failed.length} failures written to failed-records.json`);
    console.log(`     re-run with --retry-failed to retry just those`);
  }
  return { added, failed, skipped };
}

// ═══════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════
(async () => {
  const started = Date.now();
  let universe;

  if (RETRY_FAILED) {
    const failed = JSON.parse(await fs.readFile("failed-records.json", "utf8"));
    universe = failed.map((f) => f.payload);
    console.log(`Retrying ${universe.length} previously failed records…`);
  } else if (SKIP_BUILD) {
    universe = JSON.parse(await fs.readFile("universe.json", "utf8"));
    console.log(`Loaded ${universe.length} records from universe.json`);
  } else {
    console.log("1/7  Fetching NSE mainboard…");
    const nseEq = await loadNseEquity();           console.log(`     ${nseEq.length} rows`);
    console.log("2/7  Fetching NSE SME…");
    const nseSme = await loadNseSme().catch(() => []); console.log(`     ${nseSme.length} rows`);
    console.log("3/7  Fetching NSE ETFs…");
    const nseEtf = await loadNseEtf().catch(() => []); console.log(`     ${nseEtf.length} rows`);
    console.log("4/7  Fetching BSE scrips…");
    const bse = await loadBse().catch(() => []);   console.log(`     ${bse.length} rows`);

    console.log("5/7  Enriching NSE industry + market cap…");
    await enrichNse(nseEq);

    console.log("6/7  De-duplicating…");
    const { merged, rejected } = dedupe([nseEq, nseSme, bse, nseEtf]);
    assignCapBuckets(merged);

    universe = merged.map(({ _market, _mktCapCr, _bseCode, ...rest }) => rest);

    await fs.writeFile("universe.json", JSON.stringify(universe, null, 2));
    await fs.writeFile("universe.js", `export const stocks = ${JSON.stringify(universe, null, 2)};\n`);
    await fs.writeFile("audit-report.json", JSON.stringify({
      generatedAt: new Date().toISOString(),
      total: universe.length,
      equities: universe.filter((s) => s.equityCategory !== null).length,
      funds: universe.filter((s) => s.equityCategory === null).length,
      byExchange: universe.reduce((a, s) => ({ ...a, [s.exchange]: (a[s.exchange] || 0) + 1 }), {}),
      unclassified: universe.filter((s) => s.sector === "Unclassified").length,
      rejectedBreakdown: rejected.reduce((a, r) => ({ ...a, [r.reason]: (a[r.reason] || 0) + 1 }), {}),
    }, null, 2));
    console.log(`     ${universe.length} unique records → universe.json`);
  }

  const { added, failed, skipped } = await ingest(universe);

  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\n─────────────────────────────────────────`);
  console.log(` Universe records : ${universe.length}`);
  console.log(` Inserted         : ${added}`);
  console.log(` Skipped (exists) : ${skipped.length}`);
  console.log(` Failed           : ${failed.length}`);
  console.log(` Elapsed          : ${mins} min`);
  console.log(`─────────────────────────────────────────`);
})();