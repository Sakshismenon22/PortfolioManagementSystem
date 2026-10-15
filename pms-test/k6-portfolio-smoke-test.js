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
    name: `k6 smoke ${vuId} ${suffix}`,
    email: `k6.smoke.${vuId}.${suffix}@example.com`,
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
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const vuId = __VU;
  const user = buildUser(vuId);

  const registerRes = http.post(`${BASE_URL}/api/users/register`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(registerRes, {
    'register status is 200': (r) => r.status === 200,
  });

  const loginRes = http.post(
    `${BASE_URL}/api/users/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  const loginBody = loginRes.json();
  const userId = loginBody?.data?.userId ?? loginBody?.userId ?? null;
  check(userId, {
    'user was returned after login': (id) => !!id,
  });

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

  check(listRes, { 'list portfolios status is 200': (r) => r.status === 200 });

  const portfolioId = extractFirstPortfolioId(listRes.json());
  const countRes = http.get(`${BASE_URL}/api/portfolio/count-portfolio/${userId}`);
  const securityRes = http.get(`${BASE_URL}/api/security/get-all-security-info`);

  if (portfolioId) {
    const detailsRes = http.get(`${BASE_URL}/api/portfolio/portfolio-details/${portfolioId}/${userId}`);
    const driftRes = http.get(`${BASE_URL}/api/drift/calculate/${portfolioId}/${userId}`);
    const historyRes = http.get(`${BASE_URL}/api/drift/history/${portfolioId}/${userId}`);

    check(detailsRes, { 'portfolio details status is 200': (r) => r.status === 200 });
    check(countRes, { 'portfolio count status is 200': (r) => r.status === 200 });
    check(securityRes, { 'security list status is 200': (r) => r.status === 200 });
    check(driftRes, { 'drift calculation status is 200': (r) => r.status === 200 });
    check(historyRes, { 'drift history status is 200': (r) => r.status === 200 });
  } else {
    check(countRes, { 'portfolio count status is 200': (r) => r.status === 200 });
    check(securityRes, { 'security list status is 200': (r) => r.status === 200 });
  }

  sleep(1);
}
