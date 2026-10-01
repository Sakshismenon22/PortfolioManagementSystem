// GenerateTradeCard.jsx
import React, { useState } from "react";
import { X, ArrowDownRight, ArrowUpRight, AlertTriangle } from "lucide-react";

// A simple tile sub-component used for label/value rows
const DetailTile = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
    <div className="mt-1 font-mono text-sm text-slate-900">{value}</div>
  </div>
);

export default function TradeCardComponent({
  portfolioId,          
  securities = [],     
  onClose = () => {},   
  onTrade  = () => {}, 
}) {
  const [tradeMode, setTradeMode]       = useState("sell");
  const [securityId, setSecurityId]     = useState("");
  const [quantity, setQuantity]         = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);

  const activeSecurity = securities.find((s) => String(s.id) === String(securityId));
  const parsedQuantity = Number(quantity);
  const estimated = activeSecurity?.price
    ? activeSecurity.price * (Number.isInteger(parsedQuantity) ? parsedQuantity : 0)
    : null;

  const submitTrade = async (event) => {
    event.preventDefault();
    setTradeLoading(true);
    await onTrade({
      portfolioId,
      side: tradeMode,
      securityId,
      quantity: parsedQuantity,
    });
    setTradeLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
      >
   
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Trade ticket
            </div>
            <h2 id="trade-title" className="mt-1 text-lg font-bold text-slate-900">
              Portfolio #{portfolioId}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a security and enter a quantity to buy or sell.
            </p>
          </div>
          <button
            disabled={tradeLoading}
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ---------- Buy / Sell Tabs ---------- */}
        <div className="border-b border-slate-100 px-5 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTradeMode("sell")}
              className={`rounded-t-md px-4 py-2 text-xs font-semibold ${
                tradeMode === "sell"
                  ? "bg-red-50 text-red-800"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ArrowDownRight className="mr-1 inline" size={14} /> Sell
            </button>
            <button
              onClick={() => setTradeMode("buy")}
              className={`rounded-t-md px-4 py-2 text-xs font-semibold ${
                tradeMode === "buy"
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ArrowUpRight className="mr-1 inline" size={14} /> Buy
            </button>
          </div>
        </div>

      
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {tradeLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading securities and prices…
            </div>
          ) : (
            <form onSubmit={submitTrade} className="space-y-4">
          
              <label className="block text-xs font-semibold text-slate-700">
                Security
                <select
                  required
                  value={securityId}
                  onChange={(event) => {
                    setSecurityId(event.target.value);
                    setQuantity("");
                  }}
                  className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-blue-400"
                >
                  <option value="">Select a security</option>
                  {securities.map((security) => (
                    <option key={security.id} value={security.id}>
                      {security.name} ({security.symbol || "—"})
                    </option>
                  ))}
                </select>
              </label>

           
              {activeSecurity && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <DetailTile label="Symbol" value={activeSecurity.symbol || "—"} />
                    <DetailTile label="Price" value={activeSecurity.price ?? "—"} />
                    <DetailTile label="Last traded" value={activeSecurity.lastDate || "—"} />
                  </div>

                  <label className="block text-xs font-semibold text-slate-700">
                    Quantity (whole shares)
                    <input
                      required
                      type="number"
                      step="1"
                      min="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 font-mono text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                </>
              )}

              {!securities.length && (
                <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                  No securities are currently available for this portfolio.
                </div>
              )}

              {/* Estimated value */}
              {activeSecurity && estimated !== null && (
                <div className="flex justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
                  <span className="text-slate-600">Estimated value</span>
                  <strong className="font-mono text-slate-900">{estimated}</strong>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tradeLoading}
                  className={`rounded-md px-4 py-2 text-xs font-semibold text-white ${
                    tradeMode === "sell"
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {tradeLoading
                    ? "Recording…"
                    : tradeMode === "sell"
                    ? "Record sell"
                    : "Record buy"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-4 text-[10px] leading-4 text-slate-400">
            Recording a trade updates the portfolio holdings ledger at the current
            quote. It does not submit an order to a broker.
          </p>
        </div>
      </section>
    </div>
  );
}