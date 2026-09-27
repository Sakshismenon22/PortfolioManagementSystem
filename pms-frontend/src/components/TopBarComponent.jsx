import React from "react";
import {
  Bell,
  Search,
  UserRound,
} from "lucide-react";

const TopBarComponent = () => {
  return (
    <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-slate-200 bg-white px-5">

 
      <div className="flex w-[375px] items-center gap-3 rounded-md bg-[#f0f4fc] px-3 py-2.5">

        <Search
          size={17}
          className="text-slate-500"
        />

        <input
          type="text"
          placeholder="Search portfolios, ISIN, securities, benchmarks..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
        />

      </div>

    
      <div className="flex items-center gap-5">

   
        <div className="flex items-center gap-2 rounded-md bg-[#eef4ff] px-4 py-2 text-xs font-semibold text-slate-600">

          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          <span>NSE/BSE</span>

          <span className="text-emerald-700">
            Open
          </span>

          <span className="text-slate-400">
            •
          </span>

          <span>
            14:32 IST
          </span>

        </div>

        <button className="relative">

          <Bell
            size={19}
            className="text-slate-600"
          />

          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-600" />

        </button>


        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-white">
            <UserRound size={19} />
          </div>

          <div className="leading-tight">

            <div className="text-sm font-semibold">
              Marcus Vance
            </div>

            <div className="text-[10px] font-medium tracking-wider text-slate-500">
              SENIOR FUND MANAGER
            </div>

          </div>

        </div>

      </div>

    </header>
  );
};

export default TopBarComponent;