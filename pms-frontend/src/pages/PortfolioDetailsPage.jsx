import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, AlertTriangle, CalendarDays,
  CheckCircle2, Clock3, Download, Filter, LineChart, Plus, RefreshCw,
  SlidersHorizontal, TrendingUp, WalletCards, Trash2,
} from "lucide-react";
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
  const [sortDirection, setSortDirection] = useState(null);
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [securities, setSecurities] = useState([]);
  const [buyOrders, setBuyOrders] = useState([newBuyOrder()]);
  const [addLoading, setAddLoading] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addNotice, setAddNotice] = useState("");

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
        const basicInfo = basicResult.status === "fulfilled" ? basicResult.value : location.state?.portfolio;
        if (!basicInfo) throw basicResult.reason || new Error("Could not load this portfolio.");
        setPortfolio(basicInfo);
        setHoldings(holdingsResult.status === "fulfilled" && Array.isArray(holdingsResult.value) ? holdingsResult.value : []);
        setHoldingsError(holdingsResult.status === "rejected" ? "Holdings could not be loaded. Check that you are signed in and try again." : "");
        setValidation(validationResult.status === "fulfilled" ? validationResult.value : null);
        setThemeAllocation(themeResult.status === "fulfilled" ? themeResult.value : null);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.response?.data?.message || loadError.message || "Could not load this portfolio.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const cashBalance = Number(portfolio?.amount || 0);
  const holdingsInvested = Number(validation?.totalInvestedAmount ?? holdings.reduce((sum, holding) => sum + Number(holding.totalCost || 0), 0));
  // The backend current AUM includes uninvested cash, while its validation
  // invested amount is securities-only. Include cash on both sides of return.
  const invested = holdingsInvested + cashBalance;
  const currentValue = Number(validation?.totalCurrentValue ?? holdings.reduce((sum, holding) => sum + Number(holding.currentValue ?? holding.totalCost ?? 0), 0) + cashBalance);
  const pnl = currentValue - invested;
  const returnPercentage = invested ? (pnl / invested) * 100 : 0;
  const assetClasses = useMemo(() => [...new Set(holdings.map((holding) => normalizeAssetClass(holding.assetClass)))], [holdings]);
  const visibleHoldings = useMemo(() => {
    const filtered = holdings.filter((holding) => assetFilter === "ALL" || normalizeAssetClass(holding.assetClass) === assetFilter);
    if (!sortDirection) return filtered;
    return [...filtered].sort((a, b) =>
      sortDirection === "asc" ? holdingReturn(a) - holdingReturn(b) : holdingReturn(b) - holdingReturn(a));
  }, [holdings, assetFilter, sortDirection]);
  const portfolioId = portfolio?.portfolioId ?? id;
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
      setAddError(loadError?.response?.data?.message || loadError?.message || "Could not load securities for this portfolio.");
    } finally {
      setAddLoading(false);
    }
  };
  const themeAllocations = (validation?.allocations || []).filter((allocation) => Number(allocation.targetPercentage) > 0);
  const eligibleSecurities = securities.filter((security) => Number(security.price) > 0 &&
    themeAllocations.some((allocation) => Number(allocation.assetId) === Number(security.asset?.id)));
  const basketItems = buyOrders.map((order) => {
    const security = eligibleSecurities.find((item) => String(item.id) === String(order.securityId));
    const quantity = Number(order.quantity);
    const validQuantity = Number.isInteger(quantity) && quantity > 0;
    return { ...order, security, quantity, validQuantity, amount: security && validQuantity ? Number(security.price) * quantity : 0 };
  });
  const basketTotal = basketItems.reduce((sum, item) => sum + item.amount, 0);
  const basketRowsValid = basketItems.length > 0 && basketItems.every((item) => item.security && item.validQuantity);
  const projectedAllocations = (validation?.allocations || []).map((allocation) => {
    const currentAssetCost = holdings.reduce((sum, holding) => sum + (
      Number(holding.assetId) === Number(allocation.assetId)
        ? Number(holding.totalCost ?? (Number(holding.averageCost || 0) * Number(holding.quantity || 0)))
        : 0
    ), 0);
    const basketAssetCost = basketItems.reduce((sum, item) => sum + (
      Number(item.security?.asset?.id) === Number(allocation.assetId) ? item.amount : 0
    ), 0);
    const totalAfter = holdingsInvested + basketTotal;
    const projected = totalAfter > 0 ? Math.round(((currentAssetCost + basketAssetCost) / totalAfter) * 10000) / 100 : 0;
    const drift = Math.round((projected - Number(allocation.targetPercentage || 0)) * 100) / 100;
    return { ...allocation, projectedPercentage: projected, projectedDrift: drift, satisfiedAfterBuy: Math.abs(drift) < 5 };
  });
  const basketSatisfiesTheme = projectedAllocations.length > 0 && projectedAllocations.every((allocation) => allocation.satisfiedAfterBuy);
  const basketWithinCash = basketTotal <= cashBalance + 0.01;
  const basketCanSubmit = basketRowsValid && basketTotal > 0 && basketWithinCash && basketSatisfiesTheme && !addSubmitting;

  const updateBuyOrder = (rowId, field, value) => {
    setBuyOrders((previous) => previous.map((order) => order.rowId === rowId ? { ...order, [field]: value } : order));
    setAddError("");
  };
  const addBuyOrder = () => setBuyOrders((previous) => [...previous, newBuyOrder()]);
  const removeBuyOrder = (rowId) => setBuyOrders((previous) => previous.filter((order) => order.rowId !== rowId));

  const submitAddSecurity = async (event) => {
    event.preventDefault();
    setAddError("");
    if (!basketRowsValid) { setAddError("Select a security and enter a positive whole-unit quantity for every row."); return; }
    if (!basketWithinCash) { setAddError("The total basket cost exceeds the portfolio's available cash."); return; }
    if (!basketSatisfiesTheme) { setAddError("Adjust the basket so every asset class is within 5 percentage points of its theme target."); return; }
    setAddSubmitting(true);
    try {
      const result = await buyPortfolioSecurities(basketItems.map((item) => ({
        portfolioId,
        securityId: item.security.id,
        quantity: item.quantity,
      })));
      if (result?.success === false) throw new Error(result.message || "The purchase was rejected.");
      const [freshPortfolio, freshHoldings, freshValidation, freshTheme] = await Promise.all([
        getPortfolioBasicInfo(portfolioId), getPortfolioHoldings(portfolioId),
        validatePortfolioAllocation(portfolioId), getThemeAllocation(portfolioId).catch(() => null),
      ]);
      setPortfolio(freshPortfolio);
      setHoldings(Array.isArray(freshHoldings) ? freshHoldings : []);
      setValidation(freshValidation);
      setThemeAllocation(freshTheme);
      setAddNotice(result?.message || `${basketItems.length} security purchase${basketItems.length === 1 ? "" : "s"} recorded. Cash and holdings have been updated.`);
      setAddOpen(false);
    } catch (failure) {
      setAddError(failure?.response?.data?.message || failure?.message || "Could not add this security.");
    } finally {
      setAddSubmitting(false);
    }
  };

  if (loading) return <PageMessage>Loading portfolio…</PageMessage>;
  if (error || !portfolio) return (
    <PageMessage>
      <div className="max-w-md rounded-xl border border-red-100 bg-white p-7 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 text-red-500" size={30} />
        <h2 className="text-lg font-semibold text-slate-900">Portfolio details unavailable</h2>
        <p className="mt-2 text-sm text-slate-500">{error || "The requested portfolio could not be found."}</p>
        <button onClick={() => navigate("/portfolio")} className="mt-5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white">Back to portfolios</button>
      </div>
    </PageMessage>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fd] text-slate-900">
      <SideBarComponent activePage="Portfolios" />
      <div className="ml-[257px] min-h-screen min-w-0 max-[760px]:ml-0">
        <TopBarComponent />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-7">
          <button onClick={() => navigate("/portfolio")} className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-800"><ArrowLeft size={15} /> Portfolios <span>›</span> <span className="text-slate-800">{portfolio.name}</span></button>

          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[34px]">{portfolio.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="green"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{formatLabel(portfolio.portfolioStatus || "ACTIVE")}</Badge>
                <Badge>EXCHANGE: {formatLabel(portfolio.exchange || "—")}</Badge>
                <Badge>TYPE: {formatLabel(portfolio.portfolioType || "—")}</Badge>
                <Badge>THEME: {portfolio.themeName || themeAllocation?.themeName || "—"}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={openAddSecurity} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50"><Plus size={16} /> Add Security</button>
              <button onClick={() => navigate("/rebalancing", { state: { portfolioId } })} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"><RefreshCw size={16} /> Rebalance Portfolio</button>
              <button aria-label="Portfolio settings" className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600"><SlidersHorizontal size={17} /></button>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Portfolio value" value={formatMoney(currentValue || portfolio.amount)} caption="Current mandate value" icon={WalletCards} />
            <MetricCard title="Invested amount" value={formatMoney(invested)} caption="Positions + available cash cost basis" icon={CalendarDays} />
            <MetricCard title="Total return" value={`${pnl >= 0 ? "+" : "−"}${Math.abs(returnPercentage).toFixed(2)}%`} caption={`${pnl >= 0 ? "+" : "−"}${formatMoney(Math.abs(pnl))} unrealized P&L`} icon={TrendingUp} positive={pnl >= 0} />
            <MetricCard title="Benchmark" value={formatLabel(portfolio.benchmark || "—")} caption={`Rebalance: ${formatLabel(portfolio.reBalancingFrequency || "—")}`} icon={LineChart} />
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-lg font-semibold">Portfolio overview</h2><p className="mt-1 text-xs text-slate-500">Mandate and portfolio allocation summary</p></div>
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-800">Portfolio ID · {portfolioId}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <OverviewItem label="Theme" value={portfolio.themeName || themeAllocation?.themeName || "—"} />
                <OverviewItem label="Risk profile" value={formatLabel(themeAllocation?.risk || "—")} />
                <OverviewItem label="Currency" value={portfolio.currency || "INR"} />
                <OverviewItem label="Frequency" value={formatLabel(portfolio.reBalancingFrequency || "—")} />
                <OverviewItem label="Created" value={portfolio.createdAt ? new Date(`${portfolio.createdAt}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
              </div>
              <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-600">Available cash</span><span className="font-mono font-semibold">{formatMoney(cashBalance)}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.max(0, Math.min(100, invested ? (currentValue / invested) * 50 : 0))}%` }} /></div>
                <p className="mt-2 text-[11px] text-slate-500">Return compares positions and remaining cash with the same cash-inclusive cost basis.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Allocation drift monitor</h2><p className="mt-1 text-xs text-slate-500">Current holdings compared with theme targets</p></div><span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800">THEME RULES</span></div>
              {validation?.allocations?.length ? <div className="mt-4 space-y-3">
                {validation.allocations.map((allocation) => <div key={`${allocation.assetId}-${allocation.assetClass}`}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="font-medium text-slate-700">{formatLabel(allocation.assetClass)}</span><span className="font-mono text-slate-600">{Number(allocation.currentPercentage || 0).toFixed(1)}% <span className="text-slate-400">/ {Number(allocation.targetPercentage || 0).toFixed(1)}%</span></span></div>
                  <div className="h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${allocation.satisfied ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.max(0, Math.min(100, Number(allocation.currentPercentage || 0)))}%` }} /></div>
                </div>)}
                <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-xs ${validation.valid ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                  {validation.valid ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
                  <span>{validation.valid ? "Current allocation satisfies the portfolio mandate." : "One or more asset allocations are outside the configured theme rules."}</span>
                </div>
              </div> : <div className="mt-5 flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-xs text-slate-500"><Clock3 size={16} /> Allocation drift data is not available for this portfolio.</div>}
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div><h2 className="text-xl font-semibold tracking-tight">Current Holdings &amp; Deployed Positions</h2><p className="mt-1 text-xs text-slate-500">Recorded buy cost, quantity and current holding values</p></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => downloadHoldings(visibleHoldings, portfolio.name)} className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-[10px] font-bold tracking-wide text-slate-700 hover:bg-blue-100"><Download size={13} /> EXPORT LEDGER</button>
                <label className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-[10px] font-bold tracking-wide text-slate-700"><Filter size={13} /><span className="sr-only">Filter holdings by asset class</span><select aria-label="Filter by asset class" value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)} className="cursor-pointer bg-transparent outline-none"><option value="ALL">ALL CLASSES</option>{assetClasses.map((assetClass) => <option key={assetClass} value={assetClass}>{formatLabel(assetClass).toUpperCase()}</option>)}</select></label>
              </div>
            </div>
            {holdingsError ? <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center"><AlertTriangle size={30} className="text-amber-500" /><p className="mt-3 text-sm font-semibold text-slate-600">Holdings unavailable</p><p className="mt-1 text-xs text-slate-400">{holdingsError}</p></div> : holdings.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center"><WalletCards size={32} className="text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">No current holdings</p><p className="mt-1 text-xs text-slate-400">Securities added to this portfolio will appear here.</p></div> : <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
                <thead className="bg-[#eef3ff] text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr>
                  <th className="px-3 py-3 pl-5">Security</th><th className="px-3 py-3">Symbol</th><th className="px-3 py-3">Asset class</th><th className="px-3 py-3 text-right">Quantity</th><th className="px-3 py-3 text-right">Avg. buy price</th><th className="px-3 py-3 text-right">Current price</th><th className="px-3 py-3 text-right">Invested value</th><th className="px-3 py-3 text-right">Current value</th><th className="px-3 py-3 text-right">P&amp;L</th>
                  <th className="px-3 py-3 pr-5 text-right"><button onClick={() => setSortDirection((current) => current === "asc" ? "desc" : "asc")} className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-slate-600 hover:text-blue-800" aria-label={`Sort by return percentage${sortDirection ? `, currently ${sortDirection === "asc" ? "ascending" : "descending"}` : ""}`}>Return % {sortDirection === "asc" ? <ArrowUp size={13} /> : sortDirection === "desc" ? <ArrowDown size={13} /> : <ArrowUpDown size={13} />}</button></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleHoldings.map((holding) => {
                    const cost = Number(holding.totalCost ?? (Number(holding.averageCost || 0) * Number(holding.quantity || 0)));
                    const value = Number(holding.currentValue ?? cost);
                    const holdingPnl = value - cost;
                    const holdingReturnPct = holdingReturn(holding);
                    const qty = Number(holding.quantity || 0);
                    const currentPrice = holding.currentPrice != null ? Number(holding.currentPrice) : (qty ? value / qty : 0);
                    return <tr key={holding.holdingId ?? holding.securityId} className="hover:bg-slate-50/70">
                      <td className="max-w-[220px] px-3 py-3.5 pl-5"><div className="truncate font-medium text-slate-800" title={holding.securityName}>{holding.securityName || "—"}</div></td>
                      <td className="px-3 py-3.5 font-mono text-[11px] text-slate-500">{holding.symbol || "—"}</td>
                      <td className="px-3 py-3.5"><span className="whitespace-nowrap rounded bg-blue-50 px-1.5 py-1 text-[9px] font-semibold uppercase text-slate-600">{formatLabel(holding.assetClass)}</span></td>
                      <td className="px-3 py-3.5 text-right font-mono">{qty.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-slate-600">{formatMoney(holding.averageCost)}</td>
                      <td className="px-3 py-3.5 text-right font-mono">{formatMoney(currentPrice)}</td>
                      <td className="px-3 py-3.5 text-right font-mono">{formatMoney(cost)}</td>
                      <td className="px-3 py-3.5 text-right font-mono">{formatMoney(value)}</td>
                      <td className={`px-3 py-3.5 text-right font-mono font-semibold ${holdingPnl >= 0 ? "text-emerald-700" : "text-red-600"}`}>{holdingPnl >= 0 ? "+" : "−"}{formatMoney(Math.abs(holdingPnl))}</td>
                      <td className={`px-3 py-3.5 pr-5 text-right font-mono font-semibold ${holdingReturnPct >= 0 ? "text-emerald-700" : "text-red-600"}`}>{holdingReturnPct >= 0 ? "+" : ""}{holdingReturnPct.toFixed(2)}%</td>
                    </tr>;
                  })}
                </tbody>
                <tfoot className="bg-[#eef3ff] text-[11px] font-semibold text-slate-700"><tr><td className="px-3 py-3 pl-5" colSpan={6}>Portfolio total (positions + cash)</td><td className="px-3 py-3 text-right font-mono">{formatMoney(invested)}</td><td className="px-3 py-3 text-right font-mono">{formatMoney(currentValue)}</td><td className={`px-3 py-3 text-right font-mono ${pnl >= 0 ? "text-emerald-700" : "text-red-600"}`}>{pnl >= 0 ? "+" : "−"}{formatMoney(Math.abs(pnl))}</td><td className={`px-3 py-3 pr-5 text-right font-mono ${returnPercentage >= 0 ? "text-emerald-700" : "text-red-600"}`}>{returnPercentage >= 0 ? "+" : ""}{returnPercentage.toFixed(2)}%</td></tr></tfoot>
              </table>
            </div>}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Cost basis uses recorded holding average cost and quantity.</span><span>{visibleHoldings.length} of {holdings.length} holdings</span></div>
          </section>
          {addNotice && <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg">{addNotice}</div>}
          {addOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !addSubmitting) setAddOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="add-security-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><h2 id="add-security-title" className="text-lg font-bold">Build a purchase basket</h2><p className="mt-1 max-w-2xl text-xs text-slate-500">Add several securities at once. We validate the combined quantities against available cash and every theme allocation before recording any purchase.</p></div><button onClick={() => setAddOpen(false)} disabled={addSubmitting} aria-label="Close" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40">×</button></div>
              {addLoading ? <div className="p-10 text-center text-sm text-slate-500">Loading prices and theme capacity…</div> : <form onSubmit={submitAddSecurity} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 space-y-4 overflow-y-auto p-4 sm:p-5">
                  <div className="grid gap-2 sm:grid-cols-3"><div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 text-xs"><span className="font-semibold text-slate-600">Available cash</span><strong className="font-mono text-slate-900">{formatMoney(cashBalance)}</strong></div><div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-xs"><span className="font-semibold text-slate-600">Basket cost</span><strong className={`font-mono ${basketWithinCash ? "text-slate-900" : "text-red-700"}`}>{formatMoney(basketTotal)}</strong></div><div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-xs"><span className="font-semibold text-slate-600">Cash after purchase</span><strong className={`font-mono ${basketWithinCash ? "text-slate-900" : "text-red-700"}`}>{formatMoney(cashBalance - basketTotal)}</strong></div></div>

                  {!eligibleSecurities.length ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">No priced securities are available for the asset classes in this theme.</div> : <>
                    <div className="space-y-2">
                      {buyOrders.map((order) => {
                        const item = basketItems.find((candidate) => candidate.rowId === order.rowId);
                        const usedElsewhere = new Set(buyOrders.filter((candidate) => candidate.rowId !== order.rowId).map((candidate) => String(candidate.securityId)).filter(Boolean));
                        const selectable = eligibleSecurities.filter((security) => !usedElsewhere.has(String(security.id)) || String(security.id) === String(order.securityId));
                        const cashForThisRow = cashBalance - basketItems.filter((candidate) => candidate.rowId !== order.rowId).reduce((sum, candidate) => sum + candidate.amount, 0);
                        const maxQuantity = item?.security ? Math.max(0, Math.floor((cashForThisRow + 0.01) / Number(item.security.price))) : undefined;
                        return <div key={order.rowId} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[minmax(240px,1.8fr)_minmax(130px,.7fr)_minmax(130px,.8fr)_auto] md:items-end">
                          <label className="block text-[11px] font-semibold text-slate-700">Security<select required value={order.securityId} onChange={(event) => updateBuyOrder(order.rowId, "securityId", event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-normal outline-none focus:border-blue-400"><option value="">Choose a theme security</option>{themeAllocations.map((allocation) => <optgroup key={allocation.assetId} label={`${formatLabel(allocation.assetClass)} · target ${Number(allocation.targetPercentage).toFixed(1)}%`}>{selectable.filter((security) => Number(security.asset?.id) === Number(allocation.assetId)).map((security) => <option key={security.id} value={security.id}>{security.name} ({security.symbol || security.isin || "—"}) · {formatMoney(security.price)}</option>)}</optgroup>)}</select></label>
                          <label className="block text-[11px] font-semibold text-slate-700">Quantity<input required type="number" min="1" max={maxQuantity} step="1" value={order.quantity} onChange={(event) => updateBuyOrder(order.rowId, "quantity", event.target.value)} placeholder="Whole units" className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono text-xs outline-none focus:border-blue-400" /></label>
                          <div className="rounded-md bg-slate-50 px-3 py-2"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Estimated amount</div><div className="mt-1 truncate font-mono text-xs font-semibold text-slate-800">{item?.security ? formatMoney(item.amount) : "—"}</div>{item?.security && <div className="text-[9px] text-slate-500">{formatLabel(item.security.asset?.assetClass)} · {formatMoney(item.security.price)} / unit</div>}</div>
                          <button type="button" onClick={() => removeBuyOrder(order.rowId)} disabled={buyOrders.length <= 1 || addSubmitting} aria-label="Remove security row" title="Remove security" className="flex h-10 items-center justify-center rounded-md border border-slate-200 px-3 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={15} /></button>
                        </div>;
                      })}
                    </div>
                  <button type="button" onClick={addBuyOrder} disabled={eligibleSecurities.length <= buyOrders.length || addSubmitting} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-blue-300 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /> Add another security</button>
                  </>}

                  {!!projectedAllocations.length && <div className="overflow-hidden rounded-lg border border-slate-200"><div className="border-b border-slate-100 bg-slate-50 px-3 py-2"><h3 className="text-xs font-bold text-slate-800">Projected theme allocation</h3><p className="mt-0.5 text-[10px] text-slate-500">Allocation is calculated across all selected securities together.</p></div><div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-4">{projectedAllocations.map((allocation) => <div key={allocation.assetId} className={`rounded-md p-3 ${basketRowsValid && allocation.satisfiedAfterBuy ? "bg-emerald-50" : "bg-slate-50"}`}><div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600"><span>{formatLabel(allocation.assetClass)}</span><span>Target {Number(allocation.targetPercentage).toFixed(1)}%</span></div><div className="mt-1.5 flex items-baseline justify-between gap-2"><strong className="font-mono text-sm text-slate-900">{allocation.projectedPercentage.toFixed(2)}%</strong><span className={`font-mono text-[10px] ${allocation.satisfiedAfterBuy ? "text-emerald-700" : "text-amber-700"}`}>{allocation.projectedDrift > 0 ? "+" : ""}{allocation.projectedDrift.toFixed(2)}%</span></div><div className="mt-2 h-1.5 rounded-full bg-white"><div className={`h-full rounded-full ${allocation.satisfiedAfterBuy ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.max(0, Math.min(100, allocation.projectedPercentage))}%` }} /></div></div>)}</div></div>}

                  <div className={`flex items-start gap-2 rounded-lg p-3 text-xs ${basketRowsValid && basketWithinCash && basketSatisfiesTheme ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{basketRowsValid && basketWithinCash && basketSatisfiesTheme ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}<span>{!basketRowsValid ? "Choose a security and whole-unit quantity in every row." : !basketWithinCash ? "Reduce quantities so the basket fits the remaining cash." : basketSatisfiesTheme ? "The complete basket satisfies every theme allocation band (±5%)." : "Adjust quantities across the selected asset classes until each projected allocation is within ±5% of its theme target."}</span></div>
                  {addError && <div role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-xs text-red-700">{addError}</div>}
                </div>
                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-5"><button type="button" onClick={() => setAddOpen(false)} disabled={addSubmitting} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40">Cancel</button><button type="submit" disabled={!basketCanSubmit || !eligibleSecurities.length} className="rounded-md bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">{addSubmitting ? "Validating & recording…" : `Buy ${basketItems.filter((item) => item.security).length} ${basketItems.filter((item) => item.security).length === 1 ? "security" : "securities"}`}</button></div>
              </form>}
            </section>
          </div>}
        </main>
      </div>
    </div>
  );
};

function PageMessage({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-[#f6f8fd] p-5">{children}</div>;
}

function Badge({ children, tone = "blue" }) {
  return <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone === "green" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-slate-700"}`}>{children}</span>;
}

function MetricCard({ title, value, caption, icon: Icon, positive }) {
  return <article className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p><Icon size={16} className="shrink-0 text-blue-700" /></div><p className={`mt-2 truncate text-[25px] font-bold tracking-tight ${positive === undefined ? "text-slate-900" : positive ? "text-emerald-700" : "text-red-600"}`} title={String(value)}>{value}</p><p className="mt-1 truncate text-xs text-slate-500">{caption}</p></article>;
}

function OverviewItem({ label, value }) {
  return <div className="min-w-0 rounded-lg border border-slate-100 bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-semibold text-slate-700" title={String(value)}>{value}</p></div>;
}

const holdingReturn = (holding) => {
  if (holding.returnPercentage != null) return Number(holding.returnPercentage) || 0;
  const cost = Number(holding.totalCost ?? (Number(holding.averageCost || 0) * Number(holding.quantity || 0)));
  const value = Number(holding.currentValue ?? cost);
  return cost > 0 ? ((value - cost) / cost) * 100 : 0;
};

const normalizeAssetClass = (assetClass) => String(assetClass || "OTHER").trim().toUpperCase().replaceAll(" ", "_");
const formatLabel = (value) => String(value ?? "—").replaceAll("_", " ");
const formatMoney = (value) => value == null || !Number.isFinite(Number(value)) ? "—" : `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

let nextBuyOrderId = 0;
const newBuyOrder = () => ({ rowId: `basket-${++nextBuyOrderId}`, securityId: "", quantity: "" });

function downloadHoldings(rows, name) {
  const columns = ["Security", "Symbol", "Asset class", "Quantity", "Average cost", "Invested value", "Current value", "Return %"];
  const csv = [columns, ...rows.map((holding) => [holding.securityName, holding.symbol, holding.assetClass, holding.quantity, holding.averageCost, holding.totalCost, holding.currentValue, holdingReturn(holding).toFixed(2)])]
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `${String(name || "portfolio").replace(/[^a-z0-9-_]+/gi, "-")}-holdings.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default PortfolioDetailsPage;
