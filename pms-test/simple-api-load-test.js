import axios from 'axios';

const BASE_URL = process.env.PMS_BASE_URL || 'http://localhost:8082';
const TOTAL_USERS = Number(process.env.TOTAL_USERS || 1000);
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const REQUEST_TIMEOUT = Number(process.env.REQUEST_TIMEOUT || 15000);
const PASSWORD = process.env.PMS_PASSWORD || 'PmsDemo@12345';

const requestDurations = [];
const labelStats = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function percentiles(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index];
}

function record(label, durationMs, success) {
  requestDurations.push({ label, durationMs, success });

  const entry = labelStats.get(label) || { count: 0, total: 0, max: 0, failures: 0 };
  entry.count += 1;
  entry.total += durationMs;
  entry.max = Math.max(entry.max, durationMs);
  if (!success) entry.failures += 1;
  labelStats.set(label, entry);
}

async function sendRequest({ label, method, url, data, params }) {
  const start = Date.now();

  try {
    const res = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      params,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: REQUEST_TIMEOUT,
    });

    const duration = Date.now() - start;
    record(label, duration, res.status >= 200 && res.status < 400);
    return res.data;
  } catch (error) {
    const duration = Date.now() - start;
    const status = error?.response?.status ?? 0;
    record(label, duration, false);
    console.error(`FAIL ${label} ${method} ${url} => ${status} :: ${error.message}`);
    throw error;
  }
}

function buildUser(vuId) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: `simple-load-${vuId}-${suffix}`,
    email: `simple.load.${vuId}.${suffix}@example.com`,
    phoneNumber: `900${String(vuId).padStart(7, '0')}`,
    role: 'USER',
    password: PASSWORD,
  };
}

function extractFirstPortfolioId(responseBody) {
  const payload = responseBody?.data ?? responseBody;
  const portfolios = payload?.portfolioDetailsDTOList ?? payload?.portfolioList ?? payload?.portfolios ?? payload?.data ?? [];
  if (!Array.isArray(portfolios)) return null;
  return portfolios[0]?.id ?? portfolios[0]?.portfolioId ?? null;
}

async function loadOneUser(vuId) {
  const user = buildUser(vuId);

  await sendRequest({
    label: 'register',
    method: 'post',
    url: '/api/users/register',
    data: user,
  });

  const loginResponse = await sendRequest({
    label: 'login',
    method: 'post',
    url: '/api/users/login',
    data: { email: user.email, password: user.password },
  });

  const userId = loginResponse?.data?.userId ?? loginResponse?.userId;
  if (!userId) {
    throw new Error(`Failed to get userId for ${user.email}`);
  }

  await sendRequest({
    label: 'createDemoPortfolios',
    method: 'post',
    url: `/api/portfolio/demo-portfolios/${userId}`,
  });

  const listResponse = await sendRequest({
    label: 'listPortfolios',
    method: 'post',
    url: '/api/portfolio/get-all-portfolio',
    data: { userId },
  });

  const portfolioId = extractFirstPortfolioId(listResponse);

  await sendRequest({
    label: 'countPortfolios',
    method: 'get',
    url: `/api/portfolio/count-portfolio/${userId}`,
  });

  await sendRequest({
    label: 'getAllSecurityInfo',
    method: 'get',
    url: '/api/security/get-all-security-info',
  });

  if (portfolioId) {
    await sendRequest({
      label: 'portfolioDetails',
      method: 'get',
      url: `/api/portfolio/portfolio-details/${portfolioId}/${userId}`,
    });

    await sendRequest({
      label: 'driftCalculate',
      method: 'get',
      url: `/api/drift/calculate/${portfolioId}/${userId}`,
    });

    await sendRequest({
      label: 'driftHistory',
      method: 'get',
      url: `/api/drift/history/${portfolioId}/${userId}`,
    });
  } else {
    console.warn(`No portfolio was found for user ${userId}; ensure demo data was seeded.`);
  }
}

async function runLoadTest() {
  const start = Date.now();
  let nextUserId = 1;

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (nextUserId <= TOTAL_USERS) {
      const currentUserId = nextUserId;
      nextUserId += 1;
      await loadOneUser(currentUserId);
    }
  });

  await Promise.all(workers);
  const elapsedMs = Date.now() - start;

  const allDurations = requestDurations.map((r) => r.durationMs);
  const totalRequests = requestDurations.length;
  const successCount = requestDurations.filter((r) => r.success).length;

  const summary = {
    baseUrl: BASE_URL,
    totalUsers: TOTAL_USERS,
    concurrency: CONCURRENCY,
    totalRequests,
    successfulRequests: successCount,
    failedRequests: totalRequests - successCount,
    successRate: totalRequests ? (successCount / totalRequests) * 100 : 0,
    totalTestTimeMs: elapsedMs,
    averageLatencyMs: totalRequests ? allDurations.reduce((sum, n) => sum + n, 0) / totalRequests : 0,
    p95LatencyMs: percentiles(allDurations, 95),
    p99LatencyMs: percentiles(allDurations, 99),
    maxLatencyMs: totalRequests ? Math.max(...allDurations) : 0,
    requestsPerSecond: elapsedMs ? totalRequests / (elapsedMs / 1000) : 0,
    perLabel: Object.fromEntries(
      Array.from(labelStats.entries()).map(([label, stat]) => [
        label,
        {
          count: stat.count,
          avgMs: stat.count ? stat.total / stat.count : 0,
          maxMs: stat.max,
          failures: stat.failures,
        },
      ])
    ),
  };

  console.log('\nLoad test summary');
  console.log(JSON.stringify(summary, null, 2));
}

async function main() {
  console.log(`Starting simple load test against ${BASE_URL}`);
  console.log(`Users=${TOTAL_USERS} Concurrency=${CONCURRENCY} Timeout=${REQUEST_TIMEOUT}ms`);

  try {
    await runLoadTest();
  } catch (error) {
    console.error('Load test failed.');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
