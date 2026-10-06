import React, { useLayoutEffect, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Folder,
  LayoutDashboard,
  LogOut,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAuthSession } from "../services/authService";

const EXPANDED_WIDTH = 257;
const COLLAPSED_WIDTH = 72;
const STORAGE_KEY = "pms.sidebar.collapsed";

const SideBarComponent = ({ activePage, setActivePage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Publish the current width so the shared page offset follows the sidebar.
  useLayoutEffect(() => {
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* storage unavailable — ignore */
    }
  }, [collapsed]);

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/home" },
    { label: "Portfolios", icon: Folder, path: "/portfolio" },
    { label: "Themes", icon: Sparkles, path: "/create-theme" },
    { label: "Securities", icon: WalletCards, path: "/securities" },
    // { label: "Rebalancing", icon: SlidersHorizontal, path: "/rebalancing" },
    // { label: "Notifications", icon: Bell, badge: "3", path: null },
    { label: "Log out", icon: LogOut, action: "logout", path: "/login" },
  ];

  const handleNavigation = (item) => {
    if (item.action === "logout") {
      clearAuthSession();
      navigate("/login", { replace: true });
      return;
    }
    if (!item.path) return;
    setActivePage?.(item.label);
    navigate(item.path);
  };

  const getActivePage = () => {
    const { pathname } = location;
    if (pathname === "/home") return "Dashboard";
    if (
      pathname === "/portfolio" ||
      pathname === "/create-portfolio" ||
      pathname.startsWith("/portfolio/")
    ) {
      return "Portfolios";
    }
    if (pathname === "/create-theme") return "Themes";
    if (pathname === "/securities") return "Securities";
    if (pathname === "/rebalancing") return "Rebalancing";
    return activePage;
  };

  const currentActivePage = getActivePage();
  const ToggleIcon = collapsed ? ChevronsRight : ChevronsLeft;

  return (
    <aside
      className="fixed left-0 top-0 flex h-screen flex-col bg-[#22364d] text-white transition-[width] duration-200 ease-in-out"
      style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      aria-label="Primary navigation"
    >
      {/* Brand + collapse toggle */}
      <div
        className={`flex h-[72px] items-center border-b border-white/10 ${
          collapsed ? "justify-center px-2" : "gap-3 px-6"
        }`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-700">
          <span className="text-sm font-bold">↗</span>
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">
              <span className="text-blue-500">PMS</span>
            </div>
            <div className="text-[9px] font-semibold tracking-[0.15em] text-slate-300">
              INSTITUTIONAL
            </div>
          </div>
        )}

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ToggleIcon size={16} />
          </button>
        )}
      </div>

      {/* Expand button sits on its own row when collapsed so the brand mark stays centred */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="mx-auto mt-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ToggleIcon size={16} />
        </button>
      )}

      {/* Menu */}
      <nav className={`mt-4 space-y-1 ${collapsed ? "px-2" : "px-2"}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentActivePage === item.label;
          const isAvailable = item.path !== null;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavigation(item)}
              disabled={!isAvailable}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex w-full items-center rounded-md py-2.5 text-left text-[15px] transition ${
                collapsed ? "justify-center px-0" : "gap-3 px-4"
              } ${
                isActive
                  ? "bg-blue-700 text-white"
                  : isAvailable
                    ? "text-slate-200 hover:bg-white/5"
                    : "cursor-not-allowed text-slate-500"
              }`}
            >
              <Icon size={18} className="shrink-0" />

              {!collapsed && <span className="truncate">{item.label}</span>}

              {item.badge && !collapsed && (
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

              {/* Collapsed: badge becomes a small dot in the corner */}
              {item.badge && collapsed && (
                <span
                  aria-hidden="true"
                  className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                    item.label === "Rebalancing" ? "bg-red-400" : "bg-blue-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto" />
    </aside>
  );
};

export default SideBarComponent;
