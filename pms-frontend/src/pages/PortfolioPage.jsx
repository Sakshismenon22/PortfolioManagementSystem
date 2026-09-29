import React, { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Building2,
  Clock3,
  Download,
  Filter,
  MoreVertical,
  Plus,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import SideBarComponent from "../components/SideBarComponent";
import TopBarComponent from "../components/TopBarComponent";
import { getAllPortfolioDetails } from "../services/portfolioService";
import { useNavigate } from "react-router-dom";


const mockPortfolios = [
  {
    id: 1,
    initials: "GP",
    name: "Growth Portfolio",
    code: "APX-081",
    description: "Mid-cap multi-sector alpha equity mandate",
    theme: "Aggressive Growth",
    allocationType: "Weightage",
    aum: "84.50 Cr",
    return1Y: "+24.6%",
    benchmark: "NIF +18",
    status: "active",
    action: "Rebalance",
  },

  {
    id: 2,
    initials: "TM",
    name: "Tech Momentum Fund",
    code: "APX-104",
    description: "High velocity thematic software & cloud SaaS",
    theme: "High Growth Equity",
    allocationType: "Weightage",
    aum: "62.10 Cr",
    return1Y: "+31.4%",
    benchmark: "NIF +19",
    status: "active",
    action: "Rebalance",
  },

  {
    id: 3,
    initials: "BA",
    name: "Bluechip Alpha Strategy",
    code: "APX-012",
    description: "Top-tier sovereign market cap leaders",
    theme: "Large Cap Quality",
    allocationType: "Amount",
    aum: "112.40 Cr",
    return1Y: "+19.8%",
    benchmark: "NIF +18",
    status: "active",
    action: "View",
  },

  {
    id: 4,
    initials: "BH",
    name: "Balanced Hybrid Dynamic",
    code: "APX-047",
    description: "Dynamic 65/35 equity-debt risk parity framework",
    theme: "Moderate Balanced",
    allocationType: "Weightage",
    aum: "56.80 Cr",
    return1Y: "+15.2%",
    benchmark: "NIF +17",
    status: "active",
    action: "View",
  },

  {
    id: 5,
    initials: "ES",
    name: "ESG Leaders Mandate",
    code: "APX-095",
    description: "Screened global standard sustainability pool",
    theme: "Sustainable Core",
    allocationType: "Weightage",
    aum: "45.20 Cr",
    return1Y: "+18.1%",
    benchmark: "NIF +19",
    status: "active",
    action: "View",
  },

  {
    id: 6,
    initials: "DY",
    name: "Dividend Yield Shield",
    code: "APX-003",
    description: "High free cash flow dividend-yielding equity portfolio",
    theme: "Defensive Value",
    allocationType: "Amount",
    aum: "67.50 Cr",
    return1Y: "+12.4%",
    benchmark: "SEN +17",
    status: "draft",
    action: "Edit Draft",
  },
];



const PortfolioPage = () => {
  const [activePage, setActivePage] = useState("Portfolios");

  const [filter, setFilter] = useState("All");

  const [search, setSearch] = useState("");
  const [portfolios,setPortfolios] = useState([]);

  const navigate = useNavigate();

  const loadPortfolio = async()=>{
    const res = await getAllPortfolioDetails();
    console.log(res);
    setPortfolios(res.data.portfolioDetailsDTOList);
  }
  useEffect(()=>{
    loadPortfolio();
  },[]);
  const filteredPortfolios = useMemo(() => {
    let data = [...portfolios];

    if (filter === "Active") {
      data = data.filter((portfolio) => portfolio.status === "active");
    }

    if (filter === "Draft") {
      data = data.filter((portfolio) => portfolio.status === "draft");
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      data = data.filter(
        (portfolio) =>
          portfolio.name.toLowerCase().includes(query) ||
          portfolio.code.toLowerCase().includes(query) ||
          portfolio.theme.toLowerCase().includes(query),
      );
    }

    return data;
  }, [filter, search,portfolios]);



  const handleCreatePortfolio = () => {
    console.log("Create portfolio clicked");

    navigate("/create-portfolio");
  };



  const handleRebalance = (portfolio) => {
    navigate("/rebalancing", { state: { portfolioId: portfolio.id } });
  };


  const handleView = (portfolio) => {
    navigate("/portfolio-details", {
      state: {
        portfolio: portfolio,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f8fd]">


      <SideBarComponent activePage={activePage} setActivePage={setActivePage} />


      <div className="ml-[257px] min-h-screen">
        {/* TOP BAR */}

        <TopBarComponent />

        <main className="px-5 py-4">
     

          <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr] gap-3">
            {/* AUM */}

            <div className="flex items-center gap-3 rounded-lg bg-[#eef4fc] px-4 py-3">
              <div className="rounded-md bg-blue-50 p-2 text-blue-700">
                <Building2 size={18} />
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500">
                  TOTAL ACTIVE AUM
                </div>

                <div className="font-mono text-[17px] text-slate-800">
                  ₹ 428.50 Cr
                </div>
              </div>
            </div>



            <div className="flex items-center gap-3 rounded-lg bg-[#eef4fc] px-4 py-3">
              <div className="rounded-md bg-red-50 p-2 text-red-600">
                <AlertTriangle size={18} />
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500">
                  REBALANCE CYCLES
                </div>

                <div className="font-mono text-[17px] text-red-600">
                  2 Pending Action •
                </div>
              </div>
            </div>



            <div className="flex items-center gap-3 rounded-lg bg-[#eef4fc] px-4 py-3">
              <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
                <ShieldCheck size={18} />
              </div>

              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500">
                  SYSTEM COMPLIANCE
                </div>

                <div className="font-mono text-[17px] text-slate-800">
                  100.0% Validated
                </div>
              </div>
            </div>

      

            <div className="flex items-center gap-3 rounded-lg bg-[#eef4fc] px-4">
              <Clock3 size={17} className="text-emerald-700" />

              <div className="text-xs font-semibold text-slate-500">
                Rebalancing Window:
                <span className="ml-2 font-mono text-slate-700">
                  Closes in 4d 06h
                </span>
              </div>
            </div>
          </div>



          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="mb-2 text-[11px] font-bold tracking-wider text-slate-500">
                PORTFOLIO MANAGEMENT SYSTEM
                <span className="mx-1">•</span>
                <span className="text-blue-700">LIVE ALLOCATION</span>
              </div>

              <h1 className="text-2xl font-semibold text-slate-900">
                Fund Portfolios
              </h1>

              <p className="mt-1 max-w-[430px] text-sm leading-5 text-slate-500">
                Manage investment portfolios, allocation themes, benchmarks, and
                active rebalancing cycles.
              </p>
            </div>

      

            <div className="flex gap-2">
              <button
                onClick={() => console.log("Export ledger")}
                className="flex items-center gap-2 rounded-md bg-[#edf3fd] px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                <Download size={16} />
                Export Ledger
              </button>

              <button
                onClick={handleCreatePortfolio}
                className="flex items-center gap-2 rounded-md bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900"
              >
                <Plus size={17} />
                Create Portfolio
              </button>
            </div>
          </div>

          
          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
    

            <div className="flex gap-1.5">
              {[
                ["All", 18],
                ["Active", 14],
                ["Rebalance Required", 2],
                ["Draft", 2],
                ["Closed", 0],
              ].map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => setFilter(name)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${
                    filter === name
                      ? "bg-blue-800 text-white"
                      : "bg-[#edf2fb] text-slate-600 hover:bg-[#e4ebf8]"
                  }`}
                >
                  {name}

                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              ))}
            </div>

     

            <div className="flex items-center gap-2">
              <div className="flex w-[280px] items-center gap-2 rounded-md bg-[#edf2fb] px-3 py-2">
                <Filter size={15} className="text-slate-500" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-xs outline-none placeholder:text-slate-500"
                  placeholder="Filter by name, ISIN, strategy..."
                />
              </div>

              <button className="rounded-md bg-[#edf2fb] px-3 py-2 text-[11px] font-bold text-slate-700">
                DENSE
              </button>

              <button className="rounded-md bg-[#edf2fb] px-3 py-2 text-[11px] font-bold text-slate-500">
                EXPANDED
              </button>
            </div>
          </div>


          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
   

            <div className="grid grid-cols-[2.2fr_1fr_1fr_.85fr_.75fr_.7fr_1fr] bg-[#eff4fc] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <div>Portfolio Name</div>

              <div>Theme / Strategy</div>

              <div>Allocation Type</div>

              <div>AUM</div>

              <div>Return (1Y)</div>

              <div>BEN</div>

              <div className="text-right">Actions</div>
            </div>

     

            {filteredPortfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="grid min-h-[92px] grid-cols-[2.2fr_1fr_1fr_.85fr_.75fr_.7fr_1fr] items-center border-t border-slate-100 px-4 py-3"
              >
         

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e9effc] text-xs font-semibold text-blue-700">
                    {portfolio.initials}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="truncate">{portfolio.name}</span>

                      <span className="rounded bg-[#e6edf9] px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
                        {portfolio.code}
                      </span>
                    </div>

                    <div className="truncate text-[11px] text-slate-500">
                      {portfolio.description}
                    </div>
                  </div>
                </div>

         

                <div>
                  <span className="inline-block max-w-[115px] rounded-sm bg-[#e7eefb] px-2 py-1 text-[11px] font-semibold leading-4 text-slate-700">
                    {portfolio.theme}
                  </span>
                </div>

           

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  {portfolio.allocationType === "Weightage" ? (
                    <Scale size={15} />
                  ) : (
                    <WalletCards size={15} />
                  )}

                  {portfolio.allocationType}
                </div>

              
                <div className="font-mono text-sm font-semibold text-slate-700">
                  {portfolio.aum}
                </div>

        

                <div className="font-mono text-sm font-semibold text-emerald-700">
                  ↗{portfolio.return1Y}
                </div>

 

                <div className="font-mono text-xs text-slate-700">
                  {portfolio.benchmark}
                </div>



                <div className="flex items-center justify-end gap-2">
                  {portfolio.action === "Rebalance" ? (
                    <button
                      onClick={() => handleRebalance(portfolio)}
                      className="rounded-sm bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900"
                    >
                      Rebalance
                    </button>
                  ) : (
                    <button
                      onClick={() => handleView(portfolio)}
                      className="rounded-sm bg-[#eaf0fb] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-[#dfe8f8]"
                    >
                      {portfolio.action}
                    </button>
                  )}

                  <button
                    onClick={() => console.log("More options:", portfolio)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <MoreVertical size={17} />
                  </button>
                </div>
              </div>
            ))}

           

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>
                Showing 1–
                {filteredPortfolios.length} of 18 portfolios
              </span>

              <div className="flex items-center gap-2">
                <button className="rounded border border-slate-100 px-3 py-1.5 text-slate-400">
                  Previous
                </button>

                <span className="rounded bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
                  Page 1 of 3
                </span>

                <button className="rounded border border-slate-200 px-3 py-1.5 text-slate-700">
                  Next
                </button>
              </div>
            </div>
          </div>


          <div className="mt-3 grid grid-cols-3 gap-3">
            {/* RETURN */}

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-bold tracking-wider text-slate-500">
                AVG PORTFOLIO 1Y RETURN
              </div>

              <div className="mt-1 text-2xl font-semibold text-emerald-700">
                +20.22%
              </div>

              <div className="mt-2 text-sm text-slate-500">
                Benchmark Spread:
              </div>

              <div className="text-lg font-medium text-slate-600">
                +3.1%
                <span className="text-sm"> alpha</span>
              </div>
            </div>


            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-bold tracking-wider text-slate-500">
                ABSOLUTE DRIFT VOLUME
              </div>

              <div className="mt-1 flex items-center justify-between">
                <div className="text-2xl font-semibold text-slate-800">
                  ₹ 8.74 Cr
                </div>

                <div className="rounded-lg bg-[#eff3fc] p-3 text-slate-600">
                  <Scale size={20} />
                </div>
              </div>

              <div className="mt-2 text-sm text-red-600">
                △ Requires capital re-alignment
              </div>
            </div>

   

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-bold tracking-wider text-slate-500">
                AUTO-REBALANCE ENGINE
              </div>

              <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active & Monitoring
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Next systemic trigger:
                  <span className="font-medium"> 15 Oct, 09:15</span>
                </div>

                <button className="rounded-md bg-[#eaf0fb] px-3 py-2 text-xs font-semibold text-slate-700">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortfolioPage;
