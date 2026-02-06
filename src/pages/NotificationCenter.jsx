import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Chip,
  Card,
  CardContent,
  IconButton,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Trash2,
  Check,
  RefreshCcw,
  Inbox,
  MessageSquare,
  Users,
  AlertTriangle,
} from "lucide-react";

import NotificationContext from "../contexts/NotificationContext";
import { useNotificationService } from "../services/notificationService";

export default function NotificationCenter() {
  const theme = useTheme();
  const navigate = useNavigate();

  const notifService = useNotificationService();
  const { deleteNotification, loadMore } = notifService || {};

  const notifCtx = useContext(NotificationContext);
  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
    reload,
  } = notifCtx || {};

  const [local, setLocal] = useState([]);
  const [tab, setTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);

  // Sync notifications
  useEffect(() => {
    setLocal(notifications || []);
  }, [notifications]);

  useEffect(() => {
    if (typeof reload === "function") reload();
  }, []); // eslint-disable-line

  // Tabs
  const tabs = useMemo(
    () => [
      { id: 0, label: "All", icon: <Bell size={16} /> },
      { id: 1, label: "Unread", icon: <AlertTriangle size={16} /> },
      { id: 2, label: "System", icon: <Inbox size={16} /> },
      { id: 3, label: "Groups", icon: <Users size={16} /> },
      { id: 4, label: "Reminders", icon: <Check size={16} /> },
      { id: 5, label: "DMs", icon: <MessageSquare size={16} /> },
    ],
    []
  );

  // Filtering logic
  const filtered = useMemo(() => {
    if (!local) return [];
    switch (tab) {
      case 1:
        return local.filter((n) => !n.read && !n.is_read);
      case 2:
        return local.filter(
          (n) => n.type === "system" || n.priority === "high"
        );
      case 3:
        return local.filter((n) => n.type === "group");
      case 4:
        return local.filter((n) => n.type === "reminder");
      case 5:
        return local.filter(
          (n) => n.type === "dm" || n.type === "direct" || n.source === "dm"
        );
      default:
        return local;
    }
  }, [local, tab]);

  // Handle open notification
  const handleOpenNotif = async (n) => {
    if (!n) return;
    try {
      if (typeof markAsRead === "function" && (!n.read && !n.is_read)) {
        await markAsRead(n.id);
      }
    } catch {}
    if (n.url) {
      try {
        navigate(n.url);
      } catch (e) {
        console.warn("navigate failed", e);
      }
    }
    if (typeof reload === "function") reload();
  };

  // Pull to refresh
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startY = 0;
    let pulling = false;

    const handleTouchStart = (e) => {
      if (el.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };
    const handleTouchMove = (e) => {
      if (!pulling) return;
      const dist = e.touches[0].clientY - startY;
      if (dist > 80) {
        pulling = false;
        handleRefresh();
      }
    };
    const handleTouchEnd = () => (pulling = false);

    el.addEventListener("touchstart", handleTouchStart);
    el.addEventListener("touchmove", handleTouchMove);
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Infinite scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = async () => {
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight < 100 &&
        !isLoadingMore &&
        typeof loadMore === "function"
      ) {
        setIsLoadingMore(true);
        try {
          await loadMore();
        } catch {}
        setIsLoadingMore(false);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [isLoadingMore, loadMore]);

  // Refresh logic
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (typeof reload === "function") await reload();
    } catch {}
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        p: { xs: 1.5, sm: 2 },
        maxWidth: 700,
        mx: "auto",
        height: "calc(100vh - 80px)",
        overflowY: "auto",
        scrollBehavior: "smooth",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          gap: 1,
          position: "sticky",
          top: 0,
          zIndex: 1,
          bgcolor: "background.default",
          pb: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
        <Chip
          label={`${local.filter((n) => !n.read && !n.is_read).length} unread`}
          color="error"
          size="small"
        />
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={handleRefresh}>
          <RefreshCcw
            size={18}
            className={isRefreshing ? "spin" : ""}
            style={{
              animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
            }}
          />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            minHeight: 40,
          },
        }}
      >
        {tabs.map((t) => (
          <Tab
            key={t.id}
            iconPosition="start"
            icon={t.icon}
            label={t.label}
            sx={{ minWidth: "fit-content" }}
          />
        ))}
      </Tabs>

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={async () => {
            if (typeof markAllAsRead === "function") await markAllAsRead();
            if (typeof reload === "function") await reload();
          }}
        >
          Mark all as read
        </Button>
      </Box>

      {/* Notifications */}
      <AnimatePresence initial={false}>
        {filtered.length === 0 && !isRefreshing && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card
              elevation={0}
              sx={{
                textAlign: "center",
                py: 6,
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 3,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                🎉 You're all caught up! No notifications.
              </Typography>
            </Card>
          </motion.div>
        )}

        <motion.div
          key="notif-list"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {filtered.map((n) => {
            const unread = !n.read && !n.is_read;
            return (
              <motion.div
                key={n.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                layout
              >
                <Card
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    borderRadius: 3,
                    bgcolor: unread
                      ? theme.palette.mode === "dark"
                        ? "rgba(25,118,210,0.12)"
                        : "rgba(25,118,210,0.05)"
                      : "background.paper",
                    "&:hover": {
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 0 10px rgba(255,255,255,0.06)"
                          : "0 2px 12px rgba(0,0,0,0.06)",
                      cursor: "pointer",
                    },
                  }}
                  onClick={() => handleOpenNotif(n)}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      py: 1.5,
                      px: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={unread ? 700 : 500}
                        noWrap
                      >
                        {n.title || "Notification"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {n.message}
                      </Typography>
                      {n.created_at && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.disabled",
                            mt: 0.5,
                            display: "block",
                          }}
                        >
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {!n.read && !n.is_read && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (typeof markAsRead === "function")
                              await markAsRead(n.id);
                            if (typeof reload === "function") await reload();
                          }}
                        >
                          <Check size={16} />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm("Delete this notification?"))
                            return;
                          try {
                            if (typeof deleteNotification === "function") {
                              await deleteNotification(n.id);
                            }
                          } catch {}
                          if (typeof reload === "function") await reload();
                        }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {isLoadingMore && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={22} />
        </Box>
      )}
    </Box>
  );
}
