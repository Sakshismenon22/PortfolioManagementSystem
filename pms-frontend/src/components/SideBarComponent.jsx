import React from "react";
import {
  Bell,
  CircleHelp,
  Folder,
  LayoutDashboard,
  LogOut,
  Settings,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const SideBarComponent = ({ activePage, setActivePage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/home",
    },
    {
      label: "Portfolios",
      icon: Folder,
      path: "/portfolio",
    },
    {
      label: "Themes",
      icon: Sparkles,
      path: "/create-theme",
    },
    {
      label: "Securities",
      icon: WalletCards,
      path: "/securities",
    },
    {
      label: "Rebalancing",
      icon: SlidersHorizontal,
      path: "/rebalancing",
    },
    // {
    //   label: "Notifications",
    //   icon: Bell,
    //   badge: "3",
    //   path: null,
    // },
    {
      label: "Log out",
      icon: LogOut
    }
  ];

  const handleNavigation = (item) => {
    if (!item.path) {
      return;
    }

    setActivePage?.(item.label);
    navigate(item.path);
  };

  const getActivePage = () => {
    if (location.pathname === "/home") {
      return "Dashboard";
    }

    if (
      location.pathname === "/portfolio" ||
      location.pathname === "/create-portfolio" ||
      location.pathname.startsWith("/portfolio/")
    ) {
      return "Portfolios";
    }

    if (location.pathname === "/create-theme") {
      return "Themes";
    }

    if (location.pathname === "/securities") {
      return "Securities";
    }

    if (location.pathname === "/rebalancing") {
      return "Rebalancing";
    }

    return activePage;
  };

  const currentActivePage = getActivePage();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[257px] flex-col bg-[#22364d] text-white">

      

      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-6">

        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-700">
          <span className="text-sm font-bold">
            ↗
          </span>
        </div>

        <div>
          <div className="text-sm font-bold">
            <span className="text-blue-500">
              PMS
            </span>
          </div>

          <div className="text-[9px] font-semibold tracking-[0.15em] text-slate-300">
            INSTITUTIONAL
          </div>
        </div>

      </div>


    

      <nav className="mt-4 space-y-1 px-2">

        {menuItems.map((item) => {

          const Icon = item.icon;

          const isActive =
            currentActivePage === item.label;

          const isAvailable =
            item.path !== null;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavigation(item)}
              disabled={!isAvailable}
              className={`flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-left text-[15px] transition ${
                isActive
                  ? "bg-blue-700 text-white"
                  : isAvailable
                    ? "text-slate-200 hover:bg-white/5"
                    : "cursor-not-allowed text-slate-500"
              }`}
            >

              <Icon size={18} />

              <span>
                {item.label}
              </span>

              {item.badge && (
                <span
                  className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                    item.label === "Rebalancing"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}

            </button>
          );
        })}

      </nav>


  

      <div className="mt-auto">

        {/* <div className="mx-4 mb-5 rounded-md border border-white/10 bg-white/5 p-3">

          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
            <span>
              FUND AUM POOL
            </span>

            <span className="flex items-center gap-1 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Live
            </span>
          </div>

          <div className="text-xl font-semibold">
            ₹428.50 Cr
          </div>

          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>
              Active Strategies
            </span>

            <span>
              14 Active
            </span>
          </div>

        </div> */}


        {/* <div className="border-t border-white/5 px-2 py-2">

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-slate-500"
            disabled
          >
            <Settings size={17} />
            System Settings
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-sm text-slate-500"
            disabled
          >
            <CircleHelp size={17} />
            Institutional Support
          </button>

        </div> */}

      </div>

    </aside>
  );
};

export default SideBarComponent;
