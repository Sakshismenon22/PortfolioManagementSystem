import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import { getAllThemes } from "../services/themeService";
import { createPortfolio } from "../services/portfolioService";

const FREQUENCIES = [
  ["DAILY", "Daily"], ["WEEKLY", "Weekly"], ["MONTHLY", "Monthly"],
  ["QUARTERLY", "Quarterly"], ["SEMI_ANNUAL", "Semi-annual"], ["YEARLY", "Yearly"],
];

const CreatePortfolioPage = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [portfolio, setPortfolio] = useState({
    name: "", portfolioType: "WEIGHTAGE", amount: "", currency: "INR",
    exchange: "NSE", themeId: "", benchmark: "NIFTY_50", reBalancingFrequency: "MONTHLY",
  });

  useEffect(() => {
    let active = true;
    getAllThemes(Number(localStorage.getItem("userId")))
      .then((response) => {
        const payload = response?.data ?? response;
        const list = Array.isArray(payload) ? payload : payload?.data;
        if (!Array.isArray(list)) throw new Error(payload?.message || "Could not load themes.");
        if (active) setThemes(list.filter((theme) => theme.status !== false));
      })
      .catch((error) => {
        if (active) setLoadError(error?.response?.data?.message || error?.message || "Themes could not be loaded.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const updateField = (field, value) => setPortfolio((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const userId = Number(localStorage.getItem("userId"));
    if (!userId) return toast.error("Your user session is missing. Sign in again.");
    setSaving(true);
    try {
      const response = await createPortfolio({
        ...portfolio,
        name: portfolio.name.trim(),
        amount: Number(portfolio.amount),
        userId,
        themeId: Number(portfolio.themeId),
        portfolioStatus: "NEW",
      });
      if (!response?.success || !response?.data?.id) {
        throw new Error(response?.message || "Could not create the portfolio.");
      }
      toast.success("Portfolio created. Add holdings from its details page to validate and activate it.");
      navigate(`/portfolio/${response.data.id}`, { state: { portfolio: response.data } });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Could not create this portfolio.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  return (
    <div className="min-h-screen bg-[#f6f8fd] text-slate-900">
      <SideBarComponent activePage="Portfolios" />
      <div className="ml-[257px] max-[760px]:ml-0">
        <TopBarComponent />
        <main className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
          <button onClick={() => navigate("/portfolio")} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-800">
            <ArrowLeft size={14} /> Portfolios
          </button>
          <div className="mb-5">
            <div className="text-[10px] font-bold uppercase tracking-[.14em] text-blue-800">Mandate setup</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Create New Portfolio</h1>
            <p className="mt-1 text-sm text-slate-500">Set up the portfolio mandate first. You can add holdings and activate it from the details page.</p>
          </div>
          {loadError && <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertTriangle size={17} />{loadError}</div>}
          {loading ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading themes…</div> : (
            <form onSubmit={submit} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-800"><WalletCards size={18} /></span>
                <div><h2 className="text-sm font-bold">Portfolio details</h2><p className="mt-0.5 text-[11px] text-slate-500">All fields can be reviewed before you add holdings.</p></div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Portfolio name"><input required maxLength={100} value={portfolio.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Growth Portfolio" className={inputClass} /></Field>
                <Field label="Portfolio type"><select value={portfolio.portfolioType} onChange={(e) => updateField("portfolioType", e.target.value)} className={inputClass}><option value="WEIGHTAGE">Weightage</option><option value="AMOUNT">Amount</option></select></Field>
                <Field label="Portfolio amount"><input required type="number" min="1" step="0.01" value={portfolio.amount} onChange={(e) => updateField("amount", e.target.value)} placeholder="₹ 1,00,00,000" className={inputClass} /></Field>
                <Field label="Theme"><select required value={portfolio.themeId} onChange={(e) => updateField("themeId", e.target.value)} className={inputClass}><option value="">Choose a theme</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></Field>
                <Field label="Benchmark"><select required value={portfolio.benchmark} onChange={(e) => updateField("benchmark", e.target.value)} className={inputClass}><option value="NIFTY_50">NIFTY 50</option></select></Field>
                <Field label="Rebalancing frequency"><select required value={portfolio.reBalancingFrequency} onChange={(e) => updateField("reBalancingFrequency", e.target.value)} className={inputClass}>{FREQUENCIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                <span className="rounded bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">Status · New</span>
                <div className="flex gap-2"><button type="button" onClick={() => navigate("/portfolio")} className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving || !themes.length} className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Creating…" : "Create Portfolio"}<CheckCircle2 size={15} /></button></div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

function Field({ label, children }) {
  return <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}{children}</label>;
}

export default CreatePortfolioPage;
