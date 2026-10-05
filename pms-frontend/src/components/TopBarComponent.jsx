import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNotifications, getUnreadNotificationCount, markNotificationRead } from "../services/notificationService";

const TopBarComponent = () => {

  const navigate = useNavigate();

  const name = localStorage.getItem("userName") || "Fund Manager";

  const role = localStorage.getItem("userRole") || "FUND MANAGER";
  const userId = localStorage.getItem("userId");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const notificationRef = useRef(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      setUnreadCount(await getUnreadNotificationCount(userId));
    } catch {
      // Keep the header usable if the notification API is unavailable.
    }
  }, [userId]);

  useEffect(() => {
    refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, 30000);
    return () => window.clearInterval(timer);
  }, [refreshUnreadCount]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const toggleNotifications = async () => {
    const shouldOpen = !notificationOpen;
    setNotificationOpen(shouldOpen);
    if (!shouldOpen || !userId) return;
    setNotificationsLoading(true);
    setNotificationError("");
    try {
      setNotifications(await getNotifications(userId));
      await refreshUnreadCount();
    } catch {
      setNotificationError("Could not load notifications. Try again.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const openNotification = async (notification) => {
    if (notification.status === "UNSEEN" && userId) {
      try {
        const updated = await markNotificationRead(userId, notification.id);
        setNotifications((current) => current.map((item) => item.id === notification.id ? updated : item));
        await refreshUnreadCount();
      } catch {
        setNotificationError("Could not update notification status.");
        return;
      }
    }
    if (notification.portfolioId) {
      setNotificationOpen(false);
      navigate(`/portfolio/${notification.portfolioId}`);
    }
  };

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

   
        
        <div className="relative" ref={notificationRef}>
        <button type="button" aria-label="Notifications" aria-expanded={notificationOpen} onClick={toggleNotifications} className="relative rounded-md p-2 hover:bg-slate-100">

          <Bell
            size={19}
            className="text-slate-600"
          />

          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}

        </button>
        {notificationOpen && <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div><div className="text-sm font-bold text-slate-900">Notifications</div><div className="text-[11px] text-slate-500">{unreadCount} unread</div></div>
            <button type="button" onClick={refreshUnreadCount} className="text-xs font-semibold text-blue-700">Refresh</button>
          </div>
          {notificationError ? <div className="p-4 text-xs text-red-700">{notificationError}</div> : notificationsLoading ? <div className="p-6 text-center text-xs text-slate-500">Loading notifications…</div> : notifications.length ? <ul className="max-h-[360px] overflow-y-auto">
            {notifications.map((notification) => <li key={notification.id}>
              <button type="button" onClick={() => openNotification(notification)} className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${notification.status === "UNSEEN" ? "bg-blue-50/60" : ""}`}>
                <span className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.status === "UNSEEN" ? "bg-blue-600" : "bg-slate-300"}`} /><span className="min-w-0"><span className="block text-xs font-semibold text-slate-800">{notification.portfolioName || "Portfolio drift alert"}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span><span className="mt-1 block text-[10px] text-slate-400">{notification.date || ""}{notification.status === "UNSEEN" ? " · Click to mark read" : " · Read"}</span></span></span>
              </button>
            </li>)}
          </ul> : <div className="p-7 text-center"><Bell size={20} className="mx-auto text-slate-300"/><p className="mt-2 text-xs font-medium text-slate-600">You’re all caught up</p><p className="mt-1 text-[11px] text-slate-400">Drift alerts at or above 5% will appear here.</p></div>}
        </div>}
        </div>


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
