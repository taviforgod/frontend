import React, { createContext, useCallback, useEffect, useState, useRef, useContext } from "react";
import { useNotificationService } from "../services/notificationService";
import { AuthContext } from "./AuthContext"; 
import io from "socket.io-client";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

// --- new module-level singletons to avoid duplicate sockets when provider is mounted multiple times ---
let __cmms_sharedSocket = null;
let __cmms_providerCount = 0;

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  hasMore: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  addNotification: () => {},
  requestNotificationPermission: async () => {},
  settings: { sound: true, desktop: true, filter: null },
  updateSettings: () => {},
  loadMore: async () => {},
  setFilter: () => {},
  reload: async () => {}
});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [settings, setSettings] = useState(() => {
    try {
      // include tone and quiet_hours by default
      return JSON.parse(localStorage.getItem('notificationSettings')) || { sound: true, desktop: true, tone: "", quiet_hours: null, filter: null };
    } catch { return { sound: true, desktop: true, filter: null }; }
  });

  const {
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead
  } = useNotificationService();

  // aliases used by the rest of this file
  const markRead = markNotificationRead;
  const markAllRead = markAllNotificationsRead;
  
  // keep a stable ref to the service fn so callbacks/effects don't re-run
  const listNotificationsRef = useRef(listNotifications);
  useEffect(() => { listNotificationsRef.current = listNotifications; }, [listNotifications]);

  const getNotifications = (...args) => listNotificationsRef.current?.(...args);
  
  const { accessToken } = useContext(AuthContext);
  const autoRefreshRef = useRef();
  const socketRef = useRef(null);
  const lastLoadRef = useRef(0); // simple rate-limit

  // helper: check quiet hours (expects { start: "HH:MM", end: "HH:MM" } or null)
  const isQuietNow = (qh) => {
    if (!qh || !qh.start || !qh.end) return false;
    try {
      const now = new Date();
      const [sh, sm] = (qh.start || '00:00').split(':').map(Number);
      const [eh, em] = (qh.end || '00:00').split(':').map(Number);
      const start = new Date(now); start.setHours(sh, sm, 0, 0);
      const end = new Date(now); end.setHours(eh, em, 0, 0);
      if (start.getTime() === end.getTime()) return true; // full mute
      if (start < end) return now >= start && now <= end;
      // overnight range (e.g. 22:00 - 07:00)
      return now >= start || now <= end;
    } catch (e) { return false; }
  };

  const playTone = (url) => {
    if (!url) return;
    try {
      const audio = new Audio(url);
      audio.play().catch(()=>{});
    } catch (e) {}
  };

  const loadNotifications = useCallback(async (reset = false, opts = {}) => {
    // avoid very frequent calls (local protection against loops)
    if (!reset && Date.now() - (lastLoadRef.current || 0) < 800) return;
    lastLoadRef.current = Date.now();

    const currentPage = reset ? 0 : pageRef.current;
    const params = { limit: 20, page: currentPage, ...opts };
    if (settings.filter) params.type = settings.filter;

    try {
      const data = await getNotifications(params); // uses stable ref
      const notifs = data?.notifications || [];

      setHasMore(notifs.length === 20);

      setNotifications(prev => {
        const combined = reset ? notifs : [...prev, ...notifs];
        setUnreadCount(combined.filter(x => !x.read && !x.is_read).length);
        const nextPage = currentPage + 1;
        setPage(nextPage);
        pageRef.current = nextPage;
        return combined;
      });
    } catch (err) {
      // backoff on 429 Too Many Requests to avoid tight retry loops
      const status = err?.response?.status ?? err?.status ?? null;
      if (status === 429) {
        // delay next allowed load by 60s
        lastLoadRef.current = Date.now() + 60000;
        console.warn('loadNotifications backoff due to 429 Too Many Requests');
      } else {
        console.warn('loadNotifications failed', err?.message || err);
      }
      setHasMore(false);
    }
  }, [settings.filter]); // getNotifications removed from deps

  // socket effect: only create/use a shared socket across provider instances
  useEffect(() => {
    __cmms_providerCount += 1;

    // Only load notifications if user is authenticated
    if (accessToken) {
      loadNotifications(true);
    }

    if (!accessToken) return;

    // If a shared socket already exists, reuse it
    if (__cmms_sharedSocket) {
      socketRef.current = __cmms_sharedSocket;
    } else {
      const socket = io(SOCKET_URL, {
        auth: { token: accessToken },
        withCredentials: true,
        transports: ['websocket','polling'],
        reconnectionAttempts: 5
      });
      __cmms_sharedSocket = socket;
      socketRef.current = socket;

      // attach listeners once on the shared socket
      socket.on("connect", () => console.log('[socket] connected', socket.id));
      socket.on("connect_error", (err) => console.warn('[socket] connect_error', err));
      socket.on("disconnect", (reason) => console.log('[socket] disconnected', reason));
      socket.on("notification", (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(u => u + 1);

        const muted = isQuietNow(settings.quiet_hours);

        // play sound if enabled, not muted, and a tone is selected
        if (settings.sound && !muted && settings.tone) {
          playTone(settings.tone);
        }

        // desktop notification if enabled, not muted and permission granted
        if (settings.desktop && !muted && Notification.permission === 'granted') {
          try { new Notification(notif.title, { body: notif.message, icon: '/logo192.png' }); } catch (e) {}
        }
      });

      // Explicit event when an exit is created elsewhere in the system
      socket.on('exit:created', (payload) => {
        try {
          console.log('[socket] exit:created', payload);
          const notif = {
            id: `exit:${payload.exit_id}`,
            title: 'Exit recorded',
            message: payload.message || `Exit recorded for member ${payload.member_id}`,
            metadata: { action: 'inactive_exit_created', exit_id: payload.exit_id, member_id: payload.member_id },
            created_at: new Date().toISOString()
          };

          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(u => u + 1);

          const muted = isQuietNow(settings.quiet_hours);

          if (settings.sound && !muted && settings.tone) playTone(settings.tone);

          if (settings.desktop && !muted && Notification.permission === 'granted') {
            try { new Notification(notif.title, { body: notif.message, icon: '/logo192.png' }); } catch (e) {}
          }
        } catch (e) {
          console.warn('exit:created handler error', e);
        }
      });
    }

    return () => {
      // decrement provider count and cleanup the shared socket only when last provider unmounts
      __cmms_providerCount = Math.max(0, __cmms_providerCount - 1);
      socketRef.current = null;

      if (__cmms_providerCount === 0 && __cmms_sharedSocket) {
        try {
          __cmms_sharedSocket.off("notification");
          __cmms_sharedSocket.off("connect_error");
          __cmms_sharedSocket.off("disconnect");
          __cmms_sharedSocket.disconnect();
        } catch (e) {}
        __cmms_sharedSocket = null;
      }
    };
  }, [loadNotifications, accessToken, settings]); // observe settings object so behaviour updates

  // Load notifications when user logs in
  useEffect(() => {
    if (accessToken) {
      loadNotifications(true);
    }
  }, [accessToken, loadNotifications]);
  
  // auto-refresh stays but will use the rate-limit above
  useEffect(() => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    autoRefreshRef.current = setInterval(() => {
      loadNotifications(true);
    }, 60000);
    return () => clearInterval(autoRefreshRef.current);
  }, [loadNotifications]);

  const markAsRead = async (id) => {
    try {
      await markRead(id);
    } catch (e) {
      // best-effort: continue updating UI even if API call fails
      console.warn('markRead failed', e?.message || e);
    }
    setNotifications(notifs =>
      notifs.map(n => n.id === id ? { ...n, read: true, is_read: true } : n)
    );
    setUnreadCount(u => Math.max(0, u - 1));
  };

  const markAllAsRead = async () => {
    try {
      await markAllRead();
    } catch (e) {
      console.warn('markAllRead failed', e?.message || e);
    }
    setNotifications(notifs =>
      notifs.map(n => ({ ...n, read: true, is_read: true }))
    );
    setUnreadCount(0);
  };

  const updateSettings = (patch) => {
    setSettings(s => {
      const next = { ...s, ...patch };
      try { localStorage.setItem('notificationSettings', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const loadMore = async () => {
    if (hasMore) await loadNotifications(false);
  };

  const setFilter = filter => {
    setSettings(s => ({ ...s, filter }));
    setPage(0);
    pageRef.current = 0;
    loadNotifications(true, { type: filter });
  };

  const addNotification = (notif) => {
    if (!notif) return;
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(u => u + (notif.read || notif.is_read ? 0 : 1));
  };

  const requestNotificationPermission = async () => {
    if (!window.Notification) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.warn('Notification permission request failed:', error);
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasMore,
        markAsRead,
        markAllAsRead,
        addNotification,
        requestNotificationPermission,
        settings,
        updateSettings,
        loadMore,
        setFilter,
        // expose getNotifications for consumers that need to fetch directly
        getNotifications,
        reload: () => loadNotifications(true),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;