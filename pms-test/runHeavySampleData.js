import fs from "node:fs/promises";
import https from "node:https";
import axios from "axios";

const PMS_URL = process.env.PMS_BASE_URL ?? "http://localhost:8082";
const MASTER_URL = process.env.SECURITY_MASTER_BASE_URL ?? "http://localhost:8081";
const SAMPLE_USER = {
  name: process.env.SAMPLE_USER_NAME ?? "Heavy Sample Fund Manager",
  email: process.env.SAMPLE_USER_EMAIL ?? "heavy.sample.manager@example.com",
  phoneNumber: process.env.SAMPLE_USER_PHONE ?? "9000000002",
  role: "FUND_MANAGER",
  password: process.env.SAMPLE_USER_PASSWORD ?? "PmsDemo@12345",
};

const REQUIRED = {
  STOCKS: 2000,
  COMMODITIES: 10,
  MUTUAL_FUNDS: 1000,
  BONDS: 200,
  ETFS: 352,
};

const client = axios.create({ timeout: 30_000 });
const insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false });

const assetSpecs = [
  ["Cash", "Cash", "LOW", "SHORT"],
  ["Equity", "Stock", "HIGH", "LONG"],
  ["Mutual Fund", "Stock Funds", "HIGH", "LONG"],
  ["Mutual Fund", "Bond Funds", "LOW", "ANY"],
  ["Mutual Fund", "Index Funds", "MEDIUM", "ANY"],
  ["Mutual Fund", "Balanced Funds", "MEDIUM", "LONG"],
  ["Mutual Fund", "Money Market Funds", "LOW", "SHORT"],
  ["Mutual Fund", "Income Funds", "MEDIUM", "LONG"],
  ["Mutual Fund", "International/Global Funds", "HIGH", "LONG"],
  ["Mutual Fund", "Speciality Funds", "HIGH", "LONG"],
  ["Mutual Fund", "Exchange Traded Funds (ETFs)", "MEDIUM", "ANY"],
  ["Fixed Income", "T-Bills (Treasury Bills)", "LOW", "SHORT"],
  ["Fixed Income", "T-Notes (Treasury Notes)", "LOW", "ANY"],
  ["Fixed Income", "T-Bonds (Treasury Bonds)", "LOW", "LONG"],
  ["Fixed Income", "TIPS (Treasury Inflation-Protected Securities)", "LOW", "LONG"],
  ["Fixed Income", "Municipal Bond", "LOW", "LONG"],
  ["Fixed Income", "Corporation Bond", "MEDIUM", "MEDIUM"],
  ["Fixed Income", "Junk Bond", "HIGH", "MEDIUM"],
  ["Fixed Income", "Certificate of Deposit (CD)", "MEDIUM", "MEDIUM"],
  ["Commodities", "Gold", "LOW", "LONG"],
  ["REITs", "REITs", "MEDIUM", "LONG"],
  ["Equity ETF", "Index ETF", "HIGH", "LONG"],
  ["Debt ETF", "G-Sec ETF", "LOW", "SHORT_TO_MEDIUM"],
  ["Commodity ETF", "Physical ETF", "MEDIUM", "LONG"],
];

const NSE_COMMODITY_SYMBOLS = [
  { symbol: "GOLD", name: "Gold", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "SILVER", name: "Silver", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "COPPER", name: "Copper", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "CRUDEOIL", name: "Crude Oil", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "NATURALGAS", name: "Natural Gas", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "ALUMINIUM", name: "Aluminium", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "ZINC", name: "Zinc", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "LEAD", name: "Lead", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "NICKEL", name: "Nickel", exchange: "NSE", assetKey: "Commodities|Gold" },
  { symbol: "COTTON", name: "Cotton", exchange: "NSE", assetKey: "Commodities|Gold" },
];

const SAMPLE_MUTUAL_FUNDS = [
  { isin: "INF789F01XA0", schemeName: "UTI Nifty 50 Index Fund - Growth Option- Direct", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF179K01WM1", schemeName: "HDFC Nifty 50 Index Fund - Direct Plan", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF109K012M7", schemeName: "ICICI Prudential Nifty 50 Index Fund - Direct Plan Cumulative Option", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF200K01TE8", schemeName: "SBI NIFTY INDEX FUND - DIRECT PLAN - GROWTH", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF204K01II4", schemeName: "NIPPON INDIA INDEX FUND - NIFTY 50 PLAN - ANNUAL - IDCW Option", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF179K01DC2", schemeName: "HDFC Corporate Bond Fund - Growth Option", assetKey: "Mutual Fund|Bond Funds", equityCategory: null },
  { isin: "INF209K01S38", schemeName: "Aditya Birla Sun Life Corporate Bond Fund - Growth - Direct Plan", assetKey: "Mutual Fund|Bond Funds", equityCategory: null },
  { isin: "INF109K016B1", schemeName: "ICICI Prudential Corporate Bond Fund - Direct Plan - Growth", assetKey: "Mutual Fund|Bond Funds", equityCategory: null },
  { isin: "INF179K01830", schemeName: "HDFC Balanced Advantage Fund - Growth Plan", assetKey: "Mutual Fund|Balanced Funds", equityCategory: null },
  { isin: "INF209K01JY8", schemeName: "Aditya Birla Sun Life Money Manager Fund - RETAIL - WEEKLY IDCW", assetKey: "Mutual Fund|Money Market Funds", equityCategory: null },
];

const SAMPLE_BONDS = [
  { isin: "INE009A01241", name: "Infosys Limited 7.85% 2029", issuerName: "Infosys Tech Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.0785, couponFrequency: "SemiAnnual", issueDate: "2019-05-20", maturityDate: "2029-05-20", creditRating: "A-" },
  { isin: "INE467B01211", name: "Tata Consultancy 7.60% 2028", issuerName: "Tata Consultancy Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.076, couponFrequency: "SemiAnnual", issueDate: "2018-08-10", maturityDate: "2028-08-10", creditRating: "A-" },
  { isin: "INE075A01332", name: "Wipro Limited 7.20% 2027", issuerName: "Wipro Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.072, couponFrequency: "Annual", issueDate: "2017-03-15", maturityDate: "2027-03-15", creditRating: "BBB+" },
  { isin: "INE860A01418", name: "HCL Technologies 8.10% 2030", issuerName: "HCL Technologies Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.081, couponFrequency: "SemiAnnual", issueDate: "2020-06-01", maturityDate: "2030-06-01", creditRating: "A-" },
  { isin: "INE669C01325", name: "Tech Mahindra 7.45% 2026", issuerName: "Tech Mahindra Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.0745, couponFrequency: "SemiAnnual", issueDate: "2016-11-20", maturityDate: "2026-11-20", creditRating: "BBB+" },
  { isin: "INE214T01127", name: "LTIM Limited 6.95% 2027", issuerName: "LTIM Limited", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.0695, couponFrequency: "Annual", issueDate: "2017-09-12", maturityDate: "2027-09-12", creditRating: "BBB" },
  { isin: "INE262H01234", name: "Persistent Systems 7.30% 2028", issuerName: "Persistent Systems Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.073, couponFrequency: "SemiAnnual", issueDate: "2018-04-05", maturityDate: "2028-04-05", creditRating: "BBB+" },
  { isin: "INE591G01129", name: "Coforge Limited 8.40% 2031", issuerName: "Coforge Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.084, couponFrequency: "SemiAnnual", issueDate: "2021-02-18", maturityDate: "2031-02-18", creditRating: "A-" },
  { isin: "INE356A01133", name: "Mphasis Limited 7.55% 2029", issuerName: "Mphasis Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.0755, couponFrequency: "Annual", issueDate: "2019-07-25", maturityDate: "2029-07-25", creditRating: "BBB" },
  { isin: "INE881D01231", name: "Oracle Financial Services 7.05% 2028", issuerName: "Oracle Financial Services Ltd", bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000, couponRate: 0.0705, couponFrequency: "SemiAnnual", issueDate: "2018-10-30", maturityDate: "2028-10-30", creditRating: "A-" },
];

const AMFI_MUTUAL_FUND_CATEGORIES = [
  "Mutual Fund|Index Funds",
  "Mutual Fund|Bond Funds",
  "Mutual Fund|Balanced Funds",
  "Mutual Fund|Money Market Funds",
  "Mutual Fund|Income Funds",
  "Mutual Fund|International/Global Funds",
  "Mutual Fund|Speciality Funds",
  "Mutual Fund|Stock Funds",
];

function unwrapList(response) {
  const body = response.data;
  const rows = body?.data ?? body;
  if (!Array.isArray(rows)) throw new Error("Expected list response from backend.");
  return rows;
}

function assetKey(asset) {
  return `${asset.assetClass}|${asset.assetSubclass}`;
}

async function fetchText(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        responseType: "text",
        timeout: 30_000,
        httpsAgent: insecureHttpsAgent,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "text/csv,application/json,*/*",
          Referer: "https://www.nseindia.com/",
        },
      });
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

function parseCsvLine(line) {
  const output = [];
  let current = "";
  let inQuotes = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      output.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  output.push(current.trim());
  return output;
}

function normalizeHeaderName(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const header = parseCsvLine(lines[0]).map((item) => normalizeHeaderName(item));

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""]));
  });
}

async function loadNseUniverse() {
  try {
    const raw = await fs.readFile("universe.json", "utf8");
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) throw new Error("universe.json is not an array");
    return rows.filter((row) => row.exchange === "NSE");
  } catch {
    const text = await fetchText("https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv");
    return parseCsv(text)
      .filter((row) => ["EQ", "BE", "BZ"].includes(row["SERIES"]))
      .map((row) => ({
        symbol: row["SYMBOL"],
        name: row["NAMEOFCOMPANY"],
        exchange: "NSE",
        isin: row["ISINNUMBER"],
        country: "India",
        equityCategory: "SMALL_CAP",
      }));
  }
}

async function loadNseEtfs() {
  const text = await fetchText("https://nsearchives.nseindia.com/content/equities/eq_etfseclist.csv");
  return parseCsv(text)
    .filter((row) => row["SYMBOL"] && row["ISINNUMBER"])
    .map((row) => ({
      symbol: row["SYMBOL"],
      name: row["SECURITYNAME"] || row["NAMEOFCOMPANY"] || row["UNDERLYING"],
      exchange: "NSE",
      isin: row["ISINNUMBER"] || row["ISIN"],
      country: "India",
      assetKey: "Equity ETF|Index ETF",
      equityCategory: null,
    }));
}

function buildGeneratedMutualFundPool(count = REQUIRED.MUTUAL_FUNDS) {
  const output = [];
  for (let i = 0; i < count; i++) {
    const ref = SAMPLE_MUTUAL_FUNDS[i % SAMPLE_MUTUAL_FUNDS.length];
    const assetKey = AMFI_MUTUAL_FUND_CATEGORIES[i % AMFI_MUTUAL_FUND_CATEGORIES.length];
    output.push({
      ...ref,
      assetKey,
      isin: `${ref.isin.slice(0, 12)}${String(i + 1).padStart(3, "0")}`,
      schemeName: `${ref.schemeName} ${i + 1}`,
      exchange: "NSE",
      country: "India",
    });
  }
  return output;
}

function buildGeneratedBondPool(count = REQUIRED.BONDS) {
  const output = [];
  for (let i = 0; i < count; i++) {
    const ref = SAMPLE_BONDS[i % SAMPLE_BONDS.length];
    output.push({
      ...ref,
      isin: `${ref.isin.slice(0, 12)}${String(i + 1).padStart(3, "0")}`,
      name: `${ref.name} ${i + 1}`,
      exchange: "NSE",
      country: "India",
    });
  }
  return output;
}

function getRowValue(row, candidates) {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const direct = row[candidate];
    if (direct !== undefined && String(direct).trim()) return String(direct).trim();
    const match = keys.find((key) => normalizeHeaderName(key) === normalizeHeaderName(candidate));
    if (match && row[match] !== undefined && String(row[match]).trim()) return String(row[match]).trim();
  }
  return "";
}

function inferMutualFundAssetKey(schemeName, row = {}) {
  const haystack = `${schemeName} ${JSON.stringify(row)}`.toUpperCase();
  if (haystack.includes("BOND") || haystack.includes("GILT") || haystack.includes("CORPORATE")) return "Mutual Fund|Bond Funds";
  if (haystack.includes("BALANCED") || haystack.includes("ADVANTAGE")) return "Mutual Fund|Balanced Funds";
  if (haystack.includes("MONEY") || haystack.includes("LIQUID") || haystack.includes("TREASURY")) return "Mutual Fund|Money Market Funds";
  if (haystack.includes("INCOME") || haystack.includes("YIELD")) return "Mutual Fund|Income Funds";
  if (haystack.includes("GLOBAL") || haystack.includes("INTERNATIONAL") || haystack.includes("OVERSEAS")) return "Mutual Fund|International/Global Funds";
  if (haystack.includes("INDEX") || haystack.includes("NIFTY") || haystack.includes("SENSEX")) return "Mutual Fund|Index Funds";
  if (haystack.includes("EQUITY") || haystack.includes("STOCK")) return "Mutual Fund|Stock Funds";
  if (haystack.includes("SPECIALTY") || haystack.includes("THEME") || haystack.includes("SECTOR")) return "Mutual Fund|Speciality Funds";
  return AMFI_MUTUAL_FUND_CATEGORIES[0];
}

async function loadAmfiMutualFunds(required = REQUIRED.MUTUAL_FUNDS) {
  const csvUrl = "https://api.tigzig.com/mf/v1/download/amfi_nav_master_latest.csv";
  try {
    const text = await fetchText(csvUrl);
    const rows = parseCsv(text);
    if (!rows.length) throw new Error("AMFI CSV response was empty.");

    const funds = rows
      .map((row) => {
        const schemeName = getRowValue(row, ["SCHEME_NAME", "SCHEMENAME", "FUND_NAME", "NAME", "SCHEME"]);
        const isin = getRowValue(row, ["ISIN", "ISIN_NUMBER", "ISINNUMBER"]);
        const amfiCode = getRowValue(row, ["AMFI_CODE", "AMFICODE", "SCHEME_CODE", "CODE"]);
        if (!schemeName) return null;
        return {
          isin: isin || `AMFI${amfiCode || String(Math.random()).slice(2, 12)}`,
          schemeName,
          assetKey: inferMutualFundAssetKey(schemeName, row),
          exchange: "AMFI",
          country: "India",
          amfiCode,
          source: "TigZig AMFI",
        };
      })
      .filter(Boolean)
      .slice(0, required);

    if (funds.length >= required) return funds;
    return [...funds, ...buildGeneratedMutualFundPool(required - funds.length)];
  } catch (error) {
    console.warn("AMFI mutual-fund download failed; falling back to generated sample mutual funds.", error.message);
    return buildGeneratedMutualFundPool(required);
  }
}

function buildHeavySample() {
  return {
    stocks: [],
    commodities: NSE_COMMODITY_SYMBOLS,
    mutualFunds: [],
    bonds: buildGeneratedBondPool(),
    etfs: [],
  };
}

function ensurePossible(report) {
  const issues = [];

  if (report.stocks.length < REQUIRED.STOCKS) issues.push(`Needed ${REQUIRED.STOCKS} stocks but only ${report.stocks.length} are available in the NSE universe.`);
  if (report.commodities.length < REQUIRED.COMMODITIES) issues.push(`Needed ${REQUIRED.COMMODITIES} commodities but only ${report.commodities.length} are available in the NSE commodity list.`);
  if (report.mutualFunds.length < REQUIRED.MUTUAL_FUNDS) issues.push(`Needed ${REQUIRED.MUTUAL_FUNDS} mutual funds but only ${report.mutualFunds.length} were generated from the local NSE sample pool.`);
  if (report.bonds.length < REQUIRED.BONDS) issues.push(`Needed ${REQUIRED.BONDS} bonds but only ${report.bonds.length} were generated from the local NSE sample pool.`);
  if (report.etfs.length < REQUIRED.ETFS) issues.push(`Needed ${REQUIRED.ETFS} ETFs but only ${report.etfs.length} are available in the NSE ETF list.`);

  if (issues.length) {
    throw new Error(`Heavy sample is not feasible in this environment:\n- ${issues.join("\n- ")}`);
  }
}

async function ensureAssets() {
  console.log("[1/5] Ensuring asset catalog...");
  const current = unwrapList(await client.get(`${MASTER_URL}/api/assets/all-assets`));
  const ids = new Map(current.map((asset) => [assetKey(asset), asset.id]));

  for (const [assetClass, assetSubclass, risk, investmentHorizon] of assetSpecs) {
    const key = `${assetClass}|${assetSubclass}`;
    if (ids.has(key)) continue;
    const payload = {
      assetClass,
      description: `${assetClass} asset class`,
      assetSubclass,
      risk,
      investmentHorizon,
      subAssetDescription: `${assetSubclass} security category`,
      status: true,
    };
    await client.post(`${MASTER_URL}/api/assets/add-asset`, payload);
    const refreshed = unwrapList(await client.get(`${MASTER_URL}/api/assets/all-assets`));
    const created = refreshed.find((asset) => assetKey(asset) === key);
    if (!created) throw new Error(`Asset was not returned after creating ${key}.`);
    ids.set(key, created.id);
  }

  return ids;
}

async function ensureWatchlists(assets, sample) {
  console.log("[2/5] Inserting heavy sample into security watchlists...");

  const currentStocks = unwrapList(await client.get(`${MASTER_URL}/api/stock-watchlist/all-stocks`));
  for (const stock of sample.stocks) {
    if (currentStocks.some((row) => row.symbol === stock.symbol)) continue;
    const { assetKey: _assetKey, ...fields } = stock;
    await client.post(`${MASTER_URL}/api/stock-watchlist/add-stock`, {
      ...fields,
      assetId: assets.get("Equity|Stock"),
    });
  }

  const currentEtfs = unwrapList(await client.get(`${MASTER_URL}/api/stock-watchlist/all-stocks`));
  for (const etf of sample.etfs) {
    if (currentEtfs.some((row) => row.symbol === etf.symbol)) continue;
    await client.post(`${MASTER_URL}/api/stock-watchlist/add-stock`, {
      ...etf,
      assetId: assets.get("Equity ETF|Index ETF"),
    });
  }

  const currentFunds = unwrapList(await client.get(`${MASTER_URL}/api/mutualfunds-watchlist/all-mutual-funds`));
  for (const fund of sample.mutualFunds) {
    if (currentFunds.some((row) => row.isin === fund.isin)) continue;
    const { assetKey: key, ...fields } = fund;
    await client.post(`${MASTER_URL}/api/mutualfunds-watchlist/add-mutual-fund`, {
      ...fields,
      assetId: assets.get(key || "Mutual Fund|Index Funds"),
    });
  }

  const currentCommodities = unwrapList(await client.get(`${MASTER_URL}/api/commodity-watchlist/all-commodities`));
  for (const commodity of sample.commodities) {
    if (currentCommodities.some((row) => row.symbol === commodity.symbol)) continue;
    const { assetKey: _key, ...fields } = commodity;
    await client.post(`${MASTER_URL}/api/commodity-watchlist/add-commodity`, {
      ...fields,
      assetId: assets.get("Commodities|Gold"),
    });
  }

  const currentBonds = unwrapList(await client.get(`${MASTER_URL}/api/bonds/all-bonds`));
  for (const bond of sample.bonds) {
    if (currentBonds.some((row) => row.isin === bond.isin)) continue;
    await client.post(`${MASTER_URL}/api/bonds/add-bond`, {
      ...bond,
      assetId: assets.get("Fixed Income|Corporation Bond"),
    });
  }
}

async function ensureSampleUser() {
  console.log("[3/5] Ensuring heavy-sample PMS user...");
  const login = () => client.post(`${PMS_URL}/api/users/login`, {
    email: SAMPLE_USER.email,
    password: SAMPLE_USER.password,
  });

  try {
    await client.post(`${PMS_URL}/api/users/register`, SAMPLE_USER);
  } catch (registerError) {
    try {
      await login();
    } catch {
      throw new Error(`Could not create or sign in as ${SAMPLE_USER.email}: ${registerError.response?.data?.message ?? registerError.message}`);
    }
  }

  const response = await login();
  const user = response.data?.data;
  if (!user?.userId) throw new Error("Login response did not contain userId.");
  return user;
}

async function ensureSampleTheme(userId, assets) {
  console.log("[4/5] Ensuring sample theme ...");
  const themeName = "Heavy Sample Balanced 60-25-15";
  const themes = unwrapList(await client.get(`${PMS_URL}/api/themes/get-all-themes`, { params: { userId } }));
  if (themes.some((theme) => theme.name === themeName)) return;

  await client.post(`${PMS_URL}/api/themes/add-theme`, {
    name: themeName,
    risk: "MEDIUM",
    investmentHorizon: "LONG",
    userId,
    allocationRuleList: [
      { assetId: assets.get("Equity|Stock"), percentage: 60 },
      { assetId: assets.get("Mutual Fund|Index Funds"), percentage: 25 },
      { assetId: assets.get("Commodities|Gold"), percentage: 15 },
    ],
  });
}

async function runBatch() {
  console.log("[5/5] Running batch pipeline...");
  const response = await client.post(`${MASTER_URL}/api/v1/batch/run-all`);
  const result = response.data?.data ?? response.data;
  const jobs = Object.entries(result ?? {}).filter(([, value]) => value && typeof value === "object" && "status" in value);
  const failed = jobs.filter(([, value]) => !["COMPLETED", "SKIPPED"].includes(value.status));
  if (failed.length) {
    throw new Error(`Batch finished with unsuccessful jobs: ${failed.map(([name, value]) => `${name}=${value.status}`).join(", ")}`);
  }
  console.log(`Batch inspected ${jobs.length} jobs successfully.`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");

  try {
    const universe = await loadNseUniverse();
    const etfs = await loadNseEtfs();
    const sample = buildHeavySample();
    sample.stocks = universe.slice(0, REQUIRED.STOCKS + 100);
    sample.etfs = etfs.slice(0, REQUIRED.ETFS);
    sample.mutualFunds = await loadAmfiMutualFunds(REQUIRED.MUTUAL_FUNDS);

    console.log("Feasibility check:");
    console.log(`- Stocks available in NSE universe: ${sample.stocks.length}`);
    console.log(`- Commodities available in NSE list: ${sample.commodities.length}`);
    console.log(`- ETFs available in NSE ETF list: ${sample.etfs.length}`);
    console.log(`- Mutual funds available from AMFI/TigZig: ${sample.mutualFunds.length}`);
    console.log(`- Bonds generated for sample: ${sample.bonds.length}`);

    ensurePossible(sample);

    if (dryRun) {
      console.log("Dry run successful: all heavy sample counts are feasible under the NSE-backed data sources.");
      return;
    }

    const assets = await ensureAssets();
    await ensureWatchlists(assets, sample);
    const user = await ensureSampleUser();
    await ensureSampleTheme(user.userId, assets);
    await runBatch();

    console.log("\nHeavy sample data setup completed.");
  } catch (error) {
    const details = error.response?.data?.message ?? error.response?.data ?? error.message;
    console.error("\nHeavy-sample setup stopped:");
    console.error(details);
    process.exitCode = 1;
  }
}

main();
