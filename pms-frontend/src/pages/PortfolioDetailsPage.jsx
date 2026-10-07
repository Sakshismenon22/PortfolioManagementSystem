import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Download, Filter, LineChart,
  RefreshCw, TrendingUp, WalletCards, Wallet, PieChart, Table2, ArrowLeftRight, Scale,
} from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { toast } from "react-toastify";

import SideBarComponent from "../components/SideBarComponent";
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
import { runPortfolioDriftCheck } from "../services/driftService";
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
  headerFontSize: 11,
  headerFontWeight: 700,
  fontSize: 13,
  rowHoverColor: "#f5f8ff",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
};

const gridTheme = themeQuartz.withParams({
  ...baseParams,
  rowHeight: 32,
  headerHeight: 32,
  spacing: 4,
  cellHorizontalPadding: 9,
});

const LEFT_CELL = { display: "flex", alignItems: "center" };
const RIGHT_CELL = { display: "flex", alignItems: "center", justifyContent: "flex-end" };

const numericCol = (overrides = {}) => ({
  type: "rightAligned",
  headerClass: "ag-right-aligned-header",
  cellStyle: RIGHT_CELL,
  ...overrides,
});

/* ------------------------- constants ------------------------- */

const DRIFT_BAND = 5;

const TABS = [
  { key: "holdings", label: "Portfolio holdings", icon: Table2 },
  { key: "trade", label: "Buy or Sell holdings", icon: ArrowLeftRight },
  { key: "composition", label: "Theme composition", icon: PieChart },
  { key: "rebalance", label: "Rebalance recommendation", icon: Scale },
];

/* ------------------------- page ------------------------- */

const PortfolioDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState(location.state?.portfolio ?? null);
  const [holdings, setHoldings] = useState([]);
  const [validation, setValidation] = useState(null);
  const [themeAllocation, setThemeAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [holdingsError, setHoldingsError] = useState("");
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("holdings");

  const [securities, setSecurities] = useState([]);
  const [securitiesLoading, setSecuritiesLoading] = useState(true);
  const [orders, setOrders] = useState([newOrder()]);
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [notice, setNotice] = useState("");
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [driftCheckRunning, setDriftCheckRunning] = useState(false);

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
        if (String(basicInfo?.portfolioStatus || "").toUpperCase() === "NEW") {
          setActiveTab("trade");
        }
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
      if (active) setTradeError("Securities could not be loaded. Refresh and try again.");
    }).finally(() => active && setSecuritiesLoading(false));
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
      holdings.reduce((sum, h) => sum + holdingValue(h), 0) + cashBalance
  );
  const pnl = currentValue - invested;
  const returnPercentage = invested ? (pnl / invested) * 100 : 0;
  const portfolioId = portfolio?.portfolioId ?? id;
  const portfolioIsNew = String(portfolio?.portfolioStatus || "").toUpperCase() === "NEW";
  const portfolioUsesWeights = String(portfolio?.portfolioType || "").toUpperCase() === "WEIGHTAGE";
  const allocationBase = Math.max(0, holdingsInvested + cashBalance);
  const themeName = portfolio?.themeName || themeAllocation?.themeName || "—";
  const allocations = validation?.allocations || [];

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
          const securityInfo = securities.find((s) => String(s.id) === String(h.securityId));
          const cost = Number(h.totalCost ?? Number(h.averageCost || 0) * Number(h.quantity || 0));
          const value = holdingValue(h);
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
            currentPrice: holdingPrice(h),
            cost,
            value,
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
        securityName: "Portfolio total",
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

  const compositionRows = useMemo(
    () =>
      allocations.map((allocation) => {
        const matches = holdings.filter((h) => holdingMatchesAllocation(h, allocation));
        const investedAmount = matches.reduce(
          (sum, h) => sum + Number(h.totalCost ?? Number(h.averageCost || 0) * Number(h.quantity || 0)),
          0
        );
        const currentAmount = matches.reduce((sum, h) => sum + holdingValue(h), 0);
        const target = Number(allocation.targetPercentage || 0);
        const actualPct =
          allocation.currentPercentage != null
            ? Number(allocation.currentPercentage)
            : holdingsInvested ? (investedAmount / holdingsInvested) * 100 : 0;
        return {
          rowKey: `${allocation.assetId}-${allocation.assetClass}`,
          theme: themeName,
          assetClass: formatLabel(allocation.assetClass),
          targetPct: target,
          investedAmount,
          actualPct,
          currentAmount,
          drift: Math.round((actualPct - target) * 100) / 100,
          satisfied: allocation.satisfied !== false,
        };
      }),
    [allocations, holdings, holdingsInvested, themeName]
  );

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
      { headerName: "Theme", field: "theme", flex: 1.1, minWidth: 120, filter: "agTextColumnFilter", cellClass: "font-medium text-slate-700" },
      { headerName: "Asset", field: "assetClass", flex: 1, minWidth: 110, filter: "agTextColumnFilter", cellClass: "text-slate-700" },
      numericCol({ headerName: "Theme alloc.", field: "targetPct", flex: 0.85, minWidth: 105, cellClass: "font-mono text-slate-600", valueFormatter: (p) => `${Number(p.value || 0).toFixed(2)}%` }),
      numericCol({ headerName: "Invested", field: "investedAmount", flex: 1, minWidth: 120, cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono font-semibold", valueFormatter: (p) => formatMoney(p.value) }),
      numericCol({ headerName: "Actual alloc.", field: "actualPct", flex: 0.9, minWidth: 110, cellClass: (p) => `font-mono font-semibold ${p.data?.satisfied ? "text-emerald-700" : "text-red-600"}`, valueFormatter: (p) => `${Number(p.value || 0).toFixed(2)}%` }),
      numericCol({ headerName: "Drift", field: "drift", flex: 0.8, minWidth: 95, cellClass: (p) => `font-mono font-semibold ${Math.abs(Number(p.value || 0)) < DRIFT_BAND ? "text-emerald-700" : "text-red-600"}`, valueFormatter: (p) => `${Number(p.value) > 0 ? "+" : ""}${Number(p.value || 0).toFixed(2)}%` }),
      numericCol({ headerName: "Current amount", field: "currentAmount", flex: 1, minWidth: 130, cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono font-semibold", valueFormatter: (p) => formatMoney(p.value) }),
      numericCol({ headerName: "Status", colId: "status", flex: 0.85, minWidth: 100, sortable: false, valueGetter: (p) => (p.data?.satisfied ? "In band" : "Breached"), cellClass: (p) => `text-[10px] font-bold uppercase tracking-wide ${p.value === "In band" ? "text-emerald-700" : "text-red-600"}` }),
    ],
    []
  );

  const holdingsColumnDefs = useMemo(() => [
    { headerName: "Security", field: "securityName", flex: 1.5, minWidth: 150, tooltipField: "securityName", cellClass: "font-medium text-slate-800" },
    { headerName: "Symbol", field: "symbol", width: 72, tooltipField: "symbol", cellClass: "font-mono text-[11px] text-slate-500" },
    { headerName: "Asset", field: "assetClass", width: 82, cellClass: "text-[11px] text-slate-600" },
    {
      headerName: "Equity category",
      field: "equityCategory",
      width: 70,
      editable: (params) => ["EQUITY", "MUTUAL_FUND"].includes(params.data?.securityType),
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["", "SMALL_CAP", "MID_CAP", "LARGE_CAP"] },
      valueFormatter: (params) => params.value ? formatLabel(params.value) : "—",
      cellClass: (params) => ["EQUITY", "MUTUAL_FUND"].includes(params.data?.securityType)
        ? "text-[11px] text-slate-700"
        : "text-[11px] text-slate-300",
    },
    numericCol({
      headerName: portfolioUsesWeights ? "Alloc. %" : "Alloc. ₹",
      field: "allocationValue",
      width: 60,
      cellClass: "font-mono text-[11px] text-slate-700",
      valueFormatter: (p) => p.value == null ? "" : portfolioUsesWeights ? `${Number(p.value).toFixed(2)}%` : formatMoney(p.value),
    }),
    numericCol({
      headerName: "Quantity",
      field: "quantity",
      width: 88,
      cellClass: "font-mono text-[11px] text-slate-700",
      valueFormatter: (p) => p.value == null ? "" : `${Number(p.value).toLocaleString("en-IN")}${isGold(p.data?.symbol) ? " g" : ""}`,
    }),
    numericCol({ headerName: "Avg cost", field: "averageCost", width: 116, valueFormatter: (p) => p.value == null ? "" : formatMoney(p.value), cellClass: "font-mono text-[11px] text-slate-600" }),
    numericCol({ headerName: "Price", field: "currentPrice", width: 116, valueFormatter: (p) => p.value == null ? "" : formatMoney(p.value), cellClass: "font-mono text-[11px] text-slate-700" }),
    numericCol({ headerName: "Cost", field: "cost", width: 136, cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono text-[11px] font-semibold", valueFormatter: (p) => formatMoney(p.value) }),
    numericCol({ headerName: "Value", field: "value", width: 136, cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono text-[11px] font-semibold", valueFormatter: (p) => formatMoney(p.value) }),
    numericCol({ headerName: "P&L", field: "pnl", width: 136, cellClass: (p) => `font-mono text-[11px] font-semibold ${Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"}`, valueFormatter: (p) => `${Number(p.value) >= 0 ? "+" : "−"}${formatMoney(Math.abs(Number(p.value || 0)))}` }),
    numericCol({ headerName: "Ret.", field: "returnPct", width: 78, sort: "desc", cellClass: (p) => `font-mono text-[11px] font-semibold ${Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"}`, valueFormatter: (p) => `${Number(p.value) >= 0 ? "+" : ""}${Number(p.value || 0).toFixed(1)}%` }),
  ], [portfolioUsesWeights]);

  const rebalanceColumnDefs = useMemo(() => [
    { headerName: "Asset", field: "assetClass", flex: 1, minWidth: 100, cellClass: "text-slate-700" },
    { headerName: "Action", field: "action", width: 80, cellClass: (p) => `text-[10px] font-bold uppercase tracking-wide ${p.value === "SELL" ? "text-red-600" : "text-emerald-700"}` },
    { headerName: "Security", field: "securityName", flex: 1.6, minWidth: 140, tooltipField: "securityName", cellClass: "font-medium text-slate-800" },
    { headerName: "Symbol", field: "symbol", width: 80, cellClass: "font-mono text-[9px] text-slate-500" },
    numericCol({ headerName: "Quantity", field: "quantity", width: 90, cellClass: "font-mono font-semibold text-slate-800", valueFormatter: (p) => p.value ? `${Number(p.value).toLocaleString("en-IN")}${isGold(p.data?.symbol) ? " g" : ""}` : "—" }),
    numericCol({ headerName: "Price", field: "price", width: 90, cellClass: "font-mono text-slate-600", valueFormatter: (p) => p.value ? formatCompactMoney(p.value) : "—" }),
    numericCol({ headerName: "Amount", field: "amount", width: 110, cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono font-semibold", valueFormatter: (p) => p.value ? formatCompactMoney(p.value) : "—" }),
    { headerName: "Why", field: "reason", flex: 1.2, minWidth: 150, cellClass: "text-[10px] text-slate-500" },
  ], []);

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
    } catch (failure) {
      event.node.setDataValue("equityCategory", event.oldValue || "");
      toast.error(failure?.response?.data?.message || "Could not update equity category.");
    }
  };

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

  /* ------------------------- buy / sell basket ------------------------- */

  const themeAllocations = allocations.filter((a) => Number(a.targetPercentage) > 0);
  const eligibleSecurities = securities.filter((s) => {
    const matchesTheme = !portfolioIsNew || themeAllocations.some((a) => securityMatchesAllocation(s, a));
    const isFixedIncome = normalizeAssetClass(s?.asset?.assetClass || s?.assetClass || s?.securityType || "") === "FIXED_INCOME";
    const hasPrice = Number.isFinite(Number(s?.price)) && Number(s?.price) > 0;
    return matchesTheme && (hasPrice || isFixedIncome);
  });
  const sellableHoldings = holdings.filter((h) => h.holdingId != null && Number(h.quantity) > 0);

  const basketItems = orders.map((order) => {
    if (order.side === "SELL") {
      const holding = sellableHoldings.find((h) => String(h.holdingId) === String(order.holdingId));
      const quantity = Number(order.quantity);
      const held = Number(holding?.quantity || 0);
      const valid = Boolean(holding) && Number.isInteger(quantity) && quantity > 0 && quantity <= held;
      const price = holding ? holdingPrice(holding) : 0;
      return {
        ...order,
        holding,
        security: null,
        label: holding?.securityName || "",
        symbol: holding?.symbol || "",
        quantity: valid ? quantity : 0,
        price,
        valid,
        amount: valid ? price * quantity : 0,
      };
    }
    const security = eligibleSecurities.find((s) => String(s.id) === String(order.securityId));
    const enteredValue = Number(order.allocationValue);
    const validEntry = Number.isFinite(enteredValue) && enteredValue > 0 &&
      (!portfolioUsesWeights || enteredValue <= 100);
    const requestedAmount = validEntry
      ? portfolioUsesWeights ? allocationBase * enteredValue / 100 : enteredValue
      : 0;
    const price = Number(security?.price || 0);
    const isFixedIncomeSecurity = normalizeAssetClass(security?.asset?.assetClass || security?.assetClass || security?.securityType || "") === "FIXED_INCOME";
    const quantity = price > 0 && requestedAmount > 0
      ? Math.floor(requestedAmount / price)
      : isFixedIncomeSecurity && requestedAmount > 0
        ? 1
        : 0;
    const valid = Boolean(security) && validEntry && ((price > 0 && quantity > 0) || isFixedIncomeSecurity);
    const resolvedAmount = price > 0 ? price * quantity : requestedAmount;
    return {
      ...order,
      holding: null,
      security,
      label: security?.name || "",
      symbol: security?.symbol || "",
      quantity,
      price,
      valid,
      amount: valid ? resolvedAmount : 0,
    };
  });

  const buyTotal = basketItems.reduce((sum, i) => sum + (i.side === "BUY" ? i.amount : 0), 0);
  const sellTotal = basketItems.reduce((sum, i) => sum + (i.side === "SELL" ? i.amount : 0), 0);
  const basketValidCount = basketItems.filter((i) => i.valid).length;
  const basketRowsValid = basketItems.length > 0 && basketItems.every((i) => i.valid);
  const cashAfterBasket = cashBalance + sellTotal - buyTotal;
  const basketWithinCash = cashAfterBasket >= -0.01;

  const projectedAllocations = allocations.map((allocation) => {
    const currentAssetValue = holdings.reduce(
      (sum, h) => sum + (holdingMatchesAllocation(h, allocation) ? holdingValue(h) : 0),
      0
    );
    const basketDelta = basketItems.reduce((sum, i) => {
      if (!i.valid) return sum;
      const matches = i.side === "SELL"
        ? holdingMatchesAllocation(i.holding, allocation)
        : securityMatchesAllocation(i.security, allocation);
      return sum + (matches ? (i.side === "SELL" ? -i.amount : i.amount) : 0);
    }, 0);
    const projected = currentValue > 0
      ? Math.round(((currentAssetValue + basketDelta) / currentValue) * 10000) / 100
      : 0;
    const drift = Math.round((projected - Number(allocation.targetPercentage || 0)) * 100) / 100;
    return { ...allocation, projectedPercentage: projected, projectedDrift: drift, satisfiedAfterTrade: Math.abs(drift) < DRIFT_BAND };
  });
  const basketSatisfiesTheme = !portfolioIsNew || (
    projectedAllocations.length > 0 && projectedAllocations.every((a) => a.satisfiedAfterTrade)
  );
  const basketCanSubmit = basketRowsValid && (buyTotal > 0 || sellTotal > 0) && basketWithinCash && basketSatisfiesTheme && !tradeSubmitting;

  const updateOrder = (rowId, patch) => {
    setOrders((prev) => prev.map((o) => (o.rowId === rowId ? { ...o, ...patch } : o)));
    setTradeError("");
  };
  const addOrderRow = () => setOrders((prev) => [...prev, newOrder()]);
  const removeOrderRow = (rowId) => setOrders((prev) => prev.filter((o) => o.rowId !== rowId));
  const clearBasket = () => { setOrders([newOrder()]); setTradeError(""); };

  const refreshPortfolioData = async () => {
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
  };

  const submitTrades = async (event) => {
    event.preventDefault();
    setTradeError("");
    if (!basketRowsValid) {
      setTradeError("Every line needs a security/holding and a valid quantity or amount (whole units, within what you hold).");
      return;
    }
    if (!basketWithinCash) {
      setTradeError("Buy cost exceeds available cash plus sell proceeds.");
      return;
    }
    if (portfolioIsNew && !basketSatisfiesTheme) {
      setTradeError(`Adjust the basket so every asset class is within ${DRIFT_BAND} percentage points of its theme target.`);
      return;
    }
    const sells = basketItems.filter((i) => i.side === "SELL");
    const buys = basketItems.filter((i) => i.side === "BUY");
    let completedSells = 0;
    setTradeSubmitting(true);
    try {
      for (const item of sells) {
        const result = await sellPortfolioHolding({ holdingId: item.holding.holdingId, quantity: item.quantity });
        if (result?.success === false) throw new Error(result.message || `Sell of ${item.label} was rejected.`);
        completedSells += 1;
      }
      if (buys.length) {
        const buyOrders = buys.map((item) => ({
          portfolioId,
          securityId: item.security.id,
          quantity: item.quantity,
          equityCategory: item.security.equityCategory || null,
        }));
        const result = portfolioIsNew
          ? await addInitialPortfolioHoldings({ portfolioId, orders: buyOrders })
          : await buyPortfolioSecurities(buyOrders);
        if (result?.success === false) throw new Error(result.message || "The purchase was rejected.");
      }
      await refreshPortfolioData();
      const parts = [];
      if (sells.length) parts.push(`${sells.length} sell${sells.length === 1 ? "" : "s"}`);
      if (buys.length) parts.push(`${buys.length} buy${buys.length === 1 ? "" : "s"}`);
      setNotice(`${parts.join(" and ")} recorded.`);
      setOrders([newOrder()]);
      setActiveTab("holdings");
    } catch (failure) {
      if (completedSells > 0) await refreshPortfolioData().catch(() => {});
      setTradeError(
        (completedSells > 0 ? `${completedSells} sell order(s) completed before the failure. ` : "") +
        (failure?.response?.data?.message || failure?.message || "Could not execute the orders.")
      );
    } finally {
      setTradeSubmitting(false);
    }
  };

  /* ------------------------- rebalance recommendation ------------------------- */

  const rebalancePlan = (() => {
    if (portfolioIsNew || !allocations.length || currentValue <= 0) {
      return { summary: [], lines: [], sellProceeds: 0, buyCost: 0, cashAfter: cashBalance };
    }
    const summary = [];
    const lines = [];
    allocations.forEach((allocation) => {
      const target = Number(allocation.targetPercentage || 0);
      const assetHoldings = holdings.filter((h) => holdingMatchesAllocation(h, allocation));
      const currentAssetValue = assetHoldings.reduce((sum, h) => sum + holdingValue(h), 0);
      const currentPct = (currentAssetValue / currentValue) * 100;
      const drift = currentPct - target;
      const delta = (currentValue * target) / 100 - currentAssetValue;
      const inBand = Math.abs(drift) < DRIFT_BAND;
      const action = inBand ? "HOLD" : delta < 0 ? "SELL" : "BUY";
      const assetLabel = formatLabel(allocation.assetClass);
      summary.push({
        rowKey: `${allocation.assetId}-${allocation.assetClass}`,
        assetClass: assetLabel,
        targetPct: target,
        currentPct,
        drift,
        delta,
        action,
      });
      if (inBand) return;

      if (action === "SELL") {
        const toRaise = Math.abs(delta);
        assetHoldings
          .filter((h) => h.holdingId != null && Number(h.quantity) > 0)
          .forEach((h) => {
            const price = holdingPrice(h);
            if (!(price > 0)) return;
            const share = currentAssetValue > 0 ? holdingValue(h) / currentAssetValue : 0;
            const qty = Math.min(Number(h.quantity), Math.floor((toRaise * share) / price));
            if (qty <= 0) return;
            lines.push({
              rowKey: `sell-${h.holdingId}`,
              assetClass: assetLabel,
              action: "SELL",
              securityName: h.securityName || "—",
              symbol: h.symbol || "—",
              quantity: qty,
              price,
              amount: qty * price,
              holdingId: h.holdingId,
              securityId: h.securityId,
              reason: `Overweight by ${drift.toFixed(2)} pts`,
            });
          });
        return;
      }

      const existing = assetHoldings.filter((h) => h.securityId != null && holdingPrice(h) > 0);
      const candidates = existing.length
        ? existing.map((h) => ({
            securityId: h.securityId,
            name: h.securityName,
            symbol: h.symbol,
            price: holdingPrice(h),
            weight: currentAssetValue > 0 ? holdingValue(h) / currentAssetValue : 1 / existing.length,
          }))
        : eligibleSecurities
            .filter((s) => securityMatchesAllocation(s, allocation))
            .slice(0, 3)
            .map((s, _, arr) => ({
              securityId: s.id,
              name: s.name,
              symbol: s.symbol || s.isin,
              price: Number(s.price) || 0,
              weight: 1 / arr.length,
            }));
      if (!candidates.length) {
        lines.push({
          rowKey: `buy-none-${allocation.assetId}`,
          assetClass: assetLabel,
          action: "BUY",
          securityName: "No eligible security available for this asset class",
          symbol: "—",
          quantity: 0,
          price: 0,
          amount: 0,
          reason: `Underweight by ${Math.abs(drift).toFixed(2)} pts`,
        });
        return;
      }
      candidates.forEach((c) => {
        const qty = Math.floor((delta * c.weight) / c.price);
        if (qty <= 0) return;
        lines.push({
          rowKey: `buy-${c.securityId}`,
          assetClass: assetLabel,
          action: "BUY",
          securityName: c.name || "—",
          symbol: c.symbol || "—",
          quantity: qty,
          price: c.price,
          amount: qty * c.price,
          securityId: c.securityId,
          reason: `Underweight by ${Math.abs(drift).toFixed(2)} pts`,
        });
      });
    });
    const sellProceeds = lines.reduce((sum, l) => sum + (l.action === "SELL" ? l.amount : 0), 0);
    const buyCost = lines.reduce((sum, l) => sum + (l.action === "BUY" ? l.amount : 0), 0);
    return { summary, lines, sellProceeds, buyCost, cashAfter: cashBalance + sellProceeds - buyCost };
  })();

  const rebalanceActionLines = rebalancePlan.lines.filter((l) => l.quantity > 0);
  const rebalanceNeeded = rebalancePlan.summary.some((s) => s.action !== "HOLD");

  const loadPlanIntoBasket = () => {
    if (!rebalanceActionLines.length) return;
    const next = rebalanceActionLines.map((line) =>
      line.action === "SELL"
        ? { ...newOrder(), side: "SELL", holdingId: String(line.holdingId), quantity: String(line.quantity) }
        : {
            ...newOrder(),
            side: "BUY",
            securityId: String(line.securityId),
            allocationValue: portfolioUsesWeights
              ? String(Math.round(((line.amount / allocationBase) * 100 + 0.01) * 100) / 100)
              : String(Math.ceil(line.amount)),
          }
    );
    setOrders(next);
    setTradeError("");
    setActiveTab("trade");
  };

  /* ------------------------- tab switching ------------------------- */

  const switchTab = (tabKey) => {
    if (tabKey === activeTab || tradeSubmitting) return;
    setActiveTab(tabKey);
  };

  const runDriftCheck = async () => {
    if (portfolioIsNew || driftCheckRunning) return;
    setDriftCheckRunning(true);
    try {
      const result = await runPortfolioDriftCheck(portfolioId);
      const refreshedValidation = await validatePortfolioAllocation(portfolioId);
      setValidation(refreshedValidation);
      toast.success(result?.message || "Drift check completed.");
    } catch (driftError) {
      toast.error(driftError?.response?.data?.message || driftError?.message || "Drift check failed.");
    } finally {
      setDriftCheckRunning(false);
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
          <p className="mt-2 text-sm text-slate-500">{error || "The requested portfolio could not be found."}</p>
          <button onClick={() => navigate("/portfolio")} className="mt-5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white">
            Back to portfolios
          </button>
        </div>
      </PageMessage>
    );

  /* ------------------------- render ------------------------- */

  const mandateStatusLabel = portfolioIsNew ? "Awaiting holdings" : validation == null ? "No data" : validation.valid ? "Within mandate" : "Breach";
  const mandateStatusClass = portfolioIsNew ? "text-amber-700" : validation?.valid ? "text-emerald-700" : "text-red-600";
  const mandateDotClass = portfolioIsNew ? "bg-amber-500" : validation == null ? "bg-slate-300" : validation.valid ? "bg-emerald-500" : "bg-red-500";

  const tabCounts = {
    holdings: holdings.length,
    trade: basketValidCount,
    composition: compositionRows.length,
    rebalance: rebalanceActionLines.length,
  };

  const inputHeader = portfolioUsesWeights ? "Alloc. % | Qty" : "Amount | Qty";

  return (
    <div className="h-screen overflow-hidden bg-[#f6f8fd] text-slate-900">
      <SideBarComponent activePage="Portfolios" />

      <div className="sidebar-content flex h-screen min-w-0 flex-col">
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
              <button onClick={() => navigate("/portfolio")} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-800">
                <ArrowLeft size={13} /> Portfolios <span>›</span>
                <span className="text-slate-800">{portfolio.name}</span>
              </button>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{portfolio.name}</h1>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${portfolioIsNew ? "text-amber-700" : "text-emerald-700"}`}>
                  {formatLabel(portfolio.portfolioStatus || "ACTIVE")}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500">Theme · {themeName}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">ID · {portfolioId}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!portfolioIsNew && (
                <button onClick={runDriftCheck} disabled={driftCheckRunning} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50">
                  <RefreshCw size={14} className={driftCheckRunning ? "animate-spin" : ""} />
                  {driftCheckRunning ? "Checking drift…" : "Run Drift Check"}
                </button>
              )}
              {!portfolioIsNew && (
                <button onClick={() => setShowBenchmark(true)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50">
                  <LineChart size={14} /> View benchmark
                </button>
              )}
              {/* {!portfolioIsNew && (
                <button onClick={() => navigate("/rebalancing", { state: { portfolioId } })} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100">
                  <RefreshCw size={14} /> Rebalance
                </button>
              )} */}
            </div>
          </div>

          {/* KPI STRIP */}
          <section className="mt-2.5 grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-5">
            <MetricCard title="Portfolio value" value={formatMoney(currentValue)} caption="Positions + cash" icon={WalletCards} />
            <MetricCard title="Invested" value={formatMoney(invested)} caption="Cost basis incl. cash" icon={LineChart} />
            <MetricCard title="Total return" value={`${pnl >= 0 ? "+" : "−"}${Math.abs(returnPercentage).toFixed(2)}%`} caption={`${pnl >= 0 ? "+" : "−"}${formatMoney(Math.abs(pnl))} P&L`} icon={TrendingUp} positive={pnl >= 0} />
            <MetricCard title="Available cash" value={formatMoney(cashBalance)} caption="Deployable balance" icon={Wallet} />
            <MetricCard title="Benchmark" value={formatLabel(portfolio.benchmark || "—")} caption={`Rebalance: ${formatLabel(portfolio.reBalancingFrequency || "—")}`} icon={LineChart} />
          </section>

          {/* TABBED PANEL */}
          <section className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            {/* Tab bar + contextual toolbar */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3">
              <div role="tablist" aria-label="Portfolio views" className="flex flex-wrap items-end gap-1">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      id={`tab-${tab.key}`}
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.key}`}
                      onClick={() => switchTab(tab.key)}
                      disabled={tradeSubmitting}
                      className={`relative -mb-px inline-flex h-10 items-center gap-1.5 border-b-2 px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        isActive ? "border-blue-800 text-blue-800" : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <TabIcon size={14} />
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isActive ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-500"}`}>
                        {tabCounts[tab.key]}
                      </span>
                      {(tab.key === "composition" || tab.key === "rebalance") && (
                        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${mandateDotClass}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {activeTab === "composition" && (
                <div className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] text-slate-500">
                    Invested in securities <strong className="font-mono font-semibold" style={{ color: "#1e3a8a" }}>{formatMoney(holdingsInvested)}</strong>
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${mandateStatusClass}`}>{mandateStatusLabel}</span>
                </div>
              )}
              {activeTab === "trade" && (
                <div className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] text-slate-500">
                    Available cash <strong className="font-mono font-semibold" style={{ color: "#1e3a8a" }}>{formatMoney(cashBalance)}</strong>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Buy input <strong className="font-semibold text-slate-700">{portfolioUsesWeights ? "Allocation %" : "Amount ₹"}</strong>
                  </span>
                </div>
              )}
              {activeTab === "rebalance" && (
                <div className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] text-slate-500">Drift band <strong className="font-semibold text-slate-700">±{DRIFT_BAND} pts</strong></span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${mandateStatusClass}`}>{mandateStatusLabel}</span>
                </div>
              )}
              {activeTab === "holdings" && (
                <div className="flex flex-wrap gap-2 py-1.5">
                  <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[10px] font-bold tracking-wide text-slate-600">
                    <Filter size={12} />
                    <span className="sr-only">Filter holdings by asset class</span>
                    <select aria-label="Filter by asset class" value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)} className="cursor-pointer bg-transparent outline-none">
                      <option value="ALL">ALL CLASSES</option>
                      {assetClasses.map((assetClass) => (
                        <option key={assetClass} value={assetClass}>{formatLabel(assetClass).toUpperCase()}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={exportHoldings} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[10px] font-bold tracking-wide text-slate-600 hover:bg-slate-50">
                    <Download size={12} /> EXPORT
                  </button>
                  <button type="button" onClick={() => switchTab("trade")} disabled={tradeSubmitting} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-800 px-2.5 text-[10px] font-bold tracking-wide text-white hover:bg-blue-900 disabled:opacity-40">
                    <ArrowLeftRight size={12} /> BUY / SELL
                  </button>
                </div>
              )}
            </div>

            {/* ------------------ TAB: PORTFOLIO HOLDINGS ------------------ */}
            {activeTab === "holdings" && (
              <div role="tabpanel" id="panel-holdings" aria-labelledby="tab-holdings" className="flex min-h-0 flex-1 flex-col">
                <p className="shrink-0 border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">Recorded cost, quantity and live valuation</p>
                {holdingsError ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                    <AlertTriangle size={28} className="text-amber-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">Holdings unavailable</p>
                    <p className="mt-1 text-xs text-slate-400">{holdingsError}</p>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1">
                    <AgGridReact
                      theme={gridTheme}
                      rowData={holdingRows}
                      columnDefs={holdingsColumnDefs}
                      onCellValueChanged={handleHoldingCellValueChanged}
                      defaultColDef={defaultColDef}
                      pinnedBottomRowData={holdingRows.length ? pinnedTotals : []}
                      getRowId={(params) => String(params.data.rowKey)}
                      suppressCellFocus
                      animateRows
                      overlayNoRowsTemplate='<span class="text-xs text-slate-500">No current holdings. Use the Buy or Sell holdings tab to add positions.</span>'
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                )}
                <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-600" /> Cost basis from recorded average cost × quantity</span>
                  <span>{holdingRows.length} of {holdings.length} holdings</span>
                </div>
              </div>
            )}

            {/* ------------------ TAB: BUY OR SELL ------------------ */}
            {activeTab === "trade" && (
              <form role="tabpanel" id="panel-trade" aria-labelledby="tab-trade" onSubmit={submitTrades} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <p className="shrink-0 border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                  {portfolioIsNew
                    ? `Build the opening basket (buys only). Every asset class must land within ±${DRIFT_BAND} points of its theme target to activate the portfolio.`
                    : "Choose Buy or Sell per line. Sells execute first, then buys, so sale proceeds can fund purchases in the same basket."}
                </p>

                <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-[10px]">
                    <thead className="sticky top-0 z-[1] bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        {[["Side", "11%"], ["Security / holding", "29%"], [inputHeader, "14%"], ["Qty", "10%"], ["Price", "12%"], ["Est. value", "13%"], ["Actions", "11%"]].map(([label, width]) => (
                          <th key={label} style={{ width }} className="px-1.5 py-1.5">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => {
                        const item = basketItems.find((c) => c.rowId === order.rowId);
                        const isSell = order.side === "SELL";
                        const usedSecurities = new Set(orders.filter((o) => o.rowId !== order.rowId && o.side === "BUY").map((o) => String(o.securityId)));
                        const usedHoldings = new Set(orders.filter((o) => o.rowId !== order.rowId && o.side === "SELL").map((o) => String(o.holdingId)));
                        const selectableSecurities = portfolioIsNew ? eligibleSecurities : securities;
                        const selectableHoldings = sellableHoldings.filter((h) => !usedHoldings.has(String(h.holdingId)) || String(h.holdingId) === String(order.holdingId));
                        const held = Number(item?.holding?.quantity || 0);
                        return (
                          <tr key={order.rowId} className={isSell ? "bg-red-50/40" : "bg-amber-50/40"}>
                            <td className="px-1.5 py-1">
                              <select
                                aria-label="Order side"
                                value={order.side}
                                disabled={portfolioIsNew || tradeSubmitting}
                                onChange={(e) => updateOrder(order.rowId, { side: e.target.value, securityId: "", holdingId: "", allocationValue: "", quantity: "" })}
                                className={`h-7 w-full rounded border bg-white px-1.5 text-[10px] font-semibold outline-none focus:border-blue-500 ${isSell ? "border-red-200 text-red-700" : "border-slate-200 text-emerald-700"}`}
                              >
                                <option value="BUY">Buy</option>
                                <option value="SELL" disabled={!sellableHoldings.length}>Sell</option>
                              </select>
                            </td>
                            <td className="px-1.5 py-1">
                              {isSell ? (
                                <select
                                  aria-label="Holding to sell"
                                  value={order.holdingId}
                                  disabled={tradeSubmitting}
                                  onChange={(e) => updateOrder(order.rowId, { holdingId: e.target.value, quantity: "" })}
                                  className="h-7 w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 text-[10px] outline-none focus:border-blue-500"
                                >
                                  <option value="">Choose holding…</option>
                                  {selectableHoldings.map((h) => (
                                    <option key={h.holdingId} value={h.holdingId}>
                                      {h.securityName} ({h.symbol || "—"}) · held {Number(h.quantity).toLocaleString("en-IN")}{isGold(h.symbol) ? " g" : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  aria-label="Security to buy"
                                  value={order.securityId}
                                  disabled={tradeSubmitting}
                                  onChange={(e) => updateOrder(order.rowId, { securityId: e.target.value })}
                                  className="h-7 w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 text-[10px] outline-none focus:border-blue-500"
                                >
                                  <option value="">Choose security…</option>
                                  {(portfolioIsNew ? themeAllocations : [{ assetId: "all", assetClass: "All securities" }]).map((allocation) => (
                                    <optgroup key={allocation.assetId} label={allocation.assetId === "all" ? allocation.assetClass : formatLabel(allocation.assetClass)}>
                                      {selectableSecurities
                                        .filter((s) => allocation.assetId === "all" || securityMatchesAllocation(s, allocation))
                                        .map((s) => (
                                          <option key={s.id} value={s.id}>{s.name} ({s.symbol || s.isin || "—"})</option>
                                        ))}
                                    </optgroup>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className="px-1 py-1">
                              {isSell ? (
                                <input
                                  aria-label="Quantity to sell"
                                  type="number"
                                  min="1"
                                  max={held || undefined}
                                  step="1"
                                  value={order.quantity}
                                  disabled={tradeSubmitting || !order.holdingId}
                                  onChange={(e) => updateOrder(order.rowId, { quantity: e.target.value })}
                                  placeholder={held ? `≤ ${held}` : "Qty"}
                                  className="h-7 w-full rounded border border-red-200 bg-white px-1.5 text-right font-mono text-[10px] outline-none focus:border-red-500 disabled:bg-slate-50"
                                />
                              ) : (
                                <input
                                  aria-label={portfolioUsesWeights ? "Allocation percentage" : "Buy amount"}
                                  type="number"
                                  min="0.01"
                                  max={portfolioUsesWeights ? 100 : undefined}
                                  step="any"
                                  value={order.allocationValue}
                                  disabled={tradeSubmitting}
                                  onChange={(e) => updateOrder(order.rowId, { allocationValue: e.target.value })}
                                  placeholder={portfolioUsesWeights ? "%" : "₹"}
                                  className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-right font-mono text-[10px] outline-none focus:border-blue-500"
                                />
                              )}
                            </td>
                            <td className="px-1.5 py-1 text-right font-mono text-[10px] font-semibold text-slate-800">
                              {item?.valid ? `${item.quantity.toLocaleString("en-IN")}${isGold(item.symbol) ? " g" : ""}` : "—"}
                            </td>
                            <td className="px-1.5 py-1 text-right font-mono text-[10px]">{item?.price ? formatCompactMoney(item.price) : "—"}</td>
                            <td className={`px-1.5 py-1 text-right font-mono text-[10px] font-semibold ${isSell ? "text-emerald-700" : "text-slate-800"}`}>
                              {item?.valid ? `${isSell ? "+" : "−"}${formatCompactMoney(item.amount)}` : "—"}
                            </td>
                            <td className="whitespace-nowrap px-1 py-1 text-right">
                              <button type="button" onClick={addOrderRow} disabled={tradeSubmitting} className="rounded bg-blue-800 px-1.5 py-1 text-[9px] font-semibold text-white disabled:opacity-40">Add</button>
                              <button type="button" onClick={() => removeOrderRow(order.rowId)} disabled={orders.length <= 1 || tradeSubmitting} className="ml-1 rounded border border-slate-200 px-1.5 py-1 text-[9px] font-semibold text-slate-600 disabled:opacity-40">×</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {projectedAllocations.length > 0 && (
                  <div className="shrink-0 border-t border-slate-100 px-3 py-2">
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">Projected allocation after these orders</p>
                    <div className="flex flex-wrap gap-1.5">
                      {projectedAllocations.map((a) => (
                        <span
                          key={`${a.assetId}-${a.assetClass}`}
                          title={`Target ${Number(a.targetPercentage || 0).toFixed(2)}% · Projected ${a.projectedPercentage.toFixed(2)}%`}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] ${a.satisfiedAfterTrade ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
                        >
                          <span className="font-semibold">{formatLabel(a.assetClass)}</span>
                          <span className="font-mono">{a.projectedPercentage.toFixed(1)}% / {Number(a.targetPercentage || 0).toFixed(1)}%</span>
                          <span className="font-mono font-semibold">{a.projectedDrift > 0 ? "+" : ""}{a.projectedDrift.toFixed(1)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-2">
                  <div className="min-w-0 text-[10px]">
                    <span className="font-medium text-slate-600">Buys {formatCompactMoney(buyTotal)}</span>
                    <span className="ml-2 font-medium text-slate-600">Sells {formatCompactMoney(sellTotal)}</span>
                    <span className={`ml-2 ${basketWithinCash ? "text-slate-500" : "font-semibold text-red-600"}`}>Cash after: {formatCompactMoney(cashAfterBasket)}</span>
                    {portfolioIsNew && (
                      <span className={`ml-2 ${basketSatisfiesTheme ? "text-emerald-700" : "text-amber-700"}`}>
                        {basketSatisfiesTheme ? "Theme allocation satisfied" : "Theme allocation needs adjustment"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={clearBasket} disabled={tradeSubmitting} className="rounded-md border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Clear</button>
                    <button type="submit" disabled={!basketCanSubmit} className="rounded-md bg-blue-800 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40">
                      {tradeSubmitting ? "Executing…" : portfolioIsNew ? "Validate & Activate" : "Execute orders"}
                    </button>
                  </div>
                </div>

                {tradeError && <p role="alert" className="shrink-0 px-3 py-1.5 text-[11px] text-red-700">{tradeError}</p>}
                {securitiesLoading && <p className="shrink-0 px-3 py-1.5 text-[10px] text-slate-500">Loading securities…</p>}
              </form>
            )}

            {/* ------------------ TAB: THEME COMPOSITION ------------------ */}
            {activeTab === "composition" && (
              <div role="tabpanel" id="panel-composition" aria-labelledby="tab-composition" className="flex min-h-0 flex-1 flex-col">
                <p className="shrink-0 border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">Theme target vs. invested, actual allocation and drift (±{DRIFT_BAND}%)</p>
                <div className="min-h-0 flex-1">
                  <AgGridReact
                    theme={gridTheme}
                    rowData={compositionRows}
                    columnDefs={compositionColumnDefs}
                    defaultColDef={defaultColDef}
                    getRowId={(p) => String(p.data.rowKey)}
                    suppressCellFocus
                    overlayNoRowsTemplate='<span class="text-xs text-slate-500">Theme composition is not available for this portfolio.</span>'
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
                <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Drift band ±{DRIFT_BAND} percentage points around the theme target
                  </span>
                  <span>{compositionRows.length} asset classes in theme</span>
                </div>
              </div>
            )}

            {/* ------------------ TAB: REBALANCE RECOMMENDATION ------------------ */}
            {activeTab === "rebalance" && (
              <div role="tabpanel" id="panel-rebalance" aria-labelledby="tab-rebalance" className="flex min-h-0 flex-1 flex-col">
                <p className="shrink-0 border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                  Suggested trades to bring every asset class back inside ±{DRIFT_BAND} points of its theme target, using live prices and whole units.
                </p>

                {portfolioIsNew ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                    <AlertTriangle size={28} className="text-amber-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">Portfolio not yet active</p>
                    <p className="mt-1 text-xs text-slate-400">Record the opening basket in the Buy or Sell holdings tab first; recommendations appear once positions exist.</p>
                  </div>
                ) : !rebalancePlan.summary.length ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                    <AlertTriangle size={28} className="text-amber-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">No theme targets available</p>
                    <p className="mt-1 text-xs text-slate-400">The allocation validation did not return any targets for this portfolio.</p>
                  </div>
                ) : (
                  <>
                    {/* Per-asset summary chips */}
                    <div className="shrink-0 border-b border-slate-100 px-3 py-2">
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">Current vs target by asset class</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rebalancePlan.summary.map((s) => (
                          <span
                            key={s.rowKey}
                            title={`Current ${s.currentPct.toFixed(2)}% · Target ${s.targetPct.toFixed(2)}%`}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] ${
                              s.action === "HOLD"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : s.action === "SELL"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-blue-200 bg-blue-50 text-blue-800"
                            }`}
                          >
                            <span className="font-semibold">{s.assetClass}</span>
                            <span className="font-mono">{s.currentPct.toFixed(1)}% → {s.targetPct.toFixed(1)}%</span>
                            <span className="font-mono font-semibold">{s.drift > 0 ? "+" : ""}{s.drift.toFixed(1)}</span>
                            <span className="font-bold uppercase tracking-wide">
                              {s.action === "HOLD" ? "Hold" : `${s.action === "SELL" ? "Sell" : "Buy"} ${formatCompactMoney(Math.abs(s.delta))}`}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Trade lines */}
                    <div className="min-h-0 flex-1">
                      {rebalanceNeeded ? (
                        <AgGridReact
                          theme={gridTheme}
                          rowData={rebalancePlan.lines}
                          columnDefs={rebalanceColumnDefs}
                          defaultColDef={defaultColDef}
                          getRowId={(p) => String(p.data.rowKey)}
                          suppressCellFocus
                          overlayNoRowsTemplate='<span class="text-xs text-slate-500">Drift detected, but no whole-unit trade can be made at current prices.</span>'
                          style={{ height: "100%", width: "100%" }}
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                          <CheckCircle2 size={28} className="text-emerald-600" />
                          <p className="mt-2 text-sm font-semibold text-slate-600">Portfolio is within mandate</p>
                          <p className="mt-1 text-xs text-slate-400">Every asset class is inside the ±{DRIFT_BAND} point band. No rebalancing trades are recommended.</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
                      <div className="min-w-0 text-[10px]">
                        <span className="font-medium text-slate-600">Sell proceeds {formatCompactMoney(rebalancePlan.sellProceeds)}</span>
                        <span className="ml-2 font-medium text-slate-600">Buy cost {formatCompactMoney(rebalancePlan.buyCost)}</span>
                        <span className={`ml-2 ${rebalancePlan.cashAfter >= -0.01 ? "text-slate-500" : "font-semibold text-red-600"}`}>
                          Cash after: {formatCompactMoney(rebalancePlan.cashAfter)}
                        </span>
                        <span className="ml-2 text-slate-400">{rebalanceActionLines.length} trade line{rebalanceActionLines.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate("/rebalancing", { state: { portfolioId } })}
                          className="rounded-md border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Open rebalancing tool
                        </button>
                        <button
                          type="button"
                          onClick={loadPlanIntoBasket}
                          disabled={!rebalanceActionLines.length || tradeSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-md bg-blue-800 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowLeftRight size={13} /> Load into Buy / Sell basket
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </main>
        )}
      </div>

      {/* TOAST */}
      {notice && (
        <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
};

/* ------------------------- presentational helpers ------------------------- */

function PageMessage({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#f6f8fd] p-5">{children}</div>;
}

function MetricCard({ title, value, caption, icon: Icon, positive }) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200/80 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <Icon size={14} className="shrink-0 text-blue-700" />
      </div>
      <p
        className={`mt-1 truncate text-lg font-bold tracking-tight ${positive === undefined ? "text-slate-900" : positive ? "text-emerald-700" : "text-red-600"}`}
        title={String(value)}
      >
        {value}
      </p>
      <p className="truncate text-[10px] text-slate-500">{caption}</p>
    </article>
  );
}

/* ------------------------- data helpers ------------------------- */

const isGold = (symbol) => String(symbol || "").toUpperCase() === "GOLD";

const holdingValue = (holding) =>
  Number(
    holding?.currentValue ??
      holding?.totalCost ??
      Number(holding?.averageCost || 0) * Number(holding?.quantity || 0)
  );

const holdingPrice = (holding) => {
  if (!holding) return 0;
  if (holding.currentPrice != null) return Number(holding.currentPrice);
  const qty = Number(holding.quantity || 0);
  return qty ? holdingValue(holding) / qty : 0;
};

const securityMatchesAllocation = (security, allocation) => {
  if (!security || !allocation) return false;

  const securityAssetId = Number(security?.asset?.id ?? security?.assetId ?? security?.asset?.assetId ?? 0);
  const allocationAssetId = Number(allocation.assetId ?? allocation.asset_id ?? 0);
  console.log("MATCH_DEBUG", {
    securityId: security?.id,
    securityName: security?.name,
    securityAssetId,
    allocationAssetId,
    allocationClass: allocation?.assetClass,
    securityAssetClass: security?.asset?.assetClass ?? security?.assetClass ?? security?.securityType,
    rawSecurity: security,
    rawAllocation: allocation,
  });
  return securityAssetId > 0 && allocationAssetId > 0 && securityAssetId === allocationAssetId;
};

const holdingMatchesAllocation = (holding, allocation) =>
  Boolean(holding) && (
    Number(holding.assetId ?? holding.asset?.id ?? 0) === Number(allocation.assetId ?? allocation.asset_id ?? 0)
  );

const holdingReturn = (holding) => {
  if (holding.returnPercentage != null) return Number(holding.returnPercentage) || 0;
  const cost = Number(holding.totalCost ?? Number(holding.averageCost || 0) * Number(holding.quantity || 0));
  const value = Number(holding.currentValue ?? cost);
  return cost > 0 ? ((value - cost) / cost) * 100 : 0;
};
const ASSET_CLASS_ALIASES = {
  BOND: "FIXED_INCOME",
  BONDS: "FIXED_INCOME",
  DEBT: "FIXED_INCOME",
  FIXED_INCOME: "FIXED_INCOME",
  FIXEDINCOME: "FIXED_INCOME",
  GOVERNMENT_BOND: "FIXED_INCOME",
  CORPORATE_BOND: "FIXED_INCOME",
  G_SEC: "FIXED_INCOME",
  GSEC: "FIXED_INCOME",
  NCD: "FIXED_INCOME",
  DEBENTURE: "FIXED_INCOME",
  TREASURY_BILL: "FIXED_INCOME",
  T_BILL: "FIXED_INCOME",
  STOCK: "EQUITY",
  STOCKS: "EQUITY",
  SHARE: "EQUITY",
  EQUITY: "EQUITY",
  COMMODITY: "COMMODITIES",
  COMMODITIES: "COMMODITIES",
  GOLD: "COMMODITIES",
};

const normalizeAssetClass = (assetClass) => {
  console.log(assetClass);  
  const key = String(assetClass || "OTHER")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  
  console.log("Asset Class: "+assetClass+" Normalized: "+key+" Mapped: "+ASSET_CLASS_ALIASES[key]);
  return ASSET_CLASS_ALIASES[key] || key;
};

const formatLabel = (value) => String(value ?? "—").replaceAll("_", " ");

const formatMoney = (value) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompactMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return formatMoney(amount);
};

let nextOrderId = 0;
const newOrder = () => ({
  rowId: `order-${++nextOrderId}`,
  side: "BUY",
  securityId: "",
  holdingId: "",
  allocationValue: "",
  quantity: "",
});

export default PortfolioDetailsPage;
