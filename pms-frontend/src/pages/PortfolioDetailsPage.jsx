import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Download, Filter, LineChart,
  RefreshCw, TrendingUp, WalletCards, Wallet, PieChart, Table2, ArrowLeftRight, Scale, History, X,
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
  activatePortfolio,
  getPortfolioTransactions,
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
  { key: "transactions", label: "Transactions", icon: History },
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
  const [transactions, setTransactions] = useState([]);
  const [validation, setValidation] = useState(null);
  const [themeAllocation, setThemeAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [holdingsError, setHoldingsError] = useState("");
  const [transactionsError, setTransactionsError] = useState("");
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || "holdings");

  const [securities, setSecurities] = useState([]);
  const [securitiesLoading, setSecuritiesLoading] = useState(true);
  const [orders, setOrders] = useState([newOrder()]);
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [activationSubmitting, setActivationSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [notice, setNotice] = useState("");
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [driftCheckRunning, setDriftCheckRunning] = useState(false);
  const [searchTexts, setSearchTexts] = useState({});

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
    }
  }, [location.state?.initialTab]);

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
      getPortfolioTransactions(id),
    ])
      .then((results) => {
        if (!active) return;
        const [basicResult, holdingsResult, validationResult, themeResult, transactionsResult] = results;
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
        setTransactions(transactionsResult.status === "fulfilled" && Array.isArray(transactionsResult.value) ? transactionsResult.value : []);
        setTransactionsError(transactionsResult.status === "rejected" ? "Transaction history could not be loaded." : "");
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
  const realizedPnl = sumRealizedPnl(transactions);
  // Holdings cost + cash rises by realized gains (and falls by realized
  // losses) after a sale. Remove that realized P/L to retain the original
  // contributed-capital basis for total portfolio performance.
  const invested = holdingsInvested + cashBalance - realizedPnl;
  const currentValue = holdings.reduce((sum, holding) => sum + holdingValue(holding), 0) + cashBalance;
  const pnl = currentValue - invested;
  const returnPercentage = invested ? (pnl / invested) * 100 : 0;
  const portfolioId = portfolio?.portfolioId ?? id;
  const portfolioIsNew = String(portfolio?.portfolioStatus || "").toUpperCase() === "NEW";
  const portfolioUsesWeights = String(portfolio?.portfolioType || "").toUpperCase() === "WEIGHTAGE";
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

  const transactionColumnDefs = useMemo(() => [
    { headerName: "Transaction ID", field: "transactionId", width: 125, sort: "desc", valueFormatter: (p) => p.value == null ? "—" : `TX-${p.value}`, cellClass: "font-mono text-[10px] text-slate-500" },
    { headerName: "Date / time", field: "executedAt", width: 170, valueFormatter: (p) => formatTransactionDate(p.value), cellClass: "font-mono text-[10px] text-slate-600" },
    { headerName: "Side", field: "side", width: 90, cellClass: (p) => `text-[10px] font-bold uppercase ${p.value === "BUY" ? "text-emerald-700" : "text-red-700"}` },
    { headerName: "Security", field: "securityName", flex: 1.5, minWidth: 155, tooltipField: "securityName", cellClass: "font-medium text-slate-800" },
    { headerName: "Symbol", field: "symbol", width: 90, cellClass: "font-mono text-[10px] text-slate-500" },
    { headerName: "Asset class", field: "assetClass", width: 120, valueFormatter: (p) => formatLabel(p.value), cellClass: "text-[10px] text-slate-600" },
    numericCol({ headerName: "Quantity", field: "quantity", width: 100, cellClass: "font-mono font-semibold text-slate-700", valueFormatter: (p) => p.value == null ? "—" : `${Number(p.value).toLocaleString("en-IN")}${isGold(p.data?.symbol) ? " g" : ""}` }),
    numericCol({ headerName: "Execution price", field: "executionPrice", width: 135, valueFormatter: (p) => p.value == null ? "—" : formatMoney(p.value), cellClass: "font-mono text-slate-600" }),
    numericCol({ headerName: "Total value", field: "totalAmount", width: 135, valueFormatter: (p) => p.value == null ? "—" : formatMoney(p.value), cellStyle: { ...RIGHT_CELL, color: "#1e3a8a" }, cellClass: "font-mono font-semibold" }),
    numericCol({ headerName: "Realized P/L", field: "realizedPnl", headerTooltip: "Sell execution value minus the sold shares' average cost basis.", width: 135, valueFormatter: (p) => p.data?.side !== "SELL" || p.value == null ? "—" : `${Number(p.value) >= 0 ? "+" : "−"}${formatMoney(Math.abs(Number(p.value)))}`, cellClass: (p) => `font-mono font-semibold ${p.data?.side !== "SELL" || p.value == null ? "text-slate-300" : Number(p.value) >= 0 ? "text-emerald-700" : "text-red-600"}` }),
    numericCol({ headerName: "Cash after", field: "cashBalanceAfter", width: 135, valueFormatter: (p) => p.value == null ? "—" : formatMoney(p.value), cellClass: "font-mono text-slate-700" }),
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

  const eligibleSecurities = securities.filter((s) => {
    const hasPrice = Number.isFinite(Number(s?.price)) && Number(s?.price) > 0;
    return hasPrice;
  });
  const sellableHoldings = holdings.filter((h) => h.holdingId != null && Number(h.quantity) > 0);

  // The grid keeps a blank trailing row ready for another order. Exclude that
  // untouched row from validation and totals so it cannot disable submission.
  const enteredOrders = orders.filter((order) =>
    Boolean(order.securityId || order.holdingId || String(order.quantity).trim())
  );
  const basketItems = enteredOrders.map((order) => {
    if (order.side === "SELL") {
      const holding = sellableHoldings.find((h) => String(h.holdingId) === String(order.holdingId));
      const quantity = Number(order.quantity);
      const held = Number(holding?.quantity || 0);
      const valid = Boolean(holding) && Number.isInteger(quantity) && quantity > 0 && quantity <= held;
      const price = holding ? holdingTradePrice(holding) : 0;
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
    const rawPrice = Number(security?.price || 0);
    const price = normalizeGoldPriceForPortfolioUnit(
      rawPrice,
      security?.symbol,
      security?.quotation || security?.commoditySpotData?.quotation || ""
    );

    if (portfolioIsNew) {
      const inputValue = Number(order.allocationValue);
      const qtyFromValue = Number.isFinite(inputValue) && inputValue > 0 && price > 0
        ? (portfolioUsesWeights
            ? Math.floor((cashBalance * inputValue / 100) / price)
            : Math.floor(inputValue / price))
        : 0;
      const quantity = Number.isFinite(Number(order.quantity)) && Number(order.quantity) > 0
        ? Number(order.quantity)
        : qtyFromValue;
      const validQuantity = Number.isInteger(quantity) && quantity > 0;
      const valid = Boolean(security) && validQuantity && price > 0 && (
        portfolioUsesWeights
          ? inputValue > 0 && inputValue <= 100
          : inputValue > 0
      );
      const resolvedAmount = valid ? price * quantity : 0;
      return {
        ...order,
        holding: null,
        security,
        label: security?.name || "",
        symbol: security?.symbol || "",
        quantity,
        price,
        valid,
        amount: resolvedAmount,
      };
    }

    const quantity = Number(order.quantity);
    const validQuantity = Number.isInteger(quantity) && quantity > 0;
    const valid = Boolean(security) && validQuantity && price > 0;
    const resolvedAmount = price * quantity;
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
  const basketRowsValid = enteredOrders.length > 0 && basketItems.every((i) => i.valid);
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
  const basketCanSubmit = basketRowsValid && (buyTotal > 0 || sellTotal > 0) && basketWithinCash && !tradeSubmitting;

  const isOrderComplete = (order) => {
    if (!order) return false;
    if (order.side === "SELL") {
      return Boolean(order.holdingId) && Number(order.quantity) > 0;
    }
    if (portfolioIsNew) {
      return Boolean(order.securityId) && (
        Number(order.quantity) > 0 || Number(order.allocationValue) > 0
      );
    }
    return Boolean(order.securityId) && Number(order.quantity) > 0;
  };

  const syncNewPortfolioInputs = (order, patch) => {
    if (!portfolioIsNew || order.side !== "BUY") {
      return { ...order, ...patch };
    }

    const nextOrder = { ...order, ...patch };
    const security = eligibleSecurities.find((item) => String(item.id) === String(nextOrder.securityId));
    const price = Number(security?.price || 0);
    const normalizedPrice = price > 0
      ? normalizeGoldPriceForPortfolioUnit(
          price,
          security?.symbol,
          security?.quotation || security?.commoditySpotData?.quotation || ""
        )
      : 0;

    if (patch.quantity !== undefined && patch.quantity !== "") {
      const qty = Number(patch.quantity);
      if (Number.isFinite(qty) && qty >= 0 && normalizedPrice > 0) {
        const value = qty * normalizedPrice;
        nextOrder.allocationValue = portfolioUsesWeights
          ? Number(((value / Math.max(Number(portfolio?.amount || 0), 1)) * 100).toFixed(4))
          : Number(value.toFixed(2));
      } else {
        nextOrder.allocationValue = "";
      }
      return nextOrder;
    }

    if (patch.allocationValue !== undefined) {
      const rawValue = Number(patch.allocationValue);
      if (Number.isFinite(rawValue) && rawValue >= 0 && normalizedPrice > 0) {
        const resolvedAmount = portfolioUsesWeights
          ? (Number(portfolio?.amount || 0) * rawValue) / 100
          : rawValue;
        const derivedQty = resolvedAmount > 0 ? Math.floor(resolvedAmount / normalizedPrice) : 0;
        nextOrder.quantity = derivedQty > 0 ? String(derivedQty) : "";
      } else if (rawValue <= 0 || !Number.isFinite(rawValue)) {
        nextOrder.quantity = "";
      }
      return nextOrder;
    }

    return nextOrder;
  };

  useEffect(() => {
    setOrders((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (isOrderComplete(last)) {
        return [...prev, newOrder()];
      }
      return prev;
    });
  }, [orders]);

  const updateOrder = (rowId, patch) => {
    setOrders((prev) => prev.map((o) => (o.rowId === rowId ? syncNewPortfolioInputs(o, patch) : o)));
    setTradeError("");
  };
  const addOrderRow = () => setOrders((prev) => [...prev, newOrder()]);
  const removeOrderRow = (rowId) => setOrders((prev) => prev.filter((o) => o.rowId !== rowId));
  const clearBasket = () => { setOrders([newOrder()]); setTradeError(""); };

  const refreshPortfolioData = async () => {
    const [freshPortfolio, freshHoldings, freshValidation, freshTheme, freshTransactions] = await Promise.all([
      getPortfolioBasicInfo(portfolioId),
      getPortfolioHoldings(portfolioId),
      validatePortfolioAllocation(portfolioId),
      getThemeAllocation(portfolioId).catch(() => null),
      getPortfolioTransactions(portfolioId).catch(() => null),
    ]);
    setPortfolio(freshPortfolio);
    setHoldings(Array.isArray(freshHoldings) ? freshHoldings : []);
    setValidation(freshValidation);
    setThemeAllocation(freshTheme);
    if (Array.isArray(freshTransactions)) {
      setTransactions(freshTransactions);
      setTransactionsError("");
    } else {
      setTransactionsError("Transaction history could not be refreshed.");
    }
  };

  const activateCurrentPortfolio = async () => {
    if (!portfolioIsNew || activationSubmitting) return;
    setTradeError("");
    setActivationSubmitting(true);
    try {
      const result = await activatePortfolio(portfolioId);
      if (result?.success === false) throw new Error(result.message || "Portfolio activation failed.");
      await refreshPortfolioData();
      setNotice(result?.message || "Portfolio activated successfully.");
      toast.success(result?.message || "Portfolio activated successfully.");
    } catch (failure) {
      const message = failure?.response?.data?.message || failure?.message || "Portfolio activation failed.";
      setTradeError(message);
      toast.error(message);
    } finally {
      setActivationSubmitting(false);
    }
  };

  const submitTrades = async (event) => {
    event.preventDefault();
    setTradeError("");
    if (!basketRowsValid) {
      setTradeError("Enter a positive whole-unit quantity for every buy or sell line. Sell quantities cannot exceed the amount held.");
      return;
    }
    if (!basketWithinCash) {
      setTradeError("Buy cost exceeds available cash plus sell proceeds.");
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
            const price = holdingTradePrice(h);
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

      const existing = assetHoldings.filter((h) => h.securityId != null && holdingTradePrice(h) > 0);
      const candidates = existing.length
        ? existing.map((h) => ({
            securityId: h.securityId,
            name: h.securityName,
            symbol: h.symbol,
            price: holdingTradePrice(h),
            weight: currentAssetValue > 0 ? holdingValue(h) / currentAssetValue : 1 / existing.length,
          }))
        : eligibleSecurities
            .filter((s) => securityMatchesAllocation(s, allocation))
            .slice(0, 3)
            .map((s, _, arr) => ({
              securityId: s.id,
              name: s.name,
              symbol: s.symbol || s.isin,
              price: normalizeGoldPriceForPortfolioUnit(Number(s.price) || 0, s.symbol, s.quotation || s.commoditySpotData?.quotation || ""),
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
            quantity: String(line.quantity),
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
    transactions: transactions.length,
    trade: basketValidCount,
    composition: compositionRows.length,
    rebalance: rebalanceActionLines.length,
  };
  const tradeTableColumns = portfolioIsNew
    ? [["Side", "11%"], ["Security / holding", "29%"], ["Allocation", "16%"], ["Qty", "10%"], ["Price", "12%"], ["Est. value", "13%"], ["Actions", "9%"]]
    : [["Side", "11%"], ["Security / holding", "33%"], ["Quantity", "14%"], ["Price", "13%"], ["Est. value", "16%"], ["Actions", "13%"]];

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
              {portfolioIsNew && (
                <button onClick={activateCurrentPortfolio} disabled={activationSubmitting} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-wait disabled:opacity-50">
                  <CheckCircle2 size={14} /> {activationSubmitting ? "Validating…" : "Activate Portfolio"}
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
            <MetricCard title="Invested" value={formatMoney(invested)} caption="Net contributed capital" icon={LineChart} />
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
                    Trade input <strong className="font-semibold text-slate-700">Quantity</strong>
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

            {/* ------------------ TAB: TRANSACTION HISTORY ------------------ */}
            {activeTab === "transactions" && (
              <div role="tabpanel" id="panel-transactions" aria-labelledby="tab-transactions" className="flex min-h-0 flex-1 flex-col">
                <p className="shrink-0 border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                  Executed portfolio trades, ordered newest first. Historical activity starts being recorded when transaction logging is enabled.
                </p>
                {transactionsError ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                    <AlertTriangle size={26} className="text-amber-500" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">Transaction history unavailable</p>
                    <p className="mt-1 text-xs text-slate-400">{transactionsError}</p>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1">
                    <AgGridReact
                      theme={gridTheme}
                      rowData={transactions}
                      columnDefs={transactionColumnDefs}
                      defaultColDef={defaultColDef}
                      getRowId={(params) => String(params.data.transactionId)}
                      suppressCellFocus
                      animateRows
                      overlayNoRowsTemplate='<span class="text-xs text-slate-500">No buy or sell transactions have been recorded for this portfolio.</span>'
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                )}
                <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                  <span>Execution price × quantity · cash balance captured after each trade</span>
                  <span>{transactions.length} transaction{transactions.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            )}

            {/* ------------------ TAB: BUY OR SELL ------------------ */}
            {activeTab === "trade" && (
              <form role="tabpanel" id="panel-trade" aria-labelledby="tab-trade" onSubmit={submitTrades} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <p className="shrink-0 border-b border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
                  {portfolioIsNew
                    ? "Buy or sell opening holdings in one or more batches. Theme rules are checked only when you activate the portfolio."
                    : "Choose Buy or Sell per line. Sells execute first, then buys, so sale proceeds can fund purchases in the same basket."}
                </p>

                <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-[10px]">
                    <thead className="sticky top-0 z-[1] bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        {tradeTableColumns.map(([label, width]) => (
                          <th key={label} style={{ width }} className="px-1.5 py-1.5">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order, index) => {
                        const item = basketItems.find((c) => c.rowId === order.rowId);
                        const isSell = order.side === "SELL";
                        const usedSecurities = new Set(orders.filter((o) => o.rowId !== order.rowId && o.side === "BUY").map((o) => String(o.securityId)));
                        const usedHoldings = new Set(orders.filter((o) => o.rowId !== order.rowId && o.side === "SELL").map((o) => String(o.holdingId)));
                        const selectableSecurities = eligibleSecurities;
                        const selectableHoldings = sellableHoldings.filter((h) => !usedHoldings.has(String(h.holdingId)) || String(h.holdingId) === String(order.holdingId));
                        const held = Number(item?.holding?.quantity || 0);
                        const showAddButton =
                          index === orders.length - 1 &&
                          !isOrderComplete(order) &&
                          ((isSell && Boolean(order.holdingId)) || (!isSell && Boolean(order.securityId)));
                        return (
                          <tr key={order.rowId} className={isSell ? "bg-red-50/40" : "bg-amber-50/40"}>
                            <td className="px-1.5 py-1">
                              <select
                                aria-label="Order side"
                                value={order.side}
                                disabled={tradeSubmitting}
                                onChange={(e) => updateOrder(order.rowId, { side: e.target.value, securityId: "", holdingId: "", quantity: "", allocationValue: "" })}
                                className={`h-7 w-full rounded border bg-white px-1.5 text-[10px] font-semibold outline-none focus:border-blue-500 ${isSell ? "border-red-200 text-red-700" : "border-slate-200 text-emerald-700"}`}
                              >
                                <option value="BUY">Buy</option>
                                <option value="SELL" disabled={!sellableHoldings.length}>Sell</option>
                              </select>
                            </td>
                            <td className="px-1.5 py-1">
                              {isSell ? (
                                <div className="relative">
                                  <input
                                    aria-label="Holding to sell"
                                    value={
                                      searchTexts[order.rowId] ?? selectableHoldings.find((h) => String(h.holdingId) === String(order.holdingId))?.securityName ?? ""
                                    }
                                    disabled={tradeSubmitting}
                                    onChange={(e) => setSearchTexts((p) => ({ ...p, [order.rowId]: e.target.value }))}
                                    onFocus={() => setSearchTexts((p) => ({ ...p }))}
                                    placeholder="Type holding name…"
                                    className="h-7 w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 text-[10px] outline-none focus:border-blue-500"
                                  />
                                  {searchTexts[order.rowId] && (
                                    <ul className="absolute left-0 right-0 z-20 max-h-40 overflow-auto rounded border bg-white text-[10px]">
                                      {selectableHoldings
                                        .filter((h) => {
                                          const q = (searchTexts[order.rowId] || "").toLowerCase();
                                          return (
                                            h.securityName.toLowerCase().includes(q) || (h.symbol || "").toLowerCase().includes(q)
                                          );
                                        })
                                        .map((h) => (
                                          <li
                                            key={h.holdingId}
                                            onMouseDown={(ev) => {
                                              ev.preventDefault();
                                              updateOrder(order.rowId, { holdingId: h.holdingId, quantity: "" });
                                              setSearchTexts((p) => { const np = { ...p }; delete np[order.rowId]; return np; });
                                            }}
                                            className="cursor-pointer px-2 py-1 hover:bg-slate-50"
                                          >
                                            {h.securityName} ({h.symbol || "—"}) · held {Number(h.quantity).toLocaleString("en-IN")}{isGold(h.symbol) ? " g" : ""}
                                          </li>
                                        ))}
                                    </ul>
                                  )}
                                </div>
                              ) : (
                                <div className="relative">
                                  <input
                                    aria-label="Security to buy"
                                    value={
                                      searchTexts[order.rowId] ?? selectableSecurities.find((s) => String(s.id) === String(order.securityId))?.name ?? ""
                                    }
                                    disabled={tradeSubmitting}
                                    onChange={(e) => setSearchTexts((p) => ({ ...p, [order.rowId]: e.target.value }))}
                                    placeholder="Type security name…"
                                    className="h-7 w-full min-w-0 rounded border border-slate-200 bg-white px-1.5 text-[10px] outline-none focus:border-blue-500"
                                  />
                                  {searchTexts[order.rowId] && (
                                    <ul className="absolute left-0 right-0 z-20 max-h-56 overflow-auto rounded border bg-white text-[10px]">
                                      {selectableSecurities
                                        .filter((s) => {
                                          const q = (searchTexts[order.rowId] || "").toLowerCase();
                                          return (
                                            s.name.toLowerCase().includes(q) || (s.symbol || "").toLowerCase().includes(q) || (s.isin || "").toLowerCase().includes(q)
                                          );
                                        })
                                        .slice(0, 100)
                                        .map((s) => (
                                          <li
                                            key={s.id}
                                            onMouseDown={(ev) => {
                                              ev.preventDefault();
                                              updateOrder(order.rowId, { securityId: s.id, quantity: "", allocationValue: "" });
                                              setSearchTexts((p) => { const np = { ...p }; delete np[order.rowId]; return np; });
                                            }}
                                            className="cursor-pointer px-2 py-1 hover:bg-slate-50"
                                          >
                                            {s.name} ({s.symbol || s.isin || "—"})
                                          </li>
                                        ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </td>
                            {portfolioIsNew && (
                              <td className="px-1 py-1">
                                <input
                                  aria-label={portfolioUsesWeights ? "Allocation percentage" : "Amount to buy"}
                                  type="number"
                                  min="0"
                                  max={portfolioUsesWeights ? 100 : undefined}
                                  step="any"
                                  value={order.allocationValue}
                                  disabled={tradeSubmitting || isSell}
                                  onChange={(e) => updateOrder(order.rowId, { allocationValue: e.target.value })}
                                  placeholder={portfolioUsesWeights ? "%" : "₹"}
                                  className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-right font-mono text-[10px] outline-none focus:border-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                            )}
                            <td className="px-1 py-1">
                              <input
                                aria-label={isSell ? "Quantity to sell" : "Quantity to buy"}
                                type="number"
                                min="1"
                                max={isSell ? held || undefined : undefined}
                                step="1"
                                value={order.quantity}
                                disabled={tradeSubmitting || (isSell && !order.holdingId)}
                                onChange={(e) => updateOrder(order.rowId, { quantity: e.target.value })}
                                placeholder={isSell && held ? `≤ ${held}` : "Qty"}
                                className={`h-7 w-full rounded border bg-white px-1.5 text-right font-mono text-[10px] outline-none disabled:bg-slate-50 ${isSell ? "border-red-200 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`}
                              />
                            </td>
                            <td className="px-1.5 py-1 text-right font-mono text-[10px]">
                              {item?.price ? formatCompactMoney(item.price) : "—"}
                            </td>
                            <td className={`px-1.5 py-1 text-right font-mono text-[10px] font-semibold ${isSell ? "text-emerald-700" : "text-slate-800"}`}>
                              {item?.valid ? `${isSell ? "+" : "−"}${formatCompactMoney(item.amount)}` : "—"}
                            </td>
                            <td className="whitespace-nowrap px-1 py-1 text-right">
                              {showAddButton && (
                                <button type="button" onClick={addOrderRow} disabled={tradeSubmitting} className="rounded bg-blue-800 px-1.5 py-1 text-[9px] font-semibold text-white disabled:opacity-40">Add</button>
                              )}
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
                    {portfolioIsNew && <span className="ml-2 text-amber-700">Theme validation runs at activation</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={clearBasket} disabled={tradeSubmitting} className="rounded-md border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Clear</button>
                    <button type="submit" disabled={!basketCanSubmit} className="rounded-md bg-blue-800 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40">
                      {tradeSubmitting ? "Adding…" : portfolioIsNew ? "Add Holdings" : "Execute orders"}
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
        <div role="status" className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-lg bg-emerald-700 px-4 py-3 pr-2 text-sm font-medium text-white shadow-lg">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Close notification"
            onClick={() => setNotice("")}
            className="rounded p-1 transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-white/80"
          >
            <X size={15} />
          </button>
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

const normalizeGoldPriceForPortfolioUnit = (value, symbol, quotation = "") => {
  console.log("Quotation "+quotation);
  console.log("Value "+value)
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  if (!isGold(symbol)) return numericValue;

  const quoteText = String(quotation || "").toUpperCase();
  if (/(KG|KILOGRAM)/.test(quoteText)) return numericValue / 100;

  const gramsMatch = quoteText.match(/(\d+(?:\.\d+)?)\s*(?:G|GM|GRAMS?)\b/);
  if (gramsMatch) {
    const gramsPerQuote = Number(gramsMatch[1]);
    return Number.isFinite(gramsPerQuote) && gramsPerQuote > 0 ? numericValue / gramsPerQuote : numericValue;
  }

  if (/GRAM/.test(quoteText) || /\bG\b/.test(quoteText)) return numericValue;

  return numericValue / 10;
};

const holdingValue = (holding) =>
  Number(
    holding?.currentValue ??
      holding?.totalCost ??
      Number(holding?.averageCost || 0) * Number(holding?.quantity || 0)
  );

const sumRealizedPnl = (transactions) =>
  Array.isArray(transactions)
    ? transactions.reduce(
        (total, transaction) =>
          total +
          (String(transaction?.side || "").toUpperCase() === "SELL"
            ? Number(transaction?.realizedPnl || 0)
            : 0),
        0
      )
    : 0;

const holdingPrice = (holding) => {
  if (!holding) return 0;
  const rawPrice = holding.currentPrice != null
    ? Number(holding.currentPrice)
    : (() => {
        const qty = Number(holding.quantity || 0);
        return qty ? holdingValue(holding) / qty : 0;
      })();

  return normalizeGoldPriceForPortfolioUnit(
    rawPrice,
    holding?.symbol,
    holding?.quotation || holding?.commoditySpotData?.quotation || ""
  );
};

const holdingTradePrice = (holding) => {
  if (!holding) return 0;
  const rawPrice = String(holding?.securityType || "").toUpperCase() === "BOND"
    ? Number(holding?.bondReturnPrice?.tradePrice || holding?.averageCost || 0)
    : holdingPrice(holding);

  return normalizeGoldPriceForPortfolioUnit(
    rawPrice,
    holding?.symbol,
    holding?.quotation || holding?.commoditySpotData?.quotation || ""
  );
};

const formatTransactionDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
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
  quantity: "",
  allocationValue: "",
});

export default PortfolioDetailsPage;
