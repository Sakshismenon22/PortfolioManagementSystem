import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
 
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  LineChart,
  LockKeyhole,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  WalletCards,
  Plus,
  AlertTriangle,
  Download,
  Filter,
} from "lucide-react";
 
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
 
const API_BASE_URL = "http://localhost:8082";
 
const PortfolioDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
 
  const selectedPortfolio = location.state?.portfolio;
 
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
 
  /*
   * Your current backend endpoint requires:
   *
   * /api/portfolio/portfolio-details/{id}/{userId}
   *
   * Since userId is not available in localStorage and the
   * PortfolioDetailsDTO does not contain userId, we first
   * display the portfolio passed from PortfolioPage.
   */
 
  useEffect(() => {
    if (!selectedPortfolio) {
      setError("Portfolio information was not provided.");
      setLoading(false);
      return;
    }
 
    setPortfolio(selectedPortfolio);
    setLoading(false);
  }, [selectedPortfolio]);
 
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="text-sm font-semibold text-slate-600">
          Loading portfolio...
        </div>
      </div>
    );
  }
 
  if (error || !portfolio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <div className="rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={30} />
 
          <h2 className="text-lg font-semibold text-slate-800">
            Portfolio Not Found
          </h2>
 
          <p className="mt-2 text-sm text-slate-500">
            {error || "Unable to load portfolio details."}
          </p>
 
          <button
            onClick={() => navigate("/portfolio")}
            className="mt-4 rounded-md bg-blue-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Portfolios
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-[#f7f9fc] font-sans text-slate-900">
 
      <SideBarComponent />
 
      <TopBarComponent />
 
      <main className="ml-[240px] pt-[70px]">
 
        <div className="mx-auto max-w-[1500px] px-5 py-6">
 
          {/* BACK BUTTON */}
 
          <button
            onClick={() => navigate("/portfolio")}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Portfolios
          </button>
 
          {/* HEADER */}
 
          <div className="flex items-end justify-between">
 
            <div>
 
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Portfolios
                <span className="mx-2">›</span>
 
                <span className="text-slate-700">
                  {portfolio.name}
                </span>
              </div>
 
              <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
                {portfolio.name}
              </h1>
 
              <div className="mt-3 flex flex-wrap items-center gap-2">
 
                <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {portfolio.portfolioStatus || "ACTIVE"}
                </span>
 
                <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                  Code: {portfolio.code}
                </span>
 
                <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                  Type: {portfolio.allocationType}
                </span>
 
                <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                  Theme: {portfolio.theme}
                </span>
 
              </div>
            </div>
 
            <div className="flex items-center gap-2">
 
              <button
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm"
              >
                <Plus size={16} />
                Add Security
              </button>
 
              <button
                className="flex items-center gap-2 rounded-md bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
              >
                <RefreshCw size={16} />
                Rebalance Portfolio
              </button>
 
            </div>
          </div>
 
          {/* STAT CARDS */}
 
          <div className="mt-5 grid grid-cols-4 gap-4">
 
            <StatCard
              title="Portfolio Value"
              value={formatAUM(portfolio.aum)}
              subtitle="Current AUM"
              icon={WalletCards}
            />
 
            <StatCard
              title="Portfolio Code"
              value={portfolio.code || "-"}
              subtitle="Portfolio identifier"
              icon={Banknote}
            />
 
            <StatCard
              title="1Y Return"
              value={portfolio.return1Y || "-"}
              subtitle="Portfolio return"
              icon={TrendingUp}
              valueClass="text-emerald-700"
            />
 
            <StatCard
              title="Benchmark"
              value={formatBenchmark(portfolio.benchmark)}
              subtitle="Selected benchmark"
              icon={LineChart}
            />
 
          </div>
 
          {/* PORTFOLIO INFORMATION */}
 
          <div className="mt-4 grid grid-cols-2 gap-4">
 
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
 
              <div className="flex items-center justify-between">
 
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Portfolio Information
                  </h2>
 
                  <p className="mt-1 text-xs text-slate-500">
                    Information returned by the PMS backend
                  </p>
                </div>
 
                <SlidersHorizontal
                  size={18}
                  className="text-blue-700"
                />
 
              </div>
 
              <div className="mt-5 space-y-4">
 
                <InfoRow
                  label="Portfolio Name"
                  value={portfolio.name}
                />
 
                <InfoRow
                  label="Portfolio Code"
                  value={portfolio.code}
                />
 
                <InfoRow
                  label="Theme"
                  value={portfolio.theme}
                />
 
                <InfoRow
                  label="Allocation Type"
                  value={portfolio.allocationType}
                />
 
                <InfoRow
                  label="Benchmark"
                  value={formatBenchmark(portfolio.benchmark)}
                />
 
                <InfoRow
                  label="Status"
                  value={portfolio.portfolioStatus || "ACTIVE"}
                />
 
              </div>
 
            </div>
 
            {/* PERFORMANCE */}
 
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
 
              <div className="flex items-center justify-between">
 
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Performance Summary
                  </h2>
 
                  <p className="mt-1 text-xs text-slate-500">
                    Current portfolio performance
                  </p>
                </div>
 
                <TrendingUp
                  size={18}
                  className="text-emerald-600"
                />
 
              </div>
 
              <div className="mt-6">
 
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  1 YEAR RETURN
                </div>
 
                <div className="mt-2 text-4xl font-bold text-emerald-700">
                  {portfolio.return1Y || "-"}
                </div>
 
              </div>
 
              <div className="mt-6 border-t border-slate-100 pt-5">
 
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  BENCHMARK
                </div>
 
                <div className="mt-2 text-xl font-semibold text-slate-800">
                  {formatBenchmark(portfolio.benchmark)}
                </div>
 
              </div>
 
              <div className="mt-5 rounded-md bg-blue-50 p-4">
 
                <div className="flex items-center gap-2">
 
                  <CheckCircle2
                    size={17}
                    className="text-blue-700"
                  />
 
                  <span className="text-xs font-semibold text-slate-700">
                    Portfolio is currently active
                  </span>
 
                </div>
 
              </div>
 
            </div>
 
          </div>
 
          {/* PERFORMANCE CHART */}
 
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
 
            <div className="flex items-start justify-between">
 
              <div>
 
                <h2 className="text-lg font-semibold text-slate-900">
                  Portfolio vs Benchmark
                </h2>
 
                <p className="mt-1 text-xs text-slate-500">
                  Detailed historical comparison can be connected once
                  historical valuation data is available from the backend.
                </p>
 
              </div>
 
              <div className="flex overflow-hidden rounded-md border border-slate-200 text-[10px] font-semibold">
 
                {["1M", "3M", "6M", "1Y", "INCEPTION"].map(
                  (item) => (
                    <button
                      key={item}
                      className={`px-3 py-2 ${
                        item === "1Y"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
 
              </div>
 
            </div>
 
            <div className="mt-6 flex h-[240px] items-center justify-center rounded-md bg-slate-50">
 
              <div className="text-center">
 
                <LineChart
                  size={38}
                  className="mx-auto text-slate-300"
                />
 
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Historical performance data not available
                </p>
 
                <p className="mt-1 text-xs text-slate-400">
                  This chart can be connected to valuation/history APIs later.
                </p>
 
              </div>
 
            </div>
 
          </div>
 
          {/* HOLDINGS */}
 
          <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
 
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
 
              <div>
 
                <h2 className="text-xl font-semibold text-slate-900">
                  Current Holdings
                </h2>
 
                <p className="mt-1 text-xs text-slate-500">
                  Holdings will be displayed here when the portfolio holdings
                  GET API is available.
                </p>
 
              </div>
 
              <div className="flex gap-2">
 
                <button className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
                  <Download size={14} />
                  EXPORT
                </button>
 
                <button className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
                  <Filter size={14} />
                  FILTER
                </button>
 
              </div>
 
            </div>
 
            <div className="flex h-[180px] items-center justify-center">
 
              <div className="text-center">
 
                <WalletCards
                  size={35}
                  className="mx-auto text-slate-300"
                />
 
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Holdings API not connected
                </p>
 
                <p className="mt-1 text-xs text-slate-400">
                  Your backend currently has methods for buying holdings and
                  calculating their value, but no GET-all-holdings endpoint.
                </p>
 
              </div>
 
            </div>
 
          </div>
 
        </div>
 
      </main>
 
    </div>
  );
};
 
 
/* =========================
   SMALL COMPONENTS
========================= */
 
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  valueClass = "",
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
 
      <div className="flex items-start justify-between">
 
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </div>
 
        <Icon
          size={17}
          className="text-blue-700"
        />
 
      </div>
 
      <div
        className={`mt-2 text-[25px] font-bold tracking-tight ${valueClass}`}
      >
        {value}
      </div>
 
      {subtitle && (
        <div className="mt-1 text-xs text-slate-500">
          {subtitle}
        </div>
      )}
 
    </div>
  );
};
 
 
const InfoRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 
      <span className="text-xs font-semibold text-slate-500">
        {label}
      </span>
 
      <span className="text-sm font-semibold text-slate-800">
        {value || "-"}
      </span>
 
    </div>
  );
};
 
 
/* =========================
   HELPERS
========================= */
 
const formatAUM = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }
 
  if (typeof value === "number") {
    return `₹ ${value.toLocaleString("en-IN")}`;
  }
 
  return value;
};
 
 
const formatBenchmark = (benchmark) => {
  if (!benchmark) {
    return "-";
  }
 
  return String(benchmark).replaceAll("_", " ");
};
 
 
export default PortfolioDetailsPage;