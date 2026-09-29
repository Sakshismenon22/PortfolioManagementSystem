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
  
import { useParams } from "react-router-dom";
import {
  getPortfolioBasicInfo,
  getPortfolioHoldings,
} from "../services/portfolioService";

// const portfolio = {
//   name: "Growth Portfolio",
//   status: "ACTIVE",
//   exchange: "NSE/BSE",
//   type: "WEIGHTAGE",
//   isinPool: "INSTITUTIONAL PRIMARY",

//   portfolioValue: 845000000,
//   investedAmount: 700000000,
//   totalReturn: 24.6,
//   benchmarkReturn: 18.2,
//   alpha: 6.4,

//   benchmark: "NIFTY 50",
// };

const driftData = [
  {
    assetClass: "Stocks",
    target: 60,
    current: 66,
    drift: 6,
    status: "EXCEEDS 5%",
  },
  {
    assetClass: "Mutual Funds",
    target: 15,
    current: 14,
    drift: -1,
    status: "TOLERANCE",
  },
  {
    assetClass: "ETFs",
    target: 15,
    current: 12,
    drift: -3,
    status: "TOLERANCE",
  },
  {
    assetClass: "Commodities",
    target: 10,
    current: 8,
    drift: -2,
    status: "TOLERANCE",
  },
];

// const holdings = [
//   {
//     security: "Reliance Industries",
//     symbol: "RELIANCE",
//     assetClass: "STOCK",
//     quantity: "8,500",
//     buyPrice: 2450,
//     currentPrice: 2940.5,
//     investedValue: 20825000,
//     currentValue: 24994250,
//     pnl: 4169250,
//     pnlPercent: 20.02,
//   },
//   {
//     security: "Tata Consultancy Services",
//     symbol: "TCS",
//     assetClass: "STOCK",
//     quantity: "5,200",
//     buyPrice: 3400,
//     currentPrice: 3920,
//     investedValue: 17680000,
//     currentValue: 20384000,
//     pnl: 2704000,
//     pnlPercent: 15.29,
//   },
//   {
//     security: "HDFC Bank",
//     symbol: "HDFCBANK",
//     assetClass: "STOCK",
//     quantity: "6,800",
//     buyPrice: 1480,
//     currentPrice: 1530.2,
//     investedValue: 10064000,
//     currentValue: 10405360,
//     pnl: 341360,
//     pnlPercent: 3.39,
//   },
//   {
//     security: "SBI Bluechip Direct",
//     symbol: "SBIBLUE",
//     assetClass: "MUTUAL FUND",
//     quantity: "1,40,000",
//     buyPrice: 72,
//     currentPrice: 84.2,
//     investedValue: 10080000,
//     currentValue: 11788000,
//     pnl: 1708000,
//     pnlPercent: 16.94,
//   },
//   {
//     security: "Nippon Nifty 50 BeES",
//     symbol: "NIFTYBEES",
//     assetClass: "ETF",
//     quantity: "40,800",
//     buyPrice: 210,
//     currentPrice: 248.1,
//     investedValue: 8568000,
//     currentValue: 10122480,
//     pnl: 1554480,
//     pnlPercent: 18.15,
//   },
//   {
//     security: "Sovereign Gold Bond 2026",
//     symbol: "SGB2026",
//     assetClass: "COMMODITY",
//     quantity: "1,050",
//     buyPrice: 5800,
//     currentPrice: 6420,
//     investedValue: 6090000,
//     currentValue: 6741000,
//     pnl: 651000,
//     pnlPercent: 10.69,
//   },
// ];

const formatCrore = (value) => {
  return `₹ ${(value / 10000000).toFixed(2)} Cr`;
};

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
const SideBarComponent = () => {
  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Portfolios",
      icon: FolderKanban,
      active: true,
    },
    {
      label: "Themes",
      icon: Layers3,
    },
    {
      label: "Securities",
      icon: Database,
    },
    {
      label: "Rebalancing",
      icon: SlidersHorizontal,
      badge: "2 Alerts",
    },
    {
      label: "Notifications",
      icon: Bell,
      badge: "3",
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[240px] flex-col bg-[#172a40] text-white">
      <div className="flex h-[70px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
          <TrendingUp size={17} />
        </div>

      <SideBarComponent />

      <TopBarComponent />

      <main className="ml-[240px] pt-[70px]">
      <nav className="mt-4 space-y-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                item.active
                  ? "bg-blue-700 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />

              <span className="flex-1">{item.label}</span>

              {item.badge && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    item.label === "Rebalancing"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <div className="rounded-md bg-white/10 p-4">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-300">
            <span>Fund AUM Pool</span>

            <span className="flex items-center gap-1 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Live
            </span>
          </div>

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
const TopBarComponent = () => {
  return (
    <header className="fixed left-[240px] right-0 top-0 z-20 h-[70px] border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-5">
        <div className="flex h-9 w-[350px] items-center gap-2 rounded-md bg-slate-100 px-3">
          <Search size={17} className="text-slate-500" />

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
const StatCard = ({ title, value, subtitle, icon: Icon, valueClass = "" }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </div>

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
const PerformanceChart = () => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Portfolio vs NIFTY 50
          </h2>

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
      <div className="relative mt-5 h-[280px] overflow-hidden">
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[10px] text-slate-400">
          <span>130.0</span>
          <span>120.0</span>
          <span>110.0</span>
          <span>100.0</span>
          <span>90.0</span>
        </div>

        <div className="absolute left-12 right-3 top-0 h-full">
          {[0, 25, 50, 75, 100].map((top) => (
            <div
              key={top}
              className="absolute left-0 right-0 border-t border-dashed border-slate-200"
              style={{ top: `${top}%` }}
            />
          ))}

          <svg
            viewBox="0 0 700 250"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="performanceGradient"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path
              d="M0 200
                 C55 198 70 185 110 172
                 C150 160 170 145 215 132
                 C250 121 280 128 320 115
                 C355 104 365 82 410 65
                 C450 50 470 48 505 42
                 C555 35 590 25 630 10
                 C650 5 680 2 700 0
                 L700 250
                 L0 250 Z"
              fill="url(#performanceGradient)"
            />

            <path
              d="M0 200
                 C60 197 80 190 115 180
                 C160 167 185 157 225 149
                 C265 142 295 139 335 128
                 C370 118 395 110 430 98
                 C470 87 505 80 540 70
                 C580 60 620 48 660 40
                 C680 36 690 32 700 28"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeDasharray="6 5"
            />

            <path
              d="M0 200
                 C55 198 70 185 110 172
                 C150 160 170 145 215 132
                 C250 121 280 128 320 115
                 C355 104 365 82 410 65
                 C450 50 470 48 505 42
                 C555 35 590 25 630 10
                 C650 5 680 2 700 0"
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="3"
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
          <div className="absolute right-0 top-0 rounded-md bg-[#172a40] px-4 py-2 text-[10px] text-white shadow-lg">
            <div className="mb-1 text-[9px] uppercase text-slate-300">
              Peak Trajectory Metric
            </div>

                <InfoRow
                  label="Status"
                  value={portfolio.portfolioStatus || "ACTIVE"}
                />

              </div>

            </div>

            {/* PERFORMANCE */}
      <div className="mt-2 flex items-center gap-5 text-[11px] font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-[2px] w-3 bg-blue-700" />
          GROWTH PORTFOLIO (+24.6%)
        </div>

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
const AllocationDriftMonitor = () => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Allocation Drift Monitor
          </h2>

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
      <div className="mt-5 grid grid-cols-[1.5fr_.8fr_.8fr_.8fr_1fr] bg-slate-100 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>Asset Class</span>
        <span>Target</span>
        <span>Current</span>
        <span>Drift</span>
        <span>Status</span>
      </div>

      <div>
        {driftData.map((item) => (
          <div
            key={item.assetClass}
            className="grid grid-cols-[1.5fr_.8fr_.8fr_.8fr_1fr] items-center border-b border-slate-100 px-2 py-4 text-xs"
          >
            <span className="font-medium text-slate-800">
              {item.assetClass}
            </span>

            <span className="text-slate-500">{item.target.toFixed(1)}%</span>

            <span className="text-slate-500">{item.current.toFixed(1)}%</span>

            <span
              className={`font-semibold ${
                item.drift > 5 ? "text-red-600" : "text-slate-600"
              }`}
            >
              {item.drift > 0 ? "+" : ""}
              {item.drift.toFixed(1)}%
            </span>

            <span>
              {item.drift > 5 ? (
                <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
                  <AlertTriangle size={11} />
                  EXCEEDS 5%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                  <CheckCircle2 size={12} />
                  TOLERANCE
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-4">
        <div className="flex gap-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />

            </div>

          </div>

          {/* PERFORMANCE CHART */}

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
const HoldingsTable = () => {
  const [portfolio, setPortfolio] = useState({});
  const [holdings, setHoldings] = useState([]);
  const { id } = useParams();
  const loadHoldings = async () => {
    const data = await getPortfolioHoldings(id);
    setHoldings(data);
  };
  const loadPortFolio = async () => {
    const data = await getPortfolioBasicInfo(id);
    console.log(data);
    setPortfolio(data);
  };
  useEffect(() => {
    loadHoldings();
  }, []);
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Current Holdings & Deployed Positions
          </h2>

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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse">
          <thead>
            <tr className="bg-blue-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-3 py-3">Security</th>
              <th className="px-3 py-3">Symbol</th>
              <th className="px-3 py-3">Asset Class</th>
              <th className="px-3 py-3 text-right">Quantity</th>
              <th className="px-3 py-3 text-right">Average Cost</th>
              <th className="px-3 py-3 text-right">Total Cost</th>
              <th className="px-3 py-3 text-right">Current Value</th>
              <th className="px-3 py-3 text-right">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr
                key={holding.holdingId}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-3 py-4 text-sm font-medium text-slate-800">
                  {holding.securityName}
                </td>

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
                <td className="px-3 py-4">
                  <span className="rounded bg-blue-100 px-2 py-1 text-[9px] font-bold text-blue-800">
                    {holding.assetClass}
                  </span>
                </td>

                <td className="px-3 py-4 text-right text-sm font-semibold text-slate-700">
                  {holding.quantity?.toLocaleString("en-IN")}
                </td>

                <td className="px-3 py-4 text-right text-sm text-slate-700">
                  {formatPrice(holding.averageCost)}
                </td>

                <td className="px-3 py-4 text-right text-sm text-slate-700">
                  {formatCompactValue(holding.totalCost)}
                </td>

                <td className="px-3 py-4 text-right text-sm font-semibold text-slate-800">
                  {formatCompactValue(holding.currentValue)}
                </td>

                <td className="px-3 py-4 text-right">
                  <div className="font-semibold text-blue-700">
                    {holding.allocationPercentage?.toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-blue-50 px-5 py-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <CheckCircle2 size={17} className="text-emerald-600" />

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
const PortfolioDetailsPage = () => {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState({});
  const loadPortFolio = async () => {
    const data = await getPortfolioBasicInfo(id);
    console.log(data);
    setPortfolio(data);
  };
  useEffect(() => {
    console.log("Portfolio ID:", id);
    loadPortFolio();
  }, [id]);
  return (
    <div className="min-h-screen bg-[#f7f9fc] font-sans text-slate-900">
      <SideBarComponent />

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

      <main className="ml-[240px] pt-[70px]">
        <div className="mx-auto max-w-[1500px] px-5 py-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Portfolios
                <span className="mx-2">›</span>
                <span className="text-slate-700">{portfolio.name}</span>
              </div>

              <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
                {portfolio.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {portfolio.portfolioStatus}
                </span>

                <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                  Exchange: {portfolio.exchange}
                </span>

                <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                  Type: {portfolio.portfolioType}
                </span>

                <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
                  Currency: {portfolio.currency}
                </span>
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
          <div className="mt-5 grid grid-cols-4 gap-4">
            <StatCard
              title="Portfolio Value"
              value={formatCrore(portfolio.portfolioValue)}
              subtitle={
                <>
                  <span className="font-semibold text-emerald-600">
                    ↑ ₹ 14.50 Cr
                  </span>{" "}
                  (+20.7% total gain)
                </>
              }
              icon={WalletCards}
            />

    </div>
  );
};


/* =========================
   SMALL COMPONENTS

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
            <StatCard
              title="Benchmark Return"
              value={`+${portfolio.benchmarkReturn}%`}
              subtitle={
                <>
                  {portfolio.benchmark}
                  <span className="float-right font-semibold text-blue-700">
                    Alpha: +{portfolio.alpha?.toFixed(2)}%
                  </span>
                </>
              }
              icon={LineChart}
            />
          </div>

          <div className="mt-4 grid grid-cols-[1.7fr_1fr] gap-4">
            <PerformanceChart />

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
          <div className="mt-4">
            <HoldingsTable />
          </div>
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