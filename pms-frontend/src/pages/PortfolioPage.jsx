import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowUpDown, Building2, Download, Filter, Plus,
  RefreshCw, Scale, ShieldCheck, WalletCards, Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import {
  getAllPortfolioDetails,
  getPortfolioBasicInfo,
  validatePortfolioAllocation,
  createDemoPortfolios,
  deleteDemoPortfolios,
} from "../services/portfolioService";

ModuleRegistry.registerModules([AllCommunityModule]);

const DRIFT_LIMIT = 5;
const FILTERS = ["All", "Active", "Rebalance Required", "Draft", "Closed"];

const gridTheme = themeQuartz.withParams({
  accentColor: "#1d4ed8",
  backgroundColor: "#ffffff",
  borderColor: "#e9eef7",
  browserColorScheme: "light",
  headerBackgroundColor: "#eff4fc",
  headerTextColor: "#64748b",
  headerFontSize: 10,
  headerFontWeight: 700,
  fontSize: 12,
  rowHeight: 52,
  headerHeight: 32,
  spacing: 5,
  rowHoverColor: "#f5f8ff",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  cellHorizontalPadding: 14,
});

const PortfolioPage = () => {
  const gridRef = useRef(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [driftPortfolioIds, setDriftPortfolioIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driftLoading, setDriftLoading] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMessage, setDemoMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);

  /* ---------------- data ---------------- */

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
        if (!Array.isArray(list))
          throw new Error(
            response?.message || "The portfolio list response was not in the expected format."
          );
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
        const validations = await Promise.allSettled(
          activePortfolios.map((item) => validatePortfolioAllocation(item.id))
        );
        if (!active) return;
        const breachedIds = activePortfolios
          .filter((item, index) => {
            const result = validations[index];
            const allocations = result.status === "fulfilled" ? result.value?.allocations : null;
            return (
              Array.isArray(allocations) &&
              allocations.some(
                (a) =>
                  a.satisfied === false || Math.abs(Number(a.driftPercentage || 0)) >= DRIFT_LIMIT
              )
            );
          })
          .map((item) => String(item.id));
        setDriftPortfolioIds(breachedIds);
      } catch (loadError) {
        if (active)
          setError(
            loadError?.response?.data?.message ||
              loadError?.message ||
              "Could not load portfolios."
          );
      } finally {
        if (active) {
          setLoading(false);
          setDriftLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [userId, refreshVersion]);

  const manageDemoPortfolios = async (action) => {
    if (!userId || demoBusy) return;
    setDemoBusy(true);
    setDemoMessage("");
    try {
      const response =
        action === "add" ? await createDemoPortfolios(userId) : await deleteDemoPortfolios(userId);
      setDemoMessage(
        response?.message ||
          (action === "add" ? "Demo portfolios added." : "Demo portfolios removed.")
      );
      setRefreshVersion((value) => value + 1);
    } catch (demoError) {
      setDemoMessage(
        demoError?.response?.data?.message ||
          demoError?.message ||
          "Could not update demo portfolios."
      );
    } finally {
      setDemoBusy(false);
    }
  };

  /* ---------------- derived ---------------- */

  const counts = useMemo(
    () => ({
      All: portfolios.length,
      Active: portfolios.filter((i) => i.status === "ACTIVE").length,
      "Rebalance Required": driftPortfolioIds.length,
      Draft: portfolios.filter((i) => ["DRAFT", "CREATED"].includes(i.status)).length,
      Closed: portfolios.filter((i) => ["CANCELED", "CLOSED"].includes(i.status)).length,
    }),
    [portfolios, driftPortfolioIds]
  );

  const rowData = useMemo(
    () =>
      portfolios.filter((p) =>
        filter === "All"
          ? true
          : filter === "Active"
            ? p.status === "ACTIVE"
            : filter === "Rebalance Required"
              ? driftPortfolioIds.includes(String(p.id))
              : filter === "Draft"
                ? ["DRAFT", "CREATED"].includes(p.status)
                : ["CANCELED", "CLOSED"].includes(p.status)
      ),
    [portfolios, filter, driftPortfolioIds]
  );

  const activePortfolios = portfolios.filter((i) => i.status === "ACTIVE");
  const totalAum = activePortfolios.reduce((sum, i) => sum + i.aum, 0);
  const averageReturn = activePortfolios.length
    ? activePortfolios.reduce((sum, i) => sum + i.returnValue, 0) / activePortfolios.length
    : 0;
  const compliance = activePortfolios.length
    ? Math.max(
        0,
        ((activePortfolios.length - driftPortfolioIds.length) / activePortfolios.length) * 100
      )
    : 100;

  const openPortfolio = useCallback(
    async (portfolio) => {
      try {
        const basicInfo = await getPortfolioBasicInfo(portfolio.id);
        navigate(`/portfolio/${portfolio.id}`, {
          state: { portfolio: { ...portfolio, ...basicInfo } },
        });
      } catch {
        navigate(`/portfolio/${portfolio.id}`, { state: { portfolio } });
      }
    },
    [navigate]
  );

  const exportPortfolios = () =>
    gridRef.current?.api?.exportDataAsCsv({
      fileName: "portfolio-ledger.csv",
      columnKeys: ["name", "theme", "allocationType", "aum", "returnValue", "benchmark", "statusCol"],
    });

  /* ---------------- columns ---------------- */

  const defaultColDef = useMemo(
    () => ({ sortable: true, resizable: true, suppressHeaderMenuButton: true }),
    []
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Portfolio",
        field: "name",
        flex: 2,
        minWidth: 240,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellRenderer: (p) => (
          <div className="flex h-full min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9effc] text-[11px] font-semibold text-blue-700">
              {p.data?.initials}
            </div>
            <div className="min-w-0 leading-tight">
              <button
                onClick={() => openPortfolio(p.data)}
                className="block max-w-full truncate text-left text-[13px] font-semibold text-slate-800 hover:text-blue-800"
              >
                {p.data?.name}
              </button>
              <div className="mt-0.5 flex gap-1.5 text-[10px] text-slate-500">
                <span className="font-mono">{p.data?.code}</span>
                <span>·</span>
                <span>{formatStatus(p.data?.status)}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        headerName: "Theme / strategy",
        field: "theme",
        flex: 1.4,
        minWidth: 170,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellRenderer: (p) => (
          <span
            className="block max-w-full truncate text-[12px] font-medium text-slate-700"
            title={p.value}
          >
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Allocation type",
        field: "allocationType",
        flex: 1.1,
        minWidth: 150,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) => formatLabel(p.data?.allocationType),
        cellRenderer: (p) => (
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Scale size={13} />
            {p.value}
          </span>
        ),
      },
      {
        headerName: "AUM",
        field: "aum",
        flex: 1,
        minWidth: 130,
        type: "rightAligned",
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        cellClass: "font-mono text-[13px] font-semibold",
        cellStyle: { color: "#1e3a8a" },
        valueFormatter: (p) => formatMoney(p.value),
      },
      {
        headerName: "Return",
        field: "returnValue",
        flex: 0.9,
        minWidth: 110,
        type: "rightAligned",
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        sort: "desc",
        cellClass: (p) =>
          `font-mono text-[13px] font-semibold ${
            Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"
          }`,
        valueFormatter: (p) =>
          `${Number(p.value) > 0 ? "+" : ""}${Number(p.value || 0).toFixed(2)}%`,
      },
      {
        headerName: "Benchmark",
        field: "benchmark",
        flex: 1.1,
        minWidth: 140,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) => formatLabel(p.data?.benchmark),
        cellClass: "font-mono text-slate-700",
      },
      {
        headerName: "Status / action",
        colId: "statusCol",
        flex: 1.5,
        minWidth: 230,
        type: "rightAligned",
        filter: false,
        sortable: false,
        valueGetter: (p) =>
          driftPortfolioIds.includes(String(p.data?.id))
            ? "Rebalance required"
            : formatStatus(p.data?.status),
        cellRenderer: (p) => {
          const needsRebalance = driftPortfolioIds.includes(String(p.data?.id));
          return (
            <div className="flex h-full items-center justify-end gap-3">
              <span
                className={`whitespace-nowrap text-[10px] font-bold uppercase tracking-wide ${
                  needsRebalance ? "text-red-600" : statusTone(p.data?.status)
                }`}
              >
                {p.value}
              </span>
              {needsRebalance && p.data?.status === "ACTIVE" ? (
                <button
                  onClick={() => navigate("/rebalancing", { state: { portfolioId: p.data.id } })}
                  className="inline-flex items-center gap-1 rounded-sm  px-2.5 py-1 text-[11px] font-semibold text-blue-800 "
                >
                  <RefreshCw size={12} /> Rebalance
                </button>
              ) : (
                <button
                  onClick={() => openPortfolio(p.data)}
                  className="rounded-sm border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-800"
                >
                  View
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [driftPortfolioIds, navigate, openPortfolio]
  );

  const syncCount = useCallback(() => {
    setVisibleCount(gridRef.current?.api?.getDisplayedRowCount?.() ?? 0);
  }, []);

  /* ---------------- render ---------------- */

  return (
    <div className="h-screen overflow-hidden bg-[#f6f8fd]">
      <SideBarComponent activePage="Portfolios" />

      <div className="ml-[257px] flex h-screen min-w-0 flex-col max-[760px]:ml-0">
        <TopBarComponent />

        <main className="mx-auto flex w-full min-h-0 max-w-[1600px] flex-1 flex-col px-4 py-3 sm:px-5">
          {/* KPI STRIP */}
          <section className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
            <SummaryCard
              title="Active AUM"
              value={formatMoney(totalAum)}
              detail={`${activePortfolios.length} active mandates`}
              icon={Building2}
            />
            <SummaryCard
              title="Rebalance required"
              value={driftLoading ? "…" : String(driftPortfolioIds.length)}
              detail={driftPortfolioIds.length ? "Outside tolerance" : "No drift alerts"}
              icon={AlertTriangle}
              tone={driftPortfolioIds.length ? "red" : "green"}
            />
            <SummaryCard
              title="Compliance"
              value={`${compliance.toFixed(1)}%`}
              detail="Within ±5% threshold"
              icon={ShieldCheck}
              tone="green"
            />
            <SummaryCard
              title="Average return"
              value={`${averageReturn >= 0 ? "+" : ""}${averageReturn.toFixed(2)}%`}
              detail="Across active mandates"
              icon={ArrowUpDown}
              tone={averageReturn >= 0 ? "green" : "red"}
            />
          </section>

          {/* TITLE + ACTIONS */}
          <section className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold tracking-wider text-blue-700">
                PORTFOLIO MANAGEMENT SYSTEM · LIVE ALLOCATION
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Fund Portfolios</h1>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={exportPortfolios}
                disabled={!rowData.length}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#edf3fd] px-3 text-xs font-semibold text-slate-700 hover:bg-blue-100 disabled:opacity-50"
              >
                <Download size={14} /> Export
              </button>
              <button
                onClick={() => manageDemoPortfolios("add")}
                disabled={demoBusy || !userId}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50"
              >
                <Plus size={14} /> {demoBusy ? "Working…" : "Add Demos"}
              </button>
              <button
                onClick={() => manageDemoPortfolios("remove")}
                disabled={demoBusy || !portfolios.some((i) => i.name.startsWith("DEMO 1Y |"))}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={13} /> Remove Demos
              </button>
              <button
                onClick={() => navigate("/create-portfolio")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-800 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-900"
              >
                <Plus size={15} /> Create Portfolio
              </button>
            </div>
          </section>

          {/* GRID PANEL */}
          <section className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((name) => (
                  <button
                    key={name}
                    onClick={() => setFilter(name)}
                    className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${
                      filter === name
                        ? "bg-blue-800 text-white"
                        : "bg-[#edf2fb] text-slate-600 hover:bg-[#e4ebf8]"
                    }`}
                  >
                    {name}
                    <span className="ml-1 opacity-70">
                      {name === "Rebalance Required" && driftLoading ? "…" : counts[name]}
                    </span>
                  </button>
                ))}
              </div>
              <label className="flex h-8 w-[min(280px,70vw)] items-center gap-2 rounded-md bg-[#edf2fb] px-3">
                <Filter size={14} className="shrink-0 text-slate-500" />
                <span className="sr-only">Filter portfolios</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-slate-500"
                  placeholder="Search name, code, theme, benchmark…"
                />
              </label>
            </div>

            {demoMessage && (
              <p
                role="status"
                className="shrink-0 border-b border-slate-100 px-4 py-1.5 text-[11px] text-slate-600"
              >
                {demoMessage}
              </p>
            )}

            {/* The ONLY scrollable region */}
            {error ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                <AlertTriangle className="text-red-500" size={28} />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Could not load portfolios
                </p>
                <p className="mt-1 text-xs text-slate-500">{error}</p>
                <button
                  onClick={() => setRefreshVersion((v) => v + 1)}
                  className="mt-4 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="min-h-0 flex-1">
                <AgGridReact
                  ref={gridRef}
                  theme={gridTheme}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  quickFilterText={search}
                  loading={loading}
                  animateRows
                  suppressCellFocus
                  getRowId={(p) => String(p.data.id)}
                  onGridReady={syncCount}
                  onModelUpdated={syncCount}
                  overlayNoRowsTemplate='<span class="text-xs text-slate-500">No portfolios match these filters.</span>'
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-4 py-1.5 text-[11px] text-slate-500">
              <span>
                {loading
                  ? "Loading portfolios…"
                  : `Showing ${visibleCount} of ${portfolios.length} portfolios`}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <WalletCards size={13} /> Click a header to sort · filter row to search
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

/* ------------------------- helpers ------------------------- */

function SummaryCard({ title, value, detail, icon: Icon, tone = "blue" }) {
  const color =
    tone === "red"
      ? "text-red-600 bg-red-50"
      : tone === "green"
        ? "text-emerald-700 bg-emerald-50"
        : "text-blue-700 bg-blue-50";
  return (
    <article className="flex min-w-0 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className={`rounded-md p-1.5 ${color}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{title}</div>
        <div className="truncate font-mono text-base font-semibold text-slate-900">{value}</div>
        <div className="truncate text-[10px] text-slate-500">{detail}</div>
      </div>
    </article>
  );
}

function parseReturn(value) {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(String(value ?? "0").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function initialsFor(name) {
  return String(name || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
  return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatLabel(value) {
  return String(value ?? "—").replaceAll("_", " ");
}

function formatStatus(status) {
  const s = String(status || "");
  return s === "CANCELED"
    ? "Closed"
    : s === "CREATED"
      ? "Draft"
      : s.charAt(0) + s.slice(1).toLowerCase();
}

function statusTone(status) {
  return status === "ACTIVE"
    ? "text-emerald-700"
    : ["DRAFT", "CREATED"].includes(status)
      ? "text-amber-600"
      : "text-slate-500";
}

export default PortfolioPage;