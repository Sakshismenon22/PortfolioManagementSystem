import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Layers3,
  Database,
  SlidersHorizontal,
  Bell,
  Settings,
  CircleHelp,
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  ShieldCheck,
  PieChart,
  Activity,
  AlertTriangle,
  Eye,
  RefreshCw,
  BarChart3,
  X,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const portfolioComparisons = [
  {
    id: 1,
    name: "Growth Portfolio",
    benchmark: "NIFTY 50",
    portfolioReturn: 21.8,
    benchmarkReturn: 17.4,
    alpha: 4.4,
    trackingError: 1.14,
    sharpe: 2.18,
    beta: 0.94,
  },
  {
    id: 2,
    name: "Tech Momentum Portfolio",
    benchmark: "NIFTY 100",
    portfolioReturn: 28.6,
    benchmarkReturn: 21.3,
    alpha: 7.3,
    trackingError: 1.82,
    sharpe: 2.46,
    beta: 1.08,
  },
  {
    id: 3,
    name: "Bluechip Balanced Portfolio",
    benchmark: "NIFTY 500",
    portfolioReturn: 16.9,
    benchmarkReturn: 14.2,
    alpha: 2.7,
    trackingError: 0.91,
    sharpe: 1.74,
    beta: 0.87,
  },
];

const chartData = [
  {
    month: "Nov '23",
    portfolio: 0,
    benchmark: 0,
  },
  {
    month: "Dec '23",
    portfolio: 6,
    benchmark: 4,
  },
  {
    month: "Jan '24",
    portfolio: 11,
    benchmark: 8,
  },
  {
    month: "Feb '24",
    portfolio: 19,
    benchmark: 13,
  },
  {
    month: "Mar '24",
    portfolio: 22,
    benchmark: 15,
  },
  {
    month: "Apr '24",
    portfolio: 21.8,
    benchmark: 17.4,
  },
];

const assetAllocation = [
  {
    name: "Stocks (Direct Equities)",
    percentage: 62,
    amount: "₹ 265.67 Cr",
  },
  {
    name: "Mutual Funds",
    percentage: 18,
    amount: "₹ 77.13 Cr",
  },
  {
    name: "Index ETFs & Liquid",
    percentage: 12,
    amount: "₹ 51.42 Cr",
  },
  {
    name: "Commodities",
    percentage: 8,
    amount: "₹ 34.28 Cr",
  },
];

const driftData = [
  {
    portfolio: "Growth Portfolio",
    description: "Aggressive Equity",
    asset: "Stocks",
    target: "60.0%",
    current: "66.0%",
    drift: "+6.0%",
    status: "Rebalance Required",
    alert: true,
  },
  {
    portfolio: "Tech Momentum Portfolio",
    description: "Thematic Sectoral",
    asset: "Stocks",
    target: "70.0%",
    current: "75.8%",
    drift: "+5.8%",
    status: "Rebalance Required",
    alert: true,
  },
  {
    portfolio: "Bluechip Balanced",
    description: "Hybrid Allocator",
    asset: "Stocks",
    target: "50.0%",
    current: "54.2%",
    drift: "+4.2%",
    status: "Within Tolerance",
    alert: false,
  },
];

const marketPulse = [
  {
    name: "NIFTY 50",
    description: "NSE BENCHMARK",
    value: "22,485.60",
    change: "+0.84%",
  },
  {
    name: "NIFTY 100",
    description: "BROAD LARGE-CAP INDEX",
    value: "23,120.40",
    change: "+0.71%",
  },
  {
    name: "BSE SENSEX",
    description: "BOMBAY STOCK EXCHANGE",
    value: "74,119.30",
    change: "+0.92%",
  },
  {
    name: "10Y G-Sec Yield",
    description: "SOVEREIGN BENCHMARK",
    value: "7.08%",
    change: "-2 bps",
  },
];



const SideBarComponent = () => {
  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: "Portfolios",
      icon: FolderKanban,
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[240px] flex-col bg-[#17283d] text-white">

      <div className="flex h-[68px] items-center border-b border-white/10 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600">
          <TrendingUp size={16} />
        </div>

        <div className="ml-3">
          <div className="text-sm font-bold">
            <span className="text-white">APEX</span>
            <span className="text-blue-400">PMS</span>
          </div>

          <div className="text-[9px] font-semibold tracking-widest text-slate-300">
            INSTITUTIONAL
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`flex w-full items-center rounded-md px-3 py-2.5 text-sm transition ${
                  item.active
                    ? "bg-blue-700 text-white"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon size={17} />

                <span className="ml-3 flex-1 text-left">{item.label}</span>

                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
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
        </div>
      </nav>


      <div className="mx-4 mb-4 rounded-md bg-slate-700/70 p-3">
        <div className="flex items-center justify-between text-[10px] text-slate-300">
          <span>FUND AUM POOL</span>

          <span className="flex items-center gap-1 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Live
          </span>
        </div>

        <div className="mt-1 text-xl font-semibold">₹428.5M</div>

        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>Active Strategies</span>
          <span className="text-white">14 Active</span>
        </div>
      </div>

    
      <div className="border-t border-white/10 px-3 py-3">
        <button className="flex w-full items-center gap-3 px-3 py-2 text-xs text-slate-300">
          <Settings size={16} />
          System Settings
        </button>

        <button className="flex w-full items-center gap-3 px-3 py-2 text-xs text-slate-300">
          <CircleHelp size={16} />
          Institutional Support
        </button>
      </div>
    </aside>
  );
};



const TopBarComponent = () => {
  return (
    <header className="fixed left-[240px] right-0 top-0 z-20 flex h-[68px] items-center border-b border-slate-200 bg-white px-5">

      <div className="flex h-9 w-[355px] items-center rounded-md bg-slate-100 px-3">
        <Search size={17} className="text-slate-500" />

        <input
          className="ml-2 w-full bg-transparent text-xs outline-none placeholder:text-slate-500"
          placeholder="Search portfolios, ISIN, securities, benchmarks..."
        />
      </div>

      <div className="ml-auto flex items-center gap-5">
     
        <div className="flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />

          <span className="font-semibold text-slate-700">NSE/BSE</span>

          <span className="font-medium text-slate-700">Open</span>

          <span className="text-slate-400">•</span>

          <span className="font-mono text-slate-500">14:32 IST</span>
        </div>

        <Bell size={18} className="text-slate-600" />


        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs text-white">
            MV
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-800">
              Marcus Vance
            </div>

            <div className="text-[9px] font-medium tracking-wide text-slate-500">
              SENIOR FUND MANAGER
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};



const KpiCard = ({ title, value, subtitle, icon: Icon, positive, danger }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </span>

        {Icon && (
          <Icon
            size={18}
            className={
              danger
                ? "text-red-600"
                : positive
                  ? "text-emerald-600"
                  : "text-blue-600"
            }
          />
        )}
      </div>

      <div className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900">
        {value}
      </div>

      {subtitle && (
        <div className="mt-1 text-[11px] text-slate-500">{subtitle}</div>
      )}
    </div>
  );
};



const PortfolioBenchmarkChart = ({
  selectedPortfolio,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Portfolio Performance vs Benchmark
          </h2>

          <p className="mt-1 text-[11px] text-slate-500">
            Cumulative time-weighted rate of return compared against master
            benchmark.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
          {["1M", "3M", "6M", "1Y", "YTD", "3Y"].map((period, index) => (
            <button
              key={period}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                index === 4
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>


      <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
            hasPrevious
              ? "text-slate-700 hover:bg-white"
              : "cursor-not-allowed text-slate-300"
          }`}
        >
          <ChevronLeft size={15} />
          Previous
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800">
            {selectedPortfolio.name}
          </span>

          <span className="text-slate-400">vs</span>

          <span className="font-semibold text-blue-700">
            {selectedPortfolio.benchmark}
          </span>
        </div>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
            hasNext
              ? "text-slate-700 hover:bg-white"
              : "cursor-not-allowed text-slate-300"
          }`}
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>


      <div className="mt-3 flex items-center gap-4 rounded-md bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="h-2 w-5 rounded bg-blue-700" />

          <span className="text-slate-600">Portfolio Return:</span>

          <strong className="text-blue-700">
            {selectedPortfolio.portfolioReturn.toFixed(1)}%
          </strong>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="h-[2px] w-5 border-t-2 border-dashed border-slate-500" />

          <span className="text-slate-600">
            Benchmark ({selectedPortfolio.benchmark}):
          </span>

          <strong className="text-slate-700">
            {selectedPortfolio.benchmarkReturn.toFixed(1)}%
          </strong>
        </div>

        <div className="ml-auto rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
          Alpha: +{selectedPortfolio.alpha.toFixed(2)}%
        </div>
      </div>


      <div className="mt-3 h-[285px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="portfolioGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.22} />

                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="month"
              tick={{
                fontSize: 10,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fontSize: 10,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "11px",
              }}
              formatter={(value) => `${value}%`}
            />

            <Area
              type="monotone"
              dataKey="portfolio"
              stroke="#1d4ed8"
              strokeWidth={3}
              fill="url(#portfolioGradient)"
            />

            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between rounded bg-blue-50 px-3 py-2 text-[10px]">
        <div className="flex gap-4">
          <span>
            <strong>Tracking Error:</strong> {selectedPortfolio.trackingError}%
          </span>

          <span>
            <strong>Sharpe Ratio:</strong> {selectedPortfolio.sharpe}
          </span>

          <span>
            <strong>Beta:</strong> {selectedPortfolio.beta}
          </span>
        </div>

        <span className="text-slate-500">Daily NAV Sync at 17:30 IST</span>
      </div>
    </div>
  );
};




const AssetAllocationCard = () => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Asset Allocation
          </h2>

          <p className="text-[11px] text-slate-500">
            All Active Portfolios Breakdown
          </p>
        </div>

        <RefreshCw size={18} className="text-slate-500" />
      </div>

      <div className="flex justify-center py-5">
        <div
          className="relative flex h-[155px] w-[155px] items-center justify-center rounded-full"
          style={{
            background:
              "conic-gradient(#123b9d 0deg 223deg, #4169c9 223deg 288deg, #59657a 288deg 331deg, #d97706 331deg 360deg)",
          }}
        >
          <div className="flex h-[105px] w-[105px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-[9px] text-slate-500">TOTAL POOL</span>

            <strong className="text-lg">₹428.5 Cr</strong>

            <span className="text-[10px] font-semibold text-emerald-700">
              100% Deployed
            </span>
          </div>
        </div>
      </div>


      <div className="space-y-4">
        {assetAllocation.map((asset, index) => (
          <div key={asset.name}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    index === 0
                      ? "bg-blue-800"
                      : index === 1
                        ? "bg-blue-500"
                        : index === 2
                          ? "bg-slate-500"
                          : "bg-orange-500"
                  }`}
                />

                <span className="font-medium text-slate-700">{asset.name}</span>
              </div>

              <div className="text-right">
                <strong>{asset.percentage}%</strong>

                <span className="ml-2 text-slate-500">({asset.amount})</span>
              </div>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${
                  index === 0
                    ? "bg-blue-800"
                    : index === 1
                      ? "bg-blue-500"
                      : index === 2
                        ? "bg-slate-500"
                        : "bg-orange-500"
                }`}
                style={{
                  width: `${asset.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



const DriftMonitoringCard = () => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Drift Monitoring & Rebalance Queue
          </h2>

          <p className="mt-1 text-[11px] text-slate-500">
            Portfolios actively flagged against target allocation thresholds.
          </p>
        </div>

        <div className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600">
          2 Actionable
        </div>
      </div>


      <div className="mt-4 grid grid-cols-[1.5fr_1fr_.7fr_.7fr_.7fr_1.2fr_.5fr] gap-2 rounded bg-blue-50 px-3 py-2 text-[9px] font-semibold uppercase text-slate-500">
        <span>Portfolio Mandate</span>
        <span>Asset Class</span>
        <span>Target</span>
        <span>Current</span>
        <span>Drift</span>
        <span>Status</span>
        <span />
      </div>

  
      <div>
        {driftData.map((item) => (
          <div
            key={item.portfolio}
            className="grid grid-cols-[1.5fr_1fr_.7fr_.7fr_.7fr_1.2fr_.5fr] items-center gap-2 border-b border-slate-100 px-3 py-4"
          >
            <div>
              <div className="text-xs font-semibold text-slate-800">
                {item.portfolio}
              </div>

              <div className="mt-1 text-[9px] text-slate-500">
                AUM: ₹94.20 Cr
              </div>

              <div className="text-[9px] text-slate-500">
                {item.description}
              </div>
            </div>

            <div>
              <span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-800">
                ● {item.asset}
              </span>
            </div>

            <span className="text-xs text-slate-500">{item.target}</span>

            <span className="text-xs font-semibold text-slate-700">
              {item.current}
            </span>

            <span
              className={`text-xs font-semibold ${
                item.alert ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {item.drift}
            </span>

            <div>
              <span
                className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold ${
                  item.alert
                    ? "bg-red-100 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {item.status}
              </span>
            </div>

            <button className="rounded bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200">
              <Eye size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};



const MarketPulseCard = () => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Market Pulse</h2>

          <p className="text-[11px] text-slate-500">
            Real-Time Benchmark Feeds
          </p>
        </div>

        <span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
          ● LIVE
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {marketPulse.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded bg-blue-50 px-3 py-2.5"
          >
            <div>
              <div className="text-xs font-semibold text-slate-800">
                {item.name}
              </div>

              <div className="text-[8px] text-slate-500">
                {item.description}
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-xs font-semibold text-slate-800">
                {item.value}
              </div>

              <div
                className={`text-[9px] font-semibold ${
                  item.change.startsWith("-")
                    ? "text-red-600"
                    : "text-emerald-700"
                }`}
              >
                {item.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded bg-blue-50 py-2 text-xs font-medium text-slate-700 hover:bg-blue-100">
        <Activity size={14} />
        Launch Advanced Market Terminal
      </button>
    </div>
  );
};


const DashboardPage = () => {
  const [portfolioIndex, setPortfolioIndex] = useState(0);

  const selectedPortfolio = portfolioComparisons[portfolioIndex];

  const goPrevious = () => {
    setPortfolioIndex((current) => Math.max(0, current - 1));
  };

  const goNext = () => {
    setPortfolioIndex((current) =>
      Math.min(portfolioComparisons.length - 1, current + 1),
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7fc]">
      <SideBarComponent />

      <TopBarComponent />

      <main className="ml-[240px] pt-[68px]">
        <div className="mx-auto max-w-[1400px] px-5 py-5">
    
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                <span className="rounded bg-blue-100 px-2 py-1">
                  MANDATE LEVEL-1
                </span>

                <span className="text-slate-400">•</span>

                <span className="text-slate-500">
                  Institutional Discretionary Pool
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Institutional Fund Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Overall portfolio health, benchmark tracking, and allocation
                drift status across active mandates.
              </p>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                <Download size={15} />
                Export Report
              </button>

              <button className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-900">
                <Plus size={15} />
                Quick Create Portfolio
              </button>
            </div>
          </div>

         
          <div className="mt-5 grid grid-cols-5 gap-3">
            <KpiCard
              title="Total Portfolios"
              value="18"
              subtitle="14 Active • 2 Draft • 2 Drift"
              icon={Building2}
            />

            <KpiCard
              title="Active Mandates"
              value="14"
              subtitle="+2 mandates vs last month"
              icon={ShieldCheck}
              positive
            />

            <KpiCard
              title="Total Assets (AUM)"
              value="₹ 428.50 Cr"
              subtitle="+14.2% YTD (₹ 53.2 Cr)"
              icon={PieChart}
              positive
            />

            <KpiCard
              title="Average Return"
              value="18.4%"
              subtitle="+2.3% Alpha vs NIFTY 50"
              icon={TrendingUp}
              positive
            />

            <KpiCard
              title="Rebalance Drift"
              value="2"
              subtitle="Portfolios Alert • Exceeded 5% threshold"
              icon={AlertTriangle}
              danger
            />
          </div>

   
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_340px] gap-5">

            <div className="space-y-5">
              <PortfolioBenchmarkChart
                selectedPortfolio={selectedPortfolio}
                onPrevious={goPrevious}
                onNext={goNext}
                hasPrevious={portfolioIndex > 0}
                hasNext={portfolioIndex < portfolioComparisons.length - 1}
              />

              <DriftMonitoringCard />
            </div>

     
            <div className="space-y-5">
              <AssetAllocationCard />

              <MarketPulseCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
