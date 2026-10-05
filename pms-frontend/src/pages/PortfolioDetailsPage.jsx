import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Download, Filter, LineChart,
  RefreshCw, TrendingUp, WalletCards, Wallet, Check, X,
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { toast } from "react-toastify";

import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import {
  getPortfolioBasicInfo,
  getPortfolioHoldings,
  getThemeAllocation,
  validatePortfolioAllocation,
  buyPortfolioSecurities,
  addInitialPortfolioHoldings,
  sellPortfolioHolding,
  updatePortfolioHoldingEquityCategory,
} from "../services/portfolioService";
import { getAllSecuritiesInfo } from "../services/securityService";
import PortfolioBenchmarkView from "./PortfolioBenchmarkView";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ------------------------- grid themes ------------------------- */

const baseParams = {
  accentColor: "#1d4ed8",
  backgroundColor: "#ffffff",
  borderColor: "#e9eef7",
  browserColorScheme: "light",
  headerBackgroundColor: "#eef3ff",
  headerTextColor: "#64748b",
  headerFontSize: 9,
  headerFontWeight: 700,
  fontSize: 12,
  rowHoverColor: "#f5f8ff",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
};

const holdingsTheme = themeQuartz.withParams({
  ...baseParams,
  rowHeight: 24,
  headerHeight: 27,
  spacing: 2,
  cellHorizontalPadding: 7,
});

const miniTheme = themeQuartz.withParams({
  ...baseParams,
  rowHeight: 24,
  headerHeight: 27,
  spacing: 2,
  cellHorizontalPadding: 7,
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

  const [securities, setSecurities] = useState([]);
  const [buyOrders, setBuyOrders] = useState([newBuyOrder()]);
  const [addLoading, setAddLoading] = useState(true);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addNotice, setAddNotice] = useState("");
  const [editingSellId, setEditingSellId] = useState(null);
  const sellQuantityRef = useRef({});
  const [sellSubmitting, setSellSubmitting] = useState(false);
  const [sellError, setSellError] = useState("");
  const [showBenchmark, setShowBenchmark] = useState(false);

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

  useEffect(() => {
    let active = true;
    getAllSecuritiesInfo().then((response) => {
      const payload = response?.data?.data ?? response?.data ?? response;
      const list = payload?.securities ?? payload;
      if (active && Array.isArray(list)) setSecurities(list);
    }).catch(() => {
      if (active) setAddError("Securities could not be loaded. Refresh and try again.");
    }).finally(() => active && setAddLoading(false));
    return () => { active = false; };
  }, []);

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
  const portfolioIsNew = String(portfolio?.portfolioStatus || "").toUpperCase() === "NEW";
  const portfolioUsesWeights = String(portfolio?.portfolioType || "").toUpperCase() === "WEIGHTAGE";
  const allocationBase = Math.max(0, holdingsInvested + cashBalance);
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
          const securityInfo = securities.find((security) => String(security.id) === String(h.securityId));
          const cost = Number(
            h.totalCost ?? Number(h.averageCost || 0) * Number(h.quantity || 0)
          );
          const value = Number(h.currentValue ?? cost);
          const qty = Number(h.quantity || 0);
          return {
            rowKey: String(h.holdingId ?? h.securityId),
            holdingId: h.holdingId,
            securityName: h.securityName || "—",
            symbol: h.symbol || "—",
            assetClass: formatLabel(h.assetClass),
            equityCategory: h.equityCategory || securityInfo?.equityCategory || "",
            securityType: h.securityType || "",
            quantity: qty,
            averageCost: Number(h.averageCost || 0),
            currentPrice: h.currentPrice != null ? Number(h.currentPrice) : qty ? value / qty : 0,
            cost,
            value,
            allocationPct: currentValue > 0 ? (value / currentValue) * 100 : 0,
            allocationValue: portfolioUsesWeights
              ? currentValue > 0 ? (value / currentValue) * 100 : 0
              : value,
            pnl: value - cost,
            returnPct: holdingReturn(h),
          };
        }),
    [holdings, securities, assetFilter, currentValue, portfolioUsesWeights]
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
        allocationValue: portfolioUsesWeights ? 100 : currentValue,
        cost: invested,
        value: currentValue,
        pnl,
        returnPct: returnPercentage,
      },
    ],
    [invested, currentValue, pnl, returnPercentage, portfolioUsesWeights]
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
      wrapHeaderText: false,
      autoHeaderHeight: false,
      cellStyle: LEFT_CELL,
    }),
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
  

  const exportHoldings = () => {
    const rows = [
      ["Security", "Symbol", "Asset class", "Equity category", "Quantity", "Average cost", "Current price", "Invested", "Current value", "P&L", "Return %"],
      ...holdingRows.map((row) => [row.securityName, row.symbol, row.assetClass, row.equityCategory, row.quantity, row.averageCost, row.currentPrice, row.cost, row.value, row.pnl, row.returnPct]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${String(portfolio?.name || "portfolio").replace(/[^a-z0-9-_]+/gi, "-")}-holdings.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };


  const themeAllocations = (validation?.allocations || []).filter(
    (a) => Number(a.targetPercentage) > 0
  );
  const eligibleSecurities = securities.filter((s) => Number(s.price) > 0 && (
    !portfolioIsNew || themeAllocations.some((a) => Number(a.assetId) === Number(s.asset?.id))
  ));
  const basketItems = buyOrders.map((order) => {
    const security = eligibleSecurities.find((i) => String(i.id) === String(order.securityId));
    const enteredValue = Number(order.allocationValue);
    const validEntry = Number.isFinite(enteredValue) && enteredValue > 0 &&
      (!portfolioUsesWeights || enteredValue <= 100);
    const requestedAmount = validEntry
      ? portfolioUsesWeights ? allocationBase * enteredValue / 100 : enteredValue
      : 0;
    const price = Number(security?.price || 0);
    const quantity = price > 0 && requestedAmount > 0 ? Math.floor(requestedAmount / price) : 0;
    const validQuantity = Boolean(security) && validEntry && Number.isInteger(quantity) && quantity > 0;
    return {
      ...order,
      security,
      quantity,
      validQuantity,
      requestedAmount,
      amount: security && validQuantity ? price * quantity : 0,
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
  const basketSatisfiesTheme = !portfolioIsNew || (
    projectedAllocations.length > 0 && projectedAllocations.every((a) => a.satisfiedAfterBuy)
  );
  const basketWithinCash = basketTotal <= cashBalance + 0.01;
  const basketCanSubmit = basketRowsValid && basketTotal > 0 && basketWithinCash && basketSatisfiesTheme && !addSubmitting && editingSellId === null;

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
      setAddError(portfolioUsesWeights
        ? "Select a security and enter an allocation percentage that buys at least one whole unit."
        : "Select a security and enter an amount that buys at least one whole unit.");
      return;
    }
    if (!basketWithinCash) {
      setAddError("The total basket cost exceeds the portfolio's available cash.");
      return;
    }
    if (portfolioIsNew && !basketSatisfiesTheme) {
      setAddError(
        "Adjust the basket so every asset class is within 5 percentage points of its theme target."
      );
      return;
    }
    setAddSubmitting(true);
    try {
      const orders = basketItems.map((item) => ({
          portfolioId,
          securityId: item.security.id,
          quantity: item.quantity,
          equityCategory: item.security.equityCategory || null,
        }));
      const result = portfolioIsNew
        ? await addInitialPortfolioHoldings({ portfolioId, orders })
        : await buyPortfolioSecurities(orders);
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
      setBuyOrders([newBuyOrder()]);
    } catch (failure) {
      setAddError(
        failure?.response?.data?.message || failure?.message || "Could not add this security."
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  const beginSell = (row) => {
    setEditingSellId(row.holdingId);
    sellQuantityRef.current[row.holdingId] = "";
    setSellError("");
  };

  const cancelSell = () => {
    if (sellSubmitting) return;
    setEditingSellId(null);
    if (editingSellId != null) delete sellQuantityRef.current[editingSellId];
    setSellError("");
  };

  const confirmSell = async (row) => {
    const quantity = Number(sellQuantityRef.current[row.holdingId]);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setSellError("Enter a positive whole-unit quantity to sell.");
      return;
    }
    if (quantity > row.quantity) {
      setSellError("Sell quantity cannot exceed the quantity currently held.");
      return;
    }
    if (!row.holdingId) {
      setSellError("This holding has no sellable holding record.");
      return;
    }

    setSellSubmitting(true);
    setSellError("");
    try {
      const result = await sellPortfolioHolding({ holdingId: row.holdingId, quantity });
      if (result?.success === false) throw new Error(result.message || "The sell order was rejected.");
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
      setAddNotice(result?.message || `Sold ${quantity} ${row.symbol.toUpperCase() === "GOLD" ? "gram(s)" : "unit(s)"} of ${row.securityName}.`);
      setEditingSellId(null);
      delete sellQuantityRef.current[row.holdingId];
    } catch (failure) {
      setSellError(failure?.response?.data?.message || failure?.message || "Could not complete the sell order.");
    } finally {
      setSellSubmitting(false);
    }
  };

  const holdingsColumnDefs = useMemo(() => [
    { headerName: "Security", field: "securityName", flex: 1.5, minWidth: 110, tooltipField: "securityName", cellClass: "font-medium text-slate-800" },
    { headerName: "Symbol", field: "symbol", width: 62, tooltipField: "symbol", cellClass: "font-mono text-[9px] text-slate-500" },
    { headerName: "Asset", field: "assetClass", width: 72, cellClass: "text-[9px] text-slate-600" },
    {
      headerName: "Equity category",
      field: "equityCategory",
      width: 112,
      editable: (params) => ["EQUITY", "MUTUAL_FUND"].includes(params.data?.securityType),
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["", "SMALL_CAP", "MID_CAP", "LARGE_CAP"] },
      valueFormatter: (params) => params.value ? formatLabel(params.value) : "—",
      cellClass: (params) => ["EQUITY", "MUTUAL_FUND"].includes(params.data?.securityType)
        ? "text-[9px] text-slate-700"
        : "text-[9px] text-slate-300",
    },
    numericCol({
      headerName: portfolioUsesWeights ? "Alloc. %" : "Alloc. ₹",
      field: "allocationValue",
      width: 94,
      cellClass: "font-mono text-[9px] text-slate-700",
      valueFormatter: (params) => params.value == null ? "" : params.context.portfolioUsesWeights
        ? `${Number(params.value).toFixed(1)}%`
        : formatCompactMoney(params.value),
    }),
    numericCol({
      headerName: "Quantity",
      field: "quantity",
      width: 70,
      cellRenderer: HoldingQuantityCellRenderer,
      suppressMouseEventHandling: () => true,
    }),
    numericCol({ headerName: "Avg cost", field: "averageCost", width: 84, valueFormatter: (p) => p.value == null ? "" : formatCompactMoney(p.value), cellClass: "font-mono text-[9px] text-slate-600" }),
    numericCol({ headerName: "Price", field: "currentPrice", width: 78, valueFormatter: (p) => p.value == null ? "" : formatCompactMoney(p.value), cellClass: "font-mono text-[9px] text-slate-700" }),
    numericCol({ headerName: "Cost", field: "cost", width: 86, cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono text-[9px] font-semibold", valueFormatter: (p) => formatCompactMoney(p.value) }),
    numericCol({ headerName: "Value", field: "value", width: 88, cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono text-[9px] font-semibold", valueFormatter: (p) => formatCompactMoney(p.value) }),
    numericCol({ headerName: "P&L", field: "pnl", width: 80, cellClass: (p) => `font-mono text-[9px] font-semibold ${Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"}`, valueFormatter: (p) => `${Number(p.value) >= 0 ? "+" : "−"}${formatCompactMoney(Math.abs(Number(p.value || 0)))}` }),
    numericCol({ headerName: "Ret.", field: "returnPct", width: 68, sort: "desc", cellClass: (p) => `font-mono text-[9px] font-semibold ${Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"}`, valueFormatter: (p) => `${Number(p.value) >= 0 ? "+" : ""}${Number(p.value || 0).toFixed(1)}%` }),
    { headerName: "Trade", field: "holdingId", width: 70, sortable: false, filter: false, suppressMouseEventHandling: () => true, cellRenderer: HoldingActionsCellRenderer },
  ], [portfolioUsesWeights]);

  const handleHoldingCellValueChanged = async (event) => {
    if (event.colDef.field !== "equityCategory" || !event.data?.holdingId) return;
    try {
      await updatePortfolioHoldingEquityCategory({
        holdingId: event.data.holdingId,
        equityCategory: event.newValue || null,
      });
      setHoldings((previous) => previous.map((holding) =>
        holding.holdingId === event.data.holdingId
          ? { ...holding, equityCategory: event.newValue || null }
          : holding
      ));
      toast.success("Equity category updated.");
    } catch (error) {
      event.node.setDataValue("equityCategory", event.oldValue || "");
      toast.error(error?.response?.data?.message || "Could not update equity category.");
    }
  };

  const holdingsGridContext = {
    portfolioUsesWeights,
    portfolioIsNew,
    editingSellId,
    setSellQuantity: (holdingId, value) => {
      sellQuantityRef.current[holdingId] = value;
      setSellError("");
    },
    beginSell,
    cancelSell,
    confirmSell,
    sellSubmitting,
    addSubmitting,
  };

  useEffect(() => {
    holdingsGridRef.current?.api?.refreshCells({ force: true });
  }, [editingSellId]);

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

        {showBenchmark ? (
          <PortfolioBenchmarkView
            portfolio={portfolio}
            holdings={holdings}
            cashBalance={cashBalance}
            invested={invested}
            currentValue={currentValue}
            pnl={pnl}
            returnPercentage={returnPercentage}
            onBack={() => setShowBenchmark(false)}
          />
        ) : (
        <main className="mx-auto flex w-full min-h-0 max-w-[1700px] max-[760px]:ml-0 flex-1 flex-col px-4 py-2.5 sm:px-5">
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
                <span className={`text-[10px] font-bold uppercase tracking-wide ${portfolioIsNew ? "text-amber-700" : "text-emerald-700"}`}>
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
              {!portfolioIsNew && <button
                onClick={() => setShowBenchmark(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50"
              >
                <LineChart size={14} /> View benchmark
              </button>}
              {!portfolioIsNew && <button
                onClick={() => navigate("/rebalancing", { state: { portfolioId } })}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <RefreshCw size={14} /> Rebalance
              </button>}
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
          <div className="mt-2 grid min-h-0 flex-1 grid-rows-[minmax(0,0.62fr)_minmax(0,1.38fr)] gap-2">
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
                      portfolioIsNew ? "text-amber-700" : validation?.valid ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {portfolioIsNew ? "Awaiting holdings" : validation == null ? "No data" : validation.valid ? "Within mandate" : "Breach"}
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
                <form onSubmit={submitAddSecurity} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="min-h-0 flex-[1.2]">
                    <AgGridReact
                      ref={holdingsGridRef}
                      theme={holdingsTheme}
                      rowData={holdingRows}
                      columnDefs={holdingsColumnDefs}
                      onCellValueChanged={handleHoldingCellValueChanged}
                      defaultColDef={defaultColDef}
                      pinnedBottomRowData={holdingRows.length ? pinnedTotals : []}
                      getRowId={(params) => String(params.data.rowKey)}
                      context={holdingsGridContext}
                      suppressCellFocus
                      animateRows
                      overlayNoRowsTemplate='<span class="text-xs text-slate-500">No current holdings in this portfolio.</span>'
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                  <div className="min-h-0 flex-[0.8] overflow-x-auto overflow-y-auto border-t border-slate-100">
                    <table className="w-full min-w-[650px] table-fixed border-collapse text-left text-[10px]">
                      <thead className="sticky top-0 z-[1] bg-amber-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        <tr>{[["Add security", "32%"], [portfolioUsesWeights ? "Alloc. %" : "Buy amount", "14%"], ["Qty", "13%"], ["Price", "14%"], ["Est. cost", "15%"], ["Actions", "22%"]].map(([label, width]) => <th key={label} style={{ width }} className="px-1.5 py-1.5">{label}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                      {buyOrders.map((order) => {
                        const item = basketItems.find((candidate) => candidate.rowId === order.rowId);
                        const used = new Set(buyOrders.filter((candidate) => candidate.rowId !== order.rowId).map((candidate) => String(candidate.securityId)));
                        const selectable = eligibleSecurities.filter((security) => !used.has(String(security.id)) || String(security.id) === String(order.securityId));
                        return <tr key={order.rowId} className="bg-amber-50/40">
                          <td className="px-1.5 py-1">
                            <select value={order.securityId} onChange={(event) => updateBuyOrder(order.rowId, "securityId", event.target.value)} className="h-7 w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 text-[10px] outline-none focus:border-blue-500">
                              <option value="">Choose security…</option>
                              {(portfolioIsNew ? themeAllocations : [{ assetId: "all", assetClass: "All securities" }]).map((allocation) => <optgroup key={allocation.assetId} label={allocation.assetId === "all" ? allocation.assetClass : formatLabel(allocation.assetClass)}>
                                {selectable.filter((security) => allocation.assetId === "all" || Number(security.asset?.id) === Number(allocation.assetId)).map((security) => <option key={security.id} value={security.id}>{security.name} ({security.symbol || security.isin || "—"})</option>)}
                              </optgroup>)}
                            </select>
                          </td>
                          <td className="px-1 py-1"><input aria-label={portfolioUsesWeights ? "Allocation percentage" : "Buy amount"} type="number" min="0.01" max={portfolioUsesWeights ? 100 : undefined} step="any" value={order.allocationValue} onChange={(event) => updateBuyOrder(order.rowId, "allocationValue", event.target.value)} placeholder={portfolioUsesWeights ? "%" : "₹"} className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-right font-mono text-[10px] outline-none focus:border-blue-500" /></td>
                          <td className="px-1.5 py-1 text-right font-mono text-[10px] font-semibold text-slate-800">{item?.validQuantity ? `${item.quantity.toLocaleString("en-IN")}${String(item.security?.symbol || "").toUpperCase() === "GOLD" ? "g" : ""}` : "—"}</td>
                          <td className="px-1.5 py-1 text-right font-mono text-[10px]">{item?.security ? formatCompactMoney(item.security.price) : "—"}</td>
                          <td className="px-1.5 py-1 text-right font-mono text-[10px] font-semibold">{item?.validQuantity ? formatCompactMoney(item.amount) : "—"}</td>
                          <td className="whitespace-nowrap px-1 py-1 text-right">
                            <button type="button" onClick={addBuyOrder} disabled={!eligibleSecurities.length || addSubmitting} className="rounded bg-blue-800 px-1.5 py-1 text-[9px] font-semibold text-white disabled:opacity-40">Add</button>
                            <button type="button" onClick={() => removeBuyOrder(order.rowId)} disabled={buyOrders.length <= 1 || addSubmitting} className="ml-1 rounded border border-slate-200 px-1.5 py-1 text-[9px] font-semibold text-slate-600 disabled:opacity-40">×</button>
                          </td>
                        </tr>;
                      })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-2">
                    <div className="min-w-0 text-[10px]">
                      <span className="font-medium text-slate-600">Basket {formatCompactMoney(basketTotal)}</span>
                      <span className={`ml-2 ${basketWithinCash ? "text-slate-500" : "font-semibold text-red-600"}`}>Cash after: {formatCompactMoney(cashBalance - basketTotal)}</span>
                      {portfolioIsNew && <span className={`ml-2 ${basketSatisfiesTheme ? "text-emerald-700" : "text-amber-700"}`}>{basketSatisfiesTheme ? "Theme allocation satisfied" : "Theme allocation needs adjustment"}</span>}
                    </div>
                    <button type="submit" disabled={!basketCanSubmit} className="rounded-md bg-blue-800 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40">
                      {addSubmitting ? "Saving…" : portfolioIsNew ? "Validate & Activate" : "Record purchases"}
                    </button>
                  </div>
                  {addError && <p role="alert" className="px-3 py-1.5 text-[11px] text-red-700">{addError}</p>}
                  {sellError && <p role="alert" className="px-3 py-1.5 text-[11px] text-red-700">{sellError}</p>}
                  {addLoading && <p className="px-3 py-1.5 text-[10px] text-slate-500">Loading securities…</p>}
                </form>
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
        )}
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

function HoldingQuantityCellRenderer(params) {
  const { data, context, value } = params;
  if (!data) return null;
  if (data.holdingId != null && String(context.editingSellId) === String(data.holdingId)) {
    return (
      <input
        aria-label={`Sell quantity for ${data.securityName}`}
        type="number"
        min="1"
        max={data.quantity}
        step="1"
        autoFocus
        disabled={context.sellSubmitting || context.addSubmitting}
        defaultValue={context.sellQuantity ?? ""}
        onChange={(event) => context.setSellQuantity(data.holdingId, event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); context.confirmSell(data); }
          if (event.key === "Escape") { event.preventDefault(); context.cancelSell(); }
        }}
        className="h-7 w-20 rounded border border-red-200 bg-white px-2 text-right font-mono text-[11px] outline-none focus:border-red-500"
      />
    );
  }
  const quantity = value == null ? "" : Number(value).toLocaleString("en-IN");
  return <span>{quantity}{String(data.symbol || "").toUpperCase() === "GOLD" && quantity ? " g" : ""}</span>;
}

function HoldingActionsCellRenderer(params) {
  const { data, context } = params;
  if (!data?.holdingId || context.portfolioIsNew || Number(data.quantity) <= 0) return null;
  const editing = String(context.editingSellId) === String(data.holdingId);
  if (editing) {
    return (
      <div className="flex h-full items-center justify-end">
        <button type="button" onClick={() => context.confirmSell(data)} disabled={context.sellSubmitting || context.addSubmitting} aria-label={`Confirm sell ${data.securityName}`} title="Confirm sell" className="inline-flex h-7 w-7 items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"><Check size={14} /></button>
        <button type="button" onClick={context.cancelSell} disabled={context.sellSubmitting || context.addSubmitting} aria-label="Cancel sell" title="Cancel" className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={14} /></button>
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-end">
      <button type="button" onClick={() => context.beginSell(data)} disabled={context.editingSellId != null || context.addSubmitting} className="rounded border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">Sell</button>
    </div>
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

const formatCompactMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return formatMoney(amount);
};

let nextBuyOrderId = 0;
const newBuyOrder = () => ({ rowId: `basket-${++nextBuyOrderId}`, securityId: "", allocationValue: "" });

export default PortfolioDetailsPage;
