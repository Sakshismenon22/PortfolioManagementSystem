import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  Edit3,
  Search,
  Plus,
  X,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  Building2,
  WalletCards,
  Scale,
  TrendingUp,
} from "lucide-react";

import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import { getAllSecuritiesInfo } from "../services/securityService";



const themes = [
  {
    id: 1,
    name: "Aggressive Growth",
    risk: "HIGH",
    investmentHorizon: "LONG_TERM",
    allocationRules: [
      {
        asset: "Stock",
        percentage: 60,
      },
      {
        asset: "Mutual Fund",
        percentage: 15,
      },
      {
        asset: "ETF",
        percentage: 15,
      },
      {
        asset: "Commodity",
        percentage: 10,
      },
    ],
  },
  {
    id: 2,
    name: "Balanced Growth",
    risk: "MODERATE",
    investmentHorizon: "MEDIUM_TERM",
    allocationRules: [
      {
        asset: "Stock",
        percentage: 50,
      },
      {
        asset: "Mutual Fund",
        percentage: 25,
      },
      {
        asset: "ETF",
        percentage: 15,
      },
      {
        asset: "Commodity",
        percentage: 10,
      },
    ],
  },
  {
    id: 3,
    name: "Conservative",
    risk: "LOW",
    investmentHorizon: "SHORT_TERM",
    allocationRules: [
      {
        asset: "Stock",
        percentage: 30,
      },
      {
        asset: "Mutual Fund",
        percentage: 40,
      },
      {
        asset: "ETF",
        percentage: 20,
      },
      {
        asset: "Commodity",
        percentage: 10,
      },
    ],
  },
];

// const securities = [
//   {
//     id: 1,
//     symbol: "RELIANCE",
//     name: "Reliance Industries Ltd",
//     isin: "INE002A01018",
//     assetClass: "Stock",
//     price: 2940.5,
//   },
//   {
//     id: 2,
//     symbol: "TCS",
//     name: "Tata Consultancy Services",
//     isin: "INE467B01029",
//     assetClass: "Stock",
//     price: 3920.0,
//   },
//   {
//     id: 3,
//     symbol: "HDFCBANK",
//     name: "HDFC Bank Ltd",
//     isin: "INE040A01034",
//     assetClass: "Stock",
//     price: 1530.2,
//   },
//   {
//     id: 4,
//     symbol: "SBIDIRECT",
//     name: "SBI Bluechip Direct Growth",
//     isin: "INF200K01135",
//     assetClass: "Mutual Fund",
//     price: 84.2,
//   },
//   {
//     id: 5,
//     symbol: "NIFTYBEES",
//     name: "Nippon India Nifty 50 BeES",
//     isin: "INF204KB14I2",
//     assetClass: "ETF",
//     price: 248.1,
//   },
//   {
//     id: 6,
//     symbol: "GOLDBEES",
//     name: "Sovereign Gold Bond / Gold",
//     isin: "INF732E01037",
//     assetClass: "Commodity",
//     price: 6420.0,
//   },
// ];

const benchmarks = [
  {
    id: "NIFTY_50",
    name: "NIFTY 50",
    category: "NSE LARGE CAP",
    description:
      "National Stock Exchange benchmark tracking 50 premier large-cap companies.",
    beta: "1.00",
    return1Y: "+18.4%",
  },
  {
    id: "NIFTY_100",
    name: "NIFTY 100",
    category: "NSE BROAD MARKET",
    description:
      "Captures top 100 liquid blue-chip companies across multiple sectors.",
    beta: "1.04",
    return1Y: "+19.2%",
  },
  {
    id: "NIFTY_500",
    name: "NIFTY 500",
    category: "BROAD MULTI-CAP",
    description:
      "Covers approximately 96% of free float market capitalization.",
    beta: "1.08",
    return1Y: "+22.1%",
  },
  {
    id: "SENSEX",
    name: "S&P BSE SENSEX",
    category: "BSE BELLWETHER",
    description:
      "Calculated based on well-established and financially sound BSE equities.",
    beta: "0.98",
    return1Y: "+17.8%",
  },
];




const CreatePortfolioPage = () => {


  const [currentStep, setCurrentStep] = useState(1);
  const [securities,setSecurities] = useState([]);
  const loadSecurities = async ()=>{
    const res = await getAllSecuritiesInfo();
    setSecurities(res.data.securities);
    console.log(securities);
  }
  useEffect(()=>{
    loadSecurities();
  },[]);

  const [portfolio, setPortfolio] = useState({
    name: "",
    portfolioType: "WEIGHTAGE",
    currency: "INR",
    exchange: "NSE",
    amount: "",
    theme: null,
    benchmark: null,
    reBalancingFrequency: "MONTHLY",
  });



  const [selectedSecurities, setSelectedSecurities] =
    useState([]);

  const [securitySearch, setSecuritySearch] =
    useState("");


  const [selectedTheme, setSelectedTheme] =
    useState(null);


  const [selectedBenchmark, setSelectedBenchmark] =
    useState(null);



  const filteredSecurities = useMemo(() => {
    if (!securitySearch.trim()) {
      return securities;
    }

    const query = securitySearch.toLowerCase();

    return securities.filter(
      (security) =>
        security.name.toLowerCase().includes(query) ||
        security.symbol.toLowerCase().includes(query) ||
        security.isin.toLowerCase().includes(query)
    );
  }, [securitySearch]);




  const handleBasicInfoChange = (field, value) => {
    setPortfolio((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  const handleSelectTheme = (theme) => {
    setSelectedTheme(theme);

    setPortfolio((previous) => ({
      ...previous,
      theme: theme.id,
    }));
  };


 
  const handleAddSecurity = (security) => {
    const alreadyAdded = selectedSecurities.some(
      (item) => item.id === security.id
    );

    if (alreadyAdded) {
      return;
    }

    setSelectedSecurities((previous) => [
      ...previous,
      {
        ...security,
        allocation: 0,
      },
    ]);
  };


  

  const handleRemoveSecurity = (securityId) => {
    setSelectedSecurities((previous) =>
      previous.filter(
        (security) => security.id !== securityId
      )
    );
  };




  const handleAllocationChange = (
    securityId,
    value
  ) => {
    setSelectedSecurities((previous) =>
      previous.map((security) =>
        security.id === securityId
          ? {
              ...security,
              allocation:
                Number(value) || 0,
            }
          : security
      )
    );
  };



  const totalAllocation = selectedSecurities.reduce(
    (total, security) =>
      total + Number(security.allocation || 0),
    0
  );


 

  const getCurrentAssetAllocation = (assetClass) => {
    return selectedSecurities
      .filter(
        (security) =>
          security.assetClass === assetClass
      )
      .reduce(
        (total, security) =>
          total +
          Number(security.allocation || 0),
        0
      );
  };




  const getThemeRule = (assetClass) => {
    if (!selectedTheme) {
      return 0;
    }

    return (
      selectedTheme.allocationRules.find(
        (rule) =>
          rule.asset === assetClass
      )?.percentage || 0
    );
  };


  const isThemeSatisfied = (assetClass) => {
    return (
      getCurrentAssetAllocation(assetClass) ===
      getThemeRule(assetClass)
    );
  };




  const themeAllocationValid =
    selectedTheme &&
    selectedTheme.allocationRules.every(
      (rule) =>
        getCurrentAssetAllocation(
          rule.asset
        ) === rule.percentage
    );





  const goNext = () => {
    if (currentStep < 6) {
      setCurrentStep(
        (previous) => previous + 1
      );
    }
  };


  const goPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(
        (previous) => previous - 1
      );
    }
  };



  const handleSaveDraft = () => {
    console.log(
      "Saving portfolio draft:",
      {
        ...portfolio,
        theme: selectedTheme,
        benchmark: selectedBenchmark,
        securities: selectedSecurities,
      }
    );

    alert("Portfolio saved as draft.");
  };




  const handleCreatePortfolio = () => {
    const payload = {
      ...portfolio,
      themeId: selectedTheme?.id,
      benchmark: selectedBenchmark?.id,
      securities: selectedSecurities,
    };

    console.log(
      "Portfolio payload:",
      payload
    );

    alert(
      "Portfolio created successfully!"
    );
  };



  const steps = [
    {
      number: 1,
      title: "Basic Info",
    },
    {
      number: 2,
      title: "Select Theme",
    },
    {
      number: 3,
      title: "Securities & Target",
    },
    {
      number: 4,
      title: "Benchmark",
    },
    {
      number: 5,
      title: "Rebalancing",
    },
    {
      number: 6,
      title: "Review & Launch",
    },
  ];



  return (
    <div className="min-h-screen bg-[#f6f8fd]">



      <SideBarComponent
        activePage="Portfolios"
        setActivePage={() => {}}
      />


    

      <div className="ml-[257px]">

        <TopBarComponent />


        <main className="px-5 py-4">


       

          <div className="flex items-start justify-between">

            <div>

              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-wider text-blue-700">

                <span>
                  MANDATE SETUP
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span className="text-slate-500">
                  Draft Ref: PRT-2026-089A
                </span>

              </div>


              <h1 className="text-2xl font-semibold text-slate-900">
                Create New Portfolio
              </h1>


              <p className="mt-1 max-w-[700px] text-sm text-slate-500">
                Follow the 6-step guided workflow
                to configure mandates, select themes,
                add securities, validate target
                allocation, assign benchmarks, and
                set drift thresholds.
              </p>

            </div>


            <div className="flex gap-2">

              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
              >
                <WalletCards size={16} />
                Quick Save
              </button>

              <button className="flex items-center gap-2 rounded-md bg-[#edf2fb] px-4 py-2.5 text-sm font-semibold text-slate-600">
                <X size={16} />
                Cancel / Exit
              </button>

            </div>

          </div>



          <div className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-4">

            <div className="flex items-center">

              {steps.map((step, index) => {

                const completed =
                  currentStep > step.number;

                const active =
                  currentStep === step.number;

                return (
                  <React.Fragment
                    key={step.number}
                  >

                    <div className="flex min-w-[80px] flex-col items-center">

                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          completed
                            ? "bg-emerald-700 text-white"
                            : active
                            ? "bg-blue-700 text-white ring-4 ring-blue-100"
                            : "bg-[#e7edf8] text-slate-500"
                        }`}
                      >

                        {completed ? (
                          <Check size={16} />
                        ) : (
                          step.number
                            .toString()
                            .padStart(2, "0")
                        )}

                      </div>


                      <div
                        className={`mt-1 text-[10px] font-semibold ${
                          active
                            ? "text-blue-700"
                            : "text-slate-500"
                        }`}
                      >
                        Step {step.number}
                      </div>


                      <div className="text-[9px] text-slate-500">
                        {step.title}
                      </div>

                    </div>


                    {index <
                      steps.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 ${
                          currentStep >
                          step.number
                            ? "bg-blue-700"
                            : "bg-blue-100"
                        }`}
                      />
                    )}

                  </React.Fragment>
                );
              })}

            </div>

          </div>


          {currentStep === 1 && (
            <div className="mt-5 grid grid-cols-3 gap-4">

              <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                    <span className="font-bold">
                      1
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Basic Portfolio Information
                    </h2>

                    <p className="text-xs text-slate-500">
                      Configure the core portfolio mandate.
                    </p>
                  </div>

                </div>


                <div className="grid grid-cols-2 gap-4">

       

                  <div className="col-span-2">

                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Portfolio Name
                    </label>

                    <input
                      value={portfolio.name}
                      onChange={(e) =>
                        handleBasicInfoChange(
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="e.g. Growth Portfolio"
                      className="mt-1 w-full rounded-md border border-slate-200 bg-[#f7f9fd] px-3 py-3 text-sm outline-none focus:border-blue-500"
                    />

                  </div>




                  <div>

                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Portfolio Type
                    </label>

                    <select
                      value={
                        portfolio.portfolioType
                      }
                      onChange={(e) =>
                        handleBasicInfoChange(
                          "portfolioType",
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 bg-[#f7f9fd] px-3 py-3 text-sm outline-none"
                    >
                      <option value="WEIGHTAGE">
                        Weightage
                      </option>

                      <option value="AMOUNT">
                        Amount
                      </option>
                    </select>

                  </div>


       

                  <div>

                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Portfolio Amount
                    </label>

                    <input
                      type="number"
                      value={portfolio.amount}
                      onChange={(e) =>
                        handleBasicInfoChange(
                          "amount",
                          e.target.value
                        )
                      }
                      placeholder="₹ 1,00,00,000"
                      className="mt-1 w-full rounded-md border border-slate-200 bg-[#f7f9fd] px-3 py-3 text-sm outline-none"
                    />

                  </div>



                  <div>

                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Currency
                    </label>

                    <select
                      value={
                        portfolio.currency
                      }
                      onChange={(e) =>
                        handleBasicInfoChange(
                          "currency",
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 bg-[#f7f9fd] px-3 py-3 text-sm"
                    >
                      <option value="INR">
                        INR (₹)
                      </option>

                      <option value="USD">
                        USD ($)
                      </option>

                      <option value="EUR">
                        EUR (€)
                      </option>
                    </select>

                  </div>


                 
                  <div>

                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Primary Exchange
                    </label>

                    <select
                      value={
                        portfolio.exchange
                      }
                      onChange={(e) =>
                        handleBasicInfoChange(
                          "exchange",
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 bg-[#f7f9fd] px-3 py-3 text-sm"
                    >
                      <option value="NSE">
                        NSE
                      </option>

                      <option value="BSE">
                        BSE
                      </option>

                      <option value="NSE_BSE">
                        NSE / BSE
                      </option>
                    </select>

                  </div>

                </div>

              </div>


            

              <div className="rounded-xl border border-slate-200 bg-white p-5">

                <div className="flex items-center justify-between">

                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Portfolio Summary
                  </div>

                  <span className="text-xs font-semibold text-emerald-600">
                    Step 01
                  </span>

                </div>


                <div className="mt-5 space-y-4">

                  <SummaryItem
                    label="Portfolio Name"
                    value={
                      portfolio.name ||
                      "Not configured"
                    }
                  />

                  <SummaryItem
                    label="Portfolio Type"
                    value={
                      portfolio.portfolioType
                    }
                  />

                  <SummaryItem
                    label="Currency"
                    value={
                      portfolio.currency
                    }
                  />

                  <SummaryItem
                    label="Primary Exchange"
                    value={
                      portfolio.exchange
                    }
                  />

                  <SummaryItem
                    label="Portfolio Amount"
                    value={
                      portfolio.amount
                        ? `₹ ${Number(
                            portfolio.amount
                          ).toLocaleString()}`
                        : "Not configured"
                    }
                  />

                </div>

              </div>

            </div>
          )}


        

          {currentStep === 2 && (
            <div className="mt-5 grid grid-cols-[2fr_1fr] gap-4">

              <div className="rounded-xl border border-slate-200 bg-white p-5">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                    <span className="font-bold">
                      2
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Select Portfolio Theme
                    </h2>

                    <p className="text-xs text-slate-500">
                      The selected theme defines the
                      allowed allocation across asset
                      classes.
                    </p>
                  </div>

                </div>


                <div className="grid grid-cols-3 gap-3">

                  {themes.map((theme) => {

                    const selected =
                      selectedTheme?.id ===
                      theme.id;

                    return (
                      <button
                        key={theme.id}
                        onClick={() =>
                          handleSelectTheme(
                            theme
                          )
                        }
                        className={`relative rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 hover:border-blue-300"
                        }`}
                      >

                        {selected && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-white">
                            <Check size={12} />
                          </div>
                        )}

                        <div className="text-sm font-bold text-slate-900">
                          {theme.name}
                        </div>

                        <div className="mt-2 flex gap-2">

                          <span className="rounded bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
                            {theme.risk}
                          </span>

                          <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                            {theme.investmentHorizon}
                          </span>

                        </div>


                        <div className="mt-4 space-y-2">

                          {theme.allocationRules.map(
                            (rule) => (
                              <div
                                key={rule.asset}
                                className="flex justify-between text-xs"
                              >
                                <span className="text-slate-500">
                                  {rule.asset}
                                </span>

                                <span className="font-semibold">
                                  {rule.percentage}%
                                </span>
                              </div>
                            )
                          )}

                        </div>

                      </button>
                    );
                  })}

                </div>

              </div>


             

              <div className="rounded-xl border border-slate-200 bg-white p-5">

                <div className="flex items-center justify-between">

                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Selected Theme
                  </div>

                  <span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                    STEP 02
                  </span>

                </div>


                {selectedTheme ? (
                  <>

                    <h3 className="mt-4 text-xl font-semibold">
                      {selectedTheme.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Risk:{" "}
                      {selectedTheme.risk}
                      {" • "}
                      Horizon:{" "}
                      {
                        selectedTheme.investmentHorizon
                      }
                    </p>


                    <div className="mt-5 space-y-4">

                      {selectedTheme.allocationRules.map(
                        (rule) => (

                          <div key={rule.asset}>

                            <div className="mb-1 flex justify-between text-xs">

                              <span>
                                {rule.asset}
                              </span>

                              <span className="font-semibold">
                                {rule.percentage}%
                              </span>

                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                              <div
                                className="h-full rounded-full bg-blue-700"
                                style={{
                                  width: `${rule.percentage}%`,
                                }}
                              />

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </>
                ) : (

                  <div className="mt-10 text-center text-sm text-slate-400">
                    Select a theme to continue.
                  </div>

                )}

              </div>

            </div>
          )}


      

          {currentStep === 3 && (
            <div className="mt-5 grid grid-cols-[2fr_1fr] gap-4">

              {/* SECURITY TABLE */}

              <div className="rounded-xl border border-slate-200 bg-white p-4">

                <div className="mb-4 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                      3
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold">
                        Securities & Capital Allocation
                      </h2>

                      <p className="text-xs text-slate-500">
                        Assign target weights to
                        individual constituent holdings.
                      </p>
                    </div>

                  </div>


                  <div className="rounded-md bg-[#edf3fc] px-4 py-2 text-right">

                    <div className="text-[9px] font-bold uppercase text-slate-500">
                      Pool Size
                    </div>

                    <div className="font-mono text-sm font-bold">
                      ₹{" "}
                      {Number(
                        portfolio.amount || 0
                      ).toLocaleString()}
                    </div>

                  </div>

                </div>


       

                <div className="flex gap-2">

                  <div className="flex flex-1 items-center gap-2 rounded-md bg-[#edf3fc] px-3 py-2.5">

                    <Search
                      size={16}
                      className="text-slate-500"
                    />

                    <input
                      value={securitySearch}
                      onChange={(e) =>
                        setSecuritySearch(
                          e.target.value
                        )
                      }
                      placeholder="Search by Security Name, Symbol or ISIN"
                      className="w-full bg-transparent text-xs outline-none"
                    />

                  </div>

                  <button className="flex items-center gap-2 rounded-md bg-blue-800 px-4 text-xs font-semibold text-white">

                    <Plus size={15} />

                    Add Security

                  </button>

                </div>



                <div className="mt-3 flex gap-2">

                  <span className="rounded-md bg-blue-800 px-3 py-1.5 text-[10px] font-semibold text-white">
                    All Classes ({securities.length})
                  </span>

                  <span className="rounded-md bg-[#edf2fb] px-3 py-1.5 text-[10px]">
                    Stock
                  </span>

                  <span className="rounded-md bg-[#edf2fb] px-3 py-1.5 text-[10px]">
                    Mutual Fund
                  </span>

                  <span className="rounded-md bg-[#edf2fb] px-3 py-1.5 text-[10px]">
                    ETF
                  </span>

                  <span className="rounded-md bg-[#edf2fb] px-3 py-1.5 text-[10px]">
                    Commodity
                  </span>

                </div>


         

                <div className="mt-3 grid grid-cols-2 gap-2">

                  {filteredSecurities.map(
                    (security) => {

                      const alreadyAdded =
                        selectedSecurities.some(
                          (item) =>
                            item.id ===
                            security.id
                        );

                      return (
                        <div
                          key={security.id}
                          className="flex items-center justify-between rounded-md border border-slate-100 bg-[#fafbfe] px-3 py-2"
                        >

                          <div>

                            <div className="text-xs font-semibold">
                              {security.name}
                            </div>

                            <div className="text-[10px] text-slate-400">
                              {security.symbol} •{" "}
                              {security.isin}
                            </div>

                          </div>


                          <button
                            disabled={
                              alreadyAdded
                            }
                            onClick={() =>
                              handleAddSecurity(
                                security
                              )
                            }
                            className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                              alreadyAdded
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {alreadyAdded
                              ? "Added"
                              : "Add"}
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>


    

                {selectedSecurities.length >
                  0 && (

                  <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">

                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] bg-[#eff4fc] px-3 py-2 text-[9px] font-bold uppercase text-slate-500">

                      <div>
                        Security
                      </div>

                      <div>
                        Asset Class
                      </div>

                      <div>
                        Current Price
                      </div>

                      <div>
                        Allocation
                      </div>

                      <div />

                    </div>


                    {selectedSecurities.map(
                      (security) => (

                        <div
                          key={security.id}
                          className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center border-t border-slate-100 px-3 py-3"
                        >

                          <div>

                            <div className="text-xs font-semibold">
                              {security.name}
                            </div>

                            <div className="text-[9px] text-slate-400">
                              {security.symbol}
                            </div>

                          </div>


                          <div>
                            <span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
                              {security.assetClass}
                            </span>
                          </div>


                          <div className="font-mono text-xs">
                            ₹{" "}
                            {security.price.toLocaleString(
                              "en-IN"
                            )}
                          </div>


                          <div>

                            <div className="flex items-center gap-1">

                              <input
                                type="number"
                                value={
                                  security.allocation
                                }
                                onChange={(e) =>
                                  handleAllocationChange(
                                    security.id,
                                    e.target.value
                                  )
                                }
                                className="w-16 rounded border border-slate-200 bg-[#f7f9fd] px-2 py-1 text-right text-xs outline-none"
                              />

                              <span className="text-xs">
                                %
                              </span>

                            </div>

                          </div>


                          <button
                            onClick={() =>
                              handleRemoveSecurity(
                                security.id
                              )
                            }
                            className="text-slate-400 hover:text-red-600"
                          >
                            <X size={15} />
                          </button>

                        </div>

                      )
                    )}


                    <div className="flex justify-between bg-[#f1f5fd] px-3 py-3 text-xs font-semibold">

                      <span>
                        Total Allocation
                      </span>

                      <span
                        className={
                          totalAllocation ===
                          100
                            ? "text-emerald-700"
                            : "text-red-600"
                        }
                      >
                        {totalAllocation.toFixed(
                          1
                        )}
                        %
                      </span>

                    </div>

                  </div>

                )}

              </div>



              <div className="rounded-xl border border-slate-200 bg-white p-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <ShieldCheck
                      size={18}
                      className="text-emerald-700"
                    />

                    <span className="font-semibold">
                      Allocation Validator
                    </span>

                  </div>

                  <span className="rounded bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                    {themeAllocationValid
                      ? "ACTIVE SLEEVE MATCH"
                      : "VALIDATION REQUIRED"}
                  </span>

                </div>


                {selectedTheme && (

                  <>

                    <div className="mt-5 rounded-md bg-[#eef4fc] p-3">

                      <div className="flex justify-between">

                        <div>

                          <div className="text-[9px] font-bold uppercase text-slate-500">
                            Selected Theme
                          </div>

                          <div className="mt-1 font-semibold">
                            {selectedTheme.name}
                          </div>

                        </div>

                        <button className="text-[10px] font-semibold text-blue-700">
                          Edit Theme
                        </button>

                      </div>

                    </div>


                    <div className="mt-4 space-y-5">

                      {selectedTheme.allocationRules.map(
                        (rule) => {

                          const current =
                            getCurrentAssetAllocation(
                              rule.asset
                            );

                          const valid =
                            isThemeSatisfied(
                              rule.asset
                            );

                          return (
                            <div
                              key={rule.asset}
                            >

                              <div className="flex justify-between text-xs">

                                <span className="font-semibold">
                                  {rule.asset}
                                </span>

                                <span>
                                  Target:{" "}
                                  <b>
                                    {
                                      rule.percentage
                                    }
                                    %
                                  </b>
                                  {"  "}
                                  Current:{" "}
                                  <b>
                                    {current}%
                                  </b>
                                </span>

                              </div>


                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                                <div
                                  className={`h-full rounded-full ${
                                    valid
                                      ? "bg-emerald-600"
                                      : "bg-blue-600"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      current,
                                      100
                                    )}%`,
                                  }}
                                />

                              </div>


                              <div className="mt-1 flex justify-between text-[9px]">

                                <span className="text-slate-400">
                                  {selectedSecurities.filter(
                                    (security) =>
                                      security.assetClass ===
                                      rule.asset
                                  ).length}{" "}
                                  Holdings
                                </span>

                                <span
                                  className={
                                    valid
                                      ? "font-semibold text-emerald-700"
                                      : "font-semibold text-red-600"
                                  }
                                >
                                  {valid
                                    ? "100% Satisfied"
                                    : "Adjustment Required"}
                                </span>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>


                    <div
                      className={`mt-5 rounded-lg p-3 ${
                        themeAllocationValid
                          ? "bg-emerald-50"
                          : "bg-amber-50"
                      }`}
                    >

                      <div className="flex gap-2">

                        {themeAllocationValid ? (
                          <Check
                            size={17}
                            className="text-emerald-700"
                          />
                        ) : (
                          <AlertTriangle
                            size={17}
                            className="text-amber-600"
                          />
                        )}

                        <div>

                          <div className="text-xs font-semibold">
                            {themeAllocationValid
                              ? "Theme Allocation Validated"
                              : "Theme Allocation Requires Adjustment"}
                          </div>

                          <p className="mt-1 text-[10px] leading-4 text-slate-500">
                            {themeAllocationValid
                              ? "All asset classes satisfy the selected theme allocation rules."
                              : "Current security allocation does not match the selected theme."}
                          </p>

                        </div>

                      </div>

                    </div>

                  </>
                )}

              </div>

            </div>
          )}


   

          {currentStep === 4 && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">

              <div className="mb-5 flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  4
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Benchmark Assignment
                  </h2>

                  <p className="text-xs text-slate-500">
                    Assign an index benchmark to
                    evaluate portfolio performance.
                  </p>
                </div>

              </div>


              <div className="grid grid-cols-2 gap-4">

                {benchmarks.map(
                  (benchmark) => {

                    const selected =
                      selectedBenchmark?.id ===
                      benchmark.id;

                    return (
                      <button
                        key={benchmark.id}
                        onClick={() =>
                          setSelectedBenchmark(
                            benchmark
                          )
                        }
                        className={`relative rounded-lg border p-4 text-left ${
                          selected
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 hover:border-blue-300"
                        }`}
                      >

                        {selected && (
                          <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-white">
                            <Check size={12} />
                          </div>
                        )}

                        <div className="text-[10px] font-bold text-blue-700">
                          {benchmark.category}
                        </div>

                        <div className="mt-2 text-lg font-semibold">
                          {benchmark.name}
                        </div>

                        <p className="mt-1 max-w-[450px] text-xs leading-5 text-slate-500">
                          {benchmark.description}
                        </p>

                        <div className="mt-4 flex justify-between text-[10px] text-slate-500">

                          <span>
                            Beta:{" "}
                            <b>
                              {benchmark.beta}
                            </b>
                          </span>

                          <span className="font-semibold text-emerald-700">
                            1Y Ret:{" "}
                            {benchmark.return1Y}
                          </span>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            </div>
          )}



          {currentStep === 5 && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  5
                </div>

                <div>

                  <h2 className="text-lg font-semibold">
                    Rebalancing & Drift Controls
                  </h2>

                  <p className="text-xs text-slate-500">
                    Automate target adherence monitoring
                    and portfolio rebalancing.
                  </p>

                </div>

              </div>


              <div>

                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Execution Frequency Mandate
                </label>


                <div className="mt-2 grid grid-cols-5 rounded-md bg-[#edf2fb] p-1">

                  {[
                    "DAILY",
                    "WEEKLY",
                    "MONTHLY",
                    "QUARTERLY",
                    "SEMI_ANNUALLY",
                  ].map((frequency) => {

                    const selected =
                      portfolio.reBalancingFrequency ===
                      frequency;

                    return (
                      <button
                        key={frequency}
                        onClick={() =>
                          handleBasicInfoChange(
                            "reBalancingFrequency",
                            frequency
                          )
                        }
                        className={`rounded px-3 py-2 text-xs font-semibold ${
                          selected
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        {frequency
                          .replace(
                            "_",
                            " "
                          )}
                      </button>
                    );
                  })}

                </div>

              </div>


              <div className="mt-7 grid grid-cols-2 gap-5">

                <div>

                  <div className="flex justify-between">

                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Maximum Tolerated Drift Threshold
                    </label>

                    <span className="text-xs font-bold text-blue-700">
                      ± 5.0%
                    </span>

                  </div>

                  <input
                    type="range"
                    min="1"
                    max="20"
                    defaultValue="5"
                    className="mt-4 w-full"
                  />

                  <p className="mt-2 text-[10px] text-slate-500">
                    Triggers a rebalance alert if any
                    constituent weight deviates by
                    more than 500 bps.
                  </p>

                </div>


                <div className="rounded-lg bg-[#edf4fc] p-4">

                  <div className="flex gap-3">

                    <CalendarDays
                      size={22}
                      className="text-blue-700"
                    />

                    <div>

                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Drift Verification Cadence
                      </div>

                      <div className="mt-1 text-sm font-semibold">
                        Next Scheduled Check:
                      </div>

                      <div className="text-xs text-slate-500">
                        15 Oct 2026
                      </div>

                      <div className="mt-1 text-[10px] font-semibold text-emerald-700">
                        Automatic batch execution enabled
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}



          {currentStep === 6 && (
            <div className="mt-5 grid grid-cols-3 gap-4">

              <div className="col-span-2 space-y-4">


                <ReviewCard
                  title="Basic Information"
                  icon={<Building2 size={17} />}
                  onEdit={() =>
                    setCurrentStep(1)
                  }
                >

                  <div className="grid grid-cols-2 gap-4">

                    <ReviewItem
                      label="Portfolio Name"
                      value={
                        portfolio.name ||
                        "Growth Portfolio"
                      }
                    />

                    <ReviewItem
                      label="Portfolio Type"
                      value={
                        portfolio.portfolioType
                      }
                    />

                    <ReviewItem
                      label="Currency"
                      value={
                        portfolio.currency
                      }
                    />

                    <ReviewItem
                      label="Exchange"
                      value={
                        portfolio.exchange
                      }
                    />

                    <ReviewItem
                      label="Amount"
                      value={
                        portfolio.amount
                          ? `₹ ${Number(
                              portfolio.amount
                            ).toLocaleString()}`
                          : "₹ 1,00,00,000"
                      }
                    />

                  </div>

                </ReviewCard>


         

                <ReviewCard
                  title="Selected Theme"
                  icon={<TrendingUp size={17} />}
                  onEdit={() =>
                    setCurrentStep(2)
                  }
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="text-lg font-semibold">
                        {selectedTheme?.name ||
                          "Aggressive Growth"}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Risk:{" "}
                        {selectedTheme?.risk ||
                          "HIGH"}
                      </div>

                    </div>

                    <span className="rounded bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      Validated
                    </span>

                  </div>

                </ReviewCard>


 

                <ReviewCard
                  title="Benchmark"
                  icon={<Scale size={17} />}
                  onEdit={() =>
                    setCurrentStep(4)
                  }
                >

                  <div className="text-lg font-semibold">
                    {selectedBenchmark?.name ||
                      "NIFTY 50"}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Selected performance benchmark
                  </div>

                </ReviewCard>


                <ReviewCard
                  title="Rebalancing"
                  icon={<CalendarDays size={17} />}
                  onEdit={() =>
                    setCurrentStep(5)
                  }
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <div className="text-sm font-semibold">
                        {
                          portfolio.reBalancingFrequency
                        }
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Drift threshold: ±5.0%
                      </div>

                    </div>

                    <span className="text-xs font-semibold text-emerald-700">
                      Monitoring Enabled
                    </span>

                  </div>

                </ReviewCard>

              </div>



              <div className="h-fit rounded-xl border border-slate-200 bg-white p-5">

                <div className="flex items-center gap-2">

                  <ShieldCheck
                    size={20}
                    className="text-emerald-700"
                  />

                  <h3 className="font-semibold">
                    Review & Launch
                  </h3>

                </div>


                <div className="mt-5 space-y-3">

                  <ValidationRow
                    label="Basic Information"
                    valid
                  />

                  <ValidationRow
                    label="Theme Selection"
                    valid
                  />

                  <ValidationRow
                    label="Security Allocation"
                    valid={
                      selectedSecurities.length >
                      0
                    }
                  />

                  <ValidationRow
                    label="Benchmark"
                    valid={
                      selectedBenchmark !==
                      null
                    }
                  />

                  <ValidationRow
                    label="Rebalancing"
                    valid
                  />

                </div>


                <button
                  onClick={
                    handleCreatePortfolio
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-800 py-3 text-sm font-semibold text-white hover:bg-blue-900"
                >
                  Create & Activate Portfolio
                  <ArrowRight size={16} />
                </button>


                <button
                  onClick={handleSaveDraft}
                  className="mt-2 w-full rounded-md bg-[#eaf0fb] py-3 text-xs font-semibold text-slate-700"
                >
                  Save as Draft
                </button>

              </div>

            </div>
          )}




          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">

            <button
              onClick={goPrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold ${
                currentStep === 1
                  ? "cursor-not-allowed text-slate-300"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              <ArrowLeft size={16} />
              Previous
            </button>


            <div className="text-xs text-slate-400">
              Step {currentStep} of 6
            </div>


            {currentStep < 6 ? (

              <button
                onClick={goNext}
                className="flex items-center gap-2 rounded-md bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
              >
                Continue
                <ArrowRight size={16} />
              </button>

            ) : (

              <button
                onClick={
                  handleCreatePortfolio
                }
                className="flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Create Portfolio
                <Check size={16} />
              </button>

            )}

          </div>

        </main>

      </div>

    </div>
  );
};




const SummaryItem = ({
  label,
  value,
}) => {
  return (
    <div className="border-b border-slate-100 pb-3">

      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </div>

    </div>
  );
};




const ReviewCard = ({
  title,
  icon,
  children,
  onEdit,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">

      <div className="mb-4 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <div className="text-blue-700">
            {icon}
          </div>

          <h3 className="font-semibold">
            {title}
          </h3>

        </div>


        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-semibold text-blue-700"
        >
          <Edit3 size={13} />
          Edit
        </button>

      </div>

      {children}

    </div>
  );
};



const ReviewItem = ({
  label,
  value,
}) => {
  return (
    <div>

      <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-800">
        {value}
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


export default CreatePortfolioPage;