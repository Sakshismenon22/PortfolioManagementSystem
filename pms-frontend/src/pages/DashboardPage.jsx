import React, { useEffect, useState } from "react";
import {
  Plus,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Eye,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { getAllPortfolioDetails, getCountOfActivePortfolios, getCountOfPortfolios } from "../services/portfolioService";
import TopBarComponent from "../components/TopBarComponent";
import SideBarComponent from "../components/SideBarComponent";
import { getPortfolioBasicInfo, getPortfolioHoldings, validatePortfolioAllocation } from "../services/portfolioService";
import { getPortfolioDriftHistory } from "../services/driftService";
import { getNifty50History } from "../services/benchmarkService";


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
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  benchmarkPoints,
  benchmarkLoading,
  benchmarkError,
}) => {
  const selected = portfolios.find((entry) => String(entry.portfolio.id) === String(selectedPortfolioId));
  const selectedIndex = portfolios.findIndex((entry) => String(entry.portfolio.id) === String(selectedPortfolioId));
  const allPoints = [...benchmarkPoints].sort((a, b) => new Date(a.date) - new Date(b.date));
  const defaultStart = new Date();
  defaultStart.setFullYear(defaultStart.getFullYear() - 1);
  const benchmarkStartDate = selected?.firstBuyDate || toLocalIsoDate(defaultStart);
  // NSE returns daily closes, so a purchase made today (or on a holiday) needs
  // the prior trading day's close as the benchmark's starting value.
  let baselineIndex = -1;
  allPoints.forEach((point, index) => {
    if (point.date <= benchmarkStartDate) baselineIndex = index;
  });
  // Keep the fetched pre-purchase dates in the chart. For a new portfolio,
  // NSE may not have published a close since the buy date yet; slicing to the
  // baseline would leave a single point, which Recharts cannot draw as a line.
  const points = allPoints;
  const firstClose = Number(allPoints[baselineIndex >= 0 ? baselineIndex : 0]?.close || 0);
  const lastClose = Number(allPoints[allPoints.length - 1]?.close || 0);
  const niftyReturn = firstClose > 0 ? ((lastClose / firstClose) - 1) * 100 : null;
  const portfolioReturn = selected?.returnPercent;
  const alpha = portfolioReturn != null && niftyReturn != null ? portfolioReturn - niftyReturn : null;
  const latestChartDate = toLocalIsoDate(new Date());
  const chartDates = [...new Set([...points.map((point) => point.date), benchmarkStartDate, latestChartDate])]
    .filter(Boolean)
    .sort((a, b) => new Date(a + "T00:00:00") - new Date(b + "T00:00:00"));
  const portfolioStartTime = new Date(benchmarkStartDate + "T00:00:00").getTime();
  const portfolioEndTime = new Date(latestChartDate + "T00:00:00").getTime();
  const chartData = chartDates.map((date) => {
    const point = points.find((item) => item.date === date);
    let closeAtDate = point ? Number(point.close) : null;
    if (closeAtDate == null) {
      for (const candidate of points) {
        if (candidate.date <= date) closeAtDate = Number(candidate.close);
        else break;
      }
    }
    const pointTime = new Date(date + "T00:00:00").getTime();
    const progress = portfolioEndTime <= portfolioStartTime
      ? (date >= benchmarkStartDate ? 1 : 0)
      : Math.max(0, Math.min(1, (pointTime - portfolioStartTime) / (portfolioEndTime - portfolioStartTime)));
    return {
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      niftyReturn: firstClose > 0 && closeAtDate > 0 ? ((closeAtDate / firstClose) - 1) * 100 : null,
      // Portfolio history is not persisted yet. This guide connects the actual
      // buy-date baseline (0%) to the latest measured portfolio return.
      portfolioReturn: portfolioReturn == null || date < benchmarkStartDate ? null : portfolioReturn * progress,
    };
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Portfolio Performance vs NIFTY 50</h2>
          <p className="mt-1 text-[11px] text-slate-500">Portfolio return since first purchase compared with NIFTY 50 over the same period.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="max-w-[190px] truncate text-xs font-semibold text-slate-700" title={selected?.portfolio.name}>{selected?.portfolio.name}</span>
          <button
            type="button"
            aria-label="Previous portfolio comparison"
            title="Previous portfolio"
            disabled={portfolios.length < 2}
            onClick={() => onSelectPortfolio(portfolios[(selectedIndex - 1 + portfolios.length) % portfolios.length]?.portfolio.id)}
            className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          ><ChevronLeft size={16} /></button>
          <span className="min-w-[42px] text-center font-mono text-[10px] text-slate-500">{portfolios.length ? selectedIndex + 1 : 0} / {portfolios.length}</span>
          <button
            type="button"
            aria-label="Next portfolio comparison"
            title="Next portfolio"
            disabled={portfolios.length < 2}
            onClick={() => onSelectPortfolio(portfolios[(selectedIndex + 1) % portfolios.length]?.portfolio.id)}
            className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          ><ChevronRight size={16} /></button>
        </div>
      </div>

      {selected ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-md bg-blue-50 px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{selected.portfolio.name} return</div>
              <div className={"mt-1 font-mono text-lg font-semibold " + (portfolioReturn >= 0 ? "text-blue-800" : "text-red-700")}>{portfolioReturn == null ? "—" : (portfolioReturn > 0 ? "+" : "") + portfolioReturn.toFixed(2) + "%"}</div>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">NIFTY 50 return</div>
              <div className={"mt-1 font-mono text-lg font-semibold " + (niftyReturn == null || niftyReturn >= 0 ? "text-slate-800" : "text-red-700")}>{niftyReturn == null ? "—" : (niftyReturn > 0 ? "+" : "") + niftyReturn.toFixed(2) + "%"}</div>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Excess return</div>
              <div className={"mt-1 font-mono text-lg font-semibold " + (alpha == null || alpha >= 0 ? "text-emerald-700" : "text-red-700")}>{alpha == null ? "—" : (alpha > 0 ? "+" : "") + alpha.toFixed(2) + "%"}</div>
            </div>
          </div>

          {benchmarkError ? <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{benchmarkError}</div> : benchmarkLoading ? (
            <div className="mt-3 flex h-[285px] items-center justify-center text-xs text-slate-500">Loading NIFTY 50 history…</div>
          ) : chartData.length ? (
            <>
              <div className="mt-3 h-[285px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={25} />
                    <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => Number(value).toFixed(0) + "%"} />
                    <Tooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ""}
                      formatter={(value, name) => [Number(value).toFixed(2) + "%", name === "NIFTY 50" ? "NIFTY 50" : selected.portfolio.name + " (endpoint guide)"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                    />
                    <Line type="monotone" dataKey="niftyReturn" name="NIFTY 50" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />
                    <Line type="linear" dataKey="portfolioReturn" name={selected.portfolio.name} stroke="#123b9d" strokeWidth={3} dot={false} activeDot={{ r: 5 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><i className="h-0.5 w-5 border-t-2 border-dashed border-slate-500" />NIFTY 50 cumulative return <i className="ml-2 h-0.5 w-5 bg-blue-800" />{selected.portfolio.name} endpoint guide</span>
                <span>{chartDates[0]} to {chartDates[chartDates.length - 1]}</span>
              </div>
              <p className="mt-2 text-[10px] text-slate-400">The blue line connects the portfolio’s buy-date baseline to its latest measured return; intermediate portfolio NAV history is not stored.</p>
            </>
          ) : <div className="mt-3 flex h-[285px] items-center justify-center rounded-md bg-slate-50 px-5 text-center text-xs text-slate-500">NIFTY 50 history is unavailable for the selected portfolio period.</div>}
        </>
      ) : <div className="mt-4 flex h-[300px] items-center justify-center rounded-md bg-slate-50 text-xs text-slate-500">No active portfolios available for comparison.</div>}
    </div>
  );
};
const dashboardColors = ["#123b9d", "#4169c9", "#59657a", "#d97706", "#16a085", "#8b5cf6"];
const DRIFT_LIMIT = 5;
const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? response;
const formatMoney = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return "₹ " + (amount / 10000000).toFixed(2) + " Cr";
  if (amount >= 100000) return "₹ " + (amount / 100000).toFixed(2) + " L";
  return "₹ " + amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};
const formatPercent = (value) => Number(value || 0).toFixed(1) + "%";
const formatDrift = (value) => (Number(value) > 0 ? "+" : "") + Number(value || 0).toFixed(1) + "%";
const toNseDate = (value) => {
  const date = value ? new Date(value + "T00:00:00") : new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return day + "-" + month + "-" + date.getFullYear();
};
const toLocalIsoDate = (date) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");

const AssetAllocationCard = ({ aum, assetAllocation, loading }) => {
  let cursor = 0;
  const segments = assetAllocation.filter((asset) => Number(asset.amount) > 0).map((asset, index) => {
    const start = cursor;
    cursor += aum > 0 ? (Number(asset.amount) / aum) * 360 : 0;
    return dashboardColors[index % dashboardColors.length] + " " + start + "deg " + cursor + "deg";
  });
  const chartBackground = segments.length ? "conic-gradient(" + segments.join(", ") + ")" : "conic-gradient(#e2e8f0 0deg 360deg)";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Asset Allocation</h2>
        <p className="text-[11px] text-slate-500">Active portfolio value by asset class</p>
      </div>
      <div className="flex justify-center py-5">
        <div className="relative flex h-[155px] w-[155px] items-center justify-center rounded-full" style={{ background: chartBackground }}>
          <div className="flex h-[105px] w-[105px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-[9px] text-slate-500">TOTAL POOL</span>
            <strong className="text-lg">{formatMoney(aum)}</strong>
            <span className="text-[10px] font-semibold text-slate-500">Current AUM</span>
          </div>
        </div>
      </div>
      {loading ? <div className="py-4 text-center text-xs text-slate-400">Loading allocation…</div> : assetAllocation.length ? (
        <div className="space-y-3">
          {assetAllocation.map((asset, index) => (
            <div key={asset.name}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dashboardColors[index % dashboardColors.length] }} />
                  <span className="truncate font-medium text-slate-700">{asset.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <strong>{formatPercent(asset.percentage)}</strong>
                  <span className="ml-2 text-slate-500">{formatMoney(asset.amount)}</span>
                </div>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: Math.min(100, Number(asset.percentage || 0)) + "%", backgroundColor: dashboardColors[index % dashboardColors.length] }} />
              </div>
            </div>
          ))}
        </div>
      ) : <div className="py-4 text-center text-xs text-slate-500">No active portfolio allocations found.</div>}
    </div>
  );
};

const DriftMonitoringCard = ({ rows, loading, error, actionableCount, onViewAll, onOpenPortfolio }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Drift Monitoring &amp; Rebalance Queue</h2>
        <p className="mt-1 text-[11px] text-slate-500">Live asset class drift against each active portfolio’s theme allocation.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={"rounded px-2 py-1 text-[10px] font-bold " + (actionableCount ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700")}>{actionableCount} Actionable</span>
        <button onClick={onViewAll} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950">Rebalancing <ArrowRight size={14} /></button>
      </div>
    </div>
    {error ? <div className="mt-4 rounded-md bg-amber-50 px-3 py-4 text-xs text-amber-800">{error}</div> : loading ? (
      <div className="mt-4 rounded-md bg-slate-50 px-3 py-8 text-center text-xs text-slate-500">Loading active portfolio drift…</div>
    ) : rows.length ? (
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.5fr_1fr_.7fr_.7fr_.7fr_1.15fr_.35fr] gap-2 rounded bg-blue-50 px-3 py-2 text-[9px] font-semibold uppercase text-slate-500">
            <span>Portfolio mandate</span><span>Asset class</span><span>Target</span><span>Current</span><span>Drift</span><span>Status</span><span />
          </div>
          {rows.slice(0, 8).map((item) => (
            <div key={item.key} className="grid grid-cols-[1.5fr_1fr_.7fr_.7fr_.7fr_1.15fr_.35fr] items-center gap-2 border-b border-slate-100 px-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-800">{item.portfolioName}</div>
                <div className="mt-1 truncate text-[9px] text-slate-500">{item.theme || "Active mandate"} · AUM {formatMoney(item.aum)}</div>
              </div>
              <span className="truncate rounded bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-800">{item.assetClass}</span>
              <span className="text-xs text-slate-500">{formatPercent(item.target)}</span>
              <span className="text-xs font-semibold text-slate-700">{formatPercent(item.current)}</span>
              <span className={"text-xs font-semibold " + (item.drift > 0 ? "text-red-600" : "text-emerald-700")}>{formatDrift(item.drift)}</span>
              <span className="inline-flex w-fit rounded bg-red-100 px-2 py-1 text-[9px] font-semibold text-red-700">Rebalance required</span>
              <button onClick={() => onOpenPortfolio(item.portfolioId)} aria-label={"View " + item.portfolioName} className="rounded bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"><Eye size={14} /></button>
            </div>
          ))}
          {rows.length > 8 && <div className="px-3 pt-2 text-[10px] text-slate-500">Showing 8 of {rows.length} breached asset classes.</div>}
        </div>
      </div>
    ) : <div className="mt-4 rounded-md bg-emerald-50 px-3 py-7 text-center text-xs text-emerald-800">No active portfolios are outside the ±{DRIFT_LIMIT}% drift threshold.</div>}
  </div>
);
const DashboardPage = () => {
  const [portfolioCount, setPortfolioCount] = useState(null);
  const [activeCount, setActiveCount] = useState(null);
  const [aum, setAum] = useState(0);
  const [assetAllocation, setAssetAllocation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mandates, setMandates] = useState([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
  const [benchmarkPoints, setBenchmarkPoints] = useState([]);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState("");
  const [driftRows, setDriftRows] = useState([]);
  const [actionableCount, setActionableCount] = useState(0);
  const [dashboardError, setDashboardError] = useState("");
  const [driftError, setDriftError] = useState("");

  const userId = localStorage.getItem("userId");


  const selectedPortfolio = mandates.find((entry) => String(entry.portfolio.id) === String(selectedPortfolioId));
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setDashboardError("");
      setDriftError("");
      if (!userId) {
        setDashboardError("Sign in to load live portfolio dashboard data.");
        setLoading(false);
        return;
      }

      try {
        const [totalResult, activeResult, listResult] = await Promise.allSettled([
          getCountOfPortfolios(userId),
          getCountOfActivePortfolios(userId),
          getAllPortfolioDetails(userId),
        ]);
        if (cancelled) return;

        const portfolioPayload = listResult.status === "fulfilled" ? unwrapResponse(listResult.value) : null;
        const portfolioList = portfolioPayload?.portfolioDetailsDTOList || portfolioPayload?.data?.portfolioDetailsDTOList;
        if (!Array.isArray(portfolioList)) {
          throw new Error(portfolioPayload?.message || "Could not load portfolios from the backend.");
        }
        const activePortfolios = portfolioList.filter((portfolio) => String(portfolio.portfolioStatus || "ACTIVE").toUpperCase() === "ACTIVE");
        setPortfolioCount(totalResult.status === "fulfilled" ? Number(totalResult.value) : portfolioList.length);
        setActiveCount(activeResult.status === "fulfilled" ? Number(activeResult.value) : activePortfolios.length);

        const details = await Promise.all(activePortfolios.map(async (portfolio) => {
          const [infoResult, holdingsResult, validationResult, historyResult] = await Promise.allSettled([
            getPortfolioBasicInfo(portfolio.id),
            getPortfolioHoldings(portfolio.id),
            validatePortfolioAllocation(portfolio.id),
            getPortfolioDriftHistory(portfolio.id),
          ]);
          return {
            portfolio,
            info: infoResult.status === "fulfilled" ? unwrapResponse(infoResult.value) : null,
            holdings: holdingsResult.status === "fulfilled" ? unwrapResponse(holdingsResult.value) : [],
            validation: validationResult.status === "fulfilled" ? unwrapResponse(validationResult.value) : null,
            history: historyResult.status === "fulfilled" ? unwrapResponse(historyResult.value) : [],
            validationFailed: validationResult.status === "rejected",
          };
        }));
        if (cancelled) return;

        const completeDetails = details.map((item) => {
          const holdings = Array.isArray(item.holdings) ? item.holdings : [];
          const investedInPositions = holdings.reduce((sum, holding) => sum + Number(holding.totalCost || 0), 0);
          const currentPositionsValue = holdings.reduce((sum, holding) => sum + Number(holding.currentValue ?? holding.totalCost ?? 0), 0);
          const cash = Number(item.info?.amount || 0);
          const totalBasis = investedInPositions + cash;
          const totalValue = currentPositionsValue + cash;
          const buyDates = holdings.map((holding) => holding.firstBuyDate).filter(Boolean).sort();
          return {
            ...item,
            holdings,
            firstBuyDate: buyDates[0] || null,
            returnPercent: totalBasis > 0 ? ((totalValue - totalBasis) / totalBasis) * 100 : null,
          };
        });
        setMandates(completeDetails);
        setSelectedPortfolioId((current) => completeDetails.some((item) => String(item.portfolio.id) === String(current)) ? current : String(completeDetails[0]?.portfolio.id || ""));

        const totalsByAsset = new Map();
        let totalAum = 0;
        const nextDriftRows = [];
        const breachedPortfolioIds = new Set();
        let failedDriftRequests = 0;
        completeDetails.forEach(({ portfolio, info, holdings, validation, validationFailed }) => {
          const cash = Number(info?.amount || 0);
          let positionsValue = 0;
          (Array.isArray(holdings) ? holdings : []).forEach((holding) => {
            const value = Number(holding.currentValue ?? holding.totalCost ?? 0);
            const assetName = String(holding.assetClass || "Other");
            totalsByAsset.set(assetName, (totalsByAsset.get(assetName) || 0) + value);
            positionsValue += value;
          });
          if (cash > 0) totalsByAsset.set("Cash / unallocated", (totalsByAsset.get("Cash / unallocated") || 0) + cash);
          totalAum += positionsValue + cash;
          if (validationFailed) failedDriftRequests += 1;
          (validation?.allocations || []).forEach((allocation) => {
            const drift = Number(allocation.driftPercentage || 0);
            if (Math.abs(drift) < DRIFT_LIMIT) return;
            breachedPortfolioIds.add(portfolio.id);
            nextDriftRows.push({
              key: String(portfolio.id) + "-" + String(allocation.assetId),
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              theme: info?.themeName || portfolio.theme,
              aum: Number(validation.totalCurrentValue || portfolio.aum || positionsValue + cash),
              assetClass: allocation.assetClass,
              target: Number(allocation.targetPercentage || 0),
              current: Number(allocation.currentPercentage || 0),
              drift,
            });
          });
        });

        const nextAllocation = [...totalsByAsset.entries()]
          .map(([name, amount]) => ({ name, amount, percentage: totalAum > 0 ? (amount / totalAum) * 100 : 0 }))
          .sort((a, b) => b.amount - a.amount);
        nextDriftRows.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));
        setAum(totalAum);
        setAssetAllocation(nextAllocation);
        setDriftRows(nextDriftRows);
        setActionableCount(breachedPortfolioIds.size);
        if (failedDriftRequests === completeDetails.length && completeDetails.length) {
          setDriftError("Drift data could not be loaded. Check the portfolio allocation API and your session.");
        }
      } catch (loadError) {
        if (!cancelled) setDashboardError(loadError?.message || "Unable to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedPortfolio) {
      setBenchmarkPoints([]);
      setBenchmarkError("");
      setBenchmarkLoading(false);
      return () => { cancelled = true; };
    }

    const startDate = selectedPortfolio.firstBuyDate || (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 1);
      return toLocalIsoDate(date);
    })();
    // Include enough calendar days to find the preceding trading close,
    // including weekends and exchange holidays.
    const requestStart = new Date(startDate + "T00:00:00");
    requestStart.setDate(requestStart.getDate() - 10);
    const from = toNseDate(toLocalIsoDate(requestStart));
    const to = toNseDate(toLocalIsoDate(new Date()));
    setBenchmarkLoading(true);
    setBenchmarkError("");
    getNifty50History(from, to)
      .then((points) => {
        if (!cancelled) setBenchmarkPoints(Array.isArray(points) ? points.filter((point) => point?.date && Number(point.close) > 0) : []);
      })
      .catch((error) => {
        if (!cancelled) {
          setBenchmarkPoints([]);
          setBenchmarkError(error.response?.data?.message || error.message || "NIFTY 50 history is unavailable.");
        }
      })
      .finally(() => { if (!cancelled) setBenchmarkLoading(false); });
    return () => { cancelled = true; };
  }, [selectedPortfolio]);

  return (
    <div className="min-h-screen bg-[#f5f7fc]">
      <SideBarComponent activePage="Dashboard" />
      <div className="ml-[257px] min-h-screen max-[760px]:ml-0">
       <TopBarComponent />
       <main>
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-5">
    
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
             
              <button 
              onClick={() => navigate("/create-portfolio")}
              className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-900">
                <Plus size={15} />
                Quick Create Portfolio
              </button>
            </div>
          </div>

          {dashboardError && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{dashboardError}</div>}

         
          <div className="mt-5 grid grid-cols-5 gap-3">
            <KpiCard
              title="Total Portfolios"
               value={portfolioCount === null ? "..." : String(portfolioCount)}
             
              icon={Building2}
            />

            <KpiCard
              title="Active Mandates"
              value={activeCount === null ? "..." : String(activeCount)}
             
              icon={ShieldCheck}
              positive
            />

          

            {/* <KpiCard
              title="Average Return"
              value="18.4%"
              subtitle="+2.3% Alpha vs NIFTY 50"
              icon={TrendingUp}
              positive
            /> */}

            <KpiCard
              title="Rebalance Drift"
              value={loading ? "…" : String(actionableCount)}
              subtitle="Active portfolios outside the 5% threshold"
              icon={AlertTriangle}
              danger
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">

            <div className="space-y-5">
              <PortfolioBenchmarkChart
                portfolios={mandates}
                selectedPortfolioId={selectedPortfolioId}
                onSelectPortfolio={setSelectedPortfolioId}
                benchmarkPoints={benchmarkPoints}
                benchmarkLoading={benchmarkLoading}
                benchmarkError={benchmarkError}
              />

              <DriftMonitoringCard
                rows={driftRows}
                loading={loading}
                error={driftError}
                actionableCount={actionableCount}
                onViewAll={() => navigate("/rebalancing")}
                onOpenPortfolio={(portfolioId) => navigate(`/portfolio/${portfolioId}`)}
              />
            </div>

     
            <div className="space-y-5">
              <AssetAllocationCard aum={aum} assetAllocation={assetAllocation} loading={loading} />

              
            </div>
          </div>
        </div>
       </main>
      </div>
    </div>
  );
};

export default DashboardPage;
