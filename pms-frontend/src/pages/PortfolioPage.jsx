import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Building2, Download,
  Filter, Plus, RefreshCw, Scale, ShieldCheck, WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import {
  getAllPortfolioDetails,
  getPortfolioBasicInfo,
  validatePortfolioAllocation,
} from "../services/portfolioService";

const PAGE_SIZE = 8;
const DRIFT_LIMIT = 5;
const FILTERS = ["All", "Active", "Rebalance Required", "Draft", "Closed"];

const PortfolioPage = () => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [driftPortfolioIds, setDriftPortfolioIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driftLoading, setDriftLoading] = useState(false);
  const [density, setDensity] = useState("dense");
  const [returnSort, setReturnSort] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      if (!userId) {
        setError("Sign in to load your portfolios.");
        setLoading(false);
        return;
      }
      try {
        const response = await getAllPortfolioDetails(userId);
        const payload = response?.data?.data ?? response?.data ?? response;
        const list = payload?.portfolioDetailsDTOList;
        if (!Array.isArray(list)) throw new Error(response?.message || "The portfolio list response was not in the expected format.");
        if (!active) return;
        const normalized = list.map((portfolio) => ({
          ...portfolio,
          id: portfolio.id ?? portfolio.portfolioId,
          status: String(portfolio.portfolioStatus ?? portfolio.status ?? "ACTIVE").toUpperCase(),
          name: portfolio.name || "Unnamed portfolio",
          code: portfolio.code || `PMS-${portfolio.id ?? portfolio.portfolioId}`,
          theme: portfolio.theme || "Unassigned theme",
          allocationType: String(portfolio.allocationType || "—").replaceAll("_", " "),
          aum: Number(portfolio.aum || 0),
          returnValue: parseReturn(portfolio.return1Y),
          benchmark: String(portfolio.benchmark || "—").replaceAll("_", " "),
          initials: portfolio.initials || initialsFor(portfolio.name),
        }));
        setPortfolios(normalized);
        setDriftLoading(true);
        const activePortfolios = normalized.filter((item) => item.status === "ACTIVE");
        const validations = await Promise.allSettled(activePortfolios.map((item) => validatePortfolioAllocation(item.id)));
        if (!active) return;
        const breachedIds = activePortfolios.filter((item, index) => {
          const result = validations[index];
          const allocations = result.status === "fulfilled" ? result.value?.allocations : null;
          return Array.isArray(allocations) && allocations.some((allocation) =>
            allocation.satisfied === false || Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT);
        }).map((item) => String(item.id));
        setDriftPortfolioIds(breachedIds);
      } catch (loadError) {
        if (active) setError(loadError?.response?.data?.message || loadError?.message || "Could not load portfolios.");
      } finally {
        if (active) {
          setLoading(false);
          setDriftLoading(false);
        }
      }
    }
    load();
    return () => { active = false; };
  }, [userId]);

  const counts = useMemo(() => ({
    All: portfolios.length,
    Active: portfolios.filter((item) => item.status === "ACTIVE").length,
    "Rebalance Required": driftPortfolioIds.length,
    Draft: portfolios.filter((item) => ["DRAFT", "CREATED"].includes(item.status)).length,
    Closed: portfolios.filter((item) => ["CANCELED", "CLOSED"].includes(item.status)).length,
  }), [portfolios, driftPortfolioIds]);

  const filteredPortfolios = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = portfolios.filter((portfolio) => {
      const matchesFilter = filter === "All"
        || (filter === "Active" && portfolio.status === "ACTIVE")
        || (filter === "Rebalance Required" && driftPortfolioIds.includes(String(portfolio.id)))
        || (filter === "Draft" && ["DRAFT", "CREATED"].includes(portfolio.status))
        || (filter === "Closed" && ["CANCELED", "CLOSED"].includes(portfolio.status));
      const matchesSearch = !query || [portfolio.name, portfolio.code, portfolio.theme, portfolio.benchmark]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
    if (returnSort) result.sort((a, b) => returnSort === "asc" ? a.returnValue - b.returnValue : b.returnValue - a.returnValue);
    return result;
  }, [portfolios, filter, search, driftPortfolioIds, returnSort]);

  useEffect(() => { setPage(1); }, [filter, search]);
  const pageCount = Math.max(1, Math.ceil(filteredPortfolios.length / PAGE_SIZE));
  const pageRows = filteredPortfolios.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activePortfolios = portfolios.filter((item) => item.status === "ACTIVE");
  const totalAum = activePortfolios.reduce((sum, item) => sum + item.aum, 0);
  const averageReturn = activePortfolios.length
    ? activePortfolios.reduce((sum, item) => sum + item.returnValue, 0) / activePortfolios.length
    : 0;
  const compliance = activePortfolios.length
    ? Math.max(0, ((activePortfolios.length - driftPortfolioIds.length) / activePortfolios.length) * 100)
    : 100;

  const openPortfolio = async (portfolio) => {
    try {
      const basicInfo = await getPortfolioBasicInfo(portfolio.id);
      navigate(`/portfolio/${portfolio.id}`, { state: { portfolio: { ...portfolio, ...basicInfo } } });
    } catch {
      navigate(`/portfolio/${portfolio.id}`, { state: { portfolio } });
    }
  };

  const exportPortfolios = () => {
    const rows = [["Portfolio", "Code", "Theme", "Status", "Allocation Type", "AUM (INR)", "Return", "Benchmark"],
      ...filteredPortfolios.map((item) => [item.name, item.code, item.theme, item.status, item.allocationType, item.aum, `${item.returnValue.toFixed(2)}%`, item.benchmark])];
    downloadCsv(rows, "portfolio-ledger.csv");
  };

  return (
    <div className="min-h-screen bg-[#f6f8fd]">
      <SideBarComponent activePage="Portfolios" />
      <div className="ml-[257px] min-h-screen max-[760px]:ml-0">
        <TopBarComponent />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-5">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Active portfolio AUM" value={formatMoney(totalAum)} detail={`${activePortfolios.length} active mandates`} icon={Building2} />
            <SummaryCard title="Rebalance required" value={driftLoading ? "…" : String(driftPortfolioIds.length)} detail={driftPortfolioIds.length ? "Mandates outside allocation tolerance" : "No active drift alerts"} icon={AlertTriangle} tone={driftPortfolioIds.length ? "red" : "green"} />
            <SummaryCard title="Allocation compliance" value={`${compliance.toFixed(1)}%`} detail="Active portfolios within ±5% threshold" icon={ShieldCheck} tone="green" />
            <SummaryCard title="Average portfolio return" value={`${averageReturn >= 0 ? "+" : ""}${averageReturn.toFixed(2)}%`} detail="Current return across active mandates" icon={WalletCards} tone={averageReturn >= 0 ? "green" : "red"} />
          </section>

          <section className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-bold tracking-wider text-blue-700">PORTFOLIO MANAGEMENT SYSTEM · LIVE ALLOCATION</div>
              <h1 className="text-2xl font-semibold text-slate-900">Fund Portfolios</h1>
              <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500">Manage mandates, allocation themes, benchmarks, and rebalance actions.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportPortfolios} disabled={!filteredPortfolios.length} className="inline-flex items-center gap-2 rounded-md bg-[#edf3fd] px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-100 disabled:opacity-50"><Download size={16} /> Export Ledger</button>
              <button onClick={() => navigate("/create-portfolio")} className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900"><Plus size={17} /> Create Portfolio</button>
            </div>
          </section>

          <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((name) => <button key={name} onClick={() => setFilter(name)} className={`rounded-md px-3 py-2 text-xs font-semibold ${filter === name ? "bg-blue-800 text-white" : "bg-[#edf2fb] text-slate-600 hover:bg-[#e4ebf8]"}`}>
                {name}<span className="ml-1 opacity-70">{name === "Rebalance Required" && driftLoading ? "…" : counts[name]}</span>
              </button>)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex w-[min(280px,75vw)] items-center gap-2 rounded-md bg-[#edf2fb] px-3 py-2"><Filter size={15} className="shrink-0 text-slate-500" /><span className="sr-only">Filter portfolios</span><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-xs outline-none placeholder:text-slate-500" placeholder="Filter by name, code, theme, benchmark…" /></label>
              <div className="flex rounded-md bg-[#edf2fb] p-0.5" aria-label="Portfolio row density">
                {[["dense", "DENSE"], ["expanded", "EXPANDED"]].map(([value, label]) => <button key={value} onClick={() => setDensity(value)} aria-pressed={density === value} className={`rounded px-2.5 py-1.5 text-[10px] font-bold ${density === value ? "bg-white text-blue-800 shadow-sm" : "text-slate-500"}`}>{label}</button>)}
              </div>
            </div>
          </section>

          <section className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {error ? <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center"><AlertTriangle className="text-red-500" size={28} /><p className="mt-3 text-sm font-semibold text-slate-700">Could not load portfolios</p><p className="mt-1 text-xs text-slate-500">{error}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white">Retry</button></div>
              : loading ? <div className="flex min-h-56 items-center justify-center text-sm text-slate-500">Loading portfolios…</div>
                : <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] border-collapse text-left">
                    <thead className="bg-[#eff4fc] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="px-4 py-3">Portfolio</th>
                        <th scope="col" className="px-4 py-3">Theme / strategy</th>
                        <th scope="col" className="px-4 py-3">Allocation type</th>
                        <th scope="col" className="px-4 py-3 text-right">AUM</th>
                        <th scope="col" className="px-4 py-3 text-right"><button onClick={() => setReturnSort((current) => current === "asc" ? "desc" : "asc")} className="ml-auto inline-flex items-center gap-1 whitespace-nowrap hover:text-blue-800" aria-label="Sort portfolios by return">Return {returnSort === "asc" ? <ArrowUp size={12} /> : returnSort === "desc" ? <ArrowDown size={12} /> : <ArrowUpDown size={12} />}</button></th>
                        <th scope="col" className="px-4 py-3">Benchmark</th>
                        <th scope="col" className="px-4 py-3 text-right">Status / action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {pageRows.map((portfolio) => {
                        const needsRebalance = driftPortfolioIds.includes(String(portfolio.id));
                        return <tr key={portfolio.id} className="hover:bg-slate-50/70">
                          <td className={`px-4 ${density === "dense" ? "py-2.5" : "py-5"}`}><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e9effc] text-xs font-semibold text-blue-700">{portfolio.initials}</div><div className="min-w-0"><button onClick={() => openPortfolio(portfolio)} className="max-w-[230px] truncate text-left text-sm font-semibold text-slate-800 hover:text-blue-800">{portfolio.name}</button><div className="mt-0.5 flex gap-2 text-[10px] text-slate-500"><span className="font-mono">{portfolio.code}</span><span>·</span><span>{formatStatus(portfolio.status)}</span></div></div></div></td>
                          <td className={`px-4 ${density === "dense" ? "py-2.5" : "py-5"}`}><span className="inline-block max-w-[170px] truncate rounded-sm bg-[#e7eefb] px-2 py-1 text-[11px] font-semibold text-slate-700" title={portfolio.theme}>{portfolio.theme}</span></td>
                          <td className={`px-4 text-xs text-slate-600 ${density === "dense" ? "py-2.5" : "py-5"}`}><span className="inline-flex items-center gap-2"><Scale size={14} />{formatLabel(portfolio.allocationType)}</span></td>
                          <td className={`px-4 text-right font-mono text-sm font-semibold text-slate-700 ${density === "dense" ? "py-2.5" : "py-5"}`}>{formatMoney(portfolio.aum)}</td>
                          <td className={`px-4 text-right font-mono text-sm font-semibold ${portfolio.returnValue >= 0 ? "text-emerald-700" : "text-red-600"} ${density === "dense" ? "py-2.5" : "py-5"}`}>{portfolio.returnValue > 0 ? "+" : ""}{portfolio.returnValue.toFixed(2)}%</td>
                          <td className={`px-4 font-mono text-xs text-slate-700 ${density === "dense" ? "py-2.5" : "py-5"}`}>{formatLabel(portfolio.benchmark)}</td>
                          <td className={`px-4 text-right ${density === "dense" ? "py-2.5" : "py-5"}`}><div className="flex items-center justify-end gap-2"><span className={`whitespace-nowrap rounded px-2 py-1 text-[9px] font-bold uppercase ${needsRebalance ? "bg-red-100 text-red-700" : statusTone(portfolio.status)}`}>{needsRebalance ? "Rebalance required" : formatStatus(portfolio.status)}</span>{needsRebalance && portfolio.status === "ACTIVE" ? <button onClick={() => navigate("/rebalancing", { state: { portfolioId: portfolio.id } })} className="inline-flex items-center gap-1 rounded-sm bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900"><RefreshCw size={13} /> Rebalance</button> : <button onClick={() => openPortfolio(portfolio)} className="rounded-sm bg-[#eaf0fb] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#dfe8f8]">View</button>}</div></td>
                        </tr>;
                      })}
                      {pageRows.length === 0 && <tr><td colSpan={7} className="px-5 py-16 text-center"><WalletCards className="mx-auto text-slate-300" size={30} /><p className="mt-3 text-sm font-semibold text-slate-700">No portfolios match these filters</p><p className="mt-1 text-xs text-slate-500">Change the filter or search term, or create a portfolio.</p></td></tr>}
                    </tbody>
                  </table>
                </div>}
            {!error && !loading && filteredPortfolios.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredPortfolios.length)} of {filteredPortfolios.length} portfolios</span>
              <div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="rounded bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div>
            </div>}
          </section>

          <section className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <InsightCard title="Average portfolio return" value={`${averageReturn >= 0 ? "+" : ""}${averageReturn.toFixed(2)}%`} detail="Calculated from backend portfolio returns." icon={ArrowUpDown} tone={averageReturn >= 0 ? "green" : "red"} />
            <InsightCard title="Rebalance queue" value={driftLoading ? "Checking…" : `${driftPortfolioIds.length} mandate${driftPortfolioIds.length === 1 ? "" : "s"}`} detail={driftPortfolioIds.length ? "Allocation drift requires review." : "All checked mandates are within tolerance."} icon={RefreshCw} tone={driftPortfolioIds.length ? "red" : "green"} />
            <InsightCard title="Portfolio coverage" value={`${activePortfolios.length} active · ${counts.Draft} draft`} detail={`${counts.Closed} closed portfolio${counts.Closed === 1 ? "" : "s"} in this account`} icon={ShieldCheck} />
          </section>
        </main>
      </div>
    </div>
  );
};

function SummaryCard({ title, value, detail, icon: Icon, tone = "blue" }) {
  const color = tone === "red" ? "text-red-600 bg-red-50" : tone === "green" ? "text-emerald-700 bg-emerald-50" : "text-blue-700 bg-blue-50";
  return <article className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"><span className={`rounded-md p-2 ${color}`}><Icon size={18} /></span><div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</div><div className="mt-0.5 truncate font-mono text-lg font-semibold text-slate-900">{value}</div><div className="truncate text-[10px] text-slate-500">{detail}</div></div></article>;
}

function InsightCard({ title, value, detail, icon: Icon, tone = "blue" }) {
  return <article className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500"><span>{title.toUpperCase()}</span><Icon size={16} className={tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-700" : "text-blue-700"} /></div><div className={`mt-1 text-xl font-semibold ${tone === "red" ? "text-red-700" : tone === "green" ? "text-emerald-700" : "text-slate-900"}`}>{value}</div><div className="mt-1 text-xs text-slate-500">{detail}</div></article>;
}

function parseReturn(value) {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(String(value ?? "0").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function initialsFor(name) {
  return String(name || "P").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
  return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatLabel(value) { return String(value ?? "—").replaceAll("_", " "); }
function formatStatus(status) { return status === "CANCELED" ? "Closed" : status === "CREATED" ? "Draft" : status.charAt(0) + status.slice(1).toLowerCase(); }
function statusTone(status) {
  return status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : ["DRAFT", "CREATED"].includes(status) ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
}

function downloadCsv(rows, filename) {
  const content = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default PortfolioPage;
