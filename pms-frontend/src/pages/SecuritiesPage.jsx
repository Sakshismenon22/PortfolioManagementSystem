import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import { getAllSecuritiesInfo } from "../services/securityService";

const PAGE_SIZE = 10;
const money = (value) => value == null || !Number.isFinite(Number(value))
  ? "—"
  : `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SecuritiesPage() {
  const [securities, setSecurities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [view, setView] = useState("table");
  const [page, setPage] = useState(1);

  const loadSecurities = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllSecuritiesInfo();
      const payload = response?.data?.data ?? response?.data ?? response;
      const list = payload?.securities ?? payload;
      if (!Array.isArray(list)) throw new Error(payload?.message || "The securities response was not a list.");
      setSecurities(list);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || "Securities could not be loaded.");
      setSecurities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSecurities(); }, []);

  const sectors = useMemo(() => [...new Set(securities
    .map((security) => security.gicsSector || security.sector)
    .filter((sector) => typeof sector === "string" && sector.trim()))].sort((a, b) => a.localeCompare(b)), [securities]);
  const filtered = useMemo(() => securities.filter((security) => {
    const name = String(security.name || "").toLowerCase();
    const symbol = String(security.symbol || "").toLowerCase();
    const sector = security.gicsSector || security.sector || "";
    return name.includes(nameFilter.trim().toLowerCase())
      && symbol.includes(symbolFilter.trim().toLowerCase())
      && (sectorFilter === "ALL" || sector === sectorFilter);
  }), [securities, nameFilter, symbolFilter, sectorFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [nameFilter, symbolFilter, sectorFilter]);

  return (
    <div className="min-h-screen bg-[#f6f8fd] text-slate-900">
      <SideBarComponent activePage="Securities" />
      <div className="ml-[257px] min-h-screen min-w-0 max-[760px]:ml-0">
        <TopBarComponent />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-blue-800">Security master · live reference</div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Securities</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">Browse available instruments, current prices, identifiers, and GICS sector classifications.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm"><ShieldCheck size={15} className="text-emerald-600" />{securities.length.toLocaleString("en-IN")} instruments</div>
          </div>

          <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-slate-400"><Search size={14} /><span className="sr-only">Filter by name</span><input aria-label="Filter by name" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Filter by name" className="w-36 text-xs text-slate-700 outline-none placeholder:text-slate-400" /></label>
                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-slate-400"><span className="text-[10px] font-bold uppercase tracking-wide">Symbol</span><input aria-label="Filter by symbol" value={symbolFilter} onChange={(event) => setSymbolFilter(event.target.value)} placeholder="e.g. INFY" className="w-24 text-xs text-slate-700 outline-none placeholder:text-slate-400" /></label>
                <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs text-slate-600"><span className="font-semibold">Sector</span><select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)} className="max-w-44 bg-transparent outline-none"><option value="ALL">All sectors</option>{sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select></label>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-slate-200 p-0.5"><button onClick={() => setView("table")} aria-label="Table view" className={`rounded p-1.5 ${view === "table" ? "bg-blue-50 text-blue-800" : "text-slate-500"}`}><List size={15} /></button><button onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-blue-50 text-blue-800" : "text-slate-500"}`}><Grid2X2 size={15} /></button></div>
                <button onClick={loadSecurities} disabled={loading} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh</button>
              </div>
            </div>

            {error && <div role="alert" className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2.5 text-xs text-red-700"><span>{error}</span><button onClick={loadSecurities} className="font-semibold underline">Try again</button></div>}
            {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading securities and prices…</div> : !visible.length ? <div className="flex flex-col items-center p-12 text-center"><WalletCards size={30} className="text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No securities found</p><p className="mt-1 text-xs text-slate-500">Adjust the name, symbol, or sector filters.</p></div> : view === "table" ? (
              <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-xs"><thead className="bg-[#eef3ff] text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Security</th><th className="px-4 py-3">Symbol</th><th className="px-4 py-3">ISIN</th><th className="px-4 py-3">GICS sector</th><th className="px-4 py-3">Asset class</th><th className="px-5 py-3 text-right">Current price</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((security) => <tr key={security.id} className="hover:bg-slate-50/80"><td className="px-5 py-3.5"><div className="font-semibold text-slate-800">{security.name || "—"}</div><div className="mt-0.5 text-[10px] text-slate-400">Security ID · {security.id}</div></td><td className="px-4 py-3.5 font-mono text-slate-600">{security.symbol || "—"}</td><td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">{security.isin || "—"}</td><td className="px-4 py-3.5 text-slate-600">{security.gicsSector || security.sector || "Unclassified"}</td><td className="px-4 py-3.5"><span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-semibold uppercase text-blue-800">{security.asset?.assetClass || security.assetClass || security.securityType || "—"}</span></td><td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">{money(security.price)}</td></tr>)}</tbody></table></div>
            ) : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((security) => <article key={security.id} className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-slate-900" title={security.name}>{security.name || "—"}</h2><div className="mt-1 font-mono text-xs text-slate-500">{security.symbol || "—"}</div></div><span className="shrink-0 rounded bg-blue-50 px-2 py-1 text-[9px] font-semibold uppercase text-blue-800">{security.asset?.assetClass || security.assetClass || security.securityType || "Security"}</span></div><div className="mt-4 rounded-lg bg-[#f5f7fc] p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Current price</div><div className="mt-1 font-mono text-lg font-semibold text-slate-900">{money(security.price)}</div></div><dl className="mt-3 space-y-2 text-xs"><div className="flex justify-between gap-2"><dt className="text-slate-500">ISIN</dt><dd className="truncate font-mono text-slate-700">{security.isin || "—"}</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">GICS sector</dt><dd className="truncate text-right text-slate-700">{security.gicsSector || security.sector || "Unclassified"}</dd></div></dl></article>)}</div>}

            {!loading && filtered.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} results</span><div className="flex items-center gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} aria-label="Previous page" className="rounded border border-slate-200 p-1.5 disabled:opacity-40"><ChevronLeft size={15} /></button><span>Page {currentPage} of {pageCount}</span><button onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount} aria-label="Next page" className="rounded border border-slate-200 p-1.5 disabled:opacity-40"><ChevronRight size={15} /></button></div></div>}
          </section>
        </main>
      </div>
    </div>
  );
}
