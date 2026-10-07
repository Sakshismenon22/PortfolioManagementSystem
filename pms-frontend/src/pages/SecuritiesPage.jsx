import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import { getAllSecuritiesInfo } from "../services/securityService";

// Register once at module scope (AG Grid v33+)
ModuleRegistry.registerModules([AllCommunityModule]);

const money = (value) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : `₹${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

/* Compact theme tuned to match the existing slate/blue UI */
const compactTheme = themeQuartz.withParams({
  accentColor: "#1d4ed8",
  backgroundColor: "#ffffff",
  borderColor: "#e9eef7",
  browserColorScheme: "light",
  headerBackgroundColor: "#eef3ff",
  headerTextColor: "#64748b",
  headerFontSize: 11,
  headerFontWeight: 700,
  fontSize: 13,
  rowHeight: 40,
  headerHeight: 34,
  spacing: 5,
  rowHoverColor: "#f5f8ff",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  cellHorizontalPadding: 14,
});

const sectorOf = (s) => s?.gicsSector || s?.sector || "Unclassified";
const assetClassOf = (s) =>
  s?.asset?.assetClass || s?.assetClass || s?.securityType || "—";

export default function SecuritiesPage() {
  const gridRef = useRef(null);
  const [securities, setSecurities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);

  const loadSecurities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllSecuritiesInfo();
      const payload = response?.data?.data ?? response?.data ?? response;
      const list = payload?.securities ?? payload;
      if (!Array.isArray(list)) {
        throw new Error(payload?.message || "The securities response was not a list.");
      }
      setSecurities(list);
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Securities could not be loaded."
      );
      setSecurities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurities();
  }, [loadSecurities]);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      suppressHeaderMenuButton: true,
      filterParams: { buttons: ["reset"], debounceMs: 200, maxNumConditions: 1 },
    }),
    []
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Security",
        field: "name",
        flex: 2.2,
        minWidth: 240,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) => p.data?.name || "",
        cellRenderer: (p) => (
          <div className="leading-tight">
            <div className="truncate font-semibold text-slate-800">
              {p.data?.name || "—"}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              Security ID · {p.data?.id}
            </div>
          </div>
        ),
      },
      {
        headerName: "Symbol",
        field: "symbol",
        flex: 0.9,
        minWidth: 110,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellClass: "font-mono text-slate-600",
        valueFormatter: (p) => p.value || "—",
      },
      {
        headerName: "ISIN",
        field: "isin",
        flex: 1.1,
        minWidth: 140,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellClass: "font-mono text-[12px] text-slate-500",
        valueFormatter: (p) => p.value || "—",
      },
      {
        headerName: "GICS sector",
        colId: "gicsSector",
        flex: 1.4,
        minWidth: 170,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) => sectorOf(p.data),
        cellClass: "text-slate-600",
      },
      {
        headerName: "Asset class",
        colId: "assetClass",
        flex: 1,
        minWidth: 140,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) => assetClassOf(p.data),
        cellRenderer: (p) => (
          <span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-semibold uppercase text-blue-800">
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Equity category",
        field: "equityCategory",
        flex: 1,
        minWidth: 135,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueFormatter: (params) => params.value
          ? String(params.value).replaceAll("_", " ")
          : "—",
        cellClass: "text-slate-600",
      },
      {
        headerName: "Current price",
        field: "price",
        flex: 1,
        minWidth: 140,
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        type: "rightAligned",
        // Dark blue price values
        cellClass: "font-mono font-semibold text-blue-900",
        cellStyle: { color: "#1e3a8a" },
        valueFormatter: (p) => money(p.value),
        comparator: (a, b) => (Number(a) || 0) - (Number(b) || 0),
      },
    ],
    []
  );

  const syncCount = useCallback(() => {
    setVisibleCount(gridRef.current?.api?.getDisplayedRowCount?.() ?? 0);
  }, []);

  return (
    // h-screen + overflow-hidden => the PAGE never scrolls
    <div className="h-screen overflow-hidden bg-[#f6f8fd] text-slate-900">
      <SideBarComponent activePage="Securities" />

      <div className="sidebar-content flex h-screen min-w-0 flex-col">
        {/* <TopBarComponent /> */}

        <main className="mx-auto flex w-full min-h-0 max-w-[1600px] flex-1 flex-col px-4 py-3 sm:px-6 lg:px-7">
          {/* Header */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-blue-800">
                Security master · live reference
              </div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Securities</h1>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
              <ShieldCheck size={15} className="text-emerald-600" />
              {securities.length.toLocaleString("en-IN")} instruments
            </div>
          </div>

          {/* Card shell: flex column, min-h-0 lets the grid shrink correctly */}
          <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar — Refresh only */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Instrument reference data
              </span>
              <button
                onClick={loadSecurities}
                disabled={loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mx-3 mt-2 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                <span>{error}</span>
                <button onClick={loadSecurities} className="font-semibold underline">
                  Try again
                </button>
              </div>
            )}

            {/* ---------- SCROLLABLE GRID ---------- */}
            <div className="min-h-0 flex-1">
              <AgGridReact
                ref={gridRef}
                theme={compactTheme}
                rowData={securities}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                loading={loading}
                animateRows
                suppressCellFocus
                rowBuffer={12}
                getRowId={(p) => String(p.data.id)}
                overlayNoRowsTemplate={
                  '<span class="text-xs text-slate-500">No securities match the current filters.</span>'
                }
                onGridReady={syncCount}
                onModelUpdated={syncCount}
                domLayout="normal"
                style={{ height: "100%", width: "100%" }}
              />
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
              <span>
                {loading
                  ? "Loading securities and prices…"
                  : `Showing ${visibleCount.toLocaleString("en-IN")} of ${securities.length.toLocaleString("en-IN")} instruments`}
              </span>
              <span className="text-slate-400">
                Click a header to sort · use the row below headers to search
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
