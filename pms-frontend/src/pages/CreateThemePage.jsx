import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  TrendingUp,
  ShieldCheck,
  PieChart,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  RefreshCw,
  Search,
} from "lucide-react";
 
import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
 
import { createTheme, getAllThemes } from "../services/themeService";
import { getAllAssets } from "../services/portfolioService";
import { toast } from "react-toastify";
 
import { useNavigate } from "react-router-dom";
 
 
const RISK_OPTIONS = [
  {
    value: "LOW",
    label: "Low Risk",
    description:
      "Capital preservation with relatively lower volatility.",
  },
  {
    value: "MEDIUM",
    label: "Medium Risk",
    description:
      "Balanced growth with moderate market exposure.",
  },
  {
    value: "HIGH",
    label: "High Risk",
    description:
      "Higher growth potential with higher volatility.",
  },
];
 
 
const HORIZON_OPTIONS = [
  {
    value: "SHORT",
    label: "Short Term",
  },
  {
    value: "MEDIUM",
    label: "Medium Term",
  },
  {
    value: "LONG",
    label: "Long Term",
  },
  {
    value: "SHORT_TO_MEDIUM",
    label: "Short to Medium",
  },
  {
    value: "ANY",
    label: "Any Horizon",
  },
];
 
 
const CreateThemePage = () => {
 
  const [activePage, setActivePage] = useState("Themes");
 
  const [theme, setTheme] = useState({
    name: "",
    risk: "",
    investmentHorizon: "",
  });
 
  const [assets, setAssets] = useState([]);
  const [themeList, setThemeList] = useState([]);
  const [themeListLoading, setThemeListLoading] = useState(false);
  const [themeListError, setThemeListError] = useState("");
  const [themeSearch, setThemeSearch] = useState("");
  const [themePage, setThemePage] = useState(1);
  const [themeView, setThemeView] = useState("table");
  const themesPerPage = 6;
 
  const [allocations, setAllocations] = useState([
    {
      assetId: "",
      percentage: "",
    },
  ]);
 
  const [loading, setLoading] = useState(false);
 
  const navigate = useNavigate();
 
 
  useEffect(() => {
    loadAssets();
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setThemeListLoading(true);
    setThemeListError("");
    try {
      const response = await getAllThemes();
      const list = response?.data?.data ?? response?.data;
      if (!Array.isArray(list)) throw new Error(response?.message || "Theme list response was invalid.");
      setThemeList(list);
    } catch (error) {
      setThemeListError(error?.response?.data?.message || error?.message || "Themes could not be loaded.");
    } finally {
      setThemeListLoading(false);
    }
  };

  const filteredThemes = useMemo(() => {
    const query = themeSearch.trim().toLowerCase();
    return themeList.filter((item) => !query || [item.name, item.risk, item.investmentHorizon]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [themeList, themeSearch]);
  const themePageCount = Math.max(1, Math.ceil(filteredThemes.length / themesPerPage));
  const visibleThemes = filteredThemes.slice((themePage - 1) * themesPerPage, themePage * themesPerPage);

  useEffect(() => { setThemePage(1); }, [themeSearch]);
 
 
  /*
   * Load assets from Unified Security Master
   *
   * portfolioService.getAllAssets() returns:
   *
   * {
   *   statusCode: 200,
   *   success: true,
   *   data: [ ...assets... ],
   *   message: "All assets retrieved"
   * }
   *
   * Therefore the actual array is response.data.
   */
  const loadAssets = async () => {
 
    try {
 
      const response = await getAllAssets();
 
      console.log("Asset API response:", response);
      console.log("Assets:", response?.data);
 
      const assetList = Array.isArray(response?.data)
        ? response.data
        : [];
 
        //Remove duplicates
        const uniqueAssets = Array.from(
            new Map(
                assetList.map((asset) => [
                    asset.assetClass, asset,
                ])
            ).values()
    );
 
      setAssets(uniqueAssets);
 
    } catch (error) {
 
      console.error("Failed to load assets:", error);
 
      toast.error("Unable to load assets.");
 
    }
 
  };
 
 
  const totalAllocation = useMemo(() => {
 
    return allocations.reduce(
      (total, allocation) =>
        total + Number(allocation.percentage || 0),
      0
    );
 
  }, [allocations]);
 
 
  const remainingAllocation =
    100 - totalAllocation;
 
 
  const isValidAllocation =
    totalAllocation === 100 &&
    allocations.length > 0 &&
    allocations.every(
      (allocation) =>
        allocation.assetId !== "" &&
        Number(allocation.percentage) > 0
    );
 
 
  const handleThemeChange = (field, value) => {
 
    setTheme((previous) => ({
      ...previous,
      [field]: value,
    }));
 
  };
 
 
  const handleAllocationChange = (
    index,
    field,
    value
  ) => {
 
    setAllocations((previous) => {
 
      const updated = [...previous];
 
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
 
      return updated;
 
    });
 
  };
 
 
  const addAllocation = () => {
 
    setAllocations((previous) => [
      ...previous,
      {
        assetId: "",
        percentage: "",
      },
    ]);
 
  };
 
 
  const removeAllocation = (index) => {
 
    setAllocations((previous) =>
      previous.filter(
        (_, allocationIndex) =>
          allocationIndex !== index
      )
    );
 
  };
 
 
  const handleCreateTheme = async () => {
 
    if (!theme.name.trim()) {
      toast.error("Please enter a theme name.");
      return;
    }
 
    if (!theme.risk) {
      toast.error("Please select a risk level.");
      return;
    }
 
    if (!theme.investmentHorizon) {
      toast.error("Please select an investment horizon.");
      return;
    }
 
    if (!isValidAllocation) {
      toast.error(
        "Allocation must contain valid assets and total exactly 100%."
      );
      return;
    }
 
 
    /*
     * Get logged-in user's ID.
     */
    const userId =
      Number(localStorage.getItem("userId")) || 1;
 
 
    /*
     * Payload expected by AddThemeDTO
     */
    const payload = {
 
      name: theme.name,
 
      risk: theme.risk,
 
      investmentHorizon:
        theme.investmentHorizon,
 
      allocationRuleList:
        allocations.map((allocation) => ({
 
          assetId: Number(
            allocation.assetId
          ),
 
          percentage: Number(
            allocation.percentage
          ),
 
        })),
 
      userId,
 
    };
 
 
    try {
 
      setLoading(true);
 
      console.log(
        "Create Theme Payload:",
        payload
      );
 
      const response =
        await createTheme(payload);
 
      console.log(
        "Create Theme Response:",
        response
      );
 
      toast.success(
        "Theme created successfully."
       
      );

      await loadThemes();
 
 
      /*
       * Reset form after successful creation.
       */
      setTheme({
        name: "",
        risk: "",
        investmentHorizon: "",
      });
 
      setAllocations([
        {
          assetId: "",
          percentage: "",
        },
      ]);
 
    } catch (error) {
 
      console.error(
        "Create theme failed:",
        error
      );
 
      toast.error(
        "Failed to create theme."
      );
 
    } finally {
 
      setLoading(false);
 
    }
 
  };
 
 
  return (
    <div className="min-h-screen bg-[#f6f8fd]">
 
      <SideBarComponent
        activePage={activePage}
        setActivePage={setActivePage}
      />
 
 
      <div className="ml-[257px] min-h-screen">
 
        <TopBarComponent />
 
 
        <main className="px-5 py-4">
 
          {/* HEADER */}
 
          <div className="flex items-end justify-between">
 
            <div>
 
              <div className="mb-2 text-[11px] font-bold tracking-wider text-slate-500">
 
                PORTFOLIO MANAGEMENT SYSTEM
 
                <span className="mx-1">
                  •
                </span>
 
                <span className="text-blue-700">
                  THEME CONFIGURATION
                </span>
 
              </div>
 
 
              <h1 className="text-2xl font-semibold text-slate-900">
                Create Investment Theme
              </h1>
 
 
              <p className="mt-1 max-w-[550px] text-sm leading-5 text-slate-500">
 
                Define a reusable investment strategy
                with risk parameters, investment horizon,
                and target asset allocation.
 
              </p>
 
            </div>
 
 
            <button
              onClick={() =>
                navigate("/home")
              }
              className="flex items-center gap-2 rounded-md bg-[#edf3fd] px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#e4ebf8]"
            >
 
              <ArrowLeft size={16} />
 
              Back
 
            </button>
 
          </div>
 
 
          {/* BASIC INFORMATION */}
 
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
 
            <div className="mb-5 flex items-center gap-3">
 
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
 
                <TrendingUp size={17} />
 
              </div>
 
 
              <div>
 
                <h2 className="text-lg font-semibold text-slate-900">
                  Basic Information
                </h2>
 
                <p className="text-xs text-slate-500">
                  Define the identity and investment characteristics of the theme.
                </p>
 
              </div>
 
            </div>
 
 
            <div className="grid grid-cols-3 gap-5">
 
              {/* THEME NAME */}
 
              <div className="col-span-1">
 
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
 
                  Theme Name
 
                </label>
 
 
                <input
                  type="text"
                  value={theme.name}
                  onChange={(event) =>
                    handleThemeChange(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Aggressive Growth"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
 
              </div>
 
 
              {/* RISK */}
 
              <div>
 
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
 
                  Risk Profile
 
                </label>
 
 
                <select
                  value={theme.risk}
                  onChange={(event) =>
                    handleThemeChange(
                      "risk",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
 
                  <option value="">
                    Select Risk
                  </option>
 
                  {RISK_OPTIONS.map((risk) => (
 
                    <option
                      key={risk.value}
                      value={risk.value}
                    >
                      {risk.label}
                    </option>
 
                  ))}
 
                </select>
 
              </div>
 
 
              {/* HORIZON */}
 
              <div>
 
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
 
                  Investment Horizon
 
                </label>
 
 
                <select
                  value={theme.investmentHorizon}
                  onChange={(event) =>
                    handleThemeChange(
                      "investmentHorizon",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
 
                  <option value="">
                    Select Horizon
                  </option>
 
                  {HORIZON_OPTIONS.map(
                    (horizon) => (
 
                      <option
                        key={horizon.value}
                        value={horizon.value}
                      >
                        {horizon.label}
                      </option>
 
                    )
                  )}
 
                </select>
 
              </div>
 
            </div>
 
          </div>
 
 
          {/* ALLOCATION RULES */}
 
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
 
            <div className="mb-5 flex items-center justify-between">
 
              <div className="flex items-center gap-3">
 
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
 
                  <PieChart size={17} />
 
                </div>
 
 
                <div>
 
                  <h2 className="text-lg font-semibold text-slate-900">
                    Asset Allocation
                  </h2>
 
                  <p className="text-xs text-slate-500">
                    Define the target percentage for each asset.
                  </p>
 
                </div>
 
              </div>
 
 
              <button
                type="button"
                onClick={addAllocation}
                className="flex items-center gap-2 rounded-md bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
              >
 
                <Plus size={15} />
 
                Add Asset
 
              </button>
 
            </div>
 
 
            {/* TABLE HEADER */}
 
            <div className="grid grid-cols-[2fr_1fr_.5fr] rounded-md bg-[#eff4fc] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
 
              <div>
                Asset
              </div>
 
              <div>
                Target Allocation
              </div>
 
              <div className="text-right">
                Action
              </div>
 
            </div>
 
 
            {/* ALLOCATION ROWS */}
 
            <div className="divide-y divide-slate-100">
 
              {allocations.map(
                (allocation, index) => (
 
                  <div
                    key={index}
                    className="grid grid-cols-[2fr_1fr_.5fr] items-center gap-4 px-4 py-3"
                  >
 
                    {/* ASSET */}
 
                    <div>
 
                      <select
                        name="assetId"
                        value={allocation.assetId}
 
                        onChange={(event) =>
                          handleAllocationChange(
                            index,
                            "assetId",
                            event.target.value
                          )
                        }
 
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
 
                        <option value="">
                          Select Asset
                        </option>
 
 
                        {assets.map(
                          (asset) => (
 
                            <option
                              key={asset.id}
                              value={asset.id}
                            >
                              {asset.assetClass}
                            </option>
 
                          )
                        )}
 
                      </select>
 
                    </div>
 
 
                    {/* PERCENTAGE */}
 
                    <div className="relative">
 
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={
                          allocation.percentage
                        }
                        onChange={(event) =>
                          handleAllocationChange(
                            index,
                            "percentage",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
 
                      <span className="absolute right-3 top-2 text-sm text-slate-400">
                        %
                      </span>
 
                    </div>
 
 
                    {/* DELETE */}
 
                    <div className="flex justify-end">
 
                      <button
                        type="button"
                        onClick={() =>
                          removeAllocation(index)
                        }
                        disabled={
                          allocations.length === 1
                        }
                        className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
 
                        <Trash2 size={16} />
 
                      </button>
 
                    </div>
 
                  </div>
 
                )
              )}
 
            </div>
 
 
            {/* ALLOCATION SUMMARY */}
 
            <div className="mt-4 grid grid-cols-3 gap-3">
 
              <div className="rounded-lg bg-[#edf4fc] p-4">
 
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Allocation
                </div>
 
                <div className="mt-1 font-mono text-xl font-semibold text-slate-800">
                  {totalAllocation.toFixed(2)}%
                </div>
 
              </div>
 
 
              <div className="rounded-lg bg-[#edf4fc] p-4">
 
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Remaining
                </div>
 
                <div
                  className={`mt-1 font-mono text-xl font-semibold ${
                    remainingAllocation < 0
                      ? "text-red-600"
                      : remainingAllocation === 0
                        ? "text-emerald-700"
                        : "text-blue-700"
                  }`}
                >
                  {remainingAllocation.toFixed(2)}%
                </div>
 
              </div>
 
 
              <div className="rounded-lg bg-[#edf4fc] p-4">
 
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Validation
                </div>
 
                <div className="mt-1 flex items-center gap-2">
 
                  {isValidAllocation ? (
                    <>
 
                      <Check
                        size={16}
                        className="text-emerald-700"
                      />
 
                      <span className="text-sm font-semibold text-emerald-700">
                        Validated
                      </span>
 
                    </>
                  ) : (
                    <>
 
                      <AlertTriangle
                        size={16}
                        className="text-red-600"
                      />
 
                      <span className="text-sm font-semibold text-red-600">
                        Requires 100%
                      </span>
 
                    </>
                  )}
 
                </div>
 
              </div>
 
            </div>
 
          </div>
 
 
          {/* THEME SUMMARY */}
 
          <div className="mt-5 grid grid-cols-3 gap-4">
 
            {/* SUMMARY */}
 
            <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5">
 
              <div className="mb-4 flex items-center gap-2">
 
                <ShieldCheck
                  size={19}
                  className="text-emerald-700"
                />
 
                <h3 className="font-semibold text-slate-900">
                  Theme Summary
                </h3>
 
              </div>
 
 
              <div className="grid grid-cols-3 gap-5">
 
                <div>
 
                  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Theme Name
                  </div>
 
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {theme.name ||
                      "Not specified"}
                  </div>
 
                </div>
 
 
                <div>
 
                  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Risk
                  </div>
 
                  <div className="mt-1">
 
                    {theme.risk ? (
 
                      <span className="rounded bg-[#e7eefb] px-2 py-1 text-[10px] font-bold text-slate-700">
                        {theme.risk}
                      </span>
 
                    ) : (
                      <span className="text-sm text-slate-400">
                        Not selected
                      </span>
                    )}
 
                  </div>
 
                </div>
 
 
                <div>
 
                  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Investment Horizon
                  </div>
 
                  <div className="mt-1 text-sm font-semibold text-slate-800">
 
                    {theme.investmentHorizon ||
                      "Not selected"}
 
                  </div>
 
                </div>
 
              </div>
 
            </div>
 
 
            {/* CREATE PANEL */}
 
            <div className="rounded-xl border border-slate-200 bg-white p-5">
 
              <div className="flex items-center gap-2">
 
                <ShieldCheck
                  size={20}
                  className="text-emerald-700"
                />
 
                <h3 className="font-semibold text-slate-900">
                  Validation
                </h3>
 
              </div>
 
 
              <div className="mt-5 space-y-3">
 
                <ValidationRow
                  label="Theme Name"
                  valid={
                    theme.name.trim() !== ""
                  }
                />
 
                <ValidationRow
                  label="Risk Profile"
                  valid={
                    theme.risk !== ""
                  }
                />
 
                <ValidationRow
                  label="Investment Horizon"
                  valid={
                    theme.investmentHorizon !== ""
                  }
                />
 
                <ValidationRow
                  label="Asset Allocation"
                  valid={
                    isValidAllocation
                  }
                />
 
              </div>
 
 
              <button
                onClick={handleCreateTheme}
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-800 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
 
                {loading
                  ? "Creating..."
                  : "Create Theme"}
 
                {!loading && (
                  <Check size={16} />
                )}
 
              </button>
 
            </div>
 
          </div>
 
 
          {/* BOTTOM ACTION BAR */}
 
          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
 
            <button
              onClick={() =>
                window.history.back()
              }
              className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
            >
 
              <ArrowLeft size={16} />
 
              Cancel
 
            </button>
 
 
            <div className="text-xs text-slate-400">
              Theme Configuration
            </div>
 
 
            <button
              onClick={handleCreateTheme}
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
 
              Create Theme
 
              <Check size={16} />
 
            </button>
 
          </div>

          {/* EXISTING THEMES */}
          <section className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div><h2 className="text-lg font-semibold text-slate-900">Investment themes</h2><p className="mt-1 text-xs text-slate-500">Browse reusable mandates and their target asset allocations.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-slate-400"><Search size={14} /><input value={themeSearch} onChange={(event) => setThemeSearch(event.target.value)} placeholder="Search themes…" className="w-40 text-xs text-slate-700 outline-none placeholder:text-slate-400" /></label>
                <div className="flex rounded-md border border-slate-200 p-0.5"><button onClick={() => setThemeView("table")} aria-label="Table view" className={`rounded p-1.5 ${themeView === "table" ? "bg-blue-50 text-blue-800" : "text-slate-500"}`}><List size={15} /></button><button onClick={() => setThemeView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${themeView === "grid" ? "bg-blue-50 text-blue-800" : "text-slate-500"}`}><Grid2X2 size={15} /></button></div>
                <button onClick={loadThemes} disabled={themeListLoading} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={13} className={themeListLoading ? "animate-spin" : ""} /> Refresh</button>
              </div>
            </div>
            {themeListError && <div className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{themeListError}</div>}
            {themeListLoading ? <div className="p-10 text-center text-sm text-slate-500">Loading themes…</div> : !filteredThemes.length ? <div className="p-10 text-center text-sm text-slate-500">{themeListError ? "Theme list unavailable." : "No themes match your search."}</div> : themeView === "table" ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#eef3ff] text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Theme</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Investment horizon</th><th className="px-4 py-3">Asset allocation</th><th className="px-5 py-3 text-right">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleThemes.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-3.5"><div className="font-semibold text-slate-800">{item.name || "Unnamed theme"}</div><div className="mt-0.5 text-[10px] text-slate-400">Theme ID · {item.id}</div></td><td className="px-4 py-3.5"><span className="rounded bg-blue-50 px-2 py-1 font-semibold text-blue-800">{formatThemeLabel(item.risk)}</span></td><td className="px-4 py-3.5 text-slate-600">{formatThemeLabel(item.investmentHorizon)}</td><td className="px-4 py-3.5"><div className="flex flex-wrap gap-1.5">{(item.allocationRuleList || []).map((rule) => <span key={rule.id ?? `${item.id}-${rule.asset?.id}`} className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{rule.asset?.assetClass || "Asset"} <b>{Number(rule.percentage || 0)}%</b></span>)}</div></td><td className="px-5 py-3.5 text-right"><span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${item.status === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{item.status === false ? "Inactive" : "Active"}</span></td></tr>)}</tbody></table></div> : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{visibleThemes.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-slate-900">{item.name || "Unnamed theme"}</h3><p className="mt-1 text-[10px] text-slate-400">Theme ID · {item.id}</p></div><span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${item.status === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{item.status === false ? "Inactive" : "Active"}</span></div><div className="mt-3 flex gap-2 text-[10px]"><span className="rounded bg-blue-50 px-2 py-1 font-semibold text-blue-800">{formatThemeLabel(item.risk)}</span><span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{formatThemeLabel(item.investmentHorizon)}</span></div><div className="mt-3 space-y-2">{(item.allocationRuleList || []).map((rule) => <div key={rule.id ?? `${item.id}-${rule.asset?.id}`} className="flex items-center justify-between text-xs"><span className="text-slate-600">{rule.asset?.assetClass || "Asset"}</span><strong className="font-mono text-slate-800">{Number(rule.percentage || 0)}%</strong></div>)}</div></article>)}</div>}
            {!themeListLoading && filteredThemes.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>Showing {(themePage - 1) * themesPerPage + 1}–{Math.min(themePage * themesPerPage, filteredThemes.length)} of {filteredThemes.length} themes</span><div className="flex items-center gap-2"><button onClick={() => setThemePage((page) => Math.max(1, page - 1))} disabled={themePage <= 1} className="rounded border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button><span>Page {themePage} of {themePageCount}</span><button onClick={() => setThemePage((page) => Math.min(themePageCount, page + 1))} disabled={themePage >= themePageCount} className="rounded border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button></div></div>}
          </section>
 
        </main>
 
      </div>
 
    </div>
  );
};
 
 
const ValidationRow = ({
  label,
  valid,
}) => {
 
  return (
 
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
 
      <span className="text-xs text-slate-600">
        {label}
      </span>
 
 
      <span
        className={`flex items-center gap-1 text-[10px] font-semibold ${
          valid
            ? "text-emerald-700"
            : "text-red-600"
        }`}
      >
 
        {valid ? (
          <Check size={13} />
        ) : (
          <AlertTriangle size={13} />
        )}
 
        {valid
          ? "Validated"
          : "Required"}
 
      </span>
 
    </div>
 
  );
 
};

const formatThemeLabel = (value) => String(value || "—").replaceAll("_", " ");
 
 
export default CreateThemePage;
