import axios from "axios";

// One repeatable local seed-and-load command for the PMS + Unified Security
// Master services. Override these values with environment variables as needed.
const PMS_URL = process.env.PMS_BASE_URL ?? "http://localhost:8082";
const MASTER_URL = process.env.SECURITY_MASTER_BASE_URL ?? "http://localhost:8081";
const SAMPLE_USER = {
  name: process.env.SAMPLE_USER_NAME ?? "Sample Fund Manager",
  email: process.env.SAMPLE_USER_EMAIL ?? "sample.manager@example.com",
  phoneNumber: process.env.SAMPLE_USER_PHONE ?? "9000000001",
  role: "FUND_MANAGER",
  password: process.env.SAMPLE_USER_PASSWORD ?? "PmsDemo@12345",
};

const client = axios.create({ timeout: 30_000 });

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

const stocks = [
  { symbol: "INFY", name: "Infosys Limited", exchange: "NSE", isin: "INE009A01021", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "TCS", name: "Tata Consultancy Services Limited", exchange: "NSE", isin: "INE467B01029", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "WIPRO", name: "Wipro Limited", exchange: "NSE", isin: "INE075A01022", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "HCLTECH", name: "HCL Technologies Limited", exchange: "NSE", isin: "INE860A01027", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "TECHM", name: "Tech Mahindra Limited", exchange: "NSE", isin: "INE669C01036", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "LTIM", name: "LTIMindtree Limited", exchange: "NSE", isin: "INE214T01019", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "PERSISTENT", name: "Persistent Systems Limited", exchange: "NSE", isin: "INE262H01021", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "MID_CAP" },
  { symbol: "COFORGE", name: "Coforge Limited", exchange: "NSE", isin: "INE591G01017", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "MID_CAP" },
  { symbol: "MPHASIS", name: "Mphasis Limited", exchange: "NSE", isin: "INE356A01018", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "OFSS", name: "Oracle Financial Services Software Limited", exchange: "NSE", isin: "INE881D01027", gics: "45103010", country: "India", industry: "Application Software", sector: "Information Technology", equityCategory: "LARGE_CAP" },
  { symbol: "LTTS", name: "L&T Technology Services Limited", exchange: "NSE", isin: "INE010V01017", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "MID_CAP" },
  { symbol: "TATAELXSI", name: "Tata Elxsi Limited", exchange: "NSE", isin: "INE670A01012", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "MID_CAP" },
  { symbol: "KPITTECH", name: "KPIT Technologies Limited", exchange: "NSE", isin: "INE04I401011", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "MID_CAP" },
  { symbol: "CYIENT", name: "Cyient Limited", exchange: "NSE", isin: "INE136B01020", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "MID_CAP" },
  { symbol: "BSOFT", name: "Birlasoft Limited", exchange: "NSE", isin: "INE836A01035", gics: "45102010", country: "India", industry: "IT Consulting & Other Services", sector: "Information Technology", equityCategory: "MID_CAP" },
  { symbol: "NIFTYBEES", name: "Nippon India ETF Nifty 50 BeES", exchange: "NSE", isin: "INF204KB14I2", gics: "40203010", country: "India", industry: "Exchange Traded Fund", sector: "Financial Services", equityCategory: null, assetKey: "Equity ETF|Index ETF" },
  { symbol: "BANKBEES", name: "Nippon India ETF Nifty Bank BeES", exchange: "NSE", isin: "INF204KB15I9", gics: "40203010", country: "India", industry: "Exchange Traded Fund", sector: "Financial Services", equityCategory: null, assetKey: "Equity ETF|Index ETF" },
  { symbol: "MID150BEES", name: "Nippon India ETF Nifty Midcap 150", exchange: "NSE", isin: "INF204KB1V68", gics: "40203010", country: "India", industry: "Exchange Traded Fund", sector: "Financial Services", equityCategory: null, assetKey: "Equity ETF|Index ETF" },
  { symbol: "GOLDBEES", name: "Nippon India ETF Gold BeES", exchange: "NSE", isin: "INF204KB17I5", gics: "40203010", country: "India", industry: "Exchange Traded Fund", sector: "Commodity", equityCategory: null, assetKey: "Commodity ETF|Physical ETF" },
  { symbol: "SILVERBEES", name: "Nippon India ETF Silver BeES", exchange: "NSE", isin: "INF204KC1402", gics: "40203010", country: "India", industry: "Exchange Traded Fund", sector: "Commodity", equityCategory: null, assetKey: "Commodity ETF|Physical ETF" },
];

const mutualFunds = [
  // Nifty 50 index funds are large-cap equity funds.
  { isin: "INF789F01XA0", schemeName: "UTI Nifty 50 Index Fund - Growth Option- Direct", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF179K01WM1", schemeName: "HDFC Nifty 50 Index Fund - Direct Plan", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF109K012M7", schemeName: "ICICI Prudential Nifty 50 Index Fund - Direct Plan Cumulative Option", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF200K01TE8", schemeName: "SBI NIFTY INDEX FUND - DIRECT PLAN - GROWTH", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  { isin: "INF204K01II4", schemeName: "NIPPON INDIA INDEX FUND - NIFTY 50 PLAN - ANNUAL - IDCW Option", assetKey: "Mutual Fund|Index Funds", equityCategory: "LARGE_CAP" },
  // These fixed-income and hybrid funds do not have one single market-cap category.
  { isin: "INF179K01DC2", schemeName: "HDFC Corporate Bond Fund - Growth Option", assetKey: "Mutual Fund|Bond Funds", equityCategory: null },
  { isin: "INF209K01S38", schemeName: "Aditya Birla Sun Life Corporate Bond Fund - Growth - Direct Plan", assetKey: "Mutual Fund|Bond Funds", equityCategory: null },
  { isin: "INF109K016B1", schemeName: "ICICI Prudential Corporate Bond Fund - Direct Plan - Growth", assetKey: "Mutual Fund|Bond Funds", equityCategory: null },
  { isin: "INF179K01830", schemeName: "HDFC Balanced Advantage Fund - Growth Plan", assetKey: "Mutual Fund|Balanced Funds", equityCategory: null },
  { isin: "INF209K01JY8", schemeName: "Aditya Birla Sun Life Money Manager Fund - RETAIL - WEEKLY IDCW", assetKey: "Mutual Fund|Money Market Funds", equityCategory: null },
];

const commodity = {
  productId: "10001",
  symbol: "GOLD",
  name: "Gold Spot",
  quotation: "1 Gram",
  unit: "1 Gram",
  exchange: "NSE",
  status: true,
  assetKey: "Commodities|Gold",
};

const bonds = [
  {
    isin: "INE009A01241", name: "Infosys Limited 7.85% 2029", issuerName: "Infosys Tech Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0785, couponFrequency: "SemiAnnual", issueDate: "2019-05-20",
    maturityDate: "2029-05-20", creditRating: "A-",
  },
  {
    isin: "INE467B01211", name: "Tata Consultancy 7.60% 2028", issuerName: "Tata Consultancy Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.076, couponFrequency: "SemiAnnual", issueDate: "2018-08-10",
    maturityDate: "2028-08-10", creditRating: "A-",
  },
  {
    isin: "INE075A01332", name: "Wipro Limited 7.20% 2027", issuerName: "Wipro Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.072, couponFrequency: "Annual", issueDate: "2017-03-15",
    maturityDate: "2027-03-15", creditRating: "BBB+",
  },
  {
    isin: "INE860A01418", name: "HCL Technologies 8.10% 2030", issuerName: "HCL Technologies Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.081, couponFrequency: "SemiAnnual", issueDate: "2020-06-01",
    maturityDate: "2030-06-01", creditRating: "A-",
  },
  {
    isin: "INE669C01325", name: "Tech Mahindra 7.45% 2026", issuerName: "Tech Mahindra Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0745, couponFrequency: "SemiAnnual", issueDate: "2016-11-20",
    maturityDate: "2026-11-20", creditRating: "BBB+",
  },
  {
    isin: "INE214T01127", name: "LTIM Limited 6.95% 2027", issuerName: "LTIM Limited",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0695, couponFrequency: "Annual", issueDate: "2017-09-12",
    maturityDate: "2027-09-12", creditRating: "BBB",
  },
  {
    isin: "INE262H01234", name: "Persistent Systems 7.30% 2028", issuerName: "Persistent Systems Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.073, couponFrequency: "SemiAnnual", issueDate: "2018-04-05",
    maturityDate: "2028-04-05", creditRating: "BBB+",
  },
  {
    isin: "INE591G01129", name: "Coforge Limited 8.40% 2031", issuerName: "Coforge Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.084, couponFrequency: "SemiAnnual", issueDate: "2021-02-18",
    maturityDate: "2031-02-18", creditRating: "A-",
  },
  {
    isin: "INE356A01133", name: "Mphasis Limited 7.55% 2029", issuerName: "Mphasis Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0755, couponFrequency: "Annual", issueDate: "2019-07-25",
    maturityDate: "2029-07-25", creditRating: "BBB",
  },
  {
    isin: "INE881D01231", name: "Oracle Financial Services 7.05% 2028", issuerName: "Oracle Financial Services Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0705, couponFrequency: "SemiAnnual", issueDate: "2018-10-30",
    maturityDate: "2028-10-30", creditRating: "A-",
  },
  {
    isin: "INE010V01235", name: "L&T Technology Services 7.75% 2030", issuerName: "L&T Technology Services Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0775, couponFrequency: "SemiAnnual", issueDate: "2020-01-15",
    maturityDate: "2030-01-15", creditRating: "A-",
  },
  {
    isin: "INE670A01337", name: "Tata Elxsi Limited 6.85% 2027", issuerName: "Tata Elxsi Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0685, couponFrequency: "Annual", issueDate: "2017-06-10",
    maturityDate: "2027-06-10", creditRating: "BBB+",
  },
  {
    isin: "INE04I401135", name: "KPIT Technologies 8.25% 2029", issuerName: "KPIT Technologies Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.0825, couponFrequency: "SemiAnnual", issueDate: "2019-12-01",
    maturityDate: "2029-12-01", creditRating: "A-",
  },
  {
    isin: "INE136B01139", name: "Cyient Limited 7.40% 2028", issuerName: "Cyient Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.074, couponFrequency: "Annual", issueDate: "2018-03-22",
    maturityDate: "2028-03-22", creditRating: "BBB",
  },
  {
    isin: "INE836A01332", name: "Birlasoft Limited 7.90% 2031", issuerName: "Birlasoft Ltd",
    bondType: "Corporate", exchange: "NSE", currency: "INR", country: "India", faceValue: 1000,
    couponRate: 0.079, couponFrequency: "SemiAnnual", issueDate: "2021-05-10",
    maturityDate: "2031-05-10", creditRating: "A-",
  },
];

function unwrapList(response) {
  const body = response.data;
  const rows = body?.data ?? body;
  if (!Array.isArray(rows)) throw new Error("Expected a list response from the backend.");
  return rows;
}

function assetKey(asset) {
  return `${asset.assetClass}|${asset.assetSubclass}`;
}

async function ensureAssets() {
  console.log("[1/5] Ensuring asset reference data...");
  let current = unwrapList(await client.get(`${MASTER_URL}/api/assets/all-assets`));
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
    current = unwrapList(await client.get(`${MASTER_URL}/api/assets/all-assets`));
    const created = current.find((asset) => assetKey(asset) === key);
    if (!created) throw new Error(`Asset was not returned after creating ${key}.`);
    ids.set(key, created.id);
    console.log(`  added ${key} (id ${created.id})`);
  }
  return ids;
}

async function ensureWatchlists(assets) {
  console.log("[2/5] Ensuring sample securities in watchlists...");

  const currentStocks = unwrapList(await client.get(`${MASTER_URL}/api/stock-watchlist/all-stocks`));
  for (const stock of stocks) {
    if (currentStocks.some((row) => row.symbol === stock.symbol)) continue;
    const key = stock.assetKey ?? "Equity|Stock";
    const { assetKey: _assetKey, ...fields } = stock;
    await client.post(`${MASTER_URL}/api/stock-watchlist/add-stock`, {
      ...fields,
      assetId: assets.get(key),
    });
    console.log(`  added ${stock.symbol}`);
  }

  const currentFunds = unwrapList(await client.get(`${MASTER_URL}/api/mutualfunds-watchlist/all-mutual-funds`));
  for (const fund of mutualFunds) {
    if (currentFunds.some((row) => row.isin === fund.isin)) continue;
    const { assetKey: key, ...fields } = fund;
    await client.post(`${MASTER_URL}/api/mutualfunds-watchlist/add-mutual-fund`, {
      ...fields,
      assetId: assets.get(key),
    });
    console.log(`  added ${fund.schemeName}`);
  }

  const currentCommodities = unwrapList(await client.get(`${MASTER_URL}/api/commodity-watchlist/all-commodities`));
  if (!currentCommodities.some((row) => row.symbol === commodity.symbol)) {
    const { assetKey: key, ...fields } = commodity;
    await client.post(`${MASTER_URL}/api/commodity-watchlist/add-commodity`, {
      ...fields,
      assetId: assets.get(key),
    });
    console.log("  added GOLD spot");
  }

  const currentBonds = unwrapList(await client.get(`${MASTER_URL}/api/bonds/all-bonds`));
  for (const bond of bonds) {
    if (currentBonds.some((row) => row.isin === bond.isin)) continue;
    await client.post(`${MASTER_URL}/api/bonds/add-bond`, {
      ...bond,
      assetId: assets.get("Fixed Income|Corporation Bond"),
    });
    console.log(`  added ${bond.name}`);
  }
}

async function ensureSampleUser() {
  console.log("[3/5] Ensuring sample PMS user...");
  const login = () => client.post(`${PMS_URL}/api/users/login`, {
    email: SAMPLE_USER.email,
    password: SAMPLE_USER.password,
  });

  try {
    await client.post(`${PMS_URL}/api/users/register`, SAMPLE_USER);
    console.log(`  created user ${SAMPLE_USER.email}`);
  } catch (registerError) {
    // Registration rejects an existing email. Confirm that the configured
    // password belongs to that account before proceeding.
    try {
      await login();
    } catch {
      throw new Error(
        `Could not create or sign in as ${SAMPLE_USER.email}: ` +
        `${registerError.response?.data?.message ?? registerError.message}. ` +
        "If this email already exists, set SAMPLE_USER_EMAIL and SAMPLE_USER_PASSWORD to its credentials.",
      );
    }
    console.log(`  sample user already exists: ${SAMPLE_USER.email}`);
  }

  try {
    const response = await login();
    const user = response.data?.data;
    if (!user?.userId) throw new Error("Login response did not contain userId.");
    console.log(`  authenticated user id ${user.userId}`);
    return user;
  } catch (error) {
    if (error.message.includes("did not contain userId")) throw error;
    throw new Error(`Sample user login failed: ${error.response?.data?.message ?? error.message}`);
  }
}

async function ensureSampleTheme(userId, assets) {
  console.log("[4/5] Ensuring sample theme...");
  const themeName = "Sample Balanced 60-25-15";
  const themes = unwrapList(await client.get(`${PMS_URL}/api/themes/get-all-themes`, { params: { userId } }));
  if (themes.some((theme) => theme.name === themeName)) {
    console.log(`  theme already exists for user ${userId}`);
    return;
  }

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
  console.log(`  created theme for user ${userId}`);
}

async function runBatch() {
  console.log("[5/5] Starting the unified batch pipeline...");
  const response = await client.post(`${MASTER_URL}/api/v1/batch/run-all`);
  const result = response.data?.data ?? response.data;
  console.log(JSON.stringify(result, null, 2));

  const jobs = Object.entries(result ?? {}).filter(([, value]) => value && typeof value === "object" && "status" in value);
  const failures = jobs.filter(([, value]) => !["COMPLETED", "SKIPPED"].includes(value.status));
  if (failures.length) {
    throw new Error(`Batch finished with unsuccessful jobs: ${failures.map(([name, value]) => `${name}=${value.status}`).join(", ")}`);
  }
  if (!jobs.length) throw new Error("Batch endpoint returned no per-job statuses; inspect its response and server log.");
  console.log(`Batch finished: ${jobs.length} job results inspected.`);
}

async function main() {
  try {
    const assets = await ensureAssets();
    await ensureWatchlists(assets);
    const user = await ensureSampleUser();
    await ensureSampleTheme(user.userId, assets);
    await runBatch();
    console.log("\nSample data setup and batch pipeline completed.");
  } catch (error) {
    const details = error.response?.data?.message ?? error.response?.data ?? error.message;
    console.error("\nPipeline stopped:", details);
    process.exitCode = 1;
  }
}

await main();
