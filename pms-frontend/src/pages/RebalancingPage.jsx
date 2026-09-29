import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  RefreshCw,
  Scale,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import {
  getAllPortfolioDetails,
  getPortfolioBasicInfo,
  validatePortfolioAllocation,
} from "../services/portfolioService";
import { getPortfolioDriftHistory } from "../services/driftService";

const API_URL = "http://localhost:8082/api";
const DRIFT_LIMIT = 5;
const palette = ["#173f9b", "#aebffc", "#58637c", "#65d5a4", "#f6aa45"];

const money = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
  return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;
const driftLabel = (value) => `${Number(value || 0) > 0 ? "+" : ""}${Number(value || 0).toFixed(1)}%`;

const unwrapData = (response) => response?.data?.data ?? response?.data ?? response;
const displayDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function SummaryCard({ icon: Icon, label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-800",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`rounded-lg p-2.5 ${tones[tone]}`}><Icon size={19} /></div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</div>
        <div className="mt-1 truncate font-mono text-xl font-semibold text-slate-900">{value}</div>
        <div className="mt-0.5 text-xs text-slate-500">{detail}</div>
      </div>
    </div>
  );
}

function AllocationBar({ items, field }) {
  const total = items.reduce((sum, item) => sum + Math.max(0, Number(item[field] || 0)), 0);
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-md bg-slate-100">
      {items.map((item, index) => {
        const value = Math.max(0, Number(item[field] || 0));
        if (!value) return null;
        const width = total ? (value / total) * 100 : 0;
        return (
          <div key={`${field}-${item.assetId ?? item.assetClass}`} title={`${item.assetClass}: ${percent(value)}`} className="flex min-w-0 items-center justify-center text-[10px] font-semibold text-white" style={{ width: `${width}%`, backgroundColor: palette[index % palette.length] }}>
            {width >= 9 ? percent(value) : ""}
          </div>
        );
      })}
    </div>
  );
}

function PortfolioCard({ item, onReview, onOpen }) {
  const allocations = item.validation?.allocations || [];
  const amount = Number(item.validation?.totalCurrentValue || item.validation?.totalInvestedAmount || item.info?.amount || item.portfolio.aum || 0);
  const breaches = allocations.filter((allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT);
  const targetTotal = allocations.reduce((sum, allocation) => sum + Number(allocation.targetPercentage || 0), 0);
  const currentTotal = allocations.reduce((sum, allocation) => sum + Number(allocation.currentPercentage || 0), 0);
  const isBreach = breaches.length > 0;

  return (
    <article className={`overflow-hidden rounded-xl border border-slate-200 border-t-4 bg-white shadow-sm ${isBreach ? "border-t-amber-500" : "border-t-emerald-500"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-800"><Scale size={20} /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-900">{item.portfolio.name}</h2>
              <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${isBreach ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
                {isBreach ? "Rebalance required" : "Within tolerance"}
              </span>
              <span className="font-mono text-[11px] text-slate-500">{item.portfolio.code || `ID ${item.portfolio.id}`}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.info?.themeName || item.portfolio.theme || "Portfolio mandate"}{item.info?.benchmark ? ` · ${item.info.benchmark}` : ""}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Portfolio value</div>
          <div className="font-mono text-2xl font-semibold text-slate-900">{money(amount)}</div>
        </div>
      </div>

      <div className="mx-4 grid gap-3 rounded-lg bg-[#f0f4ff] p-3 sm:grid-cols-2 xl:grid-cols-4">
        <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Target allocation</div><div className="mt-1 font-mono text-lg font-semibold text-slate-900">{percent(targetTotal)}</div><div className="text-[11px] text-slate-500">Theme baseline</div></div>
        <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Current allocation</div><div className={`mt-1 font-mono text-lg font-semibold ${isBreach ? "text-red-700" : "text-slate-900"}`}>{percent(currentTotal)}</div><div className="text-[11px] text-slate-500">From current holdings</div></div>
        <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Drift band</div><div className="mt-1 font-mono text-lg font-semibold text-slate-900">±{DRIFT_LIMIT.toFixed(1)}%</div><div className="text-[11px] text-slate-500">Theme validation threshold</div></div>
        <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Largest deviation</div><div className={`mt-1 font-mono text-lg font-semibold ${isBreach ? "text-red-700" : "text-emerald-700"}`}>{driftLabel(allocations.reduce((largest, entry) => Math.abs(entry.driftPercentage || 0) > Math.abs(largest) ? entry.driftPercentage || 0 : largest, 0))}</div><div className="text-[11px] text-slate-500">Across asset classes</div></div>
      </div>

      {allocations.length > 0 ? (
        <div className="px-5 pb-4 pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Allocation composition</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {allocations.map((allocation, index) => <span key={allocation.assetId ?? allocation.assetClass} className="flex items-center gap-1.5 text-[10px] text-slate-600"><i className="h-2 w-2 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />{allocation.assetClass}</span>)}
            </div>
          </div>
          <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500"><span>Theme target</span><span>100% allocation</span></div>
          <AllocationBar items={allocations} field="targetPercentage" />
          <div className="mb-1 mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wide"><span className={isBreach ? "text-red-700" : "text-slate-500"}>Current holdings</span><span className={isBreach ? "text-red-700" : "text-emerald-700"}>{isBreach ? `${breaches.length} class${breaches.length === 1 ? "" : "es"} outside tolerance` : "Within mandate"}</span></div>
          <AllocationBar items={allocations} field="currentPercentage" />

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><ArrowDownRight size={15} className="text-red-600" />Trim overweight</div>
              {allocations.filter((allocation) => Number(allocation.driftPercentage) > 0).length ? allocations.filter((allocation) => Number(allocation.driftPercentage) > 0).map((allocation) => <div key={allocation.assetId} className="flex items-center justify-between border-t border-slate-100 py-2 text-xs"><span className="text-slate-700">{allocation.assetClass}</span><span className="font-mono font-semibold text-red-700">{driftLabel(allocation.driftPercentage)} · {money(amount * Number(allocation.driftPercentage) / 100)}</span></div>) : <div className="text-xs text-slate-400">No overweight asset classes</div>}
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><ArrowUpRight size={15} className="text-emerald-700" />Redeploy to underweight</div>
              {allocations.filter((allocation) => Number(allocation.driftPercentage) < 0).length ? allocations.filter((allocation) => Number(allocation.driftPercentage) < 0).map((allocation) => <div key={allocation.assetId} className="flex items-center justify-between border-t border-slate-100 py-2 text-xs"><span className="text-slate-700">{allocation.assetClass}</span><span className="font-mono font-semibold text-emerald-800">{driftLabel(allocation.driftPercentage)} · {money(Math.abs(amount * Number(allocation.driftPercentage) / 100))}</span></div>) : <div className="text-xs text-slate-400">No underweight asset classes</div>}
            </div>
          </div>
        </div>
      ) : <div className="px-5 py-6 text-sm text-slate-500">Allocation breakdown is not available for this portfolio.</div>}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <button onClick={() => onReview(item)} className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900"><SlidersHorizontal size={14} />Review rebalance plan</button>
        <button onClick={() => onOpen(item)} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800">View portfolio <ArrowRight size={14} /></button>
        <span className="ml-auto text-[10px] text-slate-500">{item.info?.reBalancingFrequency ? `Scheduled: ${item.info.reBalancingFrequency}` : "Manual drift review"}</span>
      </div>
    </article>
  );
}

export default function RebalancingPage() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All mandates");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async ({ recalculate = false } = {}) => {
    setError("");
    setNotice("");
    if (recalculate) setRefreshing(true); else setLoading(true);
    try {
      const listResponse = await getAllPortfolioDetails();
      const payload = unwrapData(listResponse);
      const list = payload?.portfolioDetailsDTOList || payload?.data?.portfolioDetailsDTOList || [];
      const active = list.filter((portfolio) => String(portfolio.portfolioStatus || portfolio.status || "ACTIVE").toUpperCase() === "ACTIVE");
      const userId = localStorage.getItem("userId");
      const results = await Promise.all(active.map(async (portfolio) => {
        const [validationResult, infoResult] = await Promise.allSettled([
          recalculate && userId
            ? axios.get(`${API_URL}/drift/calculate/${portfolio.id}/${userId}`)
            : validatePortfolioAllocation(portfolio.id),
          getPortfolioBasicInfo(portfolio.id),
        ]);
        let validation = validationResult.status === "fulfilled" ? unwrapData(validationResult.value) : null;
        if (recalculate && validationResult.status === "fulfilled") {
          const refreshed = await validatePortfolioAllocation(portfolio.id).catch(() => null);
          validation = refreshed ? unwrapData(refreshed) : validation?.allocations ? validation : null;
        }
        const info = infoResult.status === "fulfilled" ? unwrapData(infoResult.value) : null;
        const history = userId ? await getPortfolioDriftHistory(portfolio.id).catch(() => []) : [];
        const latestByAsset = new Map();
        history.forEach((entry) => {
          if (!latestByAsset.has(entry.assetId)) latestByAsset.set(entry.assetId, entry);
        });
        if (validation?.valid === false && Array.isArray(validation.allocations)) {
          validation = {
            ...validation,
            allocations: validation.allocations.map((allocation) => {
              const saved = latestByAsset.get(allocation.assetId);
              return saved ? {
                ...allocation,
                driftPercentage: saved.driftPercent,
                currentPercentage: Number(allocation.targetPercentage || 0) + Number(saved.driftPercent || 0),
                driftDetectedAt: saved.detectedAt,
              } : allocation;
            }),
          };
        }
        return { portfolio, validation, info, history };
      }));
      setPortfolios(results);
      if (recalculate) setNotice("Drift checks completed for active mandates.");
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || "Unable to load portfolio allocations.");
      setPortfolios([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => portfolios.filter((item) => {
    const text = `${item.portfolio.name || ""} ${item.portfolio.code || ""} ${item.info?.themeName || item.portfolio.theme || ""}`.toLowerCase();
    const hasBreach = (item.validation?.allocations || []).some((allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT);
    return (!query || text.includes(query.toLowerCase())) && (filter === "All mandates" || (filter === "Needs action" ? hasBreach : !hasBreach));
  }), [portfolios, query, filter]);

  const breached = portfolios.filter((item) => (item.validation?.allocations || []).some((allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT));
  const totalCapital = portfolios.reduce((sum, item) => sum + Number(item.validation?.totalCurrentValue || item.validation?.totalInvestedAmount || item.info?.amount || item.portfolio.aum || 0), 0);
  const driftCapital = breached.reduce((sum, item) => {
    const amount = Number(item.validation?.totalCurrentValue || item.validation?.totalInvestedAmount || item.info?.amount || item.portfolio.aum || 0);
    const drift = (item.validation?.allocations || []).reduce((max, allocation) => Math.max(max, Math.abs(Number(allocation.driftPercentage || 0))), 0);
    return sum + amount * drift / 100;
  }, 0);

  return (
    <div className="min-h-screen bg-[#f5f7fc] font-sans text-slate-900">
      <SideBarComponent activePage="Rebalancing" />
      <div className="ml-[257px] min-h-screen">
        <TopBarComponent />
        <main className="mx-auto max-w-[1600px] px-5 py-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-blue-800"><span>Institutional drift governance</span><span className="text-slate-400">•</span><span className="font-mono normal-case tracking-normal text-slate-500">Live allocation review</span></div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Portfolio Rebalancing</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">Monitor asset class drift against each portfolio’s theme and review the trades needed to restore its target mix.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadData({ recalculate: true })} disabled={refreshing || loading} className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-60"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Checking drift…" : "Run drift checks"}</button>
            </div>
          </div>

          {notice && <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><CheckCircle2 size={15} />{notice}</div>}
          {error && <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"><AlertTriangle size={15} />{error}</div>}

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <SummaryCard icon={AlertTriangle} label="Mandates requiring action" value={loading ? "—" : breached.length} detail={`${portfolios.length} active portfolios reviewed`} tone={breached.length ? "red" : "green"} />
            <SummaryCard icon={Clock3} label="Drift tolerance" value={`±${DRIFT_LIMIT.toFixed(1)}%`} detail="Configured allocation validation band" tone="blue" />
            <SummaryCard icon={Wallet} label="Capital at drift" value={loading ? "—" : money(driftCapital)} detail={`${breached.length} affected mandate${breached.length === 1 ? "" : "s"} · active book ${money(totalCapital)}`} tone="amber" />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-base font-bold text-slate-900">Active mandates</h2><p className="mt-0.5 text-xs text-slate-500">Current allocation compared with the selected theme’s target.</p></div>
            <div className="flex flex-wrap gap-2">
              <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3"><Filter size={14} className="text-slate-400" /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="bg-transparent text-xs text-slate-700 outline-none"><option>All mandates</option><option>Needs action</option><option>Within tolerance</option></select></div>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter mandates…" className="h-9 w-48 rounded-md border border-slate-200 bg-white px-3 text-xs outline-none placeholder:text-slate-400 focus:border-blue-400" />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading portfolio allocations…</div> : filtered.length ? filtered.map((item) => <PortfolioCard key={item.portfolio.id} item={item} onReview={setSelected} onOpen={(entry) => navigate(`/portfolio/${entry.portfolio.id}`)} />) : <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><BellRing className="mx-auto mb-2 text-slate-400" size={22} /><div className="text-sm font-semibold text-slate-800">{portfolios.length ? "No mandates match this filter" : "No active portfolios to review"}</div><p className="mt-1 text-xs text-slate-500">Active portfolio allocations will appear here once available.</p></div>}
          </div>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div><h2 className="text-base font-bold text-slate-900">Drift detection history</h2><p className="mt-0.5 text-xs text-slate-500">Saved drift records from scheduled and manual calculations.</p></div>
              <button type="button" disabled title="History export is not available yet" className="flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400"><Download size={14} />Export history</button>
            </div>
            {portfolios.some((item) => item.history?.length) ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#f0f4ff] text-[10px] font-bold uppercase tracking-wide text-slate-600"><tr><th className="px-5 py-3">Detected</th><th className="px-5 py-3">Portfolio</th><th className="px-5 py-3">Asset class</th><th className="px-5 py-3">Drift</th><th className="px-5 py-3">Record</th></tr></thead><tbody>{portfolios.flatMap((item) => (item.history || []).map((entry) => ({ ...entry, portfolioName: item.portfolio.name }))).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt) || b.id - a.id).slice(0, 30).map((entry) => <tr key={entry.id} className="border-t border-slate-100 text-xs"><td className="whitespace-nowrap px-5 py-3 font-mono text-slate-700">{displayDate(entry.detectedAt)}</td><td className="px-5 py-3 font-semibold text-slate-800">{entry.portfolioName}</td><td className="px-5 py-3 text-slate-600">{entry.assetClass}</td><td className={`px-5 py-3 font-mono font-semibold ${Number(entry.driftPercent) > 0 ? "text-red-700" : "text-emerald-800"}`}>{driftLabel(entry.driftPercent)}</td><td className="px-5 py-3"><span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Drift detected</span></td></tr>)}</tbody></table></div> : <div className="flex flex-col items-center px-5 py-9 text-center"><div className="rounded-full bg-slate-100 p-3 text-slate-500"><Clock3 size={20} /></div><div className="mt-3 text-sm font-semibold text-slate-800">No drift records found</div><p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">Saved drift records will appear here after scheduled or manual drift calculations detect an out-of-band allocation.</p></div>}
          </section>
        </main>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="plan-title" className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Allocation transfer plan</div><h2 id="plan-title" className="mt-1 text-lg font-bold text-slate-900">{selected.portfolio.name}</h2></div><button onClick={() => setSelected(null)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
          <div className="px-5 py-4"><p className="text-sm text-slate-600">Estimated asset class transfers based on the latest allocation validation.</p><div className="mt-4 space-y-2">{(selected.validation?.allocations || []).map((allocation) => { const drift = Number(allocation.driftPercentage || 0); const amount = Number(selected.validation?.totalCurrentValue || selected.validation?.totalInvestedAmount || selected.info?.amount || selected.portfolio.aum || 0) * Math.abs(drift) / 100; return <div key={allocation.assetId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3"><div><div className="text-sm font-semibold text-slate-800">{allocation.assetClass}</div><div className="mt-0.5 text-[11px] text-slate-500">Target {percent(allocation.targetPercentage)} · Current {percent(allocation.currentPercentage)}</div></div><div className={`text-right font-mono text-sm font-semibold ${drift > 0 ? "text-red-700" : drift < 0 ? "text-emerald-800" : "text-slate-500"}`}>{drift > 0 ? "Sell" : drift < 0 ? "Buy" : "On target"}{drift !== 0 && <div>{money(amount)} · {driftLabel(drift)}</div>}</div></div>; })}</div><div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900">This is an asset class level estimate. Security level order generation and execution will follow once the rebalance execution flow is connected.</div></div>
          <div className="flex justify-end border-t border-slate-100 px-5 py-3"><button onClick={() => setSelected(null)} className="rounded-md bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900">Done</button></div>
        </section>
      </div>}
    </div>
  );
}
