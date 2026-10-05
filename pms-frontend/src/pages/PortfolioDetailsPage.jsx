import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Download, Filter, LineChart,
  Plus, RefreshCw, TrendingUp, WalletCards, Wallet, Trash2,
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import {
  getPortfolioBasicInfo,
  getPortfolioHoldings,
  getThemeAllocation,
  validatePortfolioAllocation,
  buyPortfolioSecurities,
} from "../services/portfolioService";
import { getAllSecuritiesInfo } from "../services/securityService";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ------------------------- grid themes ------------------------- */

const baseParams = {
  accentColor: "#1d4ed8",
  backgroundColor: "#ffffff",
  borderColor: "#e9eef7",
  browserColorScheme: "light",
  headerBackgroundColor: "#eef3ff",
  headerTextColor: "#64748b",
  headerFontSize: 10,
  headerFontWeight: 700,
  fontSize: 12,
  rowHoverColor: "#f5f8ff",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
};

const holdingsTheme = themeQuartz.withParams({
  ...baseParams,
  rowHeight: 36,
  headerHeight: 42,
  spacing: 4,
  cellHorizontalPadding: 12,
});

const miniTheme = themeQuartz.withParams({
  ...baseParams,
  rowHeight: 34,
  headerHeight: 42,
  spacing: 4,
  cellHorizontalPadding: 12,
});
const LEFT_CELL = { display: "flex", alignItems: "center" };
const RIGHT_CELL = { display: "flex", alignItems: "center", justifyContent: "flex-end" };

// numeric column factory — keeps header and value on the same alignment axis
const numericCol = (overrides = {}) => ({
  type: "rightAligned",
  headerClass: "ag-right-aligned-header",
  cellStyle: RIGHT_CELL,
  ...overrides,
});
/* ------------------------- page ------------------------- */

const PortfolioDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const holdingsGridRef = useRef(null);

  const [portfolio, setPortfolio] = useState(location.state?.portfolio ?? null);
  const [holdings, setHoldings] = useState([]);
  const [validation, setValidation] = useState(null);
  const [themeAllocation, setThemeAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [holdingsError, setHoldingsError] = useState("");
  const [assetFilter, setAssetFilter] = useState("ALL");

  const [addOpen, setAddOpen] = useState(false);
  const [securities, setSecurities] = useState([]);
  const [buyOrders, setBuyOrders] = useState([newBuyOrder()]);
  const [addLoading, setAddLoading] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addNotice, setAddNotice] = useState("");

  /* ------------------------- load ------------------------- */

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.allSettled([
      getPortfolioBasicInfo(id),
      getPortfolioHoldings(id),
      validatePortfolioAllocation(id).catch(() => null),
      getThemeAllocation(id).catch(() => null),
    ])
      .then((results) => {
        if (!active) return;
        const [basicResult, holdingsResult, validationResult, themeResult] = results;
        const basicInfo =
          basicResult.status === "fulfilled" ? basicResult.value : location.state?.portfolio;
        if (!basicInfo) throw basicResult.reason || new Error("Could not load this portfolio.");
        setPortfolio(basicInfo);
        setHoldings(
          holdingsResult.status === "fulfilled" && Array.isArray(holdingsResult.value)
            ? holdingsResult.value
            : []
        );
        setHoldingsError(
          holdingsResult.status === "rejected"
            ? "Holdings could not be loaded. Check that you are signed in and try again."
            : ""
        );
        setValidation(validationResult.status === "fulfilled" ? validationResult.value : null);
        setThemeAllocation(themeResult.status === "fulfilled" ? themeResult.value : null);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError.response?.data?.message ||
            loadError.message ||
            "Could not load this portfolio."
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  /* ------------------------- derived totals ------------------------- */

  const cashBalance = Number(portfolio?.amount || 0);
  const holdingsInvested = Number(
    validation?.totalInvestedAmount ??
      holdings.reduce((sum, h) => sum + Number(h.totalCost || 0), 0)
  );
  const invested = holdingsInvested + cashBalance;
  const currentValue = Number(
    validation?.totalCurrentValue ??
      holdings.reduce((sum, h) => sum + Number(h.currentValue ?? h.totalCost ?? 0), 0) +
        cashBalance
  );
  const pnl = currentValue - invested;
  const returnPercentage = invested ? (pnl / invested) * 100 : 0;
  const portfolioId = portfolio?.portfolioId ?? id;
  const themeName = portfolio?.themeName || themeAllocation?.themeName || "—";

  const assetClasses = useMemo(
    () => [...new Set(holdings.map((h) => normalizeAssetClass(h.assetClass)))],
    [holdings]
  );

  /* ------------------------- holdings rows ------------------------- */

  const holdingRows = useMemo(
    () =>
      holdings
        .filter((h) => assetFilter === "ALL" || normalizeAssetClass(h.assetClass) === assetFilter)
        .map((h) => {
          const cost = Number(
            h.totalCost ?? Number(h.averageCost || 0) * Number(h.quantity || 0)
          );
          const value = Number(h.currentValue ?? cost);
          const qty = Number(h.quantity || 0);
          return {
            rowKey: String(h.holdingId ?? h.securityId),
            securityName: h.securityName || "—",
            symbol: h.symbol || "—",
            assetClass: formatLabel(h.assetClass),
            quantity: qty,
            averageCost: Number(h.averageCost || 0),
            currentPrice: h.currentPrice != null ? Number(h.currentPrice) : qty ? value / qty : 0,
            cost,
            value,
            pnl: value - cost,
            returnPct: holdingReturn(h),
          };
        }),
    [holdings, assetFilter]
  );

  const pinnedTotals = useMemo(
    () => [
      {
        rowKey: "total",
        securityName: "Portfolio total (positions + cash)",
        symbol: "",
        assetClass: "",
        quantity: null,
        averageCost: null,
        currentPrice: null,
        cost: invested,
        value: currentValue,
        pnl,
        returnPct: returnPercentage,
      },
    ],
    [invested, currentValue, pnl, returnPercentage]
  );

  /* ------------------------- theme composition rows ------------------------- */

  const compositionRows = useMemo(() => {
    const allocations = validation?.allocations || [];
    return allocations.map((allocation) => {
      const matches = holdings.filter(
        (h) =>
          Number(h.assetId) === Number(allocation.assetId) ||
          normalizeAssetClass(h.assetClass) === normalizeAssetClass(allocation.assetClass)
      );
      const investedAmount = matches.reduce(
        (sum, h) =>
          sum + Number(h.totalCost ?? Number(h.averageCost || 0) * Number(h.quantity || 0)),
        0
      );
      const currentAmount = matches.reduce(
        (sum, h) => sum + Number(h.currentValue ?? h.totalCost ?? 0),
        0
      );
      const actualPct =
        allocation.currentPercentage != null
          ? Number(allocation.currentPercentage)
          : holdingsInvested
            ? (investedAmount / holdingsInvested) * 100
            : 0;
      return {
        rowKey: `${allocation.assetId}-${allocation.assetClass}`,
        theme: themeName,
        assetClass: formatLabel(allocation.assetClass),
        targetPct: Number(allocation.targetPercentage || 0),
        investedAmount,
        actualPct,
        currentAmount,
        drift: Math.round((actualPct - Number(allocation.targetPercentage || 0)) * 100) / 100,
        satisfied: allocation.satisfied !== false,
      };
    });
  }, [validation, holdings, holdingsInvested, themeName]);

  /* ------------------------- column defs ------------------------- */

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      suppressHeaderMenuButton: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      cellStyle: LEFT_CELL,
    }),
    []
  );

   const holdingsColumnDefs = useMemo(
    () => [
      {
        headerName: "Security",
        field: "securityName",
        flex: 1.8,
        minWidth: 190,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellClass: (p) =>
          p.node.rowPinned ? "font-semibold text-slate-800" : "font-medium text-slate-800",
      },
      {
        headerName: "Symbol",
        field: "symbol",
        flex: 0.8,
        minWidth: 95,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellClass: "font-mono text-[11px] text-slate-500",
      },
      {
        headerName: "Asset class",
        field: "assetClass",
        flex: 1,
        minWidth: 120,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        cellClass: "text-slate-600",
      },
      numericCol({
        headerName: "Qty",
        field: "quantity",
        flex: 0.7,
        minWidth: 85,
        cellClass: "font-mono text-slate-700",
        valueFormatter: (p) => (p.value == null ? "" : Number(p.value).toLocaleString("en-IN")),
      }),
      numericCol({
        headerName: "Avg. buy",
        field: "averageCost",
        flex: 0.9,
        minWidth: 105,
        cellClass: "font-mono text-slate-600",
        valueFormatter: (p) => (p.value == null ? "" : formatMoney(p.value)),
      }),
      numericCol({
        headerName: "Current price",
        field: "currentPrice",
        flex: 0.9,
        minWidth: 110,
        cellClass: "font-mono text-slate-700",
        valueFormatter: (p) => (p.value == null ? "" : formatMoney(p.value)),
      }),
      numericCol({
        headerName: "Invested",
        field: "cost",
        flex: 1,
        minWidth: 115,
        cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" },
        cellClass: "font-mono font-semibold",
        valueFormatter: (p) => formatMoney(p.value),
      }),
      numericCol({
        headerName: "Current value",
        field: "value",
        flex: 1,
        minWidth: 120,
        cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" },
        cellClass: "font-mono font-semibold",
        valueFormatter: (p) => formatMoney(p.value),
      }),
      numericCol({
        headerName: "P&L",
        field: "pnl",
        flex: 1,
        minWidth: 110,
        cellClass: (p) =>
          `font-mono font-semibold ${Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"}`,
        valueFormatter: (p) =>
          `${Number(p.value) >= 0 ? "+" : "−"}${formatMoney(Math.abs(Number(p.value || 0)))}`,
      }),
      numericCol({
        headerName: "Return %",
        field: "returnPct",
        flex: 0.8,
        minWidth: 100,
        sort: "desc",
        cellClass: (p) =>
          `font-mono font-semibold ${Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"}`,
        valueFormatter: (p) =>
          `${Number(p.value) >= 0 ? "+" : ""}${Number(p.value || 0).toFixed(2)}%`,
      }),
    ],
    []
  );
     const compositionColumnDefs = useMemo(
    () => [
      {
        headerName: "Theme",
        field: "theme",
        flex: 1.1,
        minWidth: 120,
        filter: "agTextColumnFilter",
        cellClass: "font-medium text-slate-700",
      },
      {
        headerName: "Asset",
        field: "assetClass",
        flex: 1,
        minWidth: 110,
        filter: "agTextColumnFilter",
        cellClass: "text-slate-700",
      },
      numericCol({
        headerName: "Theme alloc.",
        field: "targetPct",
        flex: 0.85,
        minWidth: 105,
        cellClass: "font-mono text-slate-600",
        valueFormatter: (p) => `${Number(p.value || 0).toFixed(2)}%`,
      }),
      numericCol({
        headerName: "Invested",
        field: "investedAmount",
        flex: 1,
        minWidth: 120,
        cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" },
        cellClass: "font-mono font-semibold",
        valueFormatter: (p) => formatMoney(p.value),
      }),
      numericCol({
        headerName: "Actual alloc.",
        field: "actualPct",
        flex: 0.9,
        minWidth: 110,
        cellClass: (p) =>
          `font-mono font-semibold ${p.data?.satisfied ? "text-emerald-700" : "text-red-600"}`,
        valueFormatter: (p) => `${Number(p.value || 0).toFixed(2)}%`,
      }),
      numericCol({
        headerName: "Drift",
        field: "drift",
        flex: 0.8,
        minWidth: 95,
        cellClass: (p) =>
          `font-mono font-semibold ${
            Math.abs(Number(p.value || 0)) < 5 ? "text-emerald-700" : "text-red-600"
          }`,
        valueFormatter: (p) =>
          `${Number(p.value) > 0 ? "+" : ""}${Number(p.value || 0).toFixed(2)}%`,
      }),
      numericCol({
        headerName: "Current amount",
        field: "currentAmount",
        flex: 1,
        minWidth: 130,
        cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" },
        cellClass: "font-mono font-semibold",
        valueFormatter: (p) => formatMoney(p.value),
      }),
      numericCol({
        headerName: "Status",
        colId: "status",
        flex: 0.85,
        minWidth: 100,
        sortable: false,
        valueGetter: (p) => (p.data?.satisfied ? "In band" : "Breached"),
        cellClass: (p) =>
          `text-[10px] font-bold uppercase tracking-wide ${
            p.value === "In band" ? "text-emerald-700" : "text-red-600"
          }`,
      }),
    ],
    []
  );
  

  const exportHoldings = () =>
    holdingsGridRef.current?.api?.exportDataAsCsv({
      fileName: `${String(portfolio?.name || "portfolio").replace(/[^a-z0-9-_]+/gi, "-")}-holdings.csv`,
      skipPinnedBottom: false,
    });


  const openAddSecurity = async () => {
    setAddOpen(true);
    setAddError("");
    setAddNotice("");
    setBuyOrders([newBuyOrder()]);
    setAddLoading(true);
    try {
      const [securityResponse, validationResponse, infoResponse] = await Promise.all([
        getAllSecuritiesInfo(),
        validatePortfolioAllocation(portfolioId),
        getPortfolioBasicInfo(portfolioId),
      ]);
      const payload = securityResponse?.data?.data ?? securityResponse?.data ?? securityResponse;
      const list = payload?.securities ?? payload;
      if (!Array.isArray(list)) throw new Error(payload?.message || "Securities could not be loaded.");
      setSecurities(list);
      setValidation(validationResponse);
      setPortfolio((current) => ({ ...current, ...infoResponse }));
    } catch (loadError) {
      setAddError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Could not load securities for this portfolio."
      );
    } finally {
      setAddLoading(false);
    }
  };

  const themeAllocations = (validation?.allocations || []).filter(
    (a) => Number(a.targetPercentage) > 0
  );
  const eligibleSecurities = securities.filter(
    (s) =>
      Number(s.price) > 0 &&
      themeAllocations.some((a) => Number(a.assetId) === Number(s.asset?.id))
  );
  const basketItems = buyOrders.map((order) => {
    const security = eligibleSecurities.find((i) => String(i.id) === String(order.securityId));
    const quantity = Number(order.quantity);
    const validQuantity = Number.isInteger(quantity) && quantity > 0;
    return {
      ...order,
      security,
      quantity,
      validQuantity,
      amount: security && validQuantity ? Number(security.price) * quantity : 0,
    };
  });
  const basketTotal = basketItems.reduce((sum, i) => sum + i.amount, 0);
  const basketRowsValid =
    basketItems.length > 0 && basketItems.every((i) => i.security && i.validQuantity);
  const projectedAllocations = (validation?.allocations || []).map((allocation) => {
    const currentAssetValue = holdings.reduce(
      (sum, h) =>
        sum +
        (Number(h.assetId) === Number(allocation.assetId)
          ? Number(h.currentValue ?? h.totalCost ?? Number(h.averageCost || 0) * Number(h.quantity || 0))
          : 0),
      0
    );
    const basketAssetCost = basketItems.reduce(
      (sum, i) =>
        sum + (Number(i.security?.asset?.id) === Number(allocation.assetId) ? i.amount : 0),
      0
    );
    const totalAfter = currentValue;
    const projected =
      totalAfter > 0
        ? Math.round(((currentAssetValue + basketAssetCost) / totalAfter) * 10000) / 100
        : 0;
    const drift = Math.round((projected - Number(allocation.targetPercentage || 0)) * 100) / 100;
    return {
      ...allocation,
      projectedPercentage: projected,
      projectedDrift: drift,
      satisfiedAfterBuy: Math.abs(drift) < 5,
    };
  });
  const basketSatisfiesTheme =
    projectedAllocations.length > 0 && projectedAllocations.every((a) => a.satisfiedAfterBuy);
  const basketWithinCash = basketTotal <= cashBalance + 0.01;
  const basketCanSubmit =
    basketRowsValid && basketTotal > 0 && basketWithinCash && basketSatisfiesTheme && !addSubmitting;

  const updateBuyOrder = (rowId, field, value) => {
    setBuyOrders((prev) =>
      prev.map((order) => (order.rowId === rowId ? { ...order, [field]: value } : order))
    );
    setAddError("");
  };
  const addBuyOrder = () => setBuyOrders((prev) => [...prev, newBuyOrder()]);
  const removeBuyOrder = (rowId) =>
    setBuyOrders((prev) => prev.filter((order) => order.rowId !== rowId));

  const submitAddSecurity = async (event) => {
    event.preventDefault();
    setAddError("");
    if (!basketRowsValid) {
      setAddError("Select a security and enter a positive whole-unit quantity for every row.");
      return;
    }
    if (!basketWithinCash) {
      setAddError("The total basket cost exceeds the portfolio's available cash.");
      return;
    }
    if (!basketSatisfiesTheme) {
      setAddError(
        "Adjust the basket so every asset class is within 5 percentage points of its theme target."
      );
      return;
    }
    setAddSubmitting(true);
    try {
      const result = await buyPortfolioSecurities(
        basketItems.map((item) => ({
          portfolioId,
          securityId: item.security.id,
          quantity: item.quantity,
        }))
      );
      if (result?.success === false) throw new Error(result.message || "The purchase was rejected.");
      const [freshPortfolio, freshHoldings, freshValidation, freshTheme] = await Promise.all([
        getPortfolioBasicInfo(portfolioId),
        getPortfolioHoldings(portfolioId),
        validatePortfolioAllocation(portfolioId),
        getThemeAllocation(portfolioId).catch(() => null),
      ]);
      setPortfolio(freshPortfolio);
      setHoldings(Array.isArray(freshHoldings) ? freshHoldings : []);
      setValidation(freshValidation);
      setThemeAllocation(freshTheme);
      setAddNotice(
        result?.message ||
          `${basketItems.length} security purchase${basketItems.length === 1 ? "" : "s"} recorded.`
      );
      setAddOpen(false);
    } catch (failure) {
      setAddError(
        failure?.response?.data?.message || failure?.message || "Could not add this security."
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  /* ------------------------- guards ------------------------- */

  if (loading) return <PageMessage>Loading portfolio…</PageMessage>;
  if (error || !portfolio)
    return (
      <PageMessage>
        <div className="max-w-md rounded-xl border border-red-100 bg-white p-7 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 text-red-500" size={30} />
          <h2 className="text-lg font-semibold text-slate-900">Portfolio details unavailable</h2>
          <p className="mt-2 text-sm text-slate-500">
            {error || "The requested portfolio could not be found."}
          </p>
          <button
            onClick={() => navigate("/portfolio")}
            className="mt-5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to portfolios
          </button>
        </div>
      </PageMessage>
    );

  /* ------------------------- render ------------------------- */

  return (
    <div className="h-screen overflow-hidden bg-[#f6f8fd] text-slate-900">
      <SideBarComponent activePage="Portfolios" />

      <div className="ml-[257px] flex h-screen min-w-0 flex-col max-[760px]:ml-0">
        <TopBarComponent />

        <main className="mx-auto flex w-full min-h-0 max-w-[1700px] flex-1 flex-col px-4 py-2.5 sm:px-5">
          {/* HEADER */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <button
                onClick={() => navigate("/portfolio")}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-800"
              >
                <ArrowLeft size={13} /> Portfolios <span>›</span>
                <span className="text-slate-800">{portfolio.name}</span>
              </button>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {portfolio.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  {formatLabel(portfolio.portfolioStatus || "ACTIVE")}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                  Theme · {themeName}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  ID · {portfolioId}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openAddSecurity}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm hover:bg-slate-50"
              >
                <Plus size={14} /> Add Security
              </button>
              <button
                onClick={() => navigate("/rebalancing", { state: { portfolioId } })}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={14} /> Rebalance
              </button>
            </div>
          </div>

          {/* KPI STRIP */}
          <section className="mt-2.5 grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-5">
            <MetricCard title="Portfolio value" value={formatMoney(currentValue)} caption="Positions + cash" icon={WalletCards} />
            <MetricCard title="Invested" value={formatMoney(invested)} caption="Cost basis incl. cash" icon={LineChart} />
            <MetricCard
              title="Total return"
              value={`${pnl >= 0 ? "+" : "−"}${Math.abs(returnPercentage).toFixed(2)}%`}
              caption={`${pnl >= 0 ? "+" : "−"}${formatMoney(Math.abs(pnl))} P&L`}
              icon={TrendingUp}
              positive={pnl >= 0}
            />
            <MetricCard title="Available cash" value={formatMoney(cashBalance)} caption="Deployable balance" icon={Wallet} />
            <MetricCard
              title="Benchmark"
              value={formatLabel(portfolio.benchmark || "—")}
              caption={`Rebalance: ${formatLabel(portfolio.reBalancingFrequency || "—")}`}
              icon={LineChart}
            />
          </section>


          {/* GRID AREA — stacked, both full width */}
          <div className="mt-2.5 grid min-h-0 flex-1 grid-rows-[minmax(0,0.85fr)_minmax(0,1.4fr)] gap-2.5">
            {/* THEME COMPOSITION + DRIFT */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Theme composition</h2>
                  <p className="text-[10px] text-slate-500">
                    Theme target vs. invested, actual allocation and drift (±5%)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">
                    Invested in securities{" "}
                    <strong className="font-mono font-semibold" style={{ color: "#1e3a8a" }}>
                      {formatMoney(holdingsInvested)}
                    </strong>
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      validation?.valid ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {validation == null ? "No data" : validation.valid ? "Within mandate" : "Breach"}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1">
                <AgGridReact
                  theme={miniTheme}
                  rowData={compositionRows}
                  columnDefs={compositionColumnDefs}
                  defaultColDef={defaultColDef}
                  getRowId={(p) => String(p.data.rowKey)}
                  suppressCellFocus
                  overlayNoRowsTemplate='<span class="text-xs text-slate-500">Theme composition is not available for this portfolio.</span>'
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            </section>

            {/* HOLDINGS / ALLOCATION */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Current holdings</h2>
                  <p className="text-[10px] text-slate-500">
                    Recorded cost, quantity and live valuation
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[10px] font-bold tracking-wide text-slate-600">
                    <Filter size={12} />
                    <span className="sr-only">Filter holdings by asset class</span>
                    <select
                      aria-label="Filter by asset class"
                      value={assetFilter}
                      onChange={(e) => setAssetFilter(e.target.value)}
                      className="cursor-pointer bg-transparent outline-none"
                    >
                      <option value="ALL">ALL CLASSES</option>
                      {assetClasses.map((assetClass) => (
                        <option key={assetClass} value={assetClass}>
                          {formatLabel(assetClass).toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={exportHoldings}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[10px] font-bold tracking-wide text-slate-600 hover:bg-slate-50"
                  >
                    <Download size={12} /> EXPORT
                  </button>
                </div>
              </div>

              {holdingsError ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                  <AlertTriangle size={28} className="text-amber-500" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">Holdings unavailable</p>
                  <p className="mt-1 text-xs text-slate-400">{holdingsError}</p>
                </div>
              ) : (
                <div className="min-h-0 flex-1">
                  <AgGridReact
                    ref={holdingsGridRef}
                    theme={holdingsTheme}
                    rowData={holdingRows}
                    columnDefs={holdingsColumnDefs}
                    defaultColDef={defaultColDef}
                    pinnedBottomRowData={holdingRows.length ? pinnedTotals : []}
                    getRowId={(p) => String(p.data.rowKey)}
                    suppressCellFocus
                    animateRows
                    overlayNoRowsTemplate='<span class="text-xs text-slate-500">No current holdings in this portfolio.</span>'
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              )}

              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Cost basis from recorded average cost × quantity
                </span>
                <span>
                  {holdingRows.length} of {holdings.length} holdings
                </span>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* TOAST */}
      {addNotice && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {addNotice}
        </div>
      )}

      {/* ADD SECURITY MODAL */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !addSubmitting) setAddOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-security-title"
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="add-security-title" className="text-lg font-bold">
                  Build a purchase basket
                </h2>
                <p className="mt-1 max-w-2xl text-xs text-slate-500">
                  Add several securities at once. The combined quantities are validated against
                  available cash and every theme allocation before anything is recorded.
                </p>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
                aria-label="Close"
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {addLoading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading prices and theme capacity…
              </div>
            ) : (
              <form onSubmit={submitAddSecurity} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 text-xs">
                      <span className="font-semibold text-slate-600">Available cash</span>
                      <strong className="font-mono text-slate-900">{formatMoney(cashBalance)}</strong>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-xs">
                      <span className="font-semibold text-slate-600">Basket cost</span>
                      <strong className={`font-mono ${basketWithinCash ? "text-slate-900" : "text-red-700"}`}>
                        {formatMoney(basketTotal)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-xs">
                      <span className="font-semibold text-slate-600">Cash after purchase</span>
                      <strong className={`font-mono ${basketWithinCash ? "text-slate-900" : "text-red-700"}`}>
                        {formatMoney(cashBalance - basketTotal)}
                      </strong>
                    </div>
                  </div>

                  {!eligibleSecurities.length ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                      No priced securities are available for the asset classes in this theme.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {buyOrders.map((order) => {
                          const item = basketItems.find((c) => c.rowId === order.rowId);
                          const usedElsewhere = new Set(
                            buyOrders
                              .filter((c) => c.rowId !== order.rowId)
                              .map((c) => String(c.securityId))
                              .filter(Boolean)
                          );
                          const selectable = eligibleSecurities.filter(
                            (s) =>
                              !usedElsewhere.has(String(s.id)) ||
                              String(s.id) === String(order.securityId)
                          );
                          const cashForThisRow =
                            cashBalance -
                            basketItems
                              .filter((c) => c.rowId !== order.rowId)
                              .reduce((sum, c) => sum + c.amount, 0);
                          const maxQuantity = item?.security
                            ? Math.max(0, Math.floor((cashForThisRow + 0.01) / Number(item.security.price)))
                            : undefined;
                          return (
                                                       <div
                              key={order.rowId}
                              className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[minmax(240px,1.8fr)_minmax(130px,.7fr)_minmax(130px,.8fr)_auto] md:items-end"
                            >
                              <label className="block text-[11px] font-semibold text-slate-700">
                                Security
                                <select
                                  required
                                  value={order.securityId}
                                  onChange={(e) => updateBuyOrder(order.rowId, "securityId", e.target.value)}
                                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-normal outline-none focus:border-blue-400"
                                >
                                  <option value="">Choose a theme security</option>
                                  {themeAllocations.map((allocation) => (
                                    <optgroup
                                      key={allocation.assetId}
                                      label={`${formatLabel(allocation.assetClass)} · target ${Number(allocation.targetPercentage).toFixed(1)}%`}
                                    >
                                      {selectable
                                        .filter((s) => Number(s.asset?.id) === Number(allocation.assetId))
                                        .map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.name} ({s.symbol || s.isin || "—"}) · {formatMoney(s.price)}
                                          </option>
                                        ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </label>

                              <label className="block text-[11px] font-semibold text-slate-700">
                                Quantity
                                <input
                                  required
                                  type="number"
                                  min="1"
                                  max={maxQuantity}
                                  step="1"
                                  value={order.quantity}
                                  onChange={(e) => updateBuyOrder(order.rowId, "quantity", e.target.value)}
                                  placeholder="Whole units"
                                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono text-xs outline-none focus:border-blue-400"
                                />
                              </label>

                              <div className="rounded-md bg-slate-50 px-3 py-2">
                                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                                  Estimated amount
                                </div>
                                <div className="mt-1 truncate font-mono text-xs font-semibold text-slate-800">
                                  {item?.security ? formatMoney(item.amount) : "—"}
                                </div>
                                {item?.security && (
                                  <div className="text-[9px] text-slate-500">
                                    {formatLabel(item.security.asset?.assetClass)} ·{" "}
                                    {formatMoney(item.security.price)} / unit
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeBuyOrder(order.rowId)}
                                disabled={buyOrders.length <= 1 || addSubmitting}
                                aria-label="Remove security row"
                                title="Remove security"
                                className="flex h-10 items-center justify-center rounded-md border border-slate-200 px-3 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={addBuyOrder}
                        disabled={eligibleSecurities.length <= buyOrders.length || addSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-blue-300 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={14} /> Add another security
                      </button>
                    </>
                  )}

                  {!!projectedAllocations.length && (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
                        <h3 className="text-xs font-bold text-slate-800">Projected theme allocation</h3>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Allocation is calculated across all selected securities together.
                        </p>
                      </div>
                      <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-4">
                        {projectedAllocations.map((allocation) => (
                          <div
                            key={allocation.assetId}
                            className={`rounded-md p-3 ${
                              basketRowsValid && allocation.satisfiedAfterBuy ? "bg-emerald-50" : "bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600">
                              <span>{formatLabel(allocation.assetClass)}</span>
                              <span>Target {Number(allocation.targetPercentage).toFixed(1)}%</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline justify-between gap-2">
                              <strong className="font-mono text-sm text-slate-900">
                                {allocation.projectedPercentage.toFixed(2)}%
                              </strong>
                              <span
                                className={`font-mono text-[10px] ${
                                  allocation.satisfiedAfterBuy ? "text-emerald-700" : "text-amber-700"
                                }`}
                              >
                                {allocation.projectedDrift > 0 ? "+" : ""}
                                {allocation.projectedDrift.toFixed(2)}%
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-white">
                              <div
                                className={`h-full rounded-full ${
                                  allocation.satisfiedAfterBuy ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{
                                  width: `${Math.max(0, Math.min(100, allocation.projectedPercentage))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                      basketRowsValid && basketWithinCash && basketSatisfiesTheme
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-900"
                    }`}
                  >
                    {basketRowsValid && basketWithinCash && basketSatisfiesTheme ? (
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    )}
                    <span>
                      {!basketRowsValid
                        ? "Choose a security and whole-unit quantity in every row."
                        : !basketWithinCash
                          ? "Reduce quantities so the basket fits the remaining cash."
                          : basketSatisfiesTheme
                            ? "The complete basket satisfies every theme allocation band (±5%)."
                            : "Adjust quantities across the selected asset classes until each projected allocation is within ±5% of its theme target."}
                    </span>
                  </div>

                  {addError && (
                    <div role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-xs text-red-700">
                      {addError}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    disabled={addSubmitting}
                    className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!basketCanSubmit || !eligibleSecurities.length}
                    className="rounded-md bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addSubmitting
                      ? "Validating & recording…"
                      : `Buy ${basketItems.filter((i) => i.security).length} ${
                          basketItems.filter((i) => i.security).length === 1 ? "security" : "securities"
                        }`}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

/* ------------------------- presentational helpers ------------------------- */

function PageMessage({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fd] p-5">{children}</div>
  );
}

function MetricCard({ title, value, caption, icon: Icon, positive }) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200/80 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <Icon size={14} className="shrink-0 text-blue-700" />
      </div>
      <p
        className={`mt-1 truncate text-lg font-bold tracking-tight ${
          positive === undefined ? "text-slate-900" : positive ? "text-emerald-700" : "text-red-600"
        }`}
        title={String(value)}
      >
        {value}
      </p>
      <p className="truncate text-[10px] text-slate-500">{caption}</p>
    </article>
  );
}

/* ------------------------- data helpers ------------------------- */

const holdingReturn = (holding) => {
  if (holding.returnPercentage != null) return Number(holding.returnPercentage) || 0;
  const cost = Number(
    holding.totalCost ?? Number(holding.averageCost || 0) * Number(holding.quantity || 0)
  );
  const value = Number(holding.currentValue ?? cost);
  return cost > 0 ? ((value - cost) / cost) * 100 : 0;
};

const normalizeAssetClass = (assetClass) =>
  String(assetClass || "OTHER").trim().toUpperCase().replaceAll(" ", "_");

const formatLabel = (value) => String(value ?? "—").replaceAll("_", " ");

const formatMoney = (value) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : `₹${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

let nextBuyOrderId = 0;
const newBuyOrder = () => ({ rowId: `basket-${++nextBuyOrderId}`, securityId: "", quantity: "" });

export default PortfolioDetailsPage;
