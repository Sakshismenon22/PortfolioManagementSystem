import axios from "axios";

// Run runSampleDataPipeline.js first so the sample account, theme, and
// securities are available in PMS and the Security Master.
const PMS_URL = process.env.PMS_BASE_URL ?? "http://localhost:8082";
const SAMPLE_USER_EMAIL = process.env.SAMPLE_USER_EMAIL ?? "sample.manager@example.com";
const SAMPLE_USER_PASSWORD = process.env.SAMPLE_USER_PASSWORD ?? "PmsDemo@12345";
const THEME_NAME = process.env.SAMPLE_THEME_NAME ?? "Sample Balanced 60-25-15";
const PORTFOLIO_AMOUNT = Number(process.env.SAMPLE_PORTFOLIO_AMOUNT ?? 5_000_000);
// The pipeline stores current quote snapshots rather than six-month price
// history. Use a configurable fixture factor to create a clearly synthetic
// historical cost basis from each seeded current quote.
const HISTORICAL_PRICE_MULTIPLIER = Number(process.env.SAMPLE_HISTORICAL_PRICE_MULTIPLIER ?? 0.9);
const PORTFOLIO_NAME = process.env.SAMPLE_PORTFOLIO_NAME
  ?? `Sample 6M Portfolio ${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;

const client = axios.create({ timeout: 30_000 });

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} endpoint did not return a list.`);
  return value;
}

async function createSixMonthPortfolio() {
  if (!Number.isFinite(PORTFOLIO_AMOUNT) || PORTFOLIO_AMOUNT <= 0) {
    throw new Error("SAMPLE_PORTFOLIO_AMOUNT must be a positive number.");
  }
  if (!Number.isFinite(HISTORICAL_PRICE_MULTIPLIER) || HISTORICAL_PRICE_MULTIPLIER <= 0) {
    throw new Error("SAMPLE_HISTORICAL_PRICE_MULTIPLIER must be a positive number.");
  }

  const loginResponse = await client.post(`${PMS_URL}/api/users/login`, {
    email: SAMPLE_USER_EMAIL,
    password: SAMPLE_USER_PASSWORD,
  });
  const user = unwrap(loginResponse);
  if (!user?.userId) throw new Error("Sample user login did not return a userId.");

  const themes = requireArray(unwrap(await client.get(`${PMS_URL}/api/themes/get-all-themes`, {
    params: { userId: user.userId },
  })), "Theme list");
  const theme = themes.find((candidate) => candidate.name === THEME_NAME);
  if (!theme?.id || !Array.isArray(theme.allocationRuleList) || theme.allocationRuleList.length === 0) {
    throw new Error(`Theme '${THEME_NAME}' was not found for the sample user or has no allocation rules. Run runSampleDataPipeline.js first.`);
  }

  const securitiesResponse = unwrap(await client.get(`${PMS_URL}/api/security/get-all-security-info`));
  const securities = requireArray(securitiesResponse?.securities, "Security list");
  const allocationRules = theme.allocationRuleList.filter((rule) => Number(rule.percentage) > 0);
  const holdings = allocationRules.map((rule) => {
    const security = securities.find((candidate) => candidate.asset?.id === rule.asset?.id
      && Number.isFinite(Number(candidate.price)) && Number(candidate.price) > 0);
    if (!security) {
      throw new Error(`No priced security was found for theme asset '${rule.asset?.assetClass ?? rule.asset?.assetSubclass ?? rule.asset?.id}'. Run the sample data pipeline and confirm market prices are loaded.`);
    }

    const currentPrice = Number(security.price);
    const purchasePrice = Math.round(currentPrice * HISTORICAL_PRICE_MULTIPLIER * 100) / 100;
    const targetValue = PORTFOLIO_AMOUNT * Number(rule.percentage) / 100;
    const quantity = Math.floor(targetValue / purchasePrice);
    if (quantity < 1) throw new Error(`Portfolio amount is too small to buy one unit of ${security.name}.`);

    return {
      security,
      quantity,
      purchasePrice,
      currentPrice,
      targetValue,
    };
  });

  const createdAt = new Date();
  createdAt.setMonth(createdAt.getMonth() - 6);
  const createResponse = await client.post(`${PMS_URL}/api/portfolio/demo-historical`, {
    portfolio: {
      name: PORTFOLIO_NAME,
      portfolioType: "AMOUNT",
      currency: "INR",
      benchmark: "NIFTY_50",
      exchange: "NSE",
      reBalancingFrequency: "MONTHLY",
      amount: PORTFOLIO_AMOUNT,
      userId: user.userId,
      portfolioStatus: "ACTIVE",
      themeId: theme.id,
      createdAt: createdAt.toISOString().slice(0, 10),
    },
    holdings: holdings.map(({ security, quantity, purchasePrice }) => ({
      securityMasterId: security.id,
      quantity,
      purchasePrice,
    })),
  });
  const portfolio = unwrap(createResponse);
  if (!portfolio?.id) throw new Error("Portfolio create endpoint did not return its ID.");

  console.log("Created six-month portfolio:");
  console.log(JSON.stringify({
    portfolioId: portfolio.id,
    name: PORTFOLIO_NAME,
    createdAt: createdAt.toISOString().slice(0, 10),
    userId: user.userId,
    theme: theme.name,
    benchmark: "NIFTY_50",
    amount: PORTFOLIO_AMOUNT,
    historicalPriceMultiplier: HISTORICAL_PRICE_MULTIPLIER,
    holdings: holdings.map(({ security, quantity, targetValue, purchasePrice, currentPrice }) => ({
      name: security.name,
      symbol: security.symbol,
      quantity,
      historicalPurchasePrice: purchasePrice,
      currentQuote: currentPrice,
      targetValue: Math.round(targetValue * 100) / 100,
    })),
  }, null, 2));
}

try {
  await createSixMonthPortfolio();
} catch (error) {
  console.error("Could not create the six-month portfolio:", error.response?.data?.message ?? error.message);
  process.exitCode = 1;
}
