import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CalendarDays, Landmark, TrendingUp, Wallet } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getNifty50History } from "../services/benchmarkService";

const dateToIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateToNse = (isoDate) => {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};
const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const Metric = ({ label, value, detail, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-800",
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-md p-1.5 ${tones[tone]}`}><Icon size={14} /></span>
      </div>
      <p className="mt-1 truncate font-mono text-lg font-semibold text-slate-900">{value}</p>
      {detail && <p className="mt-0.5 truncate text-[10px] text-slate-500">{detail}</p>}
    </article>
  );
};

export default function PortfolioBenchmarkView({ portfolio, holdings, cashBalance, invested, currentValue, pnl, returnPercentage, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const firstBuyDate = useMemo(() => {
    const dates = (holdings || []).map((holding) => holding.firstBuyDate).filter(Boolean).sort();
    if (dates.length) return dates[0];
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - 1);
    return dateToIso(fallback);
  }, [holdings]);

  useEffect(() => {
    let cancelled = false;
    const fromDate = new Date(`${firstBuyDate}T00:00:00`);
    fromDate.setDate(fromDate.getDate() - 10);
    const from = dateToNse(dateToIso(fromDate));
    const to = dateToNse(dateToIso(new Date()));
    setLoading(true);
    setError("");
    getNifty50History(from, to)
      .then((points) => {
        if (!cancelled) setHistory(Array.isArray(points) ? points.filter((point) => point?.date && Number(point.close) > 0) : []);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setHistory([]);
          setError(requestError?.response?.data?.message || requestError.message || "NIFTY 50 history is unavailable.");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [firstBuyDate]);

  const chart = useMemo(() => {
    const points = [...history].sort((a, b) => a.date.localeCompare(b.date));
    if (!points.length) return { data: [], niftyReturn: null, firstClose: null, lastClose: null };
    let baselineIndex = -1;
    points.forEach((point, index) => { if (point.date <= firstBuyDate) baselineIndex = index; });
    const base = Number(points[baselineIndex >= 0 ? baselineIndex : 0]?.close || 0);
    const latestClose = Number(points[points.length - 1]?.close || 0);
    const today = dateToIso(new Date());
    const dates = [...new Set([...points.map((point) => point.date), firstBuyDate, today])].sort();
    const startTime = new Date(`${firstBuyDate}T00:00:00`).getTime();
    const endTime = new Date(`${today}T00:00:00`).getTime();
    const portfolioReturn = Number(returnPercentage);
    const data = dates.map((date) => {
      const point = points.find((candidate) => candidate.date === date);
      let close = point ? Number(point.close) : null;
      if (close == null) {
        for (const candidate of points) {
          if (candidate.date <= date) close = Number(candidate.close);
          else break;
        }
      }
      const timestamp = new Date(`${date}T00:00:00`).getTime();
      const progress = endTime <= startTime ? 1 : Math.max(0, Math.min(1, (timestamp - startTime) / (endTime - startTime)));
      return {
        date,
        label: new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        niftyReturn: base > 0 && close > 0 ? ((close / base) - 1) * 100 : null,
        portfolioReturn: date < firstBuyDate || !Number.isFinite(portfolioReturn) ? null : portfolioReturn * progress,
      };
    });
    return {
      data,
      firstClose: base || null,
      lastClose: latestClose || null,
      niftyReturn: base > 0 && latestClose > 0 ? ((latestClose / base) - 1) * 100 : null,
    };
  }, [history, firstBuyDate, returnPercentage]);

  const alpha = chart.niftyReturn == null ? null : Number(returnPercentage) - chart.niftyReturn;
  const firstPurchase = firstBuyDate ? new Date(`${firstBuyDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const latestDate = history.length ? history.reduce((latest, point) => point.date > latest ? point.date : latest, history[0].date) : null;

  return (
    <main className="mx-auto flex w-full min-h-0 max-w-[1700px] flex-1 flex-col overflow-y-auto px-4 py-3 sm:px-5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-800">
            <ArrowLeft size={13} /> Back to portfolio details
          </button>
          <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{portfolio?.name} · Benchmark</h1>
          <p className="mt-0.5 text-[11px] text-slate-500">Portfolio performance compared with NIFTY 50 from the first recorded purchase.</p>
        </div>
        <div className="rounded-md bg-blue-50 px-3 py-2 text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Benchmark</p>
          <p className="font-mono text-sm font-semibold text-blue-900">NIFTY 50</p>
        </div>
      </div>

      <section className="mt-3 grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-5">
        <Metric label="Portfolio return" value={`${Number(returnPercentage) >= 0 ? "+" : ""}${Number(returnPercentage || 0).toFixed(2)}%`} detail="Since invested cost basis" icon={TrendingUp} tone={Number(returnPercentage) >= 0 ? "green" : "red"} />
        <Metric label="NIFTY 50 return" value={chart.niftyReturn == null ? "—" : `${chart.niftyReturn >= 0 ? "+" : ""}${chart.niftyReturn.toFixed(2)}%`} detail={latestDate ? `As of ${latestDate}` : "Index history"} icon={BarChart3} tone="slate" />
        <Metric label="Excess return / alpha" value={alpha == null ? "—" : `${alpha >= 0 ? "+" : ""}${alpha.toFixed(2)}%`} detail="Portfolio return less NIFTY 50" icon={Landmark} tone={alpha == null ? "slate" : alpha >= 0 ? "green" : "red"} />
        <Metric label="Portfolio value" value={formatMoney(currentValue)} detail={`Cash ${formatMoney(cashBalance)}`} icon={Wallet} />
        <Metric label="Net P&L" value={`${pnl >= 0 ? "+" : "−"}${formatMoney(Math.abs(pnl))}`} detail={`Invested ${formatMoney(invested)}`} icon={TrendingUp} tone={pnl >= 0 ? "green" : "red"} />
      </section>

      <section className="mt-3 flex min-h-[390px] flex-1 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Portfolio performance vs NIFTY 50</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">Cumulative return from {firstPurchase} to today · portfolio value {formatMoney(currentValue)}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2 py-1 text-[10px] text-slate-600"><CalendarDays size={12} /> {firstBuyDate} — {dateToIso(new Date())}</div>
        </div>

        {error ? (
          <div className="mt-4 flex min-h-[300px] flex-1 items-center justify-center rounded-lg bg-amber-50 px-6 text-center text-sm text-amber-800">{error}</div>
        ) : loading ? (
          <div className="mt-4 flex min-h-[300px] flex-1 items-center justify-center text-sm text-slate-500">Loading NIFTY 50 history…</div>
        ) : chart.data.length ? (
          <>
            <div className="mt-2 grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-blue-50 px-3 py-2"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Portfolio since first buy</span><p className="mt-0.5 font-mono text-sm font-semibold text-blue-900">{Number(returnPercentage || 0) >= 0 ? "+" : ""}{Number(returnPercentage || 0).toFixed(2)}%</p></div>
              <div className="rounded-md bg-slate-50 px-3 py-2"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">NIFTY 50 baseline close</span><p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{chart.firstClose?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}</p></div>
              <div className="rounded-md bg-slate-50 px-3 py-2"><span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Latest NIFTY 50 close</span><p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{chart.lastClose?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}</p></div>
            </div>
            <div className="mt-2 min-h-[260px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.data} margin={{ top: 8, right: 14, left: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
                  <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ""} formatter={(value, name) => [value == null ? "—" : `${Number(value).toFixed(2)}%`, name === "NIFTY 50" ? "NIFTY 50" : portfolio?.name]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
                  <Line type="monotone" dataKey="niftyReturn" name="NIFTY 50" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} />
                  <Line type="linear" dataKey="portfolioReturn" name={portfolio?.name || "Portfolio"} stroke="#123b9d" strokeWidth={3} dot={false} activeDot={{ r: 5 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex shrink-0 flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><i className="h-0.5 w-5 border-t-2 border-dashed border-slate-500" />NIFTY 50 cumulative return <i className="ml-2 h-0.5 w-5 bg-blue-800" />{portfolio?.name} endpoint guide</span>
              <span>Tracking error and daily portfolio NAV history are not available.</span>
            </div>
          </>
        ) : (
          <div className="mt-4 flex min-h-[300px] flex-1 items-center justify-center rounded-lg bg-slate-50 px-6 text-center text-sm text-slate-500">NIFTY 50 history is unavailable for this portfolio’s purchase period.</div>
        )}
      </section>
    </main>
  );
}
