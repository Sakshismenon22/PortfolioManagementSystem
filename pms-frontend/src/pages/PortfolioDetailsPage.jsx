import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, AlertTriangle, CalendarDays,
  CheckCircle2, Clock3, Download, Filter, LineChart, Plus, RefreshCw,
  SlidersHorizontal, TrendingUp, WalletCards,
} from "lucide-react";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import {
  getPortfolioBasicInfo,
  getPortfolioHoldings,
  getThemeAllocation,
  validatePortfolioAllocation,
  buyPortfolioSecurity,
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
  const [selectedSecurityId, setSelectedSecurityId] = useState("");
  const [buyQuantity, setBuyQuantity] = useState("");
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
    setSelectedSecurityId("");
    setBuyQuantity("");
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
  const allowedAllocations = (validation?.allocations || []).filter((allocation) =>
    Number(allocation.targetPercentage) > 0 && Number(allocation.currentPercentage || 0) < Number(allocation.targetPercentage) - 0.0001);
  const eligibleSecurities = securities.filter((security) => Number(security.price) > 0 &&
    allowedAllocations.some((allocation) => Number(allocation.assetId) === Number(security.asset?.id)));
  const activeSecurity = eligibleSecurities.find((security) => String(security.id) === String(selectedSecurityId));
  const activeAllocation = activeSecurity && allowedAllocations.find((allocation) => Number(allocation.assetId) === Number(activeSecurity.asset?.id));
  const activeHolding = activeSecurity && holdings.find((holding) => Number(holding.securityId) === Number(activeSecurity.id) && Number(holding.quantity) > 0);
  const maxBuyQuantity = activeSecurity ? getAddMaxQuantity(activeSecurity, activeAllocation, validation, cashBalance) : 0;
  const parsedBuyQuantity = Number(buyQuantity);
  const submitAddSecurity = async (event) => {
    event.preventDefault();
    setAddError("");
    if (!activeSecurity || !Number.isInteger(parsedBuyQuantity) || parsedBuyQuantity < 1 || parsedBuyQuantity > maxBuyQuantity) {
      setAddError(`Enter a whole-share quantity from 1 to ${maxBuyQuantity}.`);
      return;
    }
    setAddSubmitting(true);
    try {
      const result = await buyPortfolioSecurity({ portfolioId, securityId: activeSecurity.id, quantity: parsedBuyQuantity });
      if (result?.success === false) throw new Error(result.message || "The purchase was rejected.");
      const [freshPortfolio, freshHoldings, freshValidation, freshTheme] = await Promise.all([
        getPortfolioBasicInfo(portfolioId), getPortfolioHoldings(portfolioId),
        validatePortfolioAllocation(portfolioId), getThemeAllocation(portfolioId).catch(() => null),
      ]);
      setPortfolio(freshPortfolio);
      setHoldings(Array.isArray(freshHoldings) ? freshHoldings : []);
      setValidation(freshValidation);
      setThemeAllocation(freshTheme);
      setAddNotice(result?.message || "Purchase recorded. Cash and holdings have been updated.");
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
          {addOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !addSubmitting) setAddOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="add-security-title" className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><h2 id="add-security-title" className="text-lg font-bold">Add to portfolio</h2><p className="mt-1 text-xs text-slate-500">Use available cash to add a theme eligible position or increase an existing one.</p></div><button onClick={() => setAddOpen(false)} disabled={addSubmitting} aria-label="Close" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">×</button></div>
              {addLoading ? <div className="p-8 text-center text-sm text-slate-500">Loading prices and theme capacity…</div> : <form onSubmit={submitAddSecurity} className="space-y-4 p-5">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5 text-xs"><span className="font-semibold text-slate-600">Available cash</span><strong className="font-mono text-slate-900">{formatMoney(cashBalance)}</strong></div>
                {allowedAllocations.length > 0 ? <label className="block text-xs font-semibold text-slate-700">Security<select required value={selectedSecurityId} onChange={(event) => { setSelectedSecurityId(event.target.value); setBuyQuantity(""); setAddError(""); }} className="mt-1.5 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-blue-400"><option value="">Select a security in an underweight theme class</option>{allowedAllocations.map((allocation) => <optgroup key={allocation.assetId} label={`${formatLabel(allocation.assetClass)} · ${Number(allocation.targetPercentage - allocation.currentPercentage).toFixed(2)}% below target`}>{eligibleSecurities.filter((security) => Number(security.asset?.id) === Number(allocation.assetId)).map((security) => { const held = holdings.some((holding) => Number(holding.securityId) === Number(security.id) && Number(holding.quantity) > 0); return <option key={security.id} value={security.id}>{security.name} ({security.symbol || security.isin || "—"}) · {formatMoney(security.price)}{held ? " · add to existing holding" : " · new holding"}</option>; })}</optgroup>)}</select></label> : <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">All theme allocation classes are at target or above. No additional buys are currently allowed.</div>}
                {activeSecurity && <><div className="grid grid-cols-3 gap-2"><OverviewItem label="Asset class" value={formatLabel(activeSecurity.asset?.assetClass)} /><OverviewItem label="Max quantity" value={maxBuyQuantity.toLocaleString("en-IN")} /><OverviewItem label="Position" value={activeHolding ? `Existing · ${Number(activeHolding.quantity).toLocaleString("en-IN")}` : "New"} /></div><label className="block text-xs font-semibold text-slate-700">Buy quantity (whole units)<input required type="number" min="1" max={maxBuyQuantity} step="1" value={buyQuantity} onChange={(event) => setBuyQuantity(event.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-slate-200 px-3 font-mono text-sm outline-none focus:border-blue-400" /></label><div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs"><span>Estimated purchase cost</span><strong className="font-mono">{formatMoney(Number(activeSecurity.price) * (Number.isInteger(parsedBuyQuantity) ? parsedBuyQuantity : 0))}</strong></div></>}
                {addError && <div role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-xs text-red-700">{addError}</div>}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setAddOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button><button type="submit" disabled={!activeSecurity || maxBuyQuantity < 1 || !Number.isInteger(parsedBuyQuantity) || parsedBuyQuantity < 1 || parsedBuyQuantity > maxBuyQuantity || addSubmitting} className="rounded-md bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">{addSubmitting ? "Recording purchase…" : "Add security"}</button></div>
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

function getAddMaxQuantity(security, allocation, validation, cash) {
  const price = Number(security?.price || 0);
  const total = Number(validation?.totalInvestedAmount || 0);
  const target = Number(allocation?.targetPercentage || 0) / 100;
  const assetCurrent = total * Number(allocation?.currentPercentage || 0) / 100;
  if (price <= 0 || total <= 0 || target <= 0 || target >= 1) return 0;
  const classCapacity = Math.max(0, (target * total - assetCurrent) / (1 - target));
  return Math.max(0, Math.floor((Math.min(classCapacity, Number(cash || 0)) + 0.01) / price));
}

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
