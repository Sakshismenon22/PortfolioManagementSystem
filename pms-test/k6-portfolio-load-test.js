import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.PMS_BASE_URL || 'http://localhost:8082';
const PASSWORD = __ENV.PMS_PASSWORD || 'PmsDemo@12345';

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildUser(vuId) {
  const suffix = randomSuffix();
  return {
    name: `k6 load ${vuId} ${suffix}`,
    email: `k6.load.${vuId}.${suffix}@example.com`,
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

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

export default function () {
  const vuId = __VU;
  const user = buildUser(vuId);

  const registerRes = http.post(`${BASE_URL}/api/users/register`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerRes.status !== 200 && registerRes.status !== 201) {
    check(registerRes, { 'register responded successfully': (r) => false });
    return;
  }

  const loginRes = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login ok': (r) => r.status === 200,
  });

  const loginBody = loginRes.json();
  const userId = loginBody?.data?.userId ?? loginBody?.userId ?? null;

  if (!userId) {
    return;
  }

  const demoRes = http.post(`${BASE_URL}/api/portfolio/demo-portfolios/${userId}`);
  check(demoRes, {
    'demo portfolios created or already exist': (r) => r.status === 200,
  });

  const listRes = http.post(
    `${BASE_URL}/api/portfolio/get-all-portfolio`,
    JSON.stringify({ userId }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(listRes, { 'list portfolios ok': (r) => r.status === 200 });

  const portfolioId = extractFirstPortfolioId(listRes.json());
  const countRes = http.get(`${BASE_URL}/api/portfolio/count-portfolio/${userId}`);
  const securityRes = http.get(`${BASE_URL}/api/security/get-all-security-info`);

  if (portfolioId) {
    const detailsRes = http.get(`${BASE_URL}/api/portfolio/portfolio-details/${portfolioId}/${userId}`);
    const driftRes = http.get(`${BASE_URL}/api/drift/calculate/${portfolioId}/${userId}`);
    const historyRes = http.get(`${BASE_URL}/api/drift/history/${portfolioId}/${userId}`);

    check(countRes, { 'count portfolios ok': (r) => r.status === 200 });
    check(securityRes, { 'security list ok': (r) => r.status === 200 });
    check(detailsRes, { 'portfolio details ok': (r) => r.status === 200 });
    check(driftRes, { 'drift calculation ok': (r) => r.status === 200 });
    check(historyRes, { 'drift history ok': (r) => r.status === 200 });
  } else {
    check(countRes, { 'count portfolios ok': (r) => r.status === 200 });
    check(securityRes, { 'security list ok': (r) => r.status === 200 });
  }

  sleep(1);
}
