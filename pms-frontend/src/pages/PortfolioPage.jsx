import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Download,
  History,
  LoaderCircle,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import SideBarComponent from "../components/SideBarComponent";
import DashboardNotificationBell from "../components/DashboardNotificationBell";

import {
  buyPortfolioSecurities,
  createDemoPortfolios,
  deleteDemoPortfolios,
  getAllPortfolioDetails,
  getPortfolioBasicInfo,
  getPortfolioHoldings,
  getPortfolioTransactions,
  sellPortfolioHoldings,
  validatePortfolioAllocation,
} from "../services/portfolioService";

import { runPortfolioDriftCheck } from "../services/driftService";

const DRIFT_LIMIT = 5;

const FILTERS = [
  "All",
  "New",
  "Active",
  "Rebalance Required",
  "Closed",
];

const PortfolioPage = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [portfolios, setPortfolios] = useState([]);
  const [driftPortfolioIds, setDriftPortfolioIds] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [driftLoading, setDriftLoading] =
    useState(false);

  const [driftCheckRunning, setDriftCheckRunning] =
    useState(false);

  const [refreshVersion, setRefreshVersion] =
    useState(0);

  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMessage, setDemoMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPortfolios() {
      setLoading(true);
      setError("");

      if (!userId) {
        setError(
          "Sign in to load your portfolios."
        );
        setLoading(false);
        return;
      }

      try {
        const response =
          await getAllPortfolioDetails(userId);

        const payload =
          response?.data?.data ??
          response?.data ??
          response;

        const list =
          payload?.portfolioDetailsDTOList ??
          payload?.portfolios ??
          (Array.isArray(payload)
            ? payload
            : null);

        if (!Array.isArray(list)) {
          throw new Error(
            response?.message ||
              response?.data?.message ||
              "The portfolio list response was not in the expected format."
          );
        }

        if (!active) {
          return;
        }

        const normalized = list.map(
          (portfolio) => {
            const portfolioId =
              portfolio.id ??
              portfolio.portfolioId;

            const portfolioName =
              portfolio.name ||
              portfolio.portfolioName ||
              "Unnamed portfolio";

            return {
              ...portfolio,

              id: portfolioId,

              name: portfolioName,

              status: String(
                portfolio.portfolioStatus ??
                  portfolio.status ??
                  "ACTIVE"
              ).toUpperCase(),

              code:
                portfolio.code ||
                portfolio.portfolioCode ||
                `PMS-${portfolioId}`,

              theme:
                portfolio.theme ||
                portfolio.themeName ||
                "Unassigned theme",

              allocationType: formatLabel(
                portfolio.allocationType ||
                  portfolio.portfolioType ||
                  "—"
              ),

              aum: Number(
                portfolio.aum ??
                  portfolio.amount ??
                  portfolio.currentValue ??
                  0
              ),
              availableCash: Number(
                portfolio.balance ??
                  portfolio.availableBalance ??
                  portfolio.amount ??
                  0
              ),

              returnValue: parseReturn(
                portfolio.return1Y ??
                  portfolio.returnValue ??
                  portfolio.returns
              ),

              benchmark: formatLabel(
                portfolio.benchmark || "—"
              ),

              initials:
                portfolio.initials ||
                initialsFor(portfolioName),
            };
          }
        );

        const transactionResults = await Promise.allSettled(
          normalized.map((portfolio) =>
            getPortfolioTransactions(portfolio.id)
          )
        );
        normalized.forEach((portfolio, index) => {
          const result = transactionResults[index];
          const realizedPnl = result?.status === "fulfilled"
            ? sumRealizedPnl(result.value)
            : 0;
          const investedBeforeRealized = Number(
            portfolio.investedAmount ??
              portfolio.aum / (1 + portfolio.returnValue / 100)
          );
          portfolio.realizedPnl = realizedPnl;
          portfolio.investedValue = investedBeforeRealized - realizedPnl;
          portfolio.pnlAmount = portfolio.aum - portfolio.investedValue;
          portfolio.returnValue = portfolio.investedValue > 0
            ? (portfolio.pnlAmount / portfolio.investedValue) * 100
            : 0;
        });

        setPortfolios(normalized);
        setDriftLoading(true);

        const activePortfolios =
          normalized.filter(
            (portfolio) =>
              portfolio.status === "ACTIVE"
          );

        const validationResults =
          await Promise.allSettled(
            activePortfolios.map((portfolio) =>
              validatePortfolioAllocation(
                portfolio.id
              )
            )
          );

        if (!active) {
          return;
        }

        const breachedIds = activePortfolios
          .filter((portfolio, index) => {
            const result =
              validationResults[index];

            if (
              result.status !== "fulfilled"
            ) {
              return false;
            }

            const validationResponse =
              result.value;

            const validationPayload =
              validationResponse?.data?.data ??
              validationResponse?.data ??
              validationResponse;

            const allocations =
              validationPayload?.allocations ??
              validationPayload?.allocationDetails ??
              validationPayload;

            return (
              Array.isArray(allocations) &&
              allocations.some(
                (allocation) => {
                  const drift = Number(
                    allocation.driftPercentage ||
                      0
                  );

                  return (
                    allocation.satisfied ===
                      false ||
                    Math.abs(drift) >=
                      DRIFT_LIMIT
                  );
                }
              )
            );
          })
          .map((portfolio) =>
            String(portfolio.id)
          );

        setDriftPortfolioIds(breachedIds);
      } catch (loadError) {
        if (active) {
          setError(
            loadError?.response?.data
              ?.message ||
              loadError?.message ||
              "Could not load portfolios."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setDriftLoading(false);
        }
      }
    }

    loadPortfolios();

    return () => {
      active = false;
    };
  }, [userId, refreshVersion]);

  const manageDemoPortfolios = async (
    action
  ) => {
    if (!userId || demoBusy) {
      return;
    }

    setDemoBusy(true);
    setDemoMessage("");

    try {
      const response =
        action === "add"
          ? await createDemoPortfolios(userId)
          : await deleteDemoPortfolios(
              userId
            );

      setDemoMessage(
        response?.message ||
          response?.data?.message ||
          (action === "add"
            ? "Demo portfolios added."
            : "Demo portfolios removed.")
      );

      setRefreshVersion(
        (current) => current + 1
      );
    } catch (demoError) {
      setDemoMessage(
        demoError?.response?.data?.message ||
          demoError?.message ||
          "Could not update demo portfolios."
      );
    } finally {
      setDemoBusy(false);
    }
  };

  const runChecksForActivePortfolios =
    async () => {
      const activePortfolios =
        portfolios.filter(
          (portfolio) =>
            portfolio.status === "ACTIVE"
        );

      if (
        !activePortfolios.length ||
        driftCheckRunning
      ) {
        return;
      }

      setDriftCheckRunning(true);
      setDemoMessage("");

      try {
        const results =
          await Promise.allSettled(
            activePortfolios.map(
              (portfolio) =>
                runPortfolioDriftCheck(
                  portfolio.id,
                  userId
                )
            )
          );

        const failedResults =
          results.filter(
            (result) =>
              result.status === "rejected"
          );

        if (failedResults.length) {
          setDemoMessage(
            `Drift checks completed for ${
              results.length -
              failedResults.length
            } of ${
              activePortfolios.length
            } active portfolios; ${
              failedResults.length
            } failed.`
          );
        } else {
          setDemoMessage(
            `Drift check completed for ${
              activePortfolios.length
            } active portfolio${
              activePortfolios.length === 1
                ? ""
                : "s"
            }.`
          );
        }

        setRefreshVersion(
          (current) => current + 1
        );
      } catch (driftError) {
        setDemoMessage(
          driftError?.response?.data
            ?.message ||
            driftError?.message ||
            "Could not complete the drift checks."
        );
      } finally {
        setDriftCheckRunning(false);
      }
    };

  const counts = useMemo(
    () => ({
      All: portfolios.length,

      New: portfolios.filter(
        (portfolio) =>
          portfolio.status === "NEW"
      ).length,

      Active: portfolios.filter(
        (portfolio) =>
          portfolio.status === "ACTIVE"
      ).length,

      "Rebalance Required":
        driftPortfolioIds.length,

      Closed: portfolios.filter(
        (portfolio) =>
          ["CANCELED", "CLOSED"].includes(
            portfolio.status
          )
      ).length,
    }),
    [portfolios, driftPortfolioIds]
  );

  const filteredPortfolios = useMemo(
    () =>
      portfolios.filter((portfolio) => {
        switch (filter) {
          case "Active":
            return (
              portfolio.status === "ACTIVE"
            );

          case "New":
            return (
              portfolio.status === "NEW"
            );

          case "Rebalance Required":
            return driftPortfolioIds.includes(
              String(portfolio.id)
            );

          case "Closed":
            return [
              "CANCELED",
              "CLOSED",
            ].includes(portfolio.status);

          case "All":
          default:
            return true;
        }
      }),
    [
      portfolios,
      filter,
      driftPortfolioIds,
    ]
  );

  const displayedPortfolios = useMemo(
    () => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return filteredPortfolios;
      }

      return filteredPortfolios.filter(
        (portfolio) =>
          [
            portfolio.name,
            portfolio.code,
            portfolio.theme,
            portfolio.benchmark,
            portfolio.allocationType,
            portfolio.status,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .startsWith(query)
            )
      );
    },
    [filteredPortfolios, search]
  );

  const openPortfolio = useCallback(
    async (portfolio, initialTab = "holdings") => {
      try {
        const response =
          await getPortfolioBasicInfo(
            portfolio.id
          );

        const basicInfo =
          response?.data?.data ??
          response?.data ??
          response;

        navigate(
          `/portfolio/${portfolio.id}`,
          {
            state: {
              portfolio: {
                ...portfolio,
                ...(basicInfo || {}),
              },
              initialTab,
            },
          }
        );
      } catch {
        navigate(
          `/portfolio/${portfolio.id}`,
          {
            state: {
              portfolio,
              initialTab,
            },
          }
        );
      }
    },
    [navigate]
  );

  const hasActivePortfolio =
    portfolios.some(
      (portfolio) =>
        portfolio.status === "ACTIVE"
    );

  const hasDemoPortfolio =
    portfolios.some((portfolio) =>
      String(
        portfolio.name || ""
      ).startsWith("DEMO 1Y |")
    );

  return (
    <div className="h-screen overflow-hidden bg-[#f6f8fd]">
      <SideBarComponent activePage="Portfolios" />

      <div className="sidebar-content flex h-screen min-w-0 flex-col">
        <main className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col px-4 py-3 sm:px-5">
          <section className="mb-2 mt-1 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div className="shrink-0">
              <div className="text-[10px] font-bold tracking-wider text-blue-700">
                PORTFOLIO MANAGEMENT SYSTEM ·
                LIVE ALLOCATION
              </div>

              <h1 className="text-xl font-semibold text-slate-900">
                Fund Portfolios
              </h1>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
              <label className="flex h-8 w-[min(340px,100%)] min-w-[220px] items-center rounded-md border border-slate-200 bg-white px-3 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100">
                <span className="sr-only">
                  Search portfolios
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Search portfolios..."
                />
              </label>

              <button
                type="button"
                onClick={
                  runChecksForActivePortfolios
                }
                disabled={
                  driftCheckRunning ||
                  driftLoading ||
                  !hasActivePortfolio
                }
                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={
                    driftCheckRunning
                      ? "animate-spin"
                      : ""
                  }
                />

                {driftCheckRunning
                  ? "Checking drift..."
                  : "Run Drift Check"}
              </button>

              <button
                type="button"
                onClick={() =>
                  exportPortfolioCsv(
                    displayedPortfolios
                  )
                }
                disabled={
                  !displayedPortfolios.length
                }
                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md bg-[#edf3fd] px-3 text-xs font-semibold text-slate-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={14} />
                Export
              </button>

              <button
                type="button"
                onClick={() =>
                  manageDemoPortfolios("add")
                }
                disabled={demoBusy || !userId}
                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />

                {demoBusy
                  ? "Working..."
                  : "Add Demos"}
              </button>

              <button
                type="button"
                onClick={() =>
                  manageDemoPortfolios(
                    "remove"
                  )
                }
                disabled={
                  demoBusy ||
                  !hasDemoPortfolio
                }
                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
                Remove Demos
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/create-portfolio"
                  )
                }
                className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md bg-blue-800 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-900"
              >
                <Plus size={15} />
                Create Portfolio
              </button>
              <DashboardNotificationBell />
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-100 px-3 py-1.5">
              {FILTERS.map(
                (filterName) => (
                  <button
                    type="button"
                    key={filterName}
                    onClick={() =>
                      setFilter(filterName)
                    }
                    className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      filter === filterName
                        ? "bg-blue-800 text-white"
                        : "bg-[#edf2fb] text-slate-600 hover:bg-[#e4ebf8]"
                    }`}
                  >
                    {filterName}

                    <span className="ml-1 opacity-70">
                      {filterName ===
                        "Rebalance Required" &&
                      driftLoading
                        ? "..."
                        : counts[filterName]}
                    </span>
                  </button>
                )
              )}
            </div>

            {demoMessage && (
              <p
                role="status"
                className="shrink-0 border-b border-slate-100 px-4 py-1.5 text-[11px] text-slate-600"
              >
                {demoMessage}
              </p>
            )}

            {error ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
                <AlertTriangle
                  className="text-red-500"
                  size={28}
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Could not load portfolios
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setRefreshVersion(
                      (current) =>
                        current + 1
                    )
                  }
                  className="mt-4 rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <PortfolioMasterDetail
                  portfolios={portfolios}
                  visiblePortfolioIds={displayedPortfolios.map((portfolio) => String(portfolio.id))}
                  driftPortfolioIds={
                    driftPortfolioIds
                  }
                  onDriftChange={(portfolioId, isDrifting) =>
                    setDriftPortfolioIds((current) => {
                      const withoutPortfolio = current.filter(
                        (id) => String(id) !== String(portfolioId)
                      );
                      const alreadyMarked = current.some(
                        (id) => String(id) === String(portfolioId)
                      );
                      if (alreadyMarked === isDrifting) {
                        return current;
                      }
                      return isDrifting
                        ? [...withoutPortfolio, String(portfolioId)]
                        : withoutPortfolio;
                    })
                  }
                  openPortfolio={
                    openPortfolio
                  }
                  navigate={navigate}
                  loading={loading}
                  refreshVersion={
                    refreshVersion
                  }
                />
              </div>
            )}

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-1.5 text-[11px] text-slate-500">
              <span>
                {loading
                  ? "Loading portfolios..."
                  : `Showing ${displayedPortfolios.length} of ${portfolios.length} portfolios`}
              </span>

              <span className="flex items-center gap-1.5 text-slate-400">
                <WalletCards size={13} />
                Expand a portfolio to view and
                trade holdings
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

function PortfolioMasterDetail({
  portfolios,
  visiblePortfolioIds,
  driftPortfolioIds,
  onDriftChange,
  openPortfolio,
  navigate,
  loading,
  refreshVersion,
}) {
  const [expandedIds, setExpandedIds] =
    useState([]);

  const [portfolioSnapshots, setPortfolioSnapshots] =
    useState(portfolios);

  const [holdingsById, setHoldingsById] =
    useState({});

  const [detailsById, setDetailsById] =
    useState({});

  const [loadingIds, setLoadingIds] =
    useState([]);

  const [errorsById, setErrorsById] =
    useState({});

  useEffect(() => {
    setExpandedIds([]);
    setHoldingsById({});
    setDetailsById({});
    setLoadingIds([]);
    setErrorsById({});
    setPortfolioSnapshots(portfolios);
  }, [refreshVersion]);

  useEffect(() => {
    setPortfolioSnapshots(portfolios);
  }, [portfolios]);

  const visiblePortfolioIdSet = useMemo(
    () => new Set(visiblePortfolioIds),
    [visiblePortfolioIds]
  );

  async function loadPortfolioData(
    portfolio,
    options = {}
  ) {
    const { force = false } = options;
    const portfolioId = String(
      portfolio.id
    );

    const alreadyLoaded =
      Object.prototype.hasOwnProperty.call(
        holdingsById,
        portfolioId
      );

    if (alreadyLoaded && !force) {
      return;
    }

    setLoadingIds((current) =>
      current.includes(portfolioId)
        ? current
        : [...current, portfolioId]
    );

    setErrorsById((current) => {
      const nextErrors = { ...current };
      delete nextErrors[portfolioId];
      return nextErrors;
    });

    try {
      const [
        basicInfoResult,
        holdingsResult,
        validationResult,
        transactionsResult,
      ] = await Promise.allSettled([
        getPortfolioBasicInfo(
          portfolio.id
        ),
        getPortfolioHoldings(
          portfolio.id
        ),
        validatePortfolioAllocation(
          portfolio.id
        ),
        getPortfolioTransactions(portfolio.id),
      ]);

      if (holdingsResult.status !== "fulfilled" || !Array.isArray(holdingsResult.value)) {
        throw new Error(
          holdingsResult.status === "rejected"
            ? holdingsResult.reason?.response?.data?.message ||
                holdingsResult.reason?.message ||
                "Portfolio holdings could not be refreshed."
            : "The holdings API did not return an array."
        );
      }

      const holdings = holdingsResult.value;

      const basicInfo =
        basicInfoResult.status === "fulfilled"
          ? basicInfoResult.value?.data?.data ??
            basicInfoResult.value?.data ??
            basicInfoResult.value
          : detailsById[portfolioId] ?? portfolio;

      const validationPayload =
        validationResult.status === "fulfilled"
          ? validationResult.value?.data?.data ??
            validationResult.value?.data ??
            validationResult.value ??
            {}
          : {};
      const realizedPnl = transactionsResult.status === "fulfilled"
        ? sumRealizedPnl(transactionsResult.value)
        : Number(portfolio.realizedPnl || 0);

      const nextBasicInfo = {
        ...(basicInfo || {}),
        ...(validationPayload || {}),
        allocations:
          validationPayload?.allocations ??
          validationPayload?.allocationDetails ??
          basicInfo?.allocations ??
          basicInfo?.allocationDetails ??
          [],
        allocationDetails:
          validationPayload?.allocationDetails ??
          validationPayload?.allocations ??
          basicInfo?.allocationDetails ??
          basicInfo?.allocations ??
          [],
      };

      const refreshedAllocations =
        nextBasicInfo.allocations ??
        nextBasicInfo.allocationDetails ??
        [];
      const isDrifting =
        Array.isArray(refreshedAllocations) &&
        refreshedAllocations.some((allocation) => {
          const drift = Number(
            allocation?.driftPercentage ??
              allocation?.drift ??
              0
          );
          return (
            allocation?.satisfied === false ||
            Math.abs(drift) >= DRIFT_LIMIT
          );
        });
      onDriftChange?.(portfolioId, isDrifting);

      setDetailsById((current) => ({
        ...current,
        [portfolioId]: nextBasicInfo,
      }));

      setHoldingsById((current) => ({
        ...current,
        [portfolioId]: holdings,
      }));

      setPortfolioSnapshots((current) =>
        current.map((item) => {
          if (
            String(item.id) !==
            portfolioId
          ) {
            return item;
          }

          const updatedBalance = Number(
            getAvailableBalance(nextBasicInfo, item) ??
              nextBasicInfo?.amount ??
              item?.amount ??
              0
          );

          const holdingsValue =
            Array.isArray(holdings)
              ? holdings.reduce(
                  (sum, holding) =>
                    sum +
                    Number(
                      holding.currentValue ||
                        0
                    ),
                  0
                )
              : 0;

          const reportedAum =
            nextBasicInfo?.aum ??
            nextBasicInfo?.totalCurrentValue ??
            nextBasicInfo?.portfolioValue ??
            nextBasicInfo?.currentValue;
          const updatedAum =
            reportedAum !== null &&
            reportedAum !== undefined &&
            Number.isFinite(Number(reportedAum))
              ? Number(reportedAum)
              : holdingsValue + updatedBalance;

          const holdingsCost = holdings.reduce(
            (sum, holding) =>
              sum + Number(holding.totalCost || 0),
            0
          );
          const calculatedReturn =
            holdingsCost > 0
              ? ((holdingsValue - holdingsCost) / holdingsCost) * 100
              : 0;
          const reportedReturn =
            nextBasicInfo?.return1Y ??
            nextBasicInfo?.returnValue ??
            nextBasicInfo?.returns;
          const updatedReturnValue =
            reportedReturn !== null &&
            reportedReturn !== undefined
              ? parseReturn(reportedReturn)
              : calculatedReturn;
          // Remaining holdings cost + cash includes realized trade P/L.
          // Remove it to recover the portfolio's net contributed capital.
          const investedValue = holdingsCost + updatedBalance - realizedPnl;
          const currentValue = holdingsValue + updatedBalance;
          const pnlAmount = currentValue - investedValue;

          return {
            ...item,
            ...nextBasicInfo,
            amount: updatedBalance,
            cashBalance: updatedBalance,
            availableBalance: updatedBalance,
            availableCash: updatedBalance,
            aum: updatedAum,
            investedValue,
            currentValue,
            pnlAmount,
            realizedPnl,
            returnValue:
              investedValue > 0
                ? (pnlAmount / investedValue) * 100
                : updatedReturnValue,
          };
        })
      );
    } catch (loadError) {
      setErrorsById((current) => ({
        ...current,
        [portfolioId]:
          loadError?.response?.data
            ?.message ||
          loadError?.message ||
          "Could not load portfolio holdings.",
      }));

      throw loadError;
    } finally {
      setLoadingIds((current) =>
        current.filter(
          (id) => id !== portfolioId
        )
      );
    }
  }

  async function togglePortfolio(
    portfolio
  ) {
    const portfolioId = String(
      portfolio.id
    );

    const expanded =
      expandedIds.includes(portfolioId);

    if (expanded) {
      setExpandedIds((current) =>
        current.filter(
          (id) => id !== portfolioId
        )
      );

      return;
    }

    setExpandedIds((current) =>
      current.includes(portfolioId)
        ? current
        : [...current, portfolioId]
    );

    try {
      await loadPortfolioData(portfolio);
    } catch {
      // Child row displays the error.
    }
  }

  async function reloadPortfolioData(
    portfolio
  ) {
    // The expanded row refresh returns the updated holdings and cash balance.
    // loadPortfolioData also recalculates the matching master snapshot from
    // those fresh values. Do not replace it with a second all-portfolios read:
    // that endpoint can still return a cached snapshot and overwrite the
    // just-recalculated master row.
    await loadPortfolioData(portfolio, {
      force: true,
    });
  }

  async function retryPortfolio(
    portfolio
  ) {
    const portfolioId = String(
      portfolio.id
    );

    setHoldingsById((current) => {
      const next = { ...current };
      delete next[portfolioId];
      return next;
    });

    setDetailsById((current) => {
      const next = { ...current };
      delete next[portfolioId];
      return next;
    });

    try {
      await loadPortfolioData(portfolio, {
        force: true,
      });
    } catch {
      // Child row displays the error.
    }
  }

  function applyTradeToLocalState(
    portfolioId,
    selectedHolding,
    tradeSide,
    quantityValue
  ) {
    if (!selectedHolding) {
      return;
    }

    const normalizedId = String(
      portfolioId
    );
    const selectedKey = String(
      selectedHolding.holdingId ??
        selectedHolding.securityId ??
        ""
    );

    const currentHoldings =
      holdingsById[normalizedId] || [];

    const nextHoldings =
      currentHoldings.map((holding) => {
        const holdingKey = String(
          holding.holdingId ??
            holding.securityId ??
            ""
        );

        if (holdingKey !== selectedKey) {
          return holding;
        }

        const oldQuantity = Number(
          holding.quantity || 0
        );
        const nextQuantity =
          tradeSide === "buy"
            ? oldQuantity + quantityValue
            : Math.max(
                oldQuantity - quantityValue,
                0
              );

        const oldCurrentValue = Number(
          holding.currentValue || 0
        );
        const oldTotalCost = Number(
          holding.totalCost || 0
        );
        const unitValue =
          oldQuantity > 0
            ? oldCurrentValue / oldQuantity
            : Number(
                holding.averageCost || 0
              );

        const updatedCurrentValue =
          tradeSide === "buy"
            ? oldCurrentValue +
              unitValue * quantityValue
            : Math.max(
                oldCurrentValue -
                  unitValue *
                    quantityValue,
                0
              );

        const updatedTotalCost =
          tradeSide === "buy"
            ? oldTotalCost +
              Number(
                holding.averageCost || 0
              ) * quantityValue
            : Math.max(
                oldTotalCost -
                  Number(
                    holding.averageCost || 0
                  ) * quantityValue,
                0
              );

        const safeQuantity = Math.max(
          nextQuantity,
          0
        );

        return {
          ...holding,
          quantity: safeQuantity,
          currentValue: updatedCurrentValue,
          totalCost: updatedTotalCost,
          averageCost:
            safeQuantity > 0
              ? updatedTotalCost /
                safeQuantity
              : 0,
        };
      });

    setHoldingsById((current) => ({
      ...current,
      [normalizedId]: nextHoldings,
    }));

    const currentPortfolio =
      portfolioSnapshots.find(
        (item) => String(item.id) === normalizedId
      ) || null;

    const currentAvailableBalance =
      getAvailableBalance(
        detailsById[normalizedId],
        currentPortfolio || {}
      ) ??
      Number(
        (currentPortfolio || {}).availableBalance ??
          (currentPortfolio || {}).cashBalance ??
          (currentPortfolio || {}).amount ??
          0
      );

    const tradeValue =
      Number(
        selectedHolding.currentValue ||
          selectedHolding.averageCost ||
          0
      ) /
        Math.max(
          Number(
            selectedHolding.quantity || 1
          ),
          1
        ) * quantityValue;

    const nextAvailableBalance =
      tradeSide === "buy"
        ? currentAvailableBalance - tradeValue
        : currentAvailableBalance + tradeValue;

    const nextAum = Math.max(
      Number(
        (currentPortfolio || {}).aum ?? 0
      ) +
        (tradeSide === "buy"
          ? tradeValue
          : -tradeValue),
      0
    );

    setDetailsById((current) => ({
      ...current,
      [normalizedId]: {
        ...(current[normalizedId] || {}),
        amount: nextAvailableBalance,
        cashBalance: nextAvailableBalance,
        availableBalance: nextAvailableBalance,
        availableCash: nextAvailableBalance,
        aum: nextAum,
      },
    }));

    setPortfolioSnapshots((current) =>
      current.map((item) => {
        if (String(item.id) !== normalizedId) {
          return item;
        }

        return {
          ...item,
          amount: nextAvailableBalance,
          cashBalance: nextAvailableBalance,
          availableBalance: nextAvailableBalance,
          availableCash: nextAvailableBalance,
          aum: nextAum,
        };
      })
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center gap-2 text-xs text-slate-500">
        <LoaderCircle
          size={15}
          className="animate-spin"
        />

        Loading portfolios...
      </div>
    );
  }

  if (!portfolios.length) {
    return (
      <div className="flex h-full min-h-[180px] items-center justify-center p-8 text-center text-xs text-slate-500">
        No portfolios match the selected
        filters.
      </div>
    );
  }

  return (
    <div className="min-w-[1600px]">
      <div className="sticky top-0 z-20 grid grid-cols-[42px_1.5fr_0.95fr_0.75fr_1fr_1.05fr_1.1fr_0.75fr_0.75fr_minmax(100px,0.65fr)_112px] border-b border-slate-200 bg-[#eff4fc] text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <div />

        <div className="px-3 py-2">
          Portfolio
        </div>

        <div className="px-3 py-2">
          Theme / strategy
        </div>

        <div className="px-3 py-2">
          Allocation type
        </div>

        <div className="px-3 py-2 text-right">
          Invested
        </div>

        <div className="px-3 py-2 text-right">
          Available cash
        </div>

        <div className="px-3 py-2 text-right">
          Current value / AUM
        </div>

        <div className="px-3 py-2 text-right">
          P/L
        </div>

        <div className="px-3 py-2 text-right">
          P/L %
        </div>

        <div className="px-3 py-2">
          Benchmark
        </div>

        <div className="px-3 py-2 text-right">
          Action
        </div>
      </div>

      {portfolioSnapshots
        .filter((portfolio) => visiblePortfolioIdSet.has(String(portfolio.id)))
        .map((portfolio) => {
        const portfolioId = String(
          portfolio.id
        );

        const expanded =
          expandedIds.includes(
            portfolioId
          );

        const childLoading =
          loadingIds.includes(portfolioId);

        const holdings =
          holdingsById[portfolioId] ||
          [];

        const details =
          detailsById[portfolioId];

        const portfolioError =
          errorsById[portfolioId];

        const needsRebalance =
          driftPortfolioIds.includes(
            portfolioId
          );

        return (
          <React.Fragment key={portfolioId}>
            <div
              className={`grid grid-cols-[42px_1.5fr_0.95fr_0.75fr_1fr_1.05fr_1.1fr_0.75fr_0.75fr_minmax(100px,0.65fr)_112px] items-center border-b border-slate-100 text-sm ${
                expanded
                  ? "bg-blue-50/50"
                  : "bg-white hover:bg-blue-50/30"
              }`}
            >
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    togglePortfolio(
                      portfolio
                    )
                  }
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? `Collapse holdings for ${portfolio.name}`
                      : `Expand holdings for ${portfolio.name}`
                  }
                  className="rounded p-1 text-slate-500 hover:bg-blue-100 hover:text-blue-800"
                >
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${
                      expanded
                        ? "rotate-90"
                        : ""
                    }`}
                  />
                </button>
              </div>

              <div className="flex min-w-0 items-center gap-2 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#e9effc] text-[10px] font-semibold text-blue-700">
                  {portfolio.initials}
                </div>

                <div className="min-w-0 leading-tight">
                  <button
                    type="button"
                    onClick={() =>
                      openPortfolio(
                        portfolio
                      )
                    }
                    className="block max-w-full truncate text-left text-[12px] font-semibold text-slate-800 hover:text-blue-800"
                    title={portfolio.name}
                  >
                    {portfolio.name}
                  </button>

                  <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-500">
                    <span className="font-mono">
                      {portfolio.code}
                    </span>

                    <span>·</span>

                    <span>
                      {formatStatus(
                        portfolio.status
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="truncate px-3 text-[11px] font-medium text-slate-700"
                title={portfolio.theme}
              >
                {portfolio.theme}
              </div>

              <div className="flex min-w-0 items-center gap-1.5 px-3 text-[11px] text-slate-600">
                <Scale
                  size={12}
                  className="shrink-0"
                />

                <span className="truncate">
                  {
                    portfolio.allocationType
                  }
                </span>
              </div>

              <div className="px-3 text-right font-mono text-[11px] font-semibold text-blue-900" title={formatCurrencyAmount(portfolio.investedValue)}>
                {formatCurrencyAmount(portfolio.investedValue)}
              </div>

              <div className="px-3 text-right font-mono text-[11px] font-semibold text-slate-700" title={formatCurrencyAmount(portfolio.availableCash)}>
                {formatCurrencyAmount(portfolio.availableCash)}
              </div>

              <div className="px-3 text-right font-mono text-[11px] font-semibold text-blue-900" title={formatCurrencyAmount(portfolio.aum)}>
                {formatCurrencyAmount(portfolio.aum)}
              </div>

              <div
                className={`px-3 text-right font-mono text-[11px] font-semibold ${
                  portfolio.pnlAmount >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {portfolio.pnlAmount >= 0
                  ? "+"
                  : "−"}
                {formatCurrencyAmount(Math.abs(portfolio.pnlAmount))}
              </div>

              <div
                className={`px-3 text-right font-mono text-[11px] font-semibold ${
                  portfolio.returnValue >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {portfolio.returnValue >= 0 ? "+" : ""}{portfolio.returnValue.toFixed(2)}%
              </div>

              <div
                className="truncate px-3 font-mono text-[11px] text-slate-700"
                title={portfolio.benchmark}
              >
                {portfolio.benchmark}
              </div>

              <div className="flex items-center justify-end px-3">
                {needsRebalance &&
                portfolio.status ===
                  "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() =>
                      openPortfolio(
                        portfolio,
                        "trade"
                      )
                    }
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-800 hover:bg-blue-50"
                  >
                    <RefreshCw size={11} />
                    Rebalance
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      openPortfolio(
                        portfolio
                      )
                    }
                    className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-800"
                  >
                    View
                  </button>
                )}
              </div>
            </div>

            {expanded && (
              <div className="border-b border-slate-200 bg-[#f8faff] px-5 py-2.5">
                {childLoading && (
                  <div className="flex min-h-[70px] items-center justify-center gap-2 text-xs text-slate-500">
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />

                    Loading portfolio details
                    and holdings...
                  </div>
                )}

                {!childLoading &&
                  portfolioError && (
                    <div className="flex min-h-[70px] items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50 px-4 text-xs text-red-700">
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          size={14}
                        />

                        <span>
                          {portfolioError}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          retryPortfolio(
                            portfolio
                          )
                        }
                        className="rounded border border-red-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                {!childLoading &&
                  !portfolioError && (
                    <PortfolioChildPanel
                      portfolio={portfolio}
                      details={details}
                      holdings={holdings}
                      onHoldingChanged={() =>
                        reloadPortfolioData(
                          portfolio
                        )
                      }
                    />
                  )}
              </div>
            )}
          </React.Fragment>
        );
        })}
    </div>
  );
}

function PortfolioChildPanel({
  portfolio,
  details,
  holdings,
  onHoldingChanged,
}) {
  const [sortConfig, setSortConfig] =
    useState({
      key: "allocationPercentage",
      direction: "desc",
    });
  const [themeSortConfig, setThemeSortConfig] =
    useState({ key: "assetClass", direction: "asc" });
  const [transactionSortConfig, setTransactionSortConfig] =
    useState({ key: "executedAt", direction: "desc" });

  const [activeTab, setActiveTab] =
    useState("holdings");
  const [tradeRows, setTradeRows] =
    useState([]);
  const [transactions, setTransactions] =
    useState([]);
  const [transactionsLoading, setTransactionsLoading] =
    useState(false);
  const [transactionsError, setTransactionsError] =
    useState("");
  const [tradeDataVersion, setTradeDataVersion] = useState(0);
  const [expandedHoldingKey, setExpandedHoldingKey] = useState(null);
  const [securityTransactions, setSecurityTransactions] = useState([]);
  const [securityTransactionsLoading, setSecurityTransactionsLoading] = useState(false);
  const [securityTransactionsError, setSecurityTransactionsError] = useState("");

  useEffect(() => {
    if (activeTab !== "transactions") return undefined;
    let active = true;
    setTransactionsLoading(true);
    setTransactionsError("");
    getPortfolioTransactions(portfolio.id)
      .then((rows) => {
        if (active) setTransactions(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        if (!active) return;
        setTransactionsError(
          error?.response?.data?.message ||
            error?.message ||
            "Transaction history could not be loaded."
        );
      })
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, portfolio.id, tradeDataVersion]);

  const expandedHolding = holdings.find((holding) =>
    getHoldingRowKey(holding) === expandedHoldingKey
  ) || null;

  useEffect(() => {
    if (!expandedHoldingKey || !expandedHolding) {
      setSecurityTransactions([]);
      setSecurityTransactionsError("");
      setSecurityTransactionsLoading(false);
      return undefined;
    }

    let active = true;
    setSecurityTransactionsLoading(true);
    setSecurityTransactionsError("");
    getPortfolioTransactions(portfolio.id)
      .then((rows) => {
        if (!active) return;
        const transactionsForHolding = (Array.isArray(rows) ? rows : [])
          .filter((transaction) => transactionMatchesHolding(transaction, expandedHolding))
          .sort((a, b) => new Date(b.executedAt || 0) - new Date(a.executedAt || 0));
        setSecurityTransactions(transactionsForHolding);
      })
      .catch((error) => {
        if (!active) return;
        setSecurityTransactionsError(
          error?.response?.data?.message ||
            error?.message ||
            "Security transactions could not be loaded."
        );
      })
      .finally(() => {
        if (active) setSecurityTransactionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [expandedHoldingKey, expandedHolding, portfolio.id, tradeDataVersion]);

  async function refreshAfterTrade() {
    try {
      await onHoldingChanged();
      setTradeDataVersion((version) => version + 1);
    } catch {
      // The expanded row shows its retry action when the refresh fails.
    }
  }

  const totalCurrentValue = useMemo(
    () =>
      holdings.reduce(
        (total, holding) =>
          total +
          Number(
            holding.currentValue || 0
          ),
        0
      ),
    [holdings]
  );

  const sortedTransactions = useMemo(
    () => sortRows(transactions, transactionSortConfig),
    [transactions, transactionSortConfig]
  );

  const sortedHoldings = useMemo(() => {
    const result = [...holdings];

    result.sort((first, second) => {
      const firstValue =
        getHoldingSortValue(
          first,
          sortConfig.key
        );

      const secondValue =
        getHoldingSortValue(
          second,
          sortConfig.key
        );

      let comparison;

      if (
        typeof firstValue === "string" ||
        typeof secondValue === "string"
      ) {
        comparison = String(
          firstValue
        ).localeCompare(
          String(secondValue),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      } else {
        comparison =
          Number(firstValue || 0) -
          Number(secondValue || 0);
      }

      return sortConfig.direction ===
        "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [holdings, sortConfig]);

  const themeRows = useMemo(() => {
    const allocationSource =
      details?.allocations ??
      details?.allocationDetails ??
      portfolio?.allocations ??
      portfolio?.allocationDetails ??
      [];

    if (
      Array.isArray(allocationSource) &&
      allocationSource.length
    ) {
      return allocationSource
        .map((allocation) => {
          const assetClass =
            allocation.assetClass ||
            allocation.name ||
            "Unassigned";
          const investedAmount = holdings.reduce(
            (sum, holding) =>
              sum +
              (holding.assetClass ===
                assetClass ||
              holding.assetClass ===
                allocation.assetClass
                ? Number(
                    holding.totalCost || 0
                  )
                : 0),
            0
          );
          const currentAmount = holdings.reduce(
            (sum, holding) =>
              sum +
              (holding.assetClass ===
                assetClass ||
              holding.assetClass ===
                allocation.assetClass
                ? Number(
                    holding.currentValue ||
                      0
                  )
                : 0),
            0
          );
          const targetPct = parsePercentageValue(
            allocation.targetPercentage ??
              allocation.targetPct ??
              allocation.target ??
              allocation.targetAllocation ??
              allocation.targetAllocationPercentage ??
              allocation.allocationPercentage ??
              0
          );
          const actualPct =
            parsePercentageValue(
              allocation.currentPercentage ??
                allocation.actualPercentage ??
                allocation.actualPct ??
                (totalCurrentValue
                  ? (currentAmount /
                      totalCurrentValue) *
                    100
                  : 0)
            );
          const drift =
            Math.round(
              (actualPct - targetPct) * 100
            ) / 100;

          return {
            assetClass: formatLabel(assetClass),
            theme: portfolio.theme || "Theme",
            targetPct,
            investedAmount,
            actualPct,
            drift,
            currentAmount,
            satisfied:
              allocation.satisfied !== false &&
              Math.abs(drift) < 5,
          };
        })
        .sort((first, second) =>
          second.currentAmount -
            first.currentAmount
        );
    }

    const grouped = new Map();

    holdings.forEach((holding) => {
      const assetClass =
        holding.assetClass ||
        holding.securityType ||
        "Unassigned";

      const currentValueForHolding = Number(
        holding.currentValue || 0
      );
      const totalCostForHolding = Number(
        holding.totalCost || 0
      );

      if (!grouped.has(assetClass)) {
        grouped.set(assetClass, {
          assetClass,
          value: 0,
          cost: 0,
          pnl: 0,
          positions: 0,
        });
      }

      const row = grouped.get(assetClass);
      row.value += currentValueForHolding;
      row.cost += totalCostForHolding;
      row.pnl +=
        currentValueForHolding -
        totalCostForHolding;
      row.positions += 1;
    });

    return Array.from(grouped.values())
      .map((row) => ({
        assetClass: formatLabel(row.assetClass),
        theme: portfolio.theme || "Theme",
        targetPct: 0,
        investedAmount: row.cost,
        actualPct: totalCurrentValue
          ? (row.value / totalCurrentValue) *
            100
          : 0,
        drift: 0,
        currentAmount: row.value,
        satisfied: true,
      }))
      .sort((first, second) =>
        second.currentAmount -
          first.currentAmount
      );
  }, [details, holdings, portfolio.theme, totalCurrentValue]);

  const sortedThemeRows = useMemo(
    () => sortRows(themeRows, themeSortConfig),
    [themeRows, themeSortConfig]
  );

  function handleSort(key) {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction:
            current.direction === "asc"
              ? "desc"
              : "asc",
        };
      }

      return {
        key,
        direction:
          isNumericHoldingColumn(key)
            ? "desc"
            : "asc",
      };
    });
  }

  const tabOptions = [
    { key: "holdings", label: "Holdings" },
    { key: "theme", label: "Theme allocation" },
    { key: "trade", label: "Buy / Sell" },
    { key: "transactions", label: "Transactions", icon: History },
  ];

  function createTradeRow(side = "buy", holding = null) {
    return {
      id:
        Date.now() +
        Math.random() * 1000,
      side,
      searchText:
        holding?.securityName ||
        holding?.symbol ||
        "",
      selectedHoldingId:
        holding
          ? String(
              holding.holdingId ??
                holding.securityId ??
                ""
            )
          : "",
      quantity: "",
      error: "",
    };
  }

  function addTradeRow(side = "buy", holding = null) {
    setTradeRows((current) => [
      ...current,
      createTradeRow(side, holding),
    ]);
    setActiveTab("trade");
  }

  function updateTradeRow(rowId, changes) {
    setTradeRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? { ...row, ...changes }
          : row
      )
    );
  }

  async function submitTradeRow(row) {
    const quantityValue = Number(row.quantity);
    const selectedHolding =
      holdings.find(
        (item) =>
          String(
            item.holdingId ??
              item.securityId
          ) === row.selectedHoldingId
      ) || null;

    if (
      !selectedHolding ||
      !row.selectedHoldingId
    ) {
      updateTradeRow(row.id, {
        error:
          "Select a security before submitting.",
      });
      return;
    }

    if (
      !Number.isInteger(quantityValue) ||
      quantityValue <= 0
    ) {
      updateTradeRow(row.id, {
        error:
          "Enter a whole-number quantity greater than zero.",
      });
      return;
    }

    if (
      row.side === "sell" &&
      quantityValue >
        Number(selectedHolding.quantity || 0)
    ) {
      updateTradeRow(row.id, {
        error:
          "You cannot sell more than the currently held quantity.",
      });
      return;
    }

    try {
      if (row.side === "buy") {
        await buyPortfolioSecurities([
          {
            portfolioId: Number(
              portfolio.id
            ),
            quantity: quantityValue,
            securityId: Number(
              selectedHolding.securityId
            ),
            equityCategory:
              selectedHolding.equityCategory ??
              null,
          },
        ]);
      } else {
        await sellPortfolioHoldings([
          {
            id: Number(
              selectedHolding.holdingId
            ),
            quantity: quantityValue,
          },
        ]);
      }

    } catch (tradeError) {
      updateTradeRow(row.id, {
        error:
          tradeError?.response?.data
            ?.message ||
          tradeError?.message ||
          `Could not complete the ${
            row.side
          } order.`,
      });
      return;
    }

    setTradeRows((current) =>
      current.filter(
        (tradeRow) => tradeRow.id !== row.id
      )
    );
    await refreshAfterTrade();
  }

  async function executeAllTradeRows() {
    const rowsToSubmit = [...tradeRows];
    let completedTrade = false;

    if (!rowsToSubmit.length) {
      return;
    }

    for (const row of rowsToSubmit) {
      const quantityValue = Number(row.quantity);
      const selectedHolding =
        holdings.find(
          (item) =>
            String(
              item.holdingId ??
                item.securityId
            ) === row.selectedHoldingId
        ) || null;

      if (
        !selectedHolding ||
        !row.selectedHoldingId
      ) {
        updateTradeRow(row.id, {
          error:
            "Select a security before submitting.",
        });
        continue;
      }

      if (
        !Number.isInteger(quantityValue) ||
        quantityValue <= 0
      ) {
        updateTradeRow(row.id, {
          error:
            "Enter a whole-number quantity greater than zero.",
        });
        continue;
      }

      if (
        row.side === "sell" &&
        quantityValue >
          Number(selectedHolding.quantity || 0)
      ) {
        updateTradeRow(row.id, {
          error:
            "You cannot sell more than the currently held quantity.",
        });
        continue;
      }

      try {
        if (row.side === "buy") {
          await buyPortfolioSecurities([
            {
              portfolioId: Number(
                portfolio.id
              ),
              quantity: quantityValue,
              securityId: Number(
                selectedHolding.securityId
              ),
              equityCategory:
                selectedHolding.equityCategory ??
                null,
            },
          ]);
        } else {
          await sellPortfolioHoldings([
            {
              id: Number(
                selectedHolding.holdingId
              ),
              quantity: quantityValue,
            },
          ]);
        }

        completedTrade = true;
        setTradeRows((current) =>
          current.filter(
            (tradeRow) => tradeRow.id !== row.id
          )
        );

      } catch (tradeError) {
        updateTradeRow(row.id, {
          error:
            tradeError?.response?.data
              ?.message ||
            tradeError?.message ||
            `Could not complete the ${
              row.side
            } order.`,
        });
      }
    }

    if (completedTrade) await refreshAfterTrade();
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-1.5">
        {tabOptions.map((tab) => (
          (() => {
            const TabIcon = tab.icon;
            return (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {TabIcon && <TabIcon size={12} />}
                {tab.label}
              </button>
            );
          })()
        ))}
      </div>

      {activeTab === "transactions" ? (
        <div role="tabpanel" className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="max-h-[260px] overflow-auto">
            <table className="w-full min-w-[840px] table-fixed text-left text-[10px]">
              <thead className="sticky top-0 z-[1] bg-[#eaf0fa] text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <SortableHeader label="Date / time" sortKey="executedAt" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                  <SortableHeader label="Side" sortKey="side" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                  <SortableHeader label="Security" sortKey="securityName" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                  <SortableHeader label="Qty" sortKey="quantity" align="right" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                  <SortableHeader label="Execution price" sortKey="executionPrice" align="right" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                  <SortableHeader label="Total value" sortKey="totalAmount" align="right" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                  <SortableHeader label="Realized P&L" sortKey="realizedPnl" align="right" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                  <SortableHeader label="Cash after" sortKey="cashBalanceAfter" align="right" sortConfig={transactionSortConfig} onSort={(key) => setTransactionSortConfig((current) => nextSortConfig(current, key))} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactionsLoading ? (
                  <tr><td colSpan={8} className="px-3 py-5 text-center text-slate-500">Loading transactions…</td></tr>
                ) : transactionsError ? (
                  <tr><td colSpan={8} className="px-3 py-5 text-center text-red-600">{transactionsError}</td></tr>
                ) : transactions.length ? (
                  sortedTransactions.map((transaction) => {
                    const realizedPnl = Number(transaction.realizedPnl);
                    const isSell = String(transaction.side).toUpperCase() === "SELL";
                    return (
                      <tr key={transaction.transactionId} className="text-slate-700 hover:bg-slate-50">
                        <td className="whitespace-nowrap px-2.5 py-2 font-mono text-slate-500">{formatTransactionDate(transaction.executedAt)}</td>
                        <td className={`px-2.5 py-2 font-bold ${isSell ? "text-red-700" : "text-emerald-700"}`}>{transaction.side || "—"}</td>
                        <td className="truncate px-2.5 py-2 font-medium" title={transaction.securityName}>{transaction.securityName || "—"}<span className="ml-1.5 font-mono text-[9px] text-slate-400">{transaction.symbol}</span></td>
                        <td className="px-2.5 py-2 text-right font-mono">{formatNumber(transaction.quantity)}</td>
                        <td className="px-2.5 py-2 text-right font-mono">{transaction.executionPrice == null ? "—" : formatMoney(transaction.executionPrice)}</td>
                        <td className="px-2.5 py-2 text-right font-mono font-semibold text-blue-900">{transaction.totalAmount == null ? "—" : formatMoney(transaction.totalAmount)}</td>
                        <td className={`px-2.5 py-2 text-right font-mono font-semibold ${!isSell || transaction.realizedPnl == null ? "text-slate-300" : realizedPnl >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {!isSell || transaction.realizedPnl == null ? "—" : `${realizedPnl >= 0 ? "+" : "−"}${formatMoney(Math.abs(realizedPnl))}`}
                        </td>
                        <td className="px-2.5 py-2 text-right font-mono">{transaction.cashBalanceAfter == null ? "—" : formatMoney(transaction.cashBalanceAfter)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={8} className="px-3 py-5 text-center text-slate-500">No buy or sell transactions recorded for this portfolio.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
            <span>Recorded buy and sell activity</span>
            <span>{transactions.length} transaction{transactions.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      ) : !holdings.length ? (
        <div className="rounded border border-slate-200 bg-white px-3 py-4 text-center text-[11px] text-slate-500">
          No holdings found for this
          portfolio.
        </div>
      ) : activeTab === "holdings" ? (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <table className="w-full min-w-[1020px] table-fixed text-left text-[11px]" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>

            <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <SortableHeader
                  label="Security"
                  sortKey="symbol"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Asset class"
                  sortKey="assetClass"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Category"
                  sortKey="equityCategory"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Quantity"
                  sortKey="quantity"
                  align="right"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Average cost"
                  sortKey="averageCost"
                  align="right"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Total cost"
                  sortKey="totalCost"
                  align="right"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Current value"
                  sortKey="currentValue"
                  align="right"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="Weight"
                  sortKey="allocationPercentage"
                  align="right"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />

                <SortableHeader
                  label="P&L"
                  sortKey="pnl"
                  align="right"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80">
              {sortedHoldings.map(
                (holding) => {
                  const holdingKey = getHoldingRowKey(holding);
                  const isExpanded = expandedHoldingKey === holdingKey;
                  const holdingPnl =
                    Number(
                      holding.currentValue ||
                        0
                    ) -
                    Number(
                      holding.totalCost || 0
                    );

                  return (
                    <React.Fragment key={holdingKey}>
                    <tr className={`h-11 text-[10px] transition-colors hover:bg-slate-50 ${isExpanded ? "bg-blue-50/50" : ""}`}>
                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Hide" : "Show"} transactions for ${holding.securityName || holding.symbol || "security"}`}
                          onClick={() => setExpandedHoldingKey(isExpanded ? null : holdingKey)}
                          className="flex w-full min-w-0 items-center gap-1.5 text-left"
                        >
                          {isExpanded ? <ChevronDown size={13} className="shrink-0 text-blue-700" /> : <ChevronRight size={13} className="shrink-0 text-slate-400" />}
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-semibold tracking-[-0.01em] text-slate-800 hover:text-blue-800">{holding.symbol || "—"}</span>
                            <span className="block truncate text-[10px] text-slate-500" title={holding.securityName}>{holding.securityName || "Unnamed security"}</span>
                          </span>
                        </button>
                      </td>

                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle text-slate-600">
                        {holding.assetClass ||
                          "—"}
                      </td>

                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle text-slate-600">
                        {formatLabel(
                          holding.equityCategory ||
                            holding.securityType ||
                            "—"
                        )}
                      </td>

                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle text-right font-mono text-slate-700">
                        {formatNumber(
                          holding.quantity
                        )}
                      </td>

                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle text-right font-mono text-slate-700">
                        {formatCurrencyAmount(
                          holding.averageCost
                        )}
                      </td>

                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle text-right font-mono text-slate-700">
                        {formatMoney(
                          holding.totalCost
                        )}
                      </td>

                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle text-right font-mono font-semibold text-blue-900">
                        {formatMoney(
                          holding.currentValue
                        )}
                      </td>

                      <td className="border-t border-slate-200 px-2.5 py-2 align-middle text-right font-mono text-slate-700">
                        {Number(
                          holding.allocationPercentage ||
                            0
                        ).toFixed(2)}
                        %
                      </td>

                      <td
                        className={`border-t border-slate-200 px-2.5 py-2 align-middle text-right font-mono font-semibold ${
                          holdingPnl >= 0
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {holdingPnl >= 0
                          ? "+"
                          : ""}
                        {formatMoney(
                          holdingPnl
                        )}
                      </td>

                    </tr>
                    {isExpanded && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={9} className="border-b border-slate-200 px-3 py-2">
                          <div className="overflow-hidden rounded-md border border-blue-100 bg-white">
                            <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/60 px-3 py-1.5">
                              <div className="flex min-w-0 items-center gap-2">
                                <History size={12} className="shrink-0 text-blue-700" />
                                <span className="truncate text-[10px] font-semibold text-slate-800">{holding.securityName || holding.symbol} <span className="font-mono text-slate-500">({holding.symbol || "—"})</span></span>
                                <span className="shrink-0 text-[9px] text-slate-500">{securityTransactions.length} transaction{securityTransactions.length === 1 ? "" : "s"}</span>
                              </div>
                              <button type="button" onClick={() => setExpandedHoldingKey(null)} aria-label="Close security transactions" className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"><X size={12} /></button>
                            </div>
                            {securityTransactionsLoading ? (
                              <p className="px-3 py-3 text-[10px] text-slate-500">Loading security transactions…</p>
                            ) : securityTransactionsError ? (
                              <p className="px-3 py-3 text-[10px] text-red-600">{securityTransactionsError}</p>
                            ) : securityTransactions.length ? (
                              <div className="max-h-40 overflow-auto">
                                <table className="w-full border-collapse text-left text-[10px]">
                                  <thead className="sticky top-0 bg-[#eef3ff] text-[9px] font-bold uppercase tracking-wide text-slate-500">
                                    <tr>
                                      <th className="px-3 py-1.5">Date / time</th>
                                      <th className="px-3 py-1.5">Side</th>
                                      <th className="px-3 py-1.5 text-right">Quantity</th>
                                      <th className="px-3 py-1.5 text-right">Price</th>
                                      <th className="px-3 py-1.5 text-right">Total value</th>
                                      <th className="px-3 py-1.5 text-right">Realized P/L</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {securityTransactions.map((transaction) => {
                                      const isSell = String(transaction.side || "").toUpperCase() === "SELL";
                                      const realized = Number(transaction.realizedPnl || 0);
                                      return (
                                        <tr key={transaction.transactionId}>
                                          <td className="whitespace-nowrap px-3 py-1.5 font-mono text-slate-600">{formatTransactionDate(transaction.executedAt)}</td>
                                          <td className={`px-3 py-1.5 font-bold ${isSell ? "text-red-700" : "text-emerald-700"}`}>{transaction.side || "—"}</td>
                                          <td className="px-3 py-1.5 text-right font-mono text-slate-700">{formatNumber(transaction.quantity)}{String(holding.symbol || "").toUpperCase() === "GOLD" ? " g" : ""}</td>
                                          <td className="px-3 py-1.5 text-right font-mono text-slate-600">{formatCurrencyAmount(transaction.executionPrice)}</td>
                                          <td className="px-3 py-1.5 text-right font-mono font-semibold text-blue-900">{formatCurrencyAmount(transaction.totalAmount)}</td>
                                          <td className={`px-3 py-1.5 text-right font-mono font-semibold ${!isSell ? "text-slate-300" : realized >= 0 ? "text-emerald-700" : "text-red-600"}`}>{!isSell ? "—" : `${realized >= 0 ? "+" : "−"}${formatCurrencyAmount(Math.abs(realized))}`}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="px-3 py-3 text-[10px] text-slate-500">No recorded transactions for this security.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === "theme" ? (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-[11px]">
            <thead className="bg-[#eaf0fa] text-[9px] uppercase tracking-wide text-slate-500">
              <tr>
                <SortableHeader label="Theme" sortKey="theme" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
                <SortableHeader label="Asset" sortKey="assetClass" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
                <SortableHeader label="Theme alloc." sortKey="targetPct" align="right" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
                <SortableHeader label="Invested" sortKey="investedAmount" align="right" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
                <SortableHeader label="Actual alloc." sortKey="actualPct" align="right" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
                <SortableHeader label="Drift" sortKey="drift" align="right" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
                <SortableHeader label="Current amount" sortKey="currentAmount" align="right" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
                <SortableHeader label="Status" sortKey="satisfied" align="right" sortConfig={themeSortConfig} onSort={(key) => setThemeSortConfig((current) => nextSortConfig(current, key))} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedThemeRows.map((row) => (
                <tr key={row.assetClass} className="text-slate-700">
                  <td className="px-2.5 py-2 font-medium text-slate-700">
                    {row.theme}
                  </td>
                  <td className="px-2.5 py-2 font-medium text-slate-700">
                    {row.assetClass}
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono text-slate-700">
                    {Number(row.targetPct || 0).toFixed(2)}%
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono font-semibold text-blue-900">
                    {formatMoney(row.investedAmount || 0)}
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono font-semibold text-slate-700">
                    {Number(row.actualPct || 0).toFixed(2)}%
                  </td>
                  <td
                    className={`px-2.5 py-2 text-right font-mono font-semibold ${
                      Math.abs(Number(row.drift || 0)) < 5
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {Number(row.drift || 0) > 0 ? "+" : ""}
                    {Number(row.drift || 0).toFixed(2)}%
                  </td>
                  <td className="px-2.5 py-2 text-right font-mono font-semibold text-blue-900">
                    {formatMoney(row.currentAmount || 0)}
                  </td>
                  <td className="px-2.5 py-2 text-right">
                    <span
                      className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        row.satisfied
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {row.satisfied ? "In band" : "Breached"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Trade rows
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={executeAllTradeRows}
                disabled={!tradeRows.length}
                className="inline-flex items-center gap-1 rounded bg-blue-800 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Execute orders
              </button>

              <button
                type="button"
                onClick={() => addTradeRow("buy")}
                className="inline-flex items-center gap-1 rounded border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-800 hover:bg-blue-50"
              >
                <Plus size={12} />
                Add row
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-[10px]">
              <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-2 py-2">Side</th>
                  <th className="border-b border-slate-200 px-2 py-2">Security / holding</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-right">Qty</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-right">Est. value</th>
                  <th className="border-b border-slate-200 px-2 py-2 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {tradeRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-[11px] text-slate-500">
                      No trade rows yet. Add a row to begin.
                    </td>
                  </tr>
                ) : (
                  tradeRows.map((row) => {
                    const options = holdings.filter((item) => {
                      const query = (row.searchText || "").trim().toLowerCase();

                      if (!query) return true;

                      return (
                        (item.securityName || "").toLowerCase().includes(query) ||
                        (item.symbol || "").toLowerCase().includes(query)
                      );
                    });

                    const selectedHolding = holdings.find(
                      (item) =>
                        String(item.holdingId ?? item.securityId) === row.selectedHoldingId
                    ) || null;
                    const selectedDisplayName =
                      selectedHolding?.securityName ||
                      selectedHolding?.symbol ||
                      row.searchText ||
                      "";

                    const isSell = row.side === "sell";
                    const ownedQuantity = Number(selectedHolding?.quantity || 0);
                    const unitPrice = selectedHolding
                      ? Number(selectedHolding.currentValue || 0) /
                        Math.max(Number(selectedHolding.quantity || 1), 1)
                      : 0;
                    const estimatedValue =
                      Number(row.quantity || 0) > 0 ? unitPrice * Number(row.quantity || 0) : 0;

                    return (
                      <tr key={row.id} className={isSell ? "bg-red-50/30" : "bg-emerald-50/30"}>
                        <td className="border-b border-slate-200 px-2 py-2 align-top">
                          <select
                            value={row.side}
                            onChange={(event) =>
                              updateTradeRow(row.id, {
                                side: event.target.value,
                                selectedHoldingId: "",
                                searchText: "",
                                quantity: "",
                                error: "",
                              })
                            }
                            className={`h-8 w-full rounded border bg-white px-2 text-[10px] font-semibold outline-none focus:border-blue-500 ${
                              isSell ? "border-red-200 text-red-700" : "border-emerald-200 text-emerald-700"
                            }`}
                          >
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                          </select>
                        </td>

                        <td className="border-b border-slate-200 px-2 py-2 align-top">
                          <div className="relative">
                            <input
                              value={
                                row.selectedHoldingId
                                  ? selectedDisplayName
                                  : row.searchText
                              }
                              onChange={(event) => {
                                updateTradeRow(row.id, {
                                  selectedHoldingId: "",
                                  searchText: event.target.value,
                                  error: "",
                                });
                              }}
                              placeholder={isSell ? "Search held security…" : "Search security…"}
                              className="h-8 w-full rounded border border-slate-200 bg-white px-2 text-[10px] outline-none focus:border-blue-500"
                            />

                            {!row.selectedHoldingId && row.searchText && (
                              <ul className="absolute left-0 right-0 z-20 mt-1 max-h-36 overflow-auto rounded border border-slate-200 bg-white text-[10px] shadow-sm">
                                {options.length ? (
                                  options.map((item) => (
                                    <li
                                      key={item.holdingId ?? item.securityId}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        updateTradeRow(row.id, {
                                          selectedHoldingId: String(item.holdingId ?? item.securityId),
                                          searchText: item.securityName || item.symbol || "",
                                          quantity: "",
                                          error: "",
                                        });
                                      }}
                                      className="cursor-pointer px-2 py-1.5 hover:bg-slate-50"
                                    >
                                      {item.securityName || item.symbol || "—"} <span className="text-slate-500">({item.symbol || "—"})</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="px-2 py-1.5 text-slate-500">No matches found</li>
                                )}
                              </ul>
                            )}
                          </div>
                        </td>

                        <td className="border-b border-slate-200 px-2 py-2 align-top text-right">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            max={isSell ? ownedQuantity || undefined : undefined}
                            value={row.quantity}
                            onChange={(event) =>
                              updateTradeRow(row.id, {
                                quantity: event.target.value,
                                error: "",
                              })
                            }
                            className="h-8 w-24 rounded border border-slate-200 bg-white px-2 text-right text-[10px] outline-none focus:border-blue-500"
                            placeholder="Qty"
                          />
                        </td>

                        <td className="border-b border-slate-200 px-2 py-2 align-top text-right font-mono font-semibold text-slate-800">
                          {formatMoney(estimatedValue)}
                        </td>

                        <td className="border-b border-slate-200 px-2 py-2 align-top text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setTradeRows((current) => current.filter((tradeRow) => tradeRow.id !== row.id))
                              }
                              className="rounded border border-slate-200 bg-white px-2 py-1.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Remove
                            </button>
                          </div>

                          {row.error && (
                            <div className="mt-2 rounded border border-red-100 bg-red-50 px-2 py-1 text-[9px] text-red-700">
                              {row.error}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TradeDialog({
  type,
  holding,
  holdings,
  portfolio,
  availableBalance,
  onClose,
  onCompleted,
}) {
  const [quantity, setQuantity] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState("");
  const [tradeSide, setTradeSide] =
    useState(type);
  const [searchText, setSearchText] =
    useState(
      holding?.securityName ||
        holding?.symbol ||
        ""
    );
  const [selectedHoldingId, setSelectedHoldingId] =
    useState(
      String(
        holding?.holdingId ??
          holding?.securityId ??
          ""
      )
    );

  const isBuy = tradeSide === "buy";
  const matchingHoldings =
    holdings?.filter((item) => {
      const query =
        searchText.trim().toLowerCase();
      if (!query) return true;

      return (
        (item.securityName || "")
          .toLowerCase()
          .includes(query) ||
        (item.symbol || "")
          .toLowerCase()
          .includes(query)
      );
    }) || [holding];

  const selectedHolding =
    holdings?.find(
      (item) =>
        String(item.holdingId ?? item.securityId) ===
        selectedHoldingId
    ) || holding;

  const activeHolding =
    selectedHolding ||
    matchingHoldings[0] ||
    holding;

  const enteredQuantity = Number(quantity);
  const ownedQuantity = Number(
    activeHolding?.quantity || 0
  );

  const estimatedUnitPrice =
    ownedQuantity > 0
      ? Number(
          activeHolding?.currentValue || 0
        ) / ownedQuantity
      : Number(
          activeHolding?.averageCost || 0
        );

  const estimatedOrderValue =
    Number.isFinite(enteredQuantity) &&
    enteredQuantity > 0
      ? estimatedUnitPrice *
        enteredQuantity
      : 0;

  const quantityIsValid =
    Number.isInteger(enteredQuantity) &&
    enteredQuantity > 0;

  const exceedsOwnedQuantity =
    !isBuy &&
    quantityIsValid &&
    enteredQuantity > ownedQuantity;

  const hasKnownBalance =
    availableBalance !== null;

  const hasInsufficientBalance =
    isBuy &&
    quantityIsValid &&
    hasKnownBalance &&
    estimatedOrderValue >
      availableBalance;

  const canSubmit =
    quantityIsValid &&
    !exceedsOwnedQuantity &&
    !hasInsufficientBalance &&
    !submitting;

  useEffect(() => {
    function handleEscape(event) {
      if (
        event.key === "Escape" &&
        !submitting
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [onClose, submitting]);

  async function submitTrade(event) {
    event.preventDefault();
    setError("");

    if (!quantityIsValid) {
      setError(
        "Enter a whole-number quantity greater than zero."
      );
      return;
    }

    if (exceedsOwnedQuantity) {
      setError(
        `You only own ${formatNumber(
          ownedQuantity
        )} units.`
      );
      return;
    }

    if (hasInsufficientBalance) {
      setError(
        "The portfolio does not have enough available balance for this estimated order."
      );
      return;
    }

    if (
      isBuy &&
      (activeHolding.securityId === null ||
        activeHolding.securityId === undefined)
    ) {
      setError(
        "The security ID is missing. The buy order cannot be submitted."
      );
      return;
    }

    if (
      !isBuy &&
      (activeHolding.holdingId === null ||
        activeHolding.holdingId === undefined)
    ) {
      setError(
        "The holding ID is missing. The sell order cannot be submitted."
      );
      return;
    }

    setSubmitting(true);

    try {
      if (isBuy) {
        const buyOrders = [
          {
            portfolioId: Number(
              portfolio.id
            ),
            quantity: enteredQuantity,
            securityId: Number(
              activeHolding.securityId
            ),
            equityCategory:
              activeHolding.equityCategory ??
              null,
          },
        ];

        await buyPortfolioSecurities(
          buyOrders
        );
      } else {
        const sellOrders = [
          {
            id: Number(
              activeHolding.holdingId
            ),
            quantity: enteredQuantity,
          },
        ];

        await sellPortfolioHoldings(
          sellOrders
        );
      }

      await onCompleted();
    } catch (tradeError) {
      setError(
        tradeError?.response?.data
          ?.message ||
          tradeError?.message ||
          `Could not complete the ${
            isBuy ? "buy" : "sell"
          } order.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`flex items-center justify-between border-b px-3 py-2 ${
          isBuy
            ? "border-emerald-100 bg-emerald-50"
            : "border-rose-100 bg-rose-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              isBuy
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {isBuy ? "Buy" : "Sell"}
          </span>
          <span className="text-[11px] font-semibold text-slate-800">
            {activeHolding?.symbol || "Security"}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close trade panel"
          className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-50"
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={submitTrade} className="space-y-3 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-[10px] font-semibold text-slate-700">
            Action
            <select
              value={tradeSide}
              onChange={(event) => {
                const nextSide =
                  event.target.value;
                setTradeSide(nextSide);
                setSearchText(
                  nextSide === "buy"
                    ?
                        activeHolding?.securityName ||
                        activeHolding?.symbol ||
                        ""
                    :
                        activeHolding?.securityName ||
                        activeHolding?.symbol ||
                        ""
                );
              }}
              className="mt-1 h-8 w-full rounded border border-slate-200 bg-white px-2 text-[11px] outline-none focus:border-blue-500"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>

          <label className="block text-[10px] font-semibold text-slate-700">
            Quantity
            <input
              type="number"
              min="1"
              step="1"
              max={
                isBuy
                  ? undefined
                  : ownedQuantity
              }
              value={quantity}
              onChange={(event) => {
                setQuantity(
                  event.target.value
                );
                setError("");
              }}
              className="mt-1 h-8 w-full rounded border border-slate-200 bg-white px-2 text-[11px] outline-none focus:border-blue-500"
              placeholder="Qty"
            />
          </label>
        </div>

        <label className="block text-[10px] font-semibold text-slate-700">
          Search security
          <input
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="Type symbol or name…"
            className="mt-1 h-8 w-full rounded border border-slate-200 bg-white px-2 text-[11px] outline-none focus:border-blue-500"
          />
        </label>

        {searchText && (
          <div className="max-h-32 overflow-auto rounded border border-slate-200 bg-slate-50">
            {matchingHoldings.length ? (
              matchingHoldings.map((item) => (
                <button
                  key={
                    item.holdingId ??
                    item.securityId
                  }
                  type="button"
                  onClick={() => {
                    const nextKey = String(
                      item.holdingId ??
                        item.securityId
                    );
                    setSelectedHoldingId(nextKey);
                    setSearchText(
                      item.securityName ||
                        item.symbol ||
                        ""
                    );
                    setQuantity("");
                    setError("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-[10px] hover:bg-white"
                >
                  <span>
                    {item.securityName ||
                      item.symbol || "—"}
                  </span>
                  <span className="font-mono text-slate-500">
                    {item.symbol || "—"}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-2 py-1.5 text-[10px] text-slate-500">
                No matches found
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-600">
          <span>Estimated value</span>
          <span className="font-mono font-semibold text-slate-900">
            {formatMoney(estimatedOrderValue)}
          </span>
        </div>

        {exceedsOwnedQuantity && (
          <TradeWarning tone="red">
            You cannot sell more than{" "}
            {formatNumber(ownedQuantity)} units.
          </TradeWarning>
        )}

        {hasInsufficientBalance && (
          <TradeWarning tone="red">
            Insufficient available balance.
          </TradeWarning>
        )}

        {error && (
          <div
            role="alert"
            className="rounded border border-red-100 bg-red-50 px-2.5 py-1.5 text-[10px] text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-8 rounded border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex h-8 items-center gap-1 rounded px-2.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              isBuy
                ? "bg-emerald-700 hover:bg-emerald-800"
                : "bg-red-700 hover:bg-red-800"
            }`}
          >
            {submitting ? (
              <LoaderCircle
                size={12}
                className="animate-spin"
              />
            ) : isBuy ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {submitting
              ? "Processing..."
              : `Confirm ${isBuy ? "Buy" : "Sell"}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function TradeWarning({
  tone,
  children,
}) {
  const classes =
    tone === "red"
      ? "border-red-100 bg-red-50 text-red-700"
      : "border-amber-100 bg-amber-50 text-amber-700";

  return (
    <div
      className={`flex gap-2 rounded-md border px-3 py-2 text-[11px] ${classes}`}
    >
      <AlertTriangle
        size={14}
        className="shrink-0"
      />

      <span>{children}</span>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  sortConfig,
  onSort,
  align = "left",
}) {
  const isActive =
    sortConfig.key === sortKey;

  return (
    <th
      scope="col"
      aria-sort={
        isActive
          ? sortConfig.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={`border-b border-slate-200 px-2 py-1.5 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex w-full items-center gap-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-wide ${
          align === "right"
            ? "justify-end"
            : "justify-start"
        } ${
          isActive
            ? "text-blue-800"
            : "text-slate-500 hover:text-blue-800"
        }`}
      >
        <span>{label}</span>

        {isActive ? (
          sortConfig.direction === "asc" ? (
            <ArrowUp size={10} />
          ) : (
            <ArrowDown size={10} />
          )
        ) : (
          <ChevronsUpDown
            size={10}
            className="opacity-50"
          />
        )}
      </button>
    </th>
  );
}

function TradeSummary({
  label,
  value,
  valueClass = "text-slate-800",
}) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div
        className={`mt-0.5 font-mono text-xs font-semibold ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function parsePercentageValue(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const numericValue =
    typeof value === "string"
      ? value.replace(/%/g, "").replace(/,/g, "").trim()
      : value;

  const parsed = Number(numericValue);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function getAvailableBalance(
  details,
  portfolio
) {
  const possibleBalance =
    details?.availableBalance ??
    details?.cashBalance ??
    details?.availableCash ??
    details?.balance ??
    details?.amount ??
    portfolio?.availableBalance ??
    portfolio?.cashBalance ??
    portfolio?.availableCash ??
    portfolio?.balance ??
    portfolio?.amount;

  if (
    possibleBalance === null ||
    possibleBalance === undefined ||
    possibleBalance === ""
  ) {
    return null;
  }

  const balance = Number(
    possibleBalance
  );

  return Number.isFinite(balance)
    ? balance
    : null;
}

function nextSortConfig(current, key) {
  if (current.key === key) {
    return {
      key,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }

  const descendingByDefault = new Set([
    "executedAt",
    "quantity",
    "executionPrice",
    "totalAmount",
    "realizedPnl",
    "cashBalanceAfter",
    "targetPct",
    "investedAmount",
    "actualPct",
    "drift",
    "currentAmount",
    "satisfied",
  ]);
  return {
    key,
    direction: descendingByDefault.has(key) ? "desc" : "asc",
  };
}

function sortRows(rows, sortConfig) {
  const numericFields = new Set([
    "quantity",
    "executionPrice",
    "totalAmount",
    "realizedPnl",
    "cashBalanceAfter",
    "targetPct",
    "investedAmount",
    "actualPct",
    "drift",
    "currentAmount",
    "satisfied",
  ]);

  return [...rows].sort((first, second) => {
    let firstValue = first?.[sortConfig.key];
    let secondValue = second?.[sortConfig.key];

    if (sortConfig.key === "executedAt") {
      firstValue = Date.parse(firstValue || "") || 0;
      secondValue = Date.parse(secondValue || "") || 0;
    }

    let comparison;
    if (numericFields.has(sortConfig.key)) {
      comparison = Number(firstValue || 0) - Number(secondValue || 0);
    } else {
      comparison = String(firstValue ?? "").localeCompare(
        String(secondValue ?? ""),
        undefined,
        { numeric: true, sensitivity: "base" }
      );
    }

    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
}

function getHoldingSortValue(
  holding,
  key
) {
  switch (key) {
    case "symbol":
      return `${holding.symbol || ""} ${
        holding.securityName || ""
      }`;

    case "assetClass":
      return holding.assetClass || "";

    case "equityCategory":
      return (
        holding.equityCategory ||
        holding.securityType ||
        ""
      );

    case "quantity":
      return Number(
        holding.quantity || 0
      );

    case "averageCost":
      return Number(
        holding.averageCost || 0
      );

    case "totalCost":
      return Number(
        holding.totalCost || 0
      );

    case "currentValue":
      return Number(
        holding.currentValue || 0
      );

    case "allocationPercentage":
      return Number(
        holding.allocationPercentage ||
          0
      );

    case "pnl":
      return (
        Number(
          holding.currentValue || 0
        ) -
        Number(holding.totalCost || 0)
      );

    default:
      return holding[key] ?? "";
  }
}

function isNumericHoldingColumn(key) {
  return [
    "quantity",
    "averageCost",
    "totalCost",
    "currentValue",
    "allocationPercentage",
    "pnl",
  ].includes(key);
}

function exportPortfolioCsv(rows) {
  const headers = [
    "Portfolio",
    "Code",
    "Theme",
    "Allocation Type",
    "Invested",
    "Available Cash",
    "Current Value / AUM",
    "P/L",
    "P/L %",
    "Benchmark",
    "Status",
  ];

  const dataRows = rows.map(
    (portfolio) => [
      portfolio.name,
      portfolio.code,
      portfolio.theme,
      portfolio.allocationType,
      portfolio.investedValue,
      portfolio.availableCash,
      portfolio.aum,
      portfolio.pnlAmount,
      portfolio.returnValue,
      portfolio.benchmark,
      portfolio.status,
    ]
  );

  const content = [
    headers,
    ...dataRows,
  ]
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(
              value ?? ""
            ).replaceAll('"', '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  const objectUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = objectUrl;
  link.download =
    "portfolio-ledger.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

function parseReturn(value) {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const parsed = Number.parseFloat(
    String(value ?? "0")
      .replaceAll(",", "")
      .replace("%", "")
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function sumRealizedPnl(transactions) {
  return Array.isArray(transactions)
    ? transactions.reduce(
        (total, transaction) =>
          total +
          (String(transaction?.side || "").toUpperCase() === "SELL"
            ? Number(transaction?.realizedPnl || 0)
            : 0),
        0
      )
    : 0;
}

function initialsFor(name) {
  return String(name || "P")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatNumber(value) {
  const number = Number(value || 0);

  return number.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

function formatCurrencyAmount(value) {
  const amount = Number(value || 0);

  return `₹ ${amount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  const absoluteAmount =
    Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absoluteAmount >= 10000000) {
    return `${sign}₹ ${(
      absoluteAmount / 10000000
    ).toFixed(2)} Cr`;
  }

  if (absoluteAmount >= 100000) {
    return `${sign}₹ ${(
      absoluteAmount / 100000
    ).toFixed(2)} L`;
  }

  return `${sign}₹ ${absoluteAmount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatTransactionDate(value) {
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
      });
}

function getHoldingRowKey(holding) {
  return String(
    holding?.holdingId ?? `${holding?.securityId}-${holding?.symbol}`
  );
}

function transactionMatchesHolding(transaction, holding) {
  const transactionSymbol = String(transaction?.symbol || "").trim().toUpperCase();
  const holdingSymbol = String(holding?.symbol || "").trim().toUpperCase();
  if (transactionSymbol && holdingSymbol) {
    return transactionSymbol === holdingSymbol;
  }
  const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
  return normalizeName(transaction?.securityName) === normalizeName(holding?.securityName);
}

function formatLabel(value) {
  const label = String(
    value ?? ""
  ).trim();

  if (!label || label === "—") {
    return "—";
  }

  return label
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function formatStatus(status) {
  const normalizedStatus = String(
    status || ""
  ).toUpperCase();

  if (normalizedStatus === "NEW") {
    return "New";
  }

  if (
    ["CANCELED", "CLOSED"].includes(
      normalizedStatus
    )
  ) {
    return "Closed";
  }

  if (
    ["CREATED", "DRAFT"].includes(
      normalizedStatus
    )
  ) {
    return "Draft";
  }

  if (!normalizedStatus) {
    return "Unknown";
  }

  return (
    normalizedStatus.charAt(0) +
    normalizedStatus
      .slice(1)
      .toLowerCase()
  );
}

export default PortfolioPage;
