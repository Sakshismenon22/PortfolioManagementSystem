import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import { createTheme, getAllThemes } from "../services/themeService";
import { getAllAssets } from "../services/portfolioService";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const RISK_OPTIONS = [
  { value: "LOW", label: "Low Risk" },
  { value: "MEDIUM", label: "Medium Risk" },
  { value: "HIGH", label: "High Risk" },
];

const HORIZON_OPTIONS = [
  { value: "SHORT", label: "Short Term" },
  { value: "MEDIUM", label: "Medium Term" },
  { value: "LONG", label: "Long Term" },
  { value: "SHORT_TO_MEDIUM", label: "Short to Medium" },
  { value: "ANY", label: "Any Horizon" },
];

const formatThemeLabel = (value) => String(value || "—").replaceAll("_", " ");

let rowSeq = 0;
const uid = () => `row-${++rowSeq}-${Date.now()}`;

const compactTheme = themeQuartz.withParams({
  accentColor: "#1d4ed8",
  backgroundColor: "#ffffff",
  borderColor: "#e9eef7",
  browserColorScheme: "light",
  headerBackgroundColor: "#eef3ff",
  headerTextColor: "#64748b",
  headerFontSize: 10,
  headerFontWeight: 700,
  fontSize: 12,
  rowHeight: 38,
  headerHeight: 32,
  spacing: 5,
  rowHoverColor: "#f5f8ff",
  selectedRowBackgroundColor: "#e6efff",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  cellHorizontalPadding: 12,
});

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const CreateThemePage = () => {
  const navigate = useNavigate();
  const themeGridRef = useRef(null);
  const builderGridRef = useRef(null);

  const [activePage, setActivePage] = useState("Themes");

  const [themeList, setThemeList] = useState([]);
  const [themeListLoading, setThemeListLoading] = useState(false);
  const [themeListError, setThemeListError] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(null);

  const [assets, setAssets] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState({ name: "", risk: "", investmentHorizon: "" });
  const [allocations, setAllocations] = useState([
    { rowKey: uid(), assetId: "", percentage: 0 },
  ]);

  /* ---------------- data loading ---------------- */

  const loadThemes = useCallback(async () => {
    setThemeListLoading(true);
    setThemeListError("");
    try {
      const response = await getAllThemes();
      const list = response?.data?.data ?? response?.data;
      if (!Array.isArray(list)) throw new Error("Theme list response was invalid.");
      setThemeList(list);
      setSelectedTheme((prev) =>
        prev ? list.find((t) => t.id === prev.id) ?? list[0] ?? null : list[0] ?? null
      );
    } catch (error) {
      setThemeListError(
        error?.response?.data?.message || error?.message || "Themes could not be loaded."
      );
    } finally {
      setThemeListLoading(false);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    try {
      const response = await getAllAssets();
      const assetList = Array.isArray(response?.data) ? response.data : [];
      const uniqueAssets = Array.from(
        new Map(assetList.map((asset) => [asset.assetClass, asset])).values()
      );
      setAssets(uniqueAssets);
    } catch (error) {
      console.error("Failed to load assets:", error);
      toast.error("Unable to load assets.");
    }
  }, []);

  useEffect(() => {
    loadAssets();
    loadThemes();
  }, [loadAssets, loadThemes]);

  /* ---------------- derived ---------------- */

  const assetRefData = useMemo(
    () =>
      assets.reduce((acc, asset) => {
        acc[String(asset.id)] = asset.assetClass;
        return acc;
      }, {}),
    [assets]
  );

  const totalAllocation = useMemo(
    () => allocations.reduce((total, a) => total + Number(a.percentage || 0), 0),
    [allocations]
  );
  const remainingAllocation = 100 - totalAllocation;
  const isValidAllocation =
    Math.abs(totalAllocation - 100) < 0.001 &&
    allocations.length > 0 &&
    allocations.every((a) => a.assetId !== "" && Number(a.percentage) > 0);

  const allocationRows = useMemo(
    () =>
      (selectedTheme?.allocationRuleList || []).map((rule, index) => ({
        rowKey: rule.id ?? `${selectedTheme?.id}-${index}`,
        assetClass: rule.asset?.assetClass || "Asset",
        percentage: Number(rule.percentage || 0),
      })),
    [selectedTheme]
  );

  /* ---------------- grid 1: themes ---------------- */

  const defaultColDef = useMemo(
    () => ({ sortable: true, resizable: true, suppressHeaderMenuButton: true }),
    []
  );

  const themeColumnDefs = useMemo(
    () => [
      {
        headerName: "Theme",
        field: "name",
        flex: 1.8,
        minWidth: 200,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellRenderer: (p) => (
          <div className="leading-tight">
            <div className="truncate font-semibold text-slate-800">
              {p.data?.name || "Unnamed theme"}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">Theme ID · {p.data?.id}</div>
          </div>
        ),
      },
      {
        headerName: "Risk",
        colId: "risk",
        flex: 0.9,
        minWidth: 110,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) => formatThemeLabel(p.data?.risk),
        cellRenderer: (p) => (
          <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800">
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Horizon",
        colId: "investmentHorizon",
        flex: 1,
        minWidth: 130,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) => formatThemeLabel(p.data?.investmentHorizon),
        cellClass: "text-slate-600",
      },
      {
        headerName: "Asset allocation",
        colId: "allocation",
        flex: 1.4,
        minWidth: 170,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        valueGetter: (p) =>
          (p.data?.allocationRuleList || [])
            .map((r) => `${r.asset?.assetClass || "Asset"} ${Number(r.percentage || 0)}%`)
            .join(", ") || "—",
        cellClass: "text-[11px] text-slate-600",
      },
      {
        headerName: "Status",
        colId: "status",
        width: 110,
        type: "rightAligned",
        filter: false,
        valueGetter: (p) => (p.data?.status === false ? "Inactive" : "Active"),
        cellRenderer: (p) => (
          <span
            className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${
              p.value === "Inactive"
                ? "bg-slate-100 text-slate-500"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {p.value}
          </span>
        ),
      },
    ],
    []
  );

  /* ---------------- grid 2: allocations (read-only) ---------------- */

  const allocationColumnDefs = useMemo(
    () => [
      {
        headerName: "Asset class",
        field: "assetClass",
        flex: 1.2,
        minWidth: 130,
        cellClass: "font-medium text-slate-700",
      },
      {
        headerName: "Target",
        field: "percentage",
        flex: 0.8,
        minWidth: 90,
        type: "rightAligned",
        cellClass: "font-mono font-semibold text-blue-900",
        cellStyle: { color: "#1e3a8a" },
        valueFormatter: (p) => `${Number(p.value || 0).toFixed(2)}%`,
      },
      {
        headerName: "Weight",
        colId: "bar",
        flex: 1,
        minWidth: 110,
        sortable: false,
        cellRenderer: (p) => (
          <div className="flex h-full items-center">
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-blue-700"
                style={{ width: `${Math.min(100, Number(p.data?.percentage || 0))}%` }}
              />
            </div>
          </div>
        ),
      },
    ],
    []
  );

  /* ---------------- grid 3: allocation builder (editable) ---------------- */

  const syncBuilder = useCallback(() => {
    const rows = [];
    builderGridRef.current?.api?.forEachNode((node) => rows.push({ ...node.data }));
    if (rows.length) setAllocations(rows);
  }, []);

  const removeAllocation = useCallback((rowKey) => {
    setAllocations((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.rowKey !== rowKey)
    );
  }, []);

  const builderColumnDefs = useMemo(
    () => [
      {
        headerName: "Asset class",
        field: "assetId",
        flex: 1.6,
        minWidth: 180,
        editable: true,
        sortable: false,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: assets.map((a) => String(a.id)),
          formatValue: (value) => assetRefData[String(value)] || "Select asset",
        },
        refData: assetRefData,
        valueFormatter: (p) => assetRefData[String(p.value)] || "Select asset",
        cellClass: (p) => (p.value === "" ? "text-slate-400 italic" : "text-slate-700"),
      },
      {
        headerName: "Target %",
        field: "percentage",
        flex: 1,
        minWidth: 120,
        editable: true,
        sortable: false,
        type: "rightAligned",
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0, max: 100, precision: 2 },
        valueParser: (p) => Math.max(0, Math.min(100, Number(p.newValue) || 0)),
        valueFormatter: (p) => `${Number(p.value || 0).toFixed(2)}%`,
        cellClass: "font-mono font-semibold text-blue-900",
        cellStyle: { color: "#1e3a8a" },
      },
      {
        headerName: "",
        colId: "actions",
        width: 60,
        sortable: false,
        filter: false,
        cellRenderer: (p) => (
          <button
            type="button"
            onClick={() => removeAllocation(p.data.rowKey)}
            disabled={allocations.length === 1}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
          >
            <Trash2 size={14} />
          </button>
        ),
      },
    ],
    [assets, assetRefData, allocations.length, removeAllocation]
  );

  /* ---------------- create ---------------- */

  const handleCreateTheme = async () => {
    if (!theme.name.trim()) return toast.error("Please enter a theme name.");
    if (!theme.risk) return toast.error("Please select a risk level.");
    if (!theme.investmentHorizon) return toast.error("Please select an investment horizon.");
    if (!isValidAllocation)
      return toast.error("Allocation must contain valid assets and total exactly 100%.");

    const userId = Number(localStorage.getItem("userId")) || 1;
    const payload = {
      name: theme.name,
      risk: theme.risk,
      investmentHorizon: theme.investmentHorizon,
      allocationRuleList: allocations.map((a) => ({
        assetId: Number(a.assetId),
        percentage: Number(a.percentage),
      })),
      userId,
    };

    try {
      setLoading(true);
      await createTheme(payload);
      toast.success("Theme created successfully.");
      await loadThemes();
      setTheme({ name: "", risk: "", investmentHorizon: "" });
      setAllocations([{ rowKey: uid(), assetId: "", percentage: 0 }]);
      setCreateOpen(false);
    } catch (error) {
      console.error("Create theme failed:", error);
      toast.error("Failed to create theme.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- render ---------------- */

  return (
    <div className="h-screen overflow-hidden bg-[#f6f8fd]">
      <SideBarComponent activePage={activePage} setActivePage={setActivePage} />

      <div className="ml-[257px] flex h-screen min-w-0 flex-col max-[760px]:ml-0">
        <TopBarComponent />

        <main className="relative flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-5">
          {/* HEADER */}
          <div className="flex shrink-0 items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
                Portfolio management system
                <span className="mx-1">•</span>
                <span className="text-blue-700">Theme configuration</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Investment Themes
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadThemes}
                disabled={themeListLoading}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw size={13} className={themeListLoading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => navigate("/home")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#edf3fd] px-3 text-xs font-semibold text-slate-700 hover:bg-[#e4ebf8]"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          </div>

          {themeListError && (
            <div className="mt-2 shrink-0 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {themeListError}
            </div>
          )}

          {/* GRIDS */}
          <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            {/* Themes grid */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Themes
                </h2>
                <span className="text-[11px] text-slate-400">
                  {themeList.length} mandates · click a row for allocations
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <AgGridReact
                  ref={themeGridRef}
                  theme={compactTheme}
                  rowData={themeList}
                  columnDefs={themeColumnDefs}
                  defaultColDef={defaultColDef}
                  loading={themeListLoading}
                  rowSelection={{ mode: "singleRow", checkboxes: false }}
                  onRowClicked={(e) => setSelectedTheme(e.data)}
                  getRowId={(p) => String(p.data.id)}
                  animateRows
                  suppressCellFocus
                  overlayNoRowsTemplate='<span class="text-xs text-slate-500">No themes created yet.</span>'
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            </section>

            {/* Asset class allocation grid */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="shrink-0 border-b border-slate-100 px-4 py-2">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Asset class allocation
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {selectedTheme?.name || "Select a theme"}
                </p>
              </div>
              <div className="min-h-0 flex-1">
                <AgGridReact
                  theme={compactTheme}
                  rowData={allocationRows}
                  columnDefs={allocationColumnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={(p) => String(p.data.rowKey)}
                  suppressCellFocus
                  overlayNoRowsTemplate='<span class="text-xs text-slate-500">No allocation rules.</span>'
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px]">
                <span className="text-slate-500">Total</span>
                <span className="font-mono font-semibold" style={{ color: "#1e3a8a" }}>
                  {allocationRows
                    .reduce((sum, r) => sum + Number(r.percentage || 0), 0)
                    .toFixed(2)}
                  %
                </span>
              </div>
            </section>
          </div>

          {/* BOTTOM ACTION BAR — Add Theme stays last */}
          <div className="mt-3 flex shrink-0 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-700" />
              Define a reusable strategy with risk, horizon and target allocation.
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
            >
              <Plus size={15} /> Add Theme
            </button>
          </div>

          {/* CREATE DRAWER (overlay — never grows the page) */}
          {createOpen && (
            <div className="absolute inset-0 z-30 flex flex-col justify-end">
              <button
                aria-label="Close"
                onClick={() => setCreateOpen(false)}
                className="absolute inset-0 bg-slate-900/25"
              />
              <div className="relative flex max-h-[88%] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Create Investment Theme
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Allocation must total exactly 100%.
                    </p>
                  </div>
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  {/* Basic info */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Theme Name
                      </label>
                      <input
                        type="text"
                        value={theme.name}
                        onChange={(e) => setTheme((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Aggressive Growth"
                        className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Risk Profile
                      </label>
                      <select
                        value={theme.risk}
                        onChange={(e) => setTheme((p) => ({ ...p, risk: e.target.value }))}
                        className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select Risk</option>
                        {RISK_OPTIONS.map((risk) => (
                          <option key={risk.value} value={risk.value}>
                            {risk.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Investment Horizon
                      </label>
                      <select
                        value={theme.investmentHorizon}
                        onChange={(e) =>
                          setTheme((p) => ({ ...p, investmentHorizon: e.target.value }))
                        }
                        className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select Horizon</option>
                        {HORIZON_OPTIONS.map((horizon) => (
                          <option key={horizon.value} value={horizon.value}>
                            {horizon.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Editable allocation grid */}
                  <div className="mt-4 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Asset Allocation · double-click a cell to edit
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setAllocations((prev) => [
                          ...prev,
                          { rowKey: uid(), assetId: "", percentage: 0 },
                        ])
                      }
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-900"
                    >
                      <Plus size={13} /> Add Asset
                    </button>
                  </div>

                  <div className="mt-2 h-[190px] overflow-hidden rounded-lg border border-slate-200">
                    <AgGridReact
                      ref={builderGridRef}
                      theme={compactTheme}
                      rowData={allocations}
                      columnDefs={builderColumnDefs}
                      defaultColDef={{ resizable: true, suppressHeaderMenuButton: true }}
                      getRowId={(p) => String(p.data.rowKey)}
                      onCellValueChanged={syncBuilder}
                      singleClickEdit
                      stopEditingWhenCellsLoseFocus
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>

                  {/* Summary */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <SummaryTile label="Total" value={`${totalAllocation.toFixed(2)}%`} />
                    <SummaryTile
                      label="Remaining"
                      value={`${remainingAllocation.toFixed(2)}%`}
                      tone={
                        remainingAllocation < 0
                          ? "text-red-600"
                          : remainingAllocation === 0
                            ? "text-emerald-700"
                            : "text-blue-900"
                      }
                    />
                    <div className="rounded-lg bg-[#edf4fc] px-3 py-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Validation
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {isValidAllocation ? (
                          <>
                            <Check size={14} className="text-emerald-700" />
                            <span className="text-xs font-semibold text-emerald-700">
                              Validated
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={14} className="text-red-600" />
                            <span className="text-xs font-semibold text-red-600">
                              Requires 100%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTheme}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {loading ? "Creating..." : "Create Theme"}
                    {!loading && <Check size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const SummaryTile = ({ label, value, tone = "text-slate-800" }) => (
  <div className="rounded-lg bg-[#edf4fc] px-3 py-2">
    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
    <div className={`mt-0.5 font-mono text-base font-semibold ${tone}`}>{value}</div>
  </div>
);

export default CreateThemePage;