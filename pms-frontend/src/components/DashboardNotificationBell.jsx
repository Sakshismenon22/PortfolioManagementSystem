import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
} from "../services/notificationService";

const DashboardNotificationBell = () => {
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    try {
      setUnreadCount(await getUnreadNotificationCount(userId));
    } catch {
      // The dashboard remains usable if notification loading is unavailable.
    }
  }, [userId]);

  useEffect(() => {
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 30000);
    return () => window.clearInterval(timer);
  }, [refreshUnread]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const toggle = async () => {
    const shouldOpen = !open;
    setOpen(shouldOpen);
    if (!shouldOpen || !userId) return;
    setLoading(true);
    setError("");
    try {
      setNotifications(await getNotifications(userId));
      await refreshUnread();
    } catch {
      setError("Could not load notifications. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectNotification = async (notification) => {
    if (notification.status === "UNSEEN" && userId) {
      try {
        const updated = await markNotificationRead(userId, notification.id);
        setNotifications((current) => current.map((item) => item.id === notification.id ? updated : item));
        await refreshUnread();
      } catch {
        setError("Could not update notification status.");
        return;
      }
    }
    if (notification.portfolioId) {
      setOpen(false);
      navigate(`/portfolio/${notification.portfolioId}`);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={toggle}
        className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100"
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-900">Notifications</div>
              <div className="text-[11px] text-slate-500">{unreadCount} unread</div>
            </div>
            <button type="button" onClick={refreshUnread} className="text-xs font-semibold text-blue-700">Refresh</button>
          </div>
          {error ? <div role="alert" className="p-4 text-xs text-red-700">{error}</div>
            : loading ? <div className="p-6 text-center text-xs text-slate-500">Loading notifications…</div>
              : notifications.length ? <ul className="max-h-[360px] overflow-y-auto">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button type="button" onClick={() => selectNotification(notification)} className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${notification.status === "UNSEEN" ? "bg-blue-50/60" : ""}`}>
                      <span className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.status === "UNSEEN" ? "bg-blue-600" : "bg-slate-300"}`} />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800">{notification.portfolioName || "Portfolio drift alert"}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span>
                          <span className="mt-1 block text-[10px] text-slate-400">{notification.date || ""}{notification.status === "UNSEEN" ? " · Click to mark read" : " · Read"}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul> : <div className="p-7 text-center"><Bell size={20} className="mx-auto text-slate-300" /><p className="mt-2 text-xs font-medium text-slate-600">You’re all caught up</p><p className="mt-1 text-[11px] text-slate-400">Drift alerts at or above 5% will appear here.</p></div>}
        </div>
      )}
    </div>
  );
};

export default DashboardNotificationBell;
