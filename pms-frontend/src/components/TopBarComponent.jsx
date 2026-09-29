import React from "react";
import {
  Bell,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TopBarComponent = () => {

  const navigate = useNavigate();

  const name = localStorage.getItem("userName") || "Fund Manager";

  const role = localStorage.getItem("userRole") || "FUND MANAGER";

  const handleLogout = () =>{
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    navigate("/login", {replace : true});
  }
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
              {name}
            </div>

            <div className="text-[10px] font-medium tracking-wider text-slate-500">
              {role.replaceAll("_", " ")}
            </div>

          </div>

          <div>
            <button
            type = "button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600">
              <LogOut size = {18}/>
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </div>

    </header>
  );
};

export default TopBarComponent;