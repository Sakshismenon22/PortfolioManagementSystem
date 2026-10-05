import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import { getAllSecuritiesInfo } from "../services/securityService";
import { getAllThemes } from "../services/themeService";
import { createAndActivatePortfolio } from "../services/portfolioService";

const FREQUENCIES = [
  ["DAILY", "Daily"],
  ["WEEKLY", "Weekly"],
  ["MONTHLY", "Monthly"],
  ["QUARTERLY", "Quarterly"],
  ["SEMI_ANNUAL", "Semi-annual"],
  ["YEARLY", "Yearly"],
];

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatLabel = (value) =>
  String(value || "—")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const CreatePortfolioPage = () => {
  const navigate = useNavigate();
  const [securities, setSecurities] = useState([]);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [securitySearch, setSecuritySearch] = useState("");
  const [selectedSecurities, setSelectedSecurities] = useState([]);
  const [portfolio, setPortfolio] = useState({
    name: "",
    portfolioType: "WEIGHTAGE",
    amount: "",
    currency: "INR",
    exchange: "NSE",
    themeId: "",
    benchmark: "NIFTY_50",
    reBalancingFrequency: "MONTHLY",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [securityResponse, themeResponse] = await Promise.all([
          getAllSecuritiesInfo(),
          getAllThemes(),
        ]);
        const securityData = securityResponse?.data?.data ?? securityResponse?.data;
        const themeData = themeResponse?.data ?? themeResponse;
        const securityList = securityData?.securities;
        const themeList = Array.isArray(themeData) ? themeData : themeData?.data;
        if (!Array.isArray(securityList)) {
          throw new Error(securityData?.message || "Could not load the security list.");
        }
        if (!Array.isArray(themeList)) {
          throw new Error(themeData?.message || "Could not load the theme list.");
        }
        if (active) {
          setSecurities(securityList);
          setThemes(themeList.filter((theme) => theme.status !== false));
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error?.response?.data?.message || error?.message || "Portfolio setup data could not be loaded."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const selectedTheme = themes.find((theme) => String(theme.id) === String(portfolio.themeId));
  const themeRules = selectedTheme?.allocationRuleList || [];
  const rulesByAssetId = new Map(
    themeRules.map((rule) => [Number(rule.asset?.id), Number(rule.percentage || 0)])
  );
  const selectedIds = new Set(selectedSecurities.map((security) => String(security.id)));

  const eligibleSecurities = useMemo(() => {
    const allowedAssetIds = new Set(
      (selectedTheme?.allocationRuleList || [])
        .filter((rule) => Number(rule.percentage || 0) > 0)
        .map((rule) => Number(rule.asset?.id))
    );
    const query = securitySearch.trim().toLowerCase();
    return securities
      .filter(
        (security) =>
          Number(security.price) > 0 &&
          allowedAssetIds.has(Number(security.asset?.id)) &&
          (!query ||
            [security.name, security.symbol, security.isin, security.gicsSector]
              .some((value) => String(value || "").toLowerCase().includes(query)))
      )
      .slice(0, 60);
  }, [securities, selectedTheme, securitySearch]);

  const allocationsByAssetId = selectedSecurities.reduce((map, security) => {
    const assetId = Number(security.asset?.id);
    map.set(assetId, (map.get(assetId) || 0) + Number(security.allocation || 0));
    return map;
  }, new Map());

  const selectedAllocationTotal = selectedSecurities.reduce(
    (total, security) => total + Number(security.allocation || 0),
    0
  );
  const amount = Number(portfolio.amount) || 0;
  const selectedTotal = selectedSecurities.reduce((total, security) => {
    const allocatedAmount = (amount * Number(security.allocation || 0)) / 100;
    return total + allocatedAmount;
  }, 0);
  const allocationRows = selectedSecurities.map((security) => {
    const allocation = Number(security.allocation || 0);
    const price = Number(security.price || 0);
    const allocatedAmount = (amount * allocation) / 100;
    const quantity = price > 0 ? Math.floor(allocatedAmount / price) : 0;
    return { ...security, allocation, allocatedAmount, quantity };
  });

  const allocationChecks = themeRules.map((rule) => {
    const assetId = Number(rule.asset?.id);
    const target = Number(rule.percentage || 0);
    const actual = allocationsByAssetId.get(assetId) || 0;
    return { assetId, name: rule.asset?.assetClass || "Asset class", target, actual, valid: Math.abs(actual - target) < 0.01 };
  });
  const themeAllocationValid = allocationChecks.length > 0 && allocationChecks.every((row) => row.valid);
  const quantitiesValid = allocationRows.length > 0 && allocationRows.every((row) => row.quantity > 0);

  const updateField = (field, value) => setPortfolio((current) => ({ ...current, [field]: value }));

  const selectTheme = (themeId) => {
    if (String(themeId) !== String(portfolio.themeId) && selectedSecurities.length) {
      setSelectedSecurities([]);
      toast.info("Selected securities were cleared because they depend on the chosen theme.");
    }
    updateField("themeId", themeId);
  };

  const addSecurity = (security) => {
    if (selectedIds.has(String(security.id))) return;
    const assetId = Number(security.asset?.id);
    const target = rulesByAssetId.get(assetId) || 0;
    const alreadyAllocated = allocationsByAssetId.get(assetId) || 0;
    const remaining = Math.max(0, Math.round((target - alreadyAllocated) * 100) / 100);
    setSelectedSecurities((current) => [...current, { ...security, allocation: remaining }]);
    setSecuritySearch("");
  };

  const updateAllocation = (securityId, value) => {
    const parsed = value === "" ? "" : Math.max(0, Math.min(100, Number(value) || 0));
    setSelectedSecurities((current) =>
      current.map((security) =>
        String(security.id) === String(securityId) ? { ...security, allocation: parsed } : security
      )
    );
  };

  const removeSecurity = (securityId) =>
    setSelectedSecurities((current) => current.filter((security) => String(security.id) !== String(securityId)));

  const submit = async (event) => {
    event.preventDefault();
    if (!portfolio.name.trim()) return toast.error("Enter a portfolio name.");
    if (!selectedTheme) return toast.error("Select a theme.");
    if (amount <= 0) return toast.error("Enter a portfolio amount greater than zero.");
    if (!portfolio.benchmark) return toast.error("Select a benchmark.");
    if (!portfolio.reBalancingFrequency) return toast.error("Select a rebalancing frequency.");
    if (!selectedSecurities.length) return toast.error("Search and add at least one security.");
    if (!themeAllocationValid) return toast.error("Security allocations must match every theme asset-class target.");
    if (!quantitiesValid) return toast.error("Each selected security must have enough allocation to buy at least one unit.");

    const userId = Number(localStorage.getItem("userId"));
    if (!userId) return toast.error("Your user session is missing. Sign in again.");
    const createPortfolioDTO = {
      name: portfolio.name.trim(),
      portfolioType: portfolio.portfolioType,
      currency: portfolio.currency,
      benchmark: portfolio.benchmark,
      exchange: portfolio.exchange,
      reBalancingFrequency: portfolio.reBalancingFrequency,
      amount,
      userId,
      portfolioStatus: "DRAFT",
      themeId: Number(portfolio.themeId),
    };
    const addPortfolioHoldingDTOList = allocationRows.map((security) => ({
      portfolioId: null,
      securityMasterId: security.id,
      quantity: security.quantity,
      assetId: security.asset?.id,
    }));

    setSaving(true);
    try {
      const response = await createAndActivatePortfolio({ createPortfolioDTO, addPortfolioHoldingDTOList });
      const activationFailed = /validation failed|balance is insufficient/i.test(response?.message || "");
      if (!response?.success || activationFailed) {
        throw new Error(response?.message || "The portfolio could not be created.");
      }
      toast.success(response.message || "Portfolio created and activated.");
      navigate("/portfolio");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Could not create this portfolio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fd] text-slate-900">
      <SideBarComponent activePage="Portfolios" />
      <div className="ml-[257px] max-[760px]:ml-0">
        <TopBarComponent />
        <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <button onClick={() => navigate("/portfolio")} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-800">
                <ArrowLeft size={14} /> Portfolios
              </button>
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-blue-800">Mandate setup</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Create New Portfolio</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">Configure the mandate, choose a theme, then search and add securities to match its target allocation.</p>
            </div>
            <button type="button" onClick={() => navigate("/portfolio")} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>

          {loadError && <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertTriangle size={17} />{loadError}</div>}
          {loading ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading themes and securities…</div> : <form onSubmit={submit} className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <SectionHeading icon={WalletCards} title="Portfolio details" description="Set the mandate basics and review the target allocation selected by its theme." />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Portfolio name" className="sm:col-span-2">
                  <input required maxLength={100} value={portfolio.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. Growth Portfolio" className={inputClass} />
                </Field>
                <Field label="Portfolio type">
                  <select value={portfolio.portfolioType} onChange={(event) => updateField("portfolioType", event.target.value)} className={inputClass}>
                    <option value="WEIGHTAGE">Weightage</option><option value="AMOUNT">Amount</option>
                  </select>
                </Field>
                <Field label="Portfolio amount">
                  <input required type="number" min="1" step="0.01" value={portfolio.amount} onChange={(event) => updateField("amount", event.target.value)} placeholder="₹ 1,00,00,000" className={inputClass} />
                </Field>
                <Field label="Theme">
                  <select required value={portfolio.themeId} onChange={(event) => selectTheme(event.target.value)} className={inputClass}>
                    <option value="">Choose a theme</option>
                    {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                  </select>
                </Field>
                <Field label="Benchmark">
                  <select required value={portfolio.benchmark} onChange={(event) => updateField("benchmark", event.target.value)} className={inputClass}>
                    <option value="NIFTY_50">NIFTY 50</option>
                  </select>
                </Field>
                <Field label="Rebalancing frequency">
                  <select required value={portfolio.reBalancingFrequency} onChange={(event) => updateField("reBalancingFrequency", event.target.value)} className={inputClass}>
                    {FREQUENCIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
              </div>

              {selectedTheme && <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-xs font-bold text-slate-800">{selectedTheme.name} · theme targets</div><div className="mt-0.5 text-[10px] text-slate-500">Selected security weights below must satisfy each class target.</div></div><span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-blue-800">{formatLabel(selectedTheme.risk)} risk</span></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {themeRules.map((rule) => <div key={rule.id ?? rule.asset?.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-xs"><span className="text-slate-600">{formatLabel(rule.asset?.assetClass)}</span><strong className="font-mono text-slate-900">{Number(rule.percentage || 0).toFixed(2)}%</strong></div>)}
                </div>
              </div>}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <SectionHeading icon={Search} title="Find securities" description="Search by name, symbol, ISIN, or sector." />
              <div className="relative mt-3">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={securitySearch} onChange={(event) => setSecuritySearch(event.target.value)} disabled={!selectedTheme} placeholder={selectedTheme ? "Search name, symbol, ISIN, or sector" : "Choose a theme to enable security search"} className={`${inputClass} pl-9`} />
                {selectedTheme && securitySearch.trim() && <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                  {eligibleSecurities.length ? <>
                    {eligibleSecurities.slice(0, 8).map((security) => {
                      const added = selectedIds.has(String(security.id));
                      return <div key={security.id} className="flex min-h-12 items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-slate-800">{security.name}</div>
                          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] text-slate-500"><span className="truncate font-mono">{security.symbol || security.isin || "—"}</span><span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5">{formatLabel(security.asset?.assetClass)}</span></div>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-slate-600">{formatMoney(security.price)}</span>
                        <button type="button" onClick={() => addSecurity(security)} disabled={added} className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-[10px] font-semibold ${added ? "bg-emerald-50 text-emerald-700" : "bg-blue-800 text-white hover:bg-blue-900"}`}>{added ? <><CheckCircle2 size={12} /> Added</> : <><Plus size={12} /> Add</>}</button>
                      </div>;
                    })}
                    {eligibleSecurities.length > 8 && <div className="bg-slate-50 px-3 py-2 text-[10px] text-slate-500">Showing 8 matches. Refine your search to see other securities.</div>}
                  </> : <div className="px-3 py-3 text-xs text-slate-500">No matching priced securities found for this theme.</div>}
                </div>}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <SectionHeading icon={WalletCards} title="Portfolio securities" description="Enter the target portfolio weight for each selected security." />
                <div className="flex gap-2 text-[10px]"><Metric label="Selected" value={selectedSecurities.length} /><Metric label="Weight assigned" value={`${selectedAllocationTotal.toFixed(2)}%`} /></div>
              </div>
              {selectedSecurities.length ? <div className="overflow-x-auto">
                <div className="min-w-[780px]">
                  <div className="grid grid-cols-[minmax(230px,2fr)_minmax(120px,1fr)_minmax(110px,.8fr)_110px_130px_52px] gap-3 bg-[#eff4fc] px-4 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:px-5"><span>Security</span><span>Asset class</span><span>Price / unit</span><span>Weight %</span><span>Est. amount · units</span><span /></div>
                  {allocationRows.map((security) => <div key={security.id} className="grid grid-cols-[minmax(230px,2fr)_minmax(120px,1fr)_minmax(110px,.8fr)_110px_130px_52px] items-center gap-3 border-t border-slate-100 px-4 py-3 sm:px-5">
                    <div className="min-w-0"><div className="truncate text-xs font-semibold text-slate-900">{security.name}</div><div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{security.symbol || "—"}{security.isin ? ` · ${security.isin}` : ""}</div></div>
                    <span className="w-fit rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800">{formatLabel(security.asset?.assetClass)}</span>
                    <span className="font-mono text-xs text-slate-700">{formatMoney(security.price)}</span>
                    <label className="flex items-center gap-1"><input aria-label={`Allocation percentage for ${security.name}`} type="number" min="0" max="100" step="0.01" value={security.allocation} onChange={(event) => updateAllocation(security.id, event.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 font-mono text-xs outline-none focus:border-blue-500" /><span className="text-xs text-slate-400">%</span></label>
                    <div><div className="font-mono text-xs font-semibold text-slate-800">{formatMoney(security.allocatedAmount)}</div><div className={`mt-0.5 text-[10px] ${security.quantity > 0 ? "text-slate-500" : "text-red-600"}`}>{security.quantity.toLocaleString("en-IN")} units estimated</div></div>
                    <button type="button" aria-label={`Remove ${security.name}`} onClick={() => removeSecurity(security.id)} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /></button>
                  </div>)}
                </div>
              </div> : <div className="px-5 py-10 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Search size={18} /></div><div className="mt-2 text-sm font-semibold text-slate-800">No securities selected</div><p className="mt-1 text-xs text-slate-500">Use the search above to add securities to this portfolio.</p></div>}

              <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  {allocationChecks.length ? allocationChecks.map((check) => <div key={check.assetId} className={`flex items-center justify-between rounded-md px-3 py-2 text-[10px] ${check.valid ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}><span className="flex items-center gap-1.5">{check.valid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}{formatLabel(check.name)}</span><span className="font-mono">{check.actual.toFixed(2)}% / {check.target.toFixed(2)}%</span></div>) : <p className="text-xs text-slate-500">Select a theme to review allocation targets.</p>}
                </div>
                <div className="text-right"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Allocation amount</div><div className="mt-0.5 font-mono text-sm font-bold text-slate-900">{formatMoney(selectedTotal)}</div><div className="mt-0.5 text-[10px] text-slate-500">Unallocated cash after whole-unit rounding: {formatMoney(Math.max(0, amount - allocationRows.reduce((sum, row) => sum + row.quantity * Number(row.price || 0), 0)))}</div></div>
              </div>
            </section>

            {selectedTheme && <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${themeAllocationValid && quantitiesValid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              {themeAllocationValid && quantitiesValid ? <ShieldCheck size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
              <span>{themeAllocationValid ? quantitiesValid ? "Allocations match the theme and all securities have a purchasable whole-unit quantity." : "At least one allocation is too small to purchase a whole unit; adjust the amount or weights." : "Adjust weights so the total for each asset class matches the selected theme."}</span>
            </div>}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">{selectedSecurities.length} securities · {formatMoney(amount)} mandate · {formatLabel(portfolio.reBalancingFrequency)} rebalancing</div>
              <button type="submit" disabled={saving || loading} className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Creating portfolio…" : "Create & Activate Portfolio"}<CheckCircle2 size={15} /></button>
            </div>
          </form>}
        </main>
      </div>
    </div>
  );
};

const inputClass = "mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({ label, children, className = "" }) {
  return <label className={`block text-[10px] font-bold uppercase tracking-wide text-slate-500 ${className}`}>{label}{children}</label>;
}

function SectionHeading({ icon: Icon, title, description }) {
  return <div className="flex items-start gap-2.5"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-800"><Icon size={16} /></div><div><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="mt-0.5 text-[10px] text-slate-500">{description}</p></div></div>;
}

function Metric({ label, value }) {
  return <div className="rounded-md bg-slate-50 px-3 py-2 text-right"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</div><div className="mt-0.5 font-mono text-xs font-semibold text-slate-800">{value}</div></div>;
}

export default CreatePortfolioPage;
