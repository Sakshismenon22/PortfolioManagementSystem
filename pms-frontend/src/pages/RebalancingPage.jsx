// import { useCallback, useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import {
//   AlertTriangle,
//   ArrowDownRight,
//   ArrowRight,
//   ArrowUpRight,
//   BellRing,
//   CheckCircle2,
//   Clock3,
//   Download,
//   Filter,
//   RefreshCw,
//   Scale,
//   SlidersHorizontal,
//   Wallet,
//   X,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import SideBarComponent from "../components/SideBarComponent";
// import TopBarComponent from "../components/TopBarComponent";
// import {
//   getAllPortfolioDetails,
//   getPortfolioBasicInfo,
//   getPortfolioHoldings,
//   validatePortfolioAllocation,
//   buyPortfolioSecurity,
//   sellPortfolioHolding,
// } from "../services/portfolioService";
// import { getPortfolioDriftHistory } from "../services/driftService";
// import { getAllSecuritiesInfo } from "../services/securityService";

// const API_URL = "http://localhost:8082/api";
// const DRIFT_LIMIT = 5;
// const palette = ["#173f9b", "#aebffc", "#58637c", "#65d5a4", "#f6aa45"];

// const money = (value) => {
//   const amount = Number(value || 0);
//   if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
//   if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
//   return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
// };

// const percent = (value) => `${Number(value || 0).toFixed(1)}%`;
// const driftLabel = (value) => `${Number(value || 0) > 0 ? "+" : ""}${Number(value || 0).toFixed(1)}%`;

// const unwrapData = (response) => response?.data?.data ?? response?.data ?? response;
// const displayDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// function SummaryCard({ icon: Icon, label, value, detail, tone = "blue" }) {
//   const tones = {
//     blue: "bg-blue-50 text-blue-800",
//     red: "bg-red-50 text-red-700",
//     green: "bg-emerald-50 text-emerald-700",
//     amber: "bg-amber-50 text-amber-700",
//   };
//   return (
//     <div className="flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//       <div className={`rounded-lg p-2.5 ${tones[tone]}`}><Icon size={19} /></div>
//       <div className="min-w-0">
//         <div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</div>
//         <div className="mt-1 truncate font-mono text-xl font-semibold text-slate-900">{value}</div>
//         <div className="mt-0.5 text-xs text-slate-500">{detail}</div>
//       </div>
//     </div>
//   );
// }

// function AllocationBar({ items, field }) {
//   const total = items.reduce((sum, item) => sum + Math.max(0, Number(item[field] || 0)), 0);
//   return (
//     <div className="flex h-6 w-full overflow-hidden rounded-md bg-slate-100">
//       {items.map((item, index) => {
//         const value = Math.max(0, Number(item[field] || 0));
//         if (!value) return null;
//         const width = total ? (value / total) * 100 : 0;
//         return (
//           <div key={`${field}-${item.assetId ?? item.assetClass}`} title={`${item.assetClass}: ${percent(value)}`} className="flex min-w-0 items-center justify-center text-[10px] font-semibold text-white" style={{ width: `${width}%`, backgroundColor: palette[index % palette.length] }}>
//             {width >= 9 ? percent(value) : ""}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function PortfolioCard({ item, onReview, onOpen }) {
//   const allocations = item.validation?.allocations || [];
//   const amount = Number(item.validation?.totalCurrentValue || item.validation?.totalInvestedAmount || item.info?.amount || item.portfolio.aum || 0);
//   const breaches = allocations.filter((allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT);
//   const targetTotal = allocations.reduce((sum, allocation) => sum + Number(allocation.targetPercentage || 0), 0);
//   const currentTotal = allocations.reduce((sum, allocation) => sum + Number(allocation.currentPercentage || 0), 0);
//   const isBreach = breaches.length > 0;

//   return (
//     <article className={`overflow-hidden rounded-xl border border-slate-200 border-t-4 bg-white shadow-sm ${isBreach ? "border-t-amber-500" : "border-t-emerald-500"}`}>
//       <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-4">
//         <div className="flex min-w-0 items-start gap-3">
//           <div className="rounded-lg bg-blue-50 p-2.5 text-blue-800"><Scale size={20} /></div>
//           <div className="min-w-0">
//             <div className="flex flex-wrap items-center gap-2">
//               <h2 className="truncate text-lg font-bold text-slate-900">{item.portfolio.name}</h2>
//               <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${isBreach ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
//                 {isBreach ? "Rebalance required" : "Within tolerance"}
//               </span>
//               <span className="font-mono text-[11px] text-slate-500">{item.portfolio.code || `ID ${item.portfolio.id}`}</span>
//             </div>
//             <p className="mt-1 text-xs text-slate-500">{item.info?.themeName || item.portfolio.theme || "Portfolio mandate"}{item.info?.benchmark ? ` · ${item.info.benchmark}` : ""}</p>
//           </div>
//         </div>
//         <div className="text-right">
//           <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Portfolio value</div>
//           <div className="font-mono text-2xl font-semibold text-slate-900">{money(amount)}</div>
//         </div>
//       </div>

//       <div className="mx-4 grid gap-3 rounded-lg bg-[#f0f4ff] p-3 sm:grid-cols-2 xl:grid-cols-4">
//         <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Target allocation</div><div className="mt-1 font-mono text-lg font-semibold text-slate-900">{percent(targetTotal)}</div><div className="text-[11px] text-slate-500">Theme baseline</div></div>
//         <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Current allocation</div><div className={`mt-1 font-mono text-lg font-semibold ${isBreach ? "text-red-700" : "text-slate-900"}`}>{percent(currentTotal)}</div><div className="text-[11px] text-slate-500">From current holdings</div></div>
//         <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Drift band</div><div className="mt-1 font-mono text-lg font-semibold text-slate-900">±{DRIFT_LIMIT.toFixed(1)}%</div><div className="text-[11px] text-slate-500">Theme validation threshold</div></div>
//         <div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Largest deviation</div><div className={`mt-1 font-mono text-lg font-semibold ${isBreach ? "text-red-700" : "text-emerald-700"}`}>{driftLabel(allocations.reduce((largest, entry) => Math.abs(entry.driftPercentage || 0) > Math.abs(largest) ? entry.driftPercentage || 0 : largest, 0))}</div><div className="text-[11px] text-slate-500">Across asset classes</div></div>
//       </div>

//       {allocations.length > 0 ? (
//         <div className="px-5 pb-4 pt-4">
//           <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
//             <h3 className="text-sm font-bold text-slate-900">Allocation composition</h3>
//             <div className="flex flex-wrap gap-x-3 gap-y-1">
//               {allocations.map((allocation, index) => <span key={allocation.assetId ?? allocation.assetClass} className="flex items-center gap-1.5 text-[10px] text-slate-600"><i className="h-2 w-2 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />{allocation.assetClass}</span>)}
//             </div>
//           </div>
//           <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500"><span>Theme target</span><span>100% allocation</span></div>
//           <AllocationBar items={allocations} field="targetPercentage" />
//           <div className="mb-1 mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wide"><span className={isBreach ? "text-red-700" : "text-slate-500"}>Current holdings</span><span className={isBreach ? "text-red-700" : "text-emerald-700"}>{isBreach ? `${breaches.length} class${breaches.length === 1 ? "" : "es"} outside tolerance` : "Within mandate"}</span></div>
//           <AllocationBar items={allocations} field="currentPercentage" />

//           <div className="mt-4 grid gap-3 lg:grid-cols-2">
//             <div className="rounded-lg border border-slate-200 p-3">
//               <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><ArrowDownRight size={15} className="text-red-600" />Trim overweight</div>
//               {allocations.filter((allocation) => Number(allocation.driftPercentage) > 0).length ? allocations.filter((allocation) => Number(allocation.driftPercentage) > 0).map((allocation) => <div key={allocation.assetId} className="flex items-center justify-between border-t border-slate-100 py-2 text-xs"><span className="text-slate-700">{allocation.assetClass}</span><span className="font-mono font-semibold text-red-700">{driftLabel(allocation.driftPercentage)} · {money(amount * Number(allocation.driftPercentage) / 100)}</span></div>) : <div className="text-xs text-slate-400">No overweight asset classes</div>}
//             </div>
//             <div className="rounded-lg border border-slate-200 p-3">
//               <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><ArrowUpRight size={15} className="text-emerald-700" />Redeploy to underweight</div>
//               {allocations.filter((allocation) => Number(allocation.driftPercentage) < 0).length ? allocations.filter((allocation) => Number(allocation.driftPercentage) < 0).map((allocation) => <div key={allocation.assetId} className="flex items-center justify-between border-t border-slate-100 py-2 text-xs"><span className="text-slate-700">{allocation.assetClass}</span><span className="font-mono font-semibold text-emerald-800">{driftLabel(allocation.driftPercentage)} · {money(Math.abs(amount * Number(allocation.driftPercentage) / 100))}</span></div>) : <div className="text-xs text-slate-400">No underweight asset classes</div>}
//             </div>
//           </div>
//         </div>
//       ) : <div className="px-5 py-6 text-sm text-slate-500">Allocation breakdown is not available for this portfolio.</div>}

//       <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
//         <button onClick={() => onReview(item)} className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900"><SlidersHorizontal size={14} />Review rebalance plan</button>
//         <button onClick={() => onOpen(item)} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800">View portfolio <ArrowRight size={14} /></button>
//         <span className="ml-auto text-[10px] text-slate-500">{item.info?.reBalancingFrequency ? `Scheduled: ${item.info.reBalancingFrequency}` : "Manual drift review"}</span>
//       </div>
//     </article>
//   );
// }

// export default function RebalancingPage() {
//   const navigate = useNavigate();
//   const [portfolios, setPortfolios] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState("");
//   const [query, setQuery] = useState("");
//   const [filter, setFilter] = useState("All mandates");
//   const [selected, setSelected] = useState(null);
//   const [notice, setNotice] = useState("");
//   const [tradeHoldings, setTradeHoldings] = useState([]);
//   const [tradeSecurities, setTradeSecurities] = useState([]);
//   const [tradeMode, setTradeMode] = useState("sell");
//   const [tradeLoading, setTradeLoading] = useState(false);
//   const [tradeSubmitting, setTradeSubmitting] = useState(false);
//   const [tradeError, setTradeError] = useState("");
//   const [sellHoldingId, setSellHoldingId] = useState("");
//   const [sellQuantity, setSellQuantity] = useState("");
//   const [buySecurityId, setBuySecurityId] = useState("");
//   const [buyQuantity, setBuyQuantity] = useState("");

//   const loadData = useCallback(async ({ recalculate = false } = {}) => {
//     setError("");
//     setNotice("");
//     if (recalculate) setRefreshing(true); else setLoading(true);
//     try {
//       const userId = localStorage.getItem("userId");
//       if (!userId) {
//         throw new Error("No signed-in user was found. Sign in again to load portfolio drift checks.");
//       }

//       const listResponse = await getAllPortfolioDetails(userId);
//       const payload = unwrapData(listResponse);
//       const list = payload?.portfolioDetailsDTOList || payload?.data?.portfolioDetailsDTOList;
//       if (!Array.isArray(list)) {
//         throw new Error(payload?.detail || payload?.message || "The portfolio list could not be loaded.");
//       }
//       const active = list.filter((portfolio) => String(portfolio.portfolioStatus || portfolio.status || "ACTIVE").toUpperCase() === "ACTIVE");
//       const results = await Promise.all(active.map(async (portfolio) => {
//         const [validationResult, infoResult] = await Promise.allSettled([
//           recalculate && userId
//             ? axios.get(`${API_URL}/drift/calculate/${portfolio.id}/${userId}`)
//             : validatePortfolioAllocation(portfolio.id),
//           getPortfolioBasicInfo(portfolio.id),
//         ]);
//         let validation = validationResult.status === "fulfilled" ? unwrapData(validationResult.value) : null;
//         if (recalculate && validationResult.status === "fulfilled") {
//           const refreshed = await validatePortfolioAllocation(portfolio.id).catch(() => null);
//           validation = refreshed ? unwrapData(refreshed) : validation?.allocations ? validation : null;
//         }
//         const info = infoResult.status === "fulfilled" ? unwrapData(infoResult.value) : null;
//         const history = userId ? await getPortfolioDriftHistory(portfolio.id).catch(() => []) : [];
//         const latestByAsset = new Map();
//         history.forEach((entry) => {
//           if (!latestByAsset.has(entry.assetId)) latestByAsset.set(entry.assetId, entry);
//         });
//         if (validation?.valid === false && Array.isArray(validation.allocations)) {
//           validation = {
//             ...validation,
//             allocations: validation.allocations.map((allocation) => {
//               const saved = latestByAsset.get(allocation.assetId);
//               return saved ? {
//                 ...allocation,
//                 driftPercentage: saved.driftPercent,
//                 currentPercentage: Number(allocation.targetPercentage || 0) + Number(saved.driftPercent || 0),
//                 driftDetectedAt: saved.detectedAt,
//               } : allocation;
//             }),
//           };
//         }
//         return {
//           portfolio,
//           validation,
//           info,
//           history,
//           driftError: recalculate && validationResult.status === "rejected"
//             ? validationResult.reason?.response?.data?.message || validationResult.reason?.message || "Drift calculation failed."
//             : null,
//         };
//       }));
//       setPortfolios(results);
//       if (recalculate) {
//         const failed = results.filter((item) => item.driftError);
//         if (failed.length) {
//           setError(`Drift calculation failed for ${failed.map((item) => item.portfolio.name).join(", ")}: ${failed[0].driftError}`);
//         } else if (!results.length) {
//           setNotice("There are no active portfolios to check.");
//         } else {
//           setNotice(`Drift checks completed for ${results.length} active mandate${results.length === 1 ? "" : "s"}.`);
//         }
//       }
//     } catch (loadError) {
//       setError(loadError?.response?.data?.message || loadError?.message || "Unable to load portfolio allocations.");
//       setPortfolios([]);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => { loadData(); }, [loadData]);

//   const filtered = useMemo(() => portfolios.filter((item) => {
//     const text = `${item.portfolio.name || ""} ${item.portfolio.code || ""} ${item.info?.themeName || item.portfolio.theme || ""}`.toLowerCase();
//     const hasBreach = (item.validation?.allocations || []).some((allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT);
//     return (!query || text.includes(query.toLowerCase())) && (filter === "All mandates" || (filter === "Needs action" ? hasBreach : !hasBreach));
//   }), [portfolios, query, filter]);

//   const breached = portfolios.filter((item) => (item.validation?.allocations || []).some((allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT));
//   const totalCapital = portfolios.reduce((sum, item) => sum + Number(item.validation?.totalCurrentValue || item.validation?.totalInvestedAmount || item.info?.amount || item.portfolio.aum || 0), 0);
//   const driftCapital = breached.reduce((sum, item) => {
//     const amount = Number(item.validation?.totalCurrentValue || item.validation?.totalInvestedAmount || item.info?.amount || item.portfolio.aum || 0);
//     const drift = (item.validation?.allocations || []).reduce((max, allocation) => Math.max(max, Math.abs(Number(allocation.driftPercentage || 0))), 0);
//     return sum + amount * drift / 100;
//   }, 0);

//   const openTradeDialog = async (item) => {
//     setSelected(item);
//     setTradeMode("sell");
//     setTradeError("");
//     setTradeHoldings([]);
//     setTradeSecurities([]);
//     setSellHoldingId("");
//     setSellQuantity("");
//     setBuySecurityId("");
//     setBuyQuantity("");
//     setTradeLoading(true);
//     try {
//       const [holdingsResult, securityResult, validationResult, infoResult] = await Promise.all([
//         getPortfolioHoldings(item.portfolio.id),
//         getAllSecuritiesInfo(),
//         validatePortfolioAllocation(item.portfolio.id),
//         getPortfolioBasicInfo(item.portfolio.id),
//       ]);
//       const securityPayload = unwrapData(securityResult);
//       const validation = unwrapData(validationResult);
//       const info = unwrapData(infoResult);
//       if (!Array.isArray(securityPayload?.securities)) {
//         throw new Error(securityPayload?.message || "Security prices are unavailable. Try again later.");
//       }
//       setSelected((current) => current ? { ...current, validation, info } : current);
//       setTradeHoldings(Array.isArray(holdingsResult) ? holdingsResult : []);
//       setTradeSecurities(securityPayload.securities);
//     } catch (tradeLoadError) {
//       setTradeError(tradeLoadError?.response?.data?.message || tradeLoadError?.message || "Could not load holdings and securities for this rebalance.");
//     } finally {
//       setTradeLoading(false);
//     }
//   };

//   const selectedAllocation = selected?.validation?.allocations || [];
//   const sellableHoldings = tradeHoldings.filter((holding) => {
//     const allocation = selectedAllocation.find((item) => Number(item.assetId) === Number(holding.assetId));
//     return Number(holding.quantity) > 0 && Number(allocation?.driftPercentage) > 0;
//   });
//   const underweightAllocations = selectedAllocation.filter((allocation) => Number(allocation.driftPercentage) < 0);
//   const buyableSecurities = tradeSecurities.filter((security) =>
//     underweightAllocations.some((allocation) => Number(allocation.assetId) === Number(security.asset?.id))
//       && Number(security.price) > 0);
//   const activeSellHolding = sellableHoldings.find((holding) => String(holding.holdingId) === String(sellHoldingId));
//   const activeSellAllocation = activeSellHolding && selectedAllocation.find((item) => Number(item.assetId) === Number(activeSellHolding.assetId));
//   const sellMaxQuantity = activeSellHolding ? getMaxSellQuantity(activeSellHolding, activeSellAllocation, selected?.validation) : 0;
//   const sellUnitPrice = activeSellHolding && Number(activeSellHolding.quantity) > 0
//     ? Number(activeSellHolding.currentValue || 0) / Number(activeSellHolding.quantity)
//     : Number(activeSellHolding?.averageCost || 0);
//   const activeBuySecurity = buyableSecurities.find((security) => String(security.id) === String(buySecurityId));
//   const activeBuyAllocation = activeBuySecurity && underweightAllocations.find((item) => Number(item.assetId) === Number(activeBuySecurity.asset?.id));
//   const availableCash = Number(selected?.info?.amount || 0);
//   const buyMaxQuantity = activeBuySecurity ? getMaxBuyQuantity(activeBuySecurity, activeBuyAllocation, selected?.validation, availableCash) : 0;
//   const parsedSellQuantity = Number(sellQuantity);
//   const parsedBuyQuantity = Number(buyQuantity);

//   const submitTrade = async (event) => {
//     event.preventDefault();
//     setTradeError("");
//     if (tradeSubmitting || !selected) return;
//     try {
//       setTradeSubmitting(true);
//       let result;
//       if (tradeMode === "sell") {
//         if (!activeSellHolding || !Number.isInteger(parsedSellQuantity) || parsedSellQuantity <= 0 || parsedSellQuantity > sellMaxQuantity) {
//           throw new Error(`Enter a whole-share quantity from 1 to ${sellMaxQuantity}.`);
//         }
//         result = await sellPortfolioHolding({ holdingId: activeSellHolding.holdingId, quantity: parsedSellQuantity });
//       } else {
//         if (!activeBuySecurity || !Number.isInteger(parsedBuyQuantity) || parsedBuyQuantity <= 0 || parsedBuyQuantity > buyMaxQuantity) {
//           throw new Error(`Enter a whole-share quantity from 1 to ${buyMaxQuantity}.`);
//         }
//         result = await buyPortfolioSecurity({ portfolioId: selected.portfolio.id, securityId: activeBuySecurity.id, quantity: parsedBuyQuantity });
//       }
//       if (result?.success === false) throw new Error(result.message || "The trade was rejected.");
//       const successMessage = result?.message || (tradeMode === "sell" ? "Sell order recorded." : "Buy order recorded.");
//       setSelected(null);
//       await loadData({ recalculate: true });
//       setNotice(successMessage);
//     } catch (tradeFailure) {
//       setTradeError(tradeFailure?.response?.data?.message || tradeFailure?.message || "The trade could not be placed.");
//     } finally {
//       setTradeSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#f5f7fc] font-sans text-slate-900">
//       <SideBarComponent activePage="Rebalancing" />
//       <div className="ml-[257px] min-h-screen">
//         <TopBarComponent />
//         <main className="mx-auto max-w-[1600px] px-5 py-5">
//           <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
//             <div>
//               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-blue-800"><span>Institutional drift governance</span><span className="text-slate-400">•</span><span className="font-mono normal-case tracking-normal text-slate-500">Live allocation review</span></div>
//               <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Portfolio Rebalancing</h1>
//               <p className="mt-1 max-w-3xl text-sm text-slate-600">Monitor asset class drift against each portfolio’s theme and review the trades needed to restore its target mix.</p>
//             </div>
//             <div className="flex gap-2">
//               <button onClick={() => loadData({ recalculate: true })} disabled={refreshing || loading} className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-60"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Checking drift…" : "Run drift checks"}</button>
//             </div>
//           </div>

//           {notice && <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><CheckCircle2 size={15} />{notice}</div>}
//           {error && <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"><AlertTriangle size={15} />{error}</div>}

//           <div className="mb-5 grid gap-3 md:grid-cols-3">
//             <SummaryCard icon={AlertTriangle} label="Mandates requiring action" value={loading ? "—" : breached.length} detail={`${portfolios.length} active portfolios reviewed`} tone={breached.length ? "red" : "green"} />
//             <SummaryCard icon={Clock3} label="Drift tolerance" value={`±${DRIFT_LIMIT.toFixed(1)}%`} detail="Configured allocation validation band" tone="blue" />
//             <SummaryCard icon={Wallet} label="Capital at drift" value={loading ? "—" : money(driftCapital)} detail={`${breached.length} affected mandate${breached.length === 1 ? "" : "s"} · active book ${money(totalCapital)}`} tone="amber" />
//           </div>

//           <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
//             <div><h2 className="text-base font-bold text-slate-900">Active mandates</h2><p className="mt-0.5 text-xs text-slate-500">Current allocation compared with the selected theme’s target.</p></div>
//             <div className="flex flex-wrap gap-2">
//               <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3"><Filter size={14} className="text-slate-400" /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="bg-transparent text-xs text-slate-700 outline-none"><option>All mandates</option><option>Needs action</option><option>Within tolerance</option></select></div>
//               <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter mandates…" className="h-9 w-48 rounded-md border border-slate-200 bg-white px-3 text-xs outline-none placeholder:text-slate-400 focus:border-blue-400" />
//             </div>
//           </div>

//           <div className="space-y-4">
//             {loading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading portfolio allocations…</div> : filtered.length ? filtered.map((item) => <PortfolioCard key={item.portfolio.id} item={item} onReview={openTradeDialog} onOpen={(entry) => navigate(`/portfolio/${entry.portfolio.id}`)} />) : <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><BellRing className="mx-auto mb-2 text-slate-400" size={22} /><div className="text-sm font-semibold text-slate-800">{portfolios.length ? "No mandates match this filter" : "No active portfolios to review"}</div><p className="mt-1 text-xs text-slate-500">Active portfolio allocations will appear here once available.</p></div>}
//           </div>

//           <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
//             <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
//               <div><h2 className="text-base font-bold text-slate-900">Drift detection history</h2><p className="mt-0.5 text-xs text-slate-500">Saved drift records from scheduled and manual calculations.</p></div>
//               <button type="button" disabled title="History export is not available yet" className="flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400"><Download size={14} />Export history</button>
//             </div>
//             {portfolios.some((item) => item.history?.length) ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#f0f4ff] text-[10px] font-bold uppercase tracking-wide text-slate-600"><tr><th className="px-5 py-3">Detected</th><th className="px-5 py-3">Portfolio</th><th className="px-5 py-3">Asset class</th><th className="px-5 py-3">Drift</th><th className="px-5 py-3">Record</th></tr></thead><tbody>{portfolios.flatMap((item) => (item.history || []).map((entry) => ({ ...entry, portfolioName: item.portfolio.name }))).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt) || b.id - a.id).slice(0, 30).map((entry) => <tr key={entry.id} className="border-t border-slate-100 text-xs"><td className="whitespace-nowrap px-5 py-3 font-mono text-slate-700">{displayDate(entry.detectedAt)}</td><td className="px-5 py-3 font-semibold text-slate-800">{entry.portfolioName}</td><td className="px-5 py-3 text-slate-600">{entry.assetClass}</td><td className={`px-5 py-3 font-mono font-semibold ${Number(entry.driftPercent) > 0 ? "text-red-700" : "text-emerald-800"}`}>{driftLabel(entry.driftPercent)}</td><td className="px-5 py-3"><span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">Drift detected</span></td></tr>)}</tbody></table></div> : <div className="flex flex-col items-center px-5 py-9 text-center"><div className="rounded-full bg-slate-100 p-3 text-slate-500"><Clock3 size={20} /></div><div className="mt-3 text-sm font-semibold text-slate-800">No drift records found</div><p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">Saved drift records will appear here after scheduled or manual drift calculations detect an out-of-band allocation.</p></div>}
//           </section>
//         </main>
//       </div>

//       {selected && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !tradeSubmitting) setSelected(null); }}>
//         <section role="dialog" aria-modal="true" aria-labelledby="plan-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
//           <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Rebalance trade ticket</div><h2 id="plan-title" className="mt-1 text-lg font-bold text-slate-900">{selected.portfolio.name}</h2><p className="mt-1 text-xs text-slate-500">Place a ledger buy or sell within the theme’s remaining allocation room.</p></div><button disabled={tradeSubmitting} onClick={() => setSelected(null)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Close"><X size={18} /></button></div>
//           <div className="border-b border-slate-100 px-5 pt-4"><div className="flex gap-2"><button onClick={() => { setTradeMode("sell"); setTradeError(""); }} className={`rounded-t-md px-4 py-2 text-xs font-semibold ${tradeMode === "sell" ? "bg-red-50 text-red-800" : "text-slate-500 hover:bg-slate-50"}`}><ArrowDownRight className="mr-1 inline" size={14} />Sell overweight</button><button onClick={() => { setTradeMode("buy"); setTradeError(""); }} className={`rounded-t-md px-4 py-2 text-xs font-semibold ${tradeMode === "buy" ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50"}`}><ArrowUpRight className="mr-1 inline" size={14} />Buy underweight</button></div></div>
//           <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
//             {tradeError && <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{tradeError}</div>}
//             {tradeLoading ? <div className="py-12 text-center text-sm text-slate-500">Loading live holdings, prices, and eligible securities…</div> : tradeMode === "sell" ? <form onSubmit={submitTrade} className="space-y-4">
//               <div className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-900">Only currently held securities in overweight asset classes are available. Quantity is capped so the sale cannot push that class below its theme target.</div>
//               <label className="block text-xs font-semibold text-slate-700">Holding to sell<select required value={sellHoldingId} onChange={(event) => { setSellHoldingId(event.target.value); setSellQuantity(""); }} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-red-400"><option value="">Select an overweight holding</option>{sellableHoldings.map((holding) => <option key={holding.holdingId} value={holding.holdingId}>{holding.securityName} ({holding.symbol || "—"}) · {holding.assetClass} · {Number(holding.quantity).toLocaleString("en-IN")} held</option>)}</select></label>
//               {activeSellHolding && <><div className="grid gap-3 sm:grid-cols-3"><DetailTile label="Shares held" value={Number(activeSellHolding.quantity).toLocaleString("en-IN")} /><DetailTile label="Max sell quantity" value={sellMaxQuantity.toLocaleString("en-IN")} /><DetailTile label="Available cash" value={money(availableCash)} /></div><label className="block text-xs font-semibold text-slate-700">Sell quantity (whole shares)<input required type="number" step="1" min="1" max={sellMaxQuantity} value={sellQuantity} onChange={(event) => setSellQuantity(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono text-sm outline-none focus:border-red-400" /></label><div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs"><span className="text-slate-600">Estimated proceeds at latest displayed price</span><strong className="font-mono text-slate-900">{money(sellUnitPrice * (Number.isInteger(parsedSellQuantity) ? parsedSellQuantity : 0))}</strong></div></>}
//               {!sellableHoldings.length && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">There are no sellable holdings in an overweight asset class.</div>}
//               <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setSelected(null)} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button><button type="submit" disabled={!activeSellHolding || !Number.isInteger(parsedSellQuantity) || parsedSellQuantity <= 0 || parsedSellQuantity > sellMaxQuantity || tradeSubmitting} className="rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">{tradeSubmitting ? "Recording…" : "Record sell"}</button></div>
//             </form> : <form onSubmit={submitTrade} className="space-y-4">
//               <div className="rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">Choose a security mapped to an underweight theme class. The order is limited by both the remaining target allocation and available portfolio cash.</div>
//               <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-xs"><span className="text-slate-600">Available portfolio cash</span><strong className="font-mono text-slate-900">{money(availableCash)}</strong></div>
//               <label className="block text-xs font-semibold text-slate-700">Security to buy<select required value={buySecurityId} onChange={(event) => { setBuySecurityId(event.target.value); setBuyQuantity(""); }} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-emerald-400"><option value="">Select a security from an underweight class</option>{underweightAllocations.map((allocation) => <optgroup key={allocation.assetId} label={`${allocation.assetClass} · ${driftLabel(allocation.driftPercentage)} under target`}>{buyableSecurities.filter((security) => Number(security.asset?.id) === Number(allocation.assetId)).map((security) => <option key={security.id} value={security.id}>{security.name} ({security.symbol || security.isin || "—"}) · {money(security.price)}</option>)}</optgroup>)}</select></label>
//               {activeBuySecurity && <><div className="grid gap-3 sm:grid-cols-3"><DetailTile label="Current price" value={money(activeBuySecurity.price)} /><DetailTile label="Max buy quantity" value={buyMaxQuantity.toLocaleString("en-IN")} /><DetailTile label="Target allocation" value={`${percent(activeBuyAllocation?.targetPercentage)} · current ${percent(activeBuyAllocation?.currentPercentage)}`} /></div><label className="block text-xs font-semibold text-slate-700">Buy quantity (whole shares)<input required type="number" step="1" min="1" max={buyMaxQuantity} value={buyQuantity} onChange={(event) => setBuyQuantity(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono text-sm outline-none focus:border-emerald-400" /></label><div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs"><span className="text-slate-600">Estimated purchase cost</span><strong className="font-mono text-slate-900">{money(Number(activeBuySecurity.price) * (Number.isInteger(parsedBuyQuantity) ? parsedBuyQuantity : 0))}</strong></div></>}
//               {!buyableSecurities.length && <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">No priced securities are currently available for the underweight asset classes.</div>}
//               <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setSelected(null)} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button><button type="submit" disabled={!activeBuySecurity || !Number.isInteger(parsedBuyQuantity) || parsedBuyQuantity <= 0 || parsedBuyQuantity > buyMaxQuantity || tradeSubmitting} className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{tradeSubmitting ? "Recording…" : "Record buy"}</button></div>
//             </form>}
//             <p className="mt-4 text-[10px] leading-4 text-slate-400">Recording a trade updates the portfolio holdings ledger and cash balance at the backend’s current quote. It does not submit an order to a broker.</p>
//           </div>
//         </section>
//       </div>}
//     </div>
//   );
// }

// function DetailTile({ label, value }) {
//   return <div className="rounded-lg bg-slate-50 px-3 py-2.5"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 truncate font-mono text-sm font-semibold text-slate-900">{value}</div></div>;
// }

// function getMaxSellQuantity(holding, allocation, validation) {
//   const total = Number(validation?.totalInvestedAmount || 0);
//   const current = Number(allocation?.currentPercentage || 0);
//   const target = Number(allocation?.targetPercentage || 0);
//   const averageCost = Number(holding?.averageCost || 0);
//   if (total <= 0 || averageCost <= 0 || current <= target || target >= 100) return 0;
//   const currentClassCost = total * current / 100;
//   const targetClassCost = total * target / 100;
//   const allowedCostReduction = (currentClassCost - targetClassCost) / (1 - target / 100);
//   return Math.max(0, Math.min(Number(holding.quantity || 0), Math.floor((allowedCostReduction + 0.01) / averageCost)));
// }

// function getMaxBuyQuantity(security, allocation, validation, availableCash) {
//   const total = Number(validation?.totalInvestedAmount || 0);
//   const current = Number(allocation?.currentPercentage || 0);
//   const target = Number(allocation?.targetPercentage || 0);
//   const price = Number(security?.price || 0);
//   if (total <= 0 || price <= 0 || current >= target || target >= 100) return 0;
//   const currentClassCost = total * current / 100;
//   const targetClassCost = total * target / 100;
//   const allowedCostIncrease = (targetClassCost - currentClassCost) / (1 - target / 100);
//   return Math.max(0, Math.floor((Math.min(allowedCostIncrease, Number(availableCash || 0)) + 0.01) / price));
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  RefreshCw,
  Scale,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import {
  getAllPortfolioDetails,
  getPortfolioBasicInfo,
  getPortfolioHoldings,
  validatePortfolioAllocation,
  buyPortfolioSecurities,
  sellPortfolioHoldings,
} from "../services/portfolioService";
import { getPortfolioDriftHistory } from "../services/driftService";
import { getAllSecuritiesInfo } from "../services/securityService";

const API_URL = "http://localhost:8082/api";
const DRIFT_LIMIT = 5;
const palette = ["#173f9b", "#aebffc", "#58637c", "#65d5a4", "#f6aa45"];

const money = (value) => {
  const amount = Number(value || 0);
  if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
  return `₹ ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;
const driftLabel = (value) => `${Number(value || 0) > 0 ? "+" : ""}${Number(value || 0).toFixed(1)}%`;

const unwrapData = (response) => response?.data?.data ?? response?.data ?? response;

const displayDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

function SummaryCard({ icon: Icon, label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-800",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">{label}</div>
        <div className="mt-1 truncate font-mono text-xl font-semibold text-slate-900">{value}</div>
        <div className="mt-0.5 text-xs text-slate-500">{detail}</div>
      </div>
    </div>
  );
}

function AllocatinBar({ items, field, palette: palete = palette }) {
  const total = items.reduce((sum, item) => sum + Math.max(0, Number(item[field] || 0)), 0);
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-md bg-slate-100">
      {items.map((item, index) => {
        const value = Math.max(0, Number(item[field] || 0));
        if (!value) return null;
        const width = total ? (value / total) * 100 : 0;
        return (
          <div
            key={`${field}-${item.assetId ?? item.assetClass}`}
            title={`${item.assetClass}: ${percent(value)}`}
            className="flex min-w-0 items-center justify-center text-[10px] font-semibold text-white"
            style={{ width: `${width}%`, backgroundColor: palete[index % palete.length] }}
          >
            {width >= 9 ? percent(value) : ""}
          </div>
        );
      })}
    </div>
  );
}

function PortfolioCard({ item, onReview, onOpen }) {
  const allocatins = item.validation?.allocations || [];
  const amount = Number(
    item.validation?.totalCurrentValue ||
      item.validation?.totalInvestedAmount ||
      item.info?.amount ||
      item.portfolio.aum ||
      0
  );
  const breaches = allocatins.filter((a) => Math.abs(Number(a.driftPercentage || 0)) >= DRIFT_LIMIT);
  const targetTotal = allocatins.reduce((sum, a) => sum + Number(a.targetPercentage || 0), 0);
  const currentTotal = allocatins.reduce((sum, a) => sum + Number(a.currentPercentage || 0), 0);
  const isBreach = breaches.length > 0;

  return (
    <article
      className={`overflow-hidden rounded-xl border border-slate-200 border-t-4 bg-white shadow-sm ${
        isBreach ? "border-t-amber-500" : "border-t-emerald-500"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-800">
            <Scale size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-900">{item.portfolio.name}</h2>
              <span
                className={`rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
                  isBreach ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {isBreach ? "Rebalance required" : "Within tolerance"}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {item.portfolio.code || `ID ${item.portfolio.id}`}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {item.info?.themeName || item.portfolio.theme || "Portfolio mandate"}
              {item.info?.benchmark ? ` · ${item.info.benchmark}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Portfolio value</div>
          <div className="font-mono text-2xl font-semibold text-slate-900">{money(amount)}</div>
        </div>
      </div>

      <div className="mx-4 grid gap-3 rounded-lg bg-[#f0f4ff] p-3 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Target allocation</div>
          <div className="mt-1 font-mono text-lg font-semibold text-slate-900">{percent(targetTotal)}</div>
          <div className="text-[11px] text-slate-500">Theme baseline</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Current allocation</div>
          <div className={`mt-1 font-mono text-lg font-semibold ${isBreach ? "text-red-700" : "text-slate-900"}`}>
            {percent(currentTotal)}
          </div>
          <div className="text-[11px] text-slate-500">From current holdings</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Drift band</div>
          <div className="mt-1 font-mono text-lg font-semibold text-slate-900">±{DRIFT_LIMIT.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500">Theme validation threshold</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Largest deviation</div>
          <div className={`mt-1 font-mono text-lg font-semibold ${isBreach ? "text-red-700" : "text-emerald-700"}`}>
            {driftLabel(
              allocatins.reduce(
                (largest, entry) =>
                  Math.abs(entry.driftPercentage || 0) > Math.abs(largest) ? entry.driftPercentage || 0 : largest,
                0
              )
            )}
          </div>
          <div className="text-[11px] text-slate-500">Across asset classes</div>
        </div>
      </div>

      {allocatins.length > 0 ? (
        <div className="px-5 pb-4 pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Allocation composition</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {allocatins.map((allocation, index) => (
                <span
                  key={allocation.assetId ?? allocation.assetClass}
                  className="flex items-center gap-1.5 text-[10px] text-slate-600"
                >
                  <i className="h-2 w-2 rounded-sm" style={{ backgroundColor: palette[index % palette.length] }} />
                  {allocation.assetClass}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Theme target</span>
            <span>100% allocation</span>
          </div>
          <AllocatinBar items={allocatins} field="targetPercentage" />
          <div className="mb-1 mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wide">
            <span className={isBreach ? "text-red-700" : "text-slate-500"}>Current holdings</span>
            <span className={isBreach ? "text-red-700" : "text-emerald-700"}>
              {isBreach
                ? `${breaches.length} class${breaches.length === 1 ? "" : "es"} outside tolerance`
                : "Within mandate"}
            </span>
          </div>
          <AllocatinBar items={allocatins} field="currentPercentage" />

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                <ArrowDownRight size={15} className="text-red-600" />
                Trim overweight
              </div>
              {allocatins.filter((a) => Number(a.driftPercentage) > 0).length ? (
                allocatins
                  .filter((a) => Number(a.driftPercentage) > 0)
                  .map((a) => (
                    <div key={a.assetId} className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
                      <span className="text-slate-700">{a.assetClass}</span>
                      <span className="font-mono font-semibold text-red-700">
                        {driftLabel(a.driftPercentage)} · {money((amount * Number(a.driftPercentage)) / 100)}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-slate-400">No overweight asset classes</div>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                <ArrowUpRight size={15} className="text-emerald-700" />
                Redeploy to underweight
              </div>
              {allocatins.filter((a) => Number(a.driftPercentage) < 0).length ? (
                allocatins
                  .filter((a) => Number(a.driftPercentage) < 0)
                  .map((a) => (
                    <div key={a.assetId} className="flex items-center justify-between border-t border-slate-100 py-2 text-xs">
                      <span className="text-slate-700">{a.assetClass}</span>
                      <span className="font-mono font-semibold text-emerald-800">
                        {driftLabel(a.driftPercentage)} · {money(Math.abs((amount * Number(a.driftPercentage)) / 100))}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-slate-400">No underweight asset classes</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 text-sm text-slate-500">
          Allocatin breakdown is not available for this portfolio.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <button
          onClick={() => onReview(item)}
          className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900"
        >
          <SlidersHorizontal size={14} />
          Review rebalance plan
        </button>
        <button
          onClick={() => onOpen(item)}
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800"
        >
          View portfolio <ArrowRight size={14} />
        </button>
        <span className="ml-auto text-[10px] text-slate-500">
          {item.info?.reBalancingFrequency ? `Scheduled: ${item.info.reBalancingFrequency}` : "Manual drift review"}
        </span>
      </div>
    </article>
  );
}

export default function RebalancingPage() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All mandates");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [tradeHoldings, setTradeHoldings] = useState([]);
  const [tradeSecurities, setTradeSecurities] = useState([]);
  const [tradeMode, setTradeMode] = useState("sell");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState("");

  // multiple trade lines
  const [sellLines, setSellLines] = useState([]); // [{ holdingId, quantity }]
  const [buyLines, setBuyLines] = useState([]); // [{ securityId, quantity }]

  const loadData = useCallback(async ({ recalculate = false } = {}) => {
    setError("");
    setNotice("");
    if (recalculate) setRefreshing(true); else setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("No signed-in user was found. Sign in again to load portfolio drift checks.");
      }

      const listResponse = await getAllPortfolioDetails(userId);
      const payload = unwrapData(listResponse);
      const list = payload?.portfolioDetailsDTOList || payload?.data?.portfolioDetailsDTOList;
      if (!Array.isArray(list)) {
        throw new Error(payload?.detail || payload?.message || "The portfolio list could not be loaded.");
      }
      const active = list.filter(
        (portfolio) => String(portfolio.portfolioStatus || portfolio.status || "ACTIVE").toUpperCase() === "ACTIVE"
      );
      const results = await Promise.all(
        active.map(async (portfolio) => {
          const [validationResult, infoResult] = await Promise.allSettled([
            recalculate && userId
              ? axios.get(`${API_URL}/drift/calculate/${portfolio.id}/${userId}`)
              : validatePortfolioAllocation(portfolio.id),
            getPortfolioBasicInfo(portfolio.id),
          ]);
          let validation = validationResult.status === "fulfilled" ? unwrapData(validationResult.value) : null;
          if (recalculate && validationResult.status === "fulfilled") {
            const refreshed = await validatePortfolioAllocation(portfolio.id).catch(() => null);
            validation = refreshed ? unwrapData(refreshed) : validation?.allocations ? validation : null;
          }
          const info = infoResult.status === "fulfilled" ? unwrapData(infoResult.value) : null;
          const history = userId ? await getPortfolioDriftHistory(portfolio.id).catch(() => []) : [];
          return {
            portfolio,
            validation,
            info,
            history,
            driftError:
              recalculate && validationResult.status === "rejected"
                ? validationResult.reason?.response?.data?.message ||
                  validationResult.reason?.message ||
                  "Drift calculation failed."
                : null,
          };
        })
      );
      setPortfolios(results);
      if (recalculate) {
        const failed = results.filter((item) => item.driftError);
        if (failed.length) {
          setError(
            `Drift calculation failed for ${failed.map((item) => item.portfolio.name).join(", ")}: ${failed[0].driftError}`
          );
        } else if (!results.length) {
          setNotice("There are no active portfolios to check.");
        } else {
          setNotice(
            `Drift checks completed for ${results.length} active mandate${results.length === 1 ? "" : "s"}.`
          );
        }
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError?.message || "Unable to load portfolio allocations.");
      setPortfolios([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(
    () =>
      portfolios.filter((item) => {
        const text = `${item.portfolio.name || ""} ${item.portfolio.code || ""} ${
          item.info?.themeName || item.portfolio.theme || ""
        }`.toLowerCase();
        const hasBreach = (item.validation?.allocations || []).some(
          (allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT
        );
        return (
          (!query || text.includes(query.toLowerCase())) &&
          (filter === "All mandates" || (filter === "Needs action" ? hasBreach : !hasBreach))
        );
      }),
    [portfolios, query, filter]
  );

  const breached = portfolios.filter((item) =>
    (item.validation?.allocations || []).some(
      (allocation) => Math.abs(Number(allocation.driftPercentage || 0)) >= DRIFT_LIMIT
    )
  );
  const totalCapital = portfolios.reduce(
    (sum, item) =>
      sum +
      Number(
        item.validation?.totalCurrentValue ||
          item.validation?.totalInvestedAmount ||
          item.info?.amount ||
          item.portfolio.aum ||
          0
      ),
    0
  );
  const driftCapital = breached.reduce((sum, item) => {
    const amount = Number(
      item.validation?.totalCurrentValue ||
        item.validation?.totalInvestedAmount ||
        item.info?.amount ||
        item.portfolio.aum ||
        0
    );
    const drift = (item.validation?.allocations || []).reduce(
      (max, allocation) => Math.max(max, Math.abs(Number(allocation.driftPercentage || 0))),
      0
    );
    return sum + (amount * drift) / 100;
  }, 0);

  const openTradeDialog = async (item) => {
    setSelected(item);
    setTradeMode("sell");
    setTradeError("");
    setTradeHoldings([]);
    setTradeSecurities([]);
    setSellLines([{ holdingId: "", quantity: "" }]); // start with one empty sell row
    setBuyLines([{ securityId: "", quantity: "" }]);
    setTradeLoading(true);
    try {
      const [holdingsResult, securityResult, validationResult, infoResult] = await Promise.all([
        getPortfolioHoldings(item.portfolio.id),
        getAllSecuritiesInfo(),
        validatePortfolioAllocation(item.portfolio.id),
        getPortfolioBasicInfo(item.portfolio.id),
      ]);
      const securityPayload = unwrapData(securityResult);
      const validation = unwrapData(validationResult);
      const info = unwrapData(infoResult);
      if (!Array.isArray(securityPayload?.securities)) {
        throw new Error(securityPayload?.message || "Security prices are unavailable. Try again later.");
      }
      setSelected((current) => (current ? { ...current, validation, info } : current));
      setTradeHoldings(Array.isArray(holdingsResult) ? holdingsResult : []);
      setTradeSecurities(securityPayload.securities);
    } catch (tradeLoadError) {
      setTradeError(
        tradeLoadError?.response?.data?.message ||
          tradeLoadError?.message ||
          "Could not load holdings and securities for this rebalance."
      );
    } finally {
      setTradeLoading(false);
    }
  };

  // ---------------- derived values ----------------
  const selectedAllocation = selected?.validation?.allocations || [];

  const sellableHoldings = tradeHoldings.filter((holding) => Number(holding.quantity) > 0);
  const buyableSecurities = tradeSecurities.filter((security) => Number(security.price) > 0);

  const availableCash = Number(selected?.info?.amount || 0);

  // Trades stay quantity/cash validated; target bands only inform the recommendation.
  const sellLineView = (line) => {
    const holding = sellableHoldings.find((h) => String(h.holdingId) === String(line.holdingId));
    const allocation = holding && selectedAllocation.find((a) => Number(a.assetId) === Number(holding.assetId));
    const maxQuantity = Number(holding?.quantity || 0);
    const unitPrice =
      holding && Number(holding.quantity) > 0
        ? Number(holding.currentValue || 0) / Number(holding.quantity)
        : Number(holding?.averageCost || 0);
    const qty = Number(line.quantity);
    const validQty = Number.isInteger(qty) && qty > 0 && qty <= maxQuantity;
    return { holding, allocation, maxQuantity, unitPrice, qty, validQty, proceeds: validQty ? unitPrice * qty : 0 };
  };

  // per-line resolver for a buy row
  const buyLineView = (line) => {
    const security = buyableSecurities.find((s) => String(s.id) === String(line.securityId));
    const allocation = security && selectedAllocation.find((a) => Number(a.assetId) === Number(security.asset?.id));
    const otherSpend = security ? buyLines.filter((other) => other !== line).reduce((sum, other) => {
      const otherSecurity = buyableSecurities.find((s) => String(s.id) === String(other.securityId));
      const quantity = Number(other.quantity);
      return otherSecurity && Number.isInteger(quantity) && quantity > 0
        ? sum + Number(otherSecurity.price || 0) * quantity
        : sum;
    }, 0) : 0;
    const price = Number(security?.price || 0);
    const maxQuantity = security && price > 0
      ? Math.max(0, Math.floor((availableCash - otherSpend + 0.01) / price))
      : 0;
    const qty = Number(line.quantity);
    const validQty = Number.isInteger(qty) && qty > 0 && qty <= maxQuantity;
    return { security, allocation, maxQuantity, price, qty, validQty, cost: validQty ? price * qty : 0 };
  };

  const sellTotal = sellLines.reduce((s, l) => s + sellLineView(l).proceeds, 0);
  const buyTotal = buyLines.reduce((s, l) => s + buyLineView(l).cost, 0);

  // ---------------- line handlers ----------------
  const addSellLine = () => setSellLines((lines) => [...lines, { holdingId: "", quantity: "" }]);
  const addBuyLine = () => setBuyLines((lines) => [...lines, { securityId: "", quantity: "" }]);
  const updateSellLine = (i, patch) =>
    setSellLines((lines) => lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const updateBuyLine = (i, patch) =>
    setBuyLines((lines) => lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeSellLine = (i) => setSellLines((lines) => lines.filter((_, idx) => idx !== i));
  const removeBuyLine = (i) => setBuyLines((lines) => lines.filter((_, idx) => idx !== i));

  // ---------------- batched submit ----------------
  const submitTrade = async (event) => {
    event.preventDefault();
    setTradeError("");
    if (tradeSubmitting || !selected) return;

    try {
      setTradeSubmitting(true);
      let recorded = 0;

      if (tradeMode === "sell") {
        const rows = sellLines.map(sellLineView);
        if (!rows.length) throw new Error("Add at least one sell line.");

        const seenHoldings = new Set();
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r.holding) throw new Error(`Line ${i + 1}: select a holding to sell.`);
          if (!r.validQty)
            throw new Error(`Line ${i + 1}: quantity must be a whole number from 1 to ${r.maxQuantity}.`);
          if (seenHoldings.has(String(r.holding.holdingId)))
            throw new Error(`Line ${i + 1}: this holding is already used in another line.`);
          seenHoldings.add(String(r.holding.holdingId));
        }

        await sellPortfolioHoldings(rows.map((r) => ({ id: r.holding.holdingId, quantity: r.qty })));
        recorded = rows.length;
      } else {
        const rows = buyLines.map(buyLineView);
        if (!rows.length) throw new Error("Add at least one buy line.");

        const seenSecurity = new Set();
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r.security) throw new Error(`Line ${i + 1}: select a security to buy.`);
          if (!r.validQty)
            throw new Error(`Line ${i + 1}: quantity must be a whole number from 1 to ${r.maxQuantity}.`);
          if (seenSecurity.has(String(r.security.id)))
            throw new Error(`Line ${i + 1}: this security is already used in another line.`);
          seenSecurity.add(String(r.security.id));
        }

        await buyPortfolioSecurities(rows.map((r) => ({
          portfolioId: selected.portfolio.id,
          securityId: r.security.id,
          quantity: r.qty,
        })));
        recorded = rows.length;
      }

      setSelected(null);
      setSellLines([]);
      setBuyLines([]);
      await loadData({ recalculate: true });
      setNotice(`${recorded} ${tradeMode === "sell" ? "sell" : "buy"} order${recorded === 1 ? "" : "s"} recorded.`);
    } catch (tradeFailure) {
      setTradeError(
        tradeFailure?.response?.data?.message || tradeFailure?.message || "The trades could not be placed."
      );
    } finally {
      setTradeSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fc] font-sans text-slate-900">
      <SideBarComponent activePage="Rebalancing" />
      <div className="ml-[257px] min-h-screen">
        {/* <TopBarComponent /> */}
        <main className="mx-auto max-w-[1600px] px-5 py-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-blue-800">
                <span>Institutional drift governance</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono normal-case tracking-normal text-slate-500">Live allocation review</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Portfolio Rebalancing</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Monitor asset class drift against each portfolio’s theme and review the trades needed to restore its
                target mix.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadData({ recalculate: true })}
                disabled={refreshing || loading}
                className="flex items-center gap-2 rounded-md bg-blue-800 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Checking drift…" : "Run drift checks"}
              </button>
            </div>
          </div>

          {notice && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 size={15} />
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <SummaryCard
              icon={AlertTriangle}
              label="Mandates requiring action"
              value={loading ? "—" : breached.length}
              detail={`${portfolios.length} active portfolios reviewed`}
              tone={breached.length ? "red" : "green"}
            />
            <SummaryCard
              icon={Clock3}
              label="Drift tolerance"
              value={`±${DRIFT_LIMIT.toFixed(1)}%`}
              detail="Configured allocation validation band"
              tone="blue"
            />
            <SummaryCard
              icon={Wallet}
              label="Capital at drift"
              value={loading ? "—" : money(driftCapital)}
              detail={`${breached.length} affected mandate${breached.length === 1 ? "" : "s"} · active book ${money(
                totalCapital
              )}`}
              tone="amber"
            />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active mandates</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Current allocation compared with the selected theme’s target.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="bg-transparent text-xs text-slate-700 outline-none"
                >
                  <option>All mandates</option>
                  <option>Needs action</option>
                  <option>Within tolerance</option>
                </select>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter mandates…"
                className="h-9 w-48 rounded-md border border-slate-200 bg-white px-3 text-xs outline-none placeholder:text-slate-400 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                Loading portfolio allocations…
              </div>
            ) : filtered.length ? (
              filtered.map((item) => (
                <PortfolioCard
                  key={item.portfolio.id}
                  item={item}
                  onReview={openTradeDialog}
                  onOpen={(entry) => navigate(`/portfolio/${entry.portfolio.id}`)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <BellRing className="mx-auto mb-2 text-slate-400" size={22} />
                <div className="text-sm font-semibold text-slate-800">
                  {portfolios.length ? "No mandates match this filter" : "No active portfolios to review"}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Active portfolio allocations will appear here once available.
                </p>
              </div>
            )}
          </div>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Drift detection history</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Saved drift records from scheduled and manual calculations.
                </p>
              </div>
              <button
                type="button"
                disabled
                title="History export is not available yet"
                className="flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400"
              >
                <Download size={14} />
                Export history
              </button>
            </div>
            {portfolios.some((item) => item.history?.length) ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="bg-[#f0f4ff] text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-5 py-3">Detected</th>
                      <th className="px-5 py-3">Portfolio</th>
                      <th className="px-5 py-3">Asset class</th>
                      <th className="px-5 py-3">Drift</th>
                      <th className="px-5 py-3">Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolios
                      .flatMap((item) => (item.history || []).map((entry) => ({ ...entry, portfolioName: item.portfolio.name })))
                      .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt) || b.id - a.id)
                      .slice(0, 30)
                      .map((entry) => (
                        <tr key={entry.id} className="border-t border-slate-100 text-xs">
                          <td className="whitespace-nowrap px-5 py-3 font-mono text-slate-700">
                            {displayDate(entry.detectedAt)}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800">{entry.portfolioName}</td>
                          <td className="px-5 py-3 text-slate-600">{entry.assetClass}</td>
                          <td
                            className={`px-5 py-3 font-mono font-semibold ${
                              Number(entry.driftPercent) > 0 ? "text-red-700" : "text-emerald-800"
                            }`}
                          >
                            {driftLabel(entry.driftPercent)}
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
                              Drift detected
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center px-5 py-9 text-center">
                <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                  <Clock3 size={20} />
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-800">No drift records found</div>
                <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                  Saved drift records will appear here after scheduled or manual drift calculations detect an
                  out-of-band allocation.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !tradeSubmitting) setSelected(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  Rebalance trade ticket
                </div>
                <h2 id="plan-title" className="mt-1 text-lg font-bold text-slate-900">
                  {selected.portfolio.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Drift suggestions are shown for guidance. Record any buy or sell that fits the portfolio cash and holdings.
                </p>
              </div>
              <button
                disabled={tradeSubmitting}
                onClick={() => setSelected(null)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-slate-100 px-5 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTradeMode("sell");
                    setTradeError("");
                  }}
                  className={`rounded-t-md px-4 py-2 text-xs font-semibold ${
                    tradeMode === "sell" ? "bg-red-50 text-red-800" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <ArrowDownRight className="mr-1 inline" size={14} />
                  Sell overweight
                </button>
                <button
                  onClick={() => {
                    setTradeMode("buy");
                    setTradeError("");
                  }}
                  className={`rounded-t-md px-4 py-2 text-xs font-semibold ${
                    tradeMode === "buy" ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpRight className="mr-1 inline" size={14} />
                  Buy underweight
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              {tradeError && (
                <div
                  role="alert"
                  className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                >
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  {tradeError}
                </div>
              )}

              {tradeLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Loading live holdings, prices, and eligible securities…
                </div>
              ) : tradeMode === "sell" ? (
                <form onSubmit={submitTrade} className="space-y-4">
                  <div className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-900">
                    Choose any current holding to sell. Quantity cannot exceed the amount currently held; proceeds return to portfolio cash.
                  </div>

                  {sellLines.map((line, index) => {
                    const view = sellLineView(line);
                    const usedIds = sellLines.filter((_, idx) => idx !== index).map((l) => String(l.holdingId));
                    return (
                      <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Sell line {index + 1}
                          </span>
                          {sellLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSellLine(index)}
                              className="rounded-md px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <label className="block text-xs font-semibold text-slate-700">
                          Holding to sell
                          <select
                            required
                            value={line.holdingId}
                            onChange={(event) =>
                              updateSellLine(index, { holdingId: event.target.value, quantity: "" })
                            }
                            className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-400"
                          >
                            <option value="">Select a holding to sell</option>
                            {sellableHoldings.map((holding) => (
                              <option
                                key={holding.holdingId}
                                value={holding.holdingId}
                                disabled={usedIds.includes(String(holding.holdingId))}
                              >
                                {holding.securityName} ({holding.symbol || "—"}) · {holding.assetClass} ·{" "}
                                {Number(holding.quantity).toLocaleString("en-IN")} held
                              </option>
                            ))}
                          </select>
                        </label>

                        {view.holding && (
                          <>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <DetailTile
                                label={String(view.holding.symbol || "").toUpperCase() === "GOLD" ? "Grams held" : "Units held"}
                                value={`${Number(view.holding.quantity).toLocaleString("en-IN")}${String(view.holding.symbol || "").toUpperCase() === "GOLD" ? " g" : ""}`}
                              />
                              <DetailTile
                                label="Max sell quantity"
                                value={view.maxQuantity.toLocaleString("en-IN")}
                              />
                              <DetailTile label="Available cash" value={money(availableCash)} />
                            </div>
                            <label className="block text-xs font-semibold text-slate-700">
                              Sell quantity ({String(view.holding.symbol || "").toUpperCase() === "GOLD" ? "whole grams" : "whole units"})
                              <input
                                required
                                type="number"
                                step="1"
                                min="1"
                                max={view.maxQuantity}
                                value={line.quantity}
                                onChange={(event) => updateSellLine(index, { quantity: event.target.value })}
                                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono text-sm outline-none focus:border-red-400"
                              />
                            </label>
                            <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
                              <span className="text-slate-600">Line proceeds</span>
                              <strong className="font-mono text-slate-900">{money(view.proceeds)}</strong>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addSellLine}
                    className="w-full rounded-md border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                  >
                    + Add another holding
                  </button>

                  {!sellableHoldings.length && (
                    <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                      There are no current holdings available to sell.
                    </div>
                  )}

                  <div className="flex justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs">
                    <span className="text-red-800">Total estimated proceeds</span>
                    <strong className="font-mono text-red-900">{money(sellTotal)}</strong>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={tradeSubmitting || !sellLines.length}
                      className="rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {tradeSubmitting
                        ? "Recording…"
                        : `Record ${sellLines.length} sell${sellLines.length === 1 ? "" : "s"}`}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitTrade} className="space-y-4">
                  <div className="rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                    Add one or more securities to buy. Available cash is checked; theme drift remains visible as a recommendation.
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-xs">
                    <span className="text-slate-600">Available portfolio cash</span>
                    <strong className="font-mono text-slate-900">{money(availableCash)}</strong>
                  </div>

                  {buyLines.map((line, index) => {
                    const view = buyLineView(line);
                    const usedIds = buyLines.filter((_, idx) => idx !== index).map((l) => String(l.securityId));
                    return (
                      <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            Buy line {index + 1}
                          </span>
                          {buyLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBuyLine(index)}
                              className="rounded-md px-2 py-1 text-[11px] text-emerald-800 hover:bg-emerald-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <label className="block text-xs font-semibold text-slate-700">
                          Security to buy
                          <select
                            required
                            value={line.securityId}
                            onChange={(event) =>
                              updateBuyLine(index, { securityId: event.target.value, quantity: "" })
                            }
                            className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                          >
                            <option value="">Select a security</option>
                            {[...new Set(buyableSecurities.map((s) => String(s.asset?.assetClass || "Other")))].map((assetClass) => (
                              <optgroup key={assetClass} label={assetClass}>
                                {buyableSecurities.filter((s) => String(s.asset?.assetClass || "Other") === assetClass).map((security) => (
                                  <option key={security.id} value={security.id} disabled={usedIds.includes(String(security.id))}>
                                    {security.name} ({security.symbol || security.isin || "—"}) · {money(security.price)}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </label>

                        {view.security && (
                          <>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <DetailTile label="Current price" value={money(view.price)} />
                              <DetailTile
                                label="Max buy quantity"
                                value={view.maxQuantity.toLocaleString("en-IN")}
                              />
                              <DetailTile label="Asset class" value={view.security.asset?.assetClass || "—"} />
                            </div>
                            <label className="block text-xs font-semibold text-slate-700">
                              Buy quantity ({String(view.security.symbol || "").toUpperCase() === "GOLD" ? "whole grams" : "whole units"})
                              <input
                                required
                                type="number"
                                step="1"
                                min="1"
                                max={view.maxQuantity}
                                value={line.quantity}
                                onChange={(event) => updateBuyLine(index, { quantity: event.target.value })}
                                className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono text-sm outline-none focus:border-emerald-400"
                              />
                            </label>
                            <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
                              <span className="text-slate-600">Line cost</span>
                              <strong className="font-mono text-slate-900">{money(view.cost)}</strong>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addBuyLine}
                    className="w-full rounded-md border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                  >
                    + Add another security
                  </button>

                  {!buyableSecurities.length && (
                    <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                      No priced securities are currently available to buy.
                    </div>
                  )}

                  <div className="flex justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs">
                    <span className="text-emerald-800">Total estimated purchase cost</span>
                    <strong className="font-mono text-emerald-900">{money(buyTotal)}</strong>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={tradeSubmitting || !buyLines.length}
                      className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {tradeSubmitting
                        ? "Recording…"
                        : `Record ${buyLines.length} buy${buyLines.length === 1 ? "" : "s"}`}
                    </button>
                  </div>
                </form>
              )}

              <p className="mt-4 text-[10px] leading-4 text-slate-400">
                Recording a trade updates the portfolio holdings ledger and cash balance at the backend’s current
                quote. It does not submit an order to a broker.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DetailTile({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 truncate font-mono text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function getMaxSellQuantity(holding, allocation, validation) {
  const total = Number(validation?.totalCurrentValue || validation?.totalInvestedAmount || 0);
  const current = Number(allocation?.currentPercentage || 0);
  const target = Number(allocation?.targetPercentage || 0);
  const unitMarketValue = Number(holding?.currentValue || 0) / Math.max(1, Number(holding?.quantity || 0));
  if (total <= 0 || unitMarketValue <= 0 || current <= target || target >= 100) return 0;
  const currentClassCost = (total * current) / 100;
  const targetClassCost = (total * target) / 100;
  const allowedCostReduction = currentClassCost - targetClassCost;
  return Math.max(
    0,
    Math.min(Number(holding.quantity || 0), Math.floor((allowedCostReduction + 0.01) / unitMarketValue))
  );
}

function getMaxBuyQuantity(security, allocation, validation, availableCash, portfolioCash = availableCash) {
  const total = Number(validation?.totalCurrentValue ?? (Number(validation?.totalInvestedAmount || 0) + Number(portfolioCash || 0)));
  const current = Number(allocation?.currentPercentage || 0);
  const target = Number(allocation?.targetPercentage || 0);
  const price = Number(security?.price || 0);
  if (total <= 0 || price <= 0 || current >= target || target >= 100) return 0;
  const currentClassCost = (total * current) / 100;
  const targetClassCost = (total * target) / 100;
  const allowedCostIncrease = targetClassCost - currentClassCost;
  return Math.max(0, Math.floor((Math.min(allowedCostIncrease, Number(availableCash || 0)) + 0.01) / price));
}
