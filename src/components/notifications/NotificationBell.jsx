import React, { useState, useContext, useRef, useEffect } from "react";
import {
  IconButton,
  Badge,
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  useMediaQuery,
  Fade,
  Portal,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Dot, X } from "lucide-react";
import NotificationContext from "../../contexts/NotificationContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

export default function NotificationBell({ iconColor }) {
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useContext(NotificationContext);

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    function onDocumentDown(e) {
      if (!open) return;
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocumentDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocumentDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const recent = notifications.slice(0, 8);

  const handleClose = () => setOpen(false);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && typeof loadMore === "function") {
      try {
        await loadMore();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleClickNotif = async (n) => {
    handleClose();
    if (!n) return;
    if (!n.read && typeof markAsRead === "function") {
      try {
        await markAsRead(n.id);
      } catch {}
    }
    if (n.url) navigate(n.url);
  };

  const handleMarkAll = async () => {
    if (typeof markAllAsRead === "function") {
      try {
        await markAllAsRead();
      } catch {}
    }
  };

  return (
    <Box component="div" ref={containerRef} sx={{ position: "relative", display: "inline-block" }}>
      <Tooltip title="Notifications" arrow>
        <motion.div whileTap={{ scale: 0.9 }}>
          <IconButton
            onClick={toggleOpen}
            sx={{
              color: iconColor || "inherit",
              transition: "0.25s",
              "&:hover": {
                color: "primary.main",
                transform: "scale(1.08)",
              },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              overlap="circular"
              max={9}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <Bell size={22} strokeWidth={1.8} color={iconColor} />
            </Badge>
          </IconButton>
        </motion.div>
      </Tooltip>

      <AnimatePresence>
        {open && isMobile && (
          <Portal>
          <motion.div
            key="mobileSheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "70vh",
              background: theme.palette.mode === "dark" ? "#121212" : "#fff",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
              zIndex: 2000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drag handle */}
            <Box
              sx={{
                width: 40,
                height: 4,
                bgcolor: "text.disabled",
                borderRadius: 2,
                alignSelf: "center",
                mt: 1,
                mb: 1,
              }}
            />

            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                pb: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {unreadCount > 0 && (
                  <Typography
                    variant="body2"
                    color="primary"
                    onClick={handleMarkAll}
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    <CheckCheck size={16} /> Mark all
                  </Typography>
                )}
                <IconButton size="small" onClick={handleClose}>
                  <X size={18} />
                </IconButton>
              </Box>
            </Box>

            <Divider />

            {/* Notification List */}
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                px: 1,
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: "4px",
                },
              }}
            >
              <AnimatePresence>
                {recent.length === 0 ? (
                  <motion.div
                    key="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        py: 3,
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      No notifications
                    </Typography>
                  </motion.div>
                ) : (
                  recent.map((n, i) => {
                    const unread = !n.read && !n.is_read;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <ListItemButton
                          onClick={() => handleClickNotif(n)}
                          sx={{
                            alignItems: "flex-start",
                            borderRadius: unread ? 0 : 2,
                            mb: 0.5,
                            py: 1.3,
                            px: 2,
                            transition: "all 0.2s ease",
                            bgcolor: unread
                              ? "rgba(25, 118, 210, 0.08)"
                              : "transparent",
                            /* left accent removed - keep background highlight only */
                            borderLeft: 'none',
                            "&:active": {
                              bgcolor: "action.selected",
                            },
                          }}
                        >
                          <ListItemText
                            primaryTypographyProps={{
                              variant: "subtitle2",
                              fontWeight: unread ? 600 : 500,
                            }}
                            secondaryTypographyProps={{
                              variant: "body2",
                              color: "text.secondary",
                            }}
                            primary={n.title || "Notification"}
                            secondary={n.message || ""}
                          />
                          {unread && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <Dot
                                size={16}
                                color="#1976d2"
                                style={{ marginTop: 6 }}
                              />
                            </motion.div>
                          )}
                        </ListItemButton>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </Box>

            <Divider />

            <ListItemButton
              component={RouterLink}
              to="/notifications"
              onClick={handleClose}
              sx={{
                justifyContent: "center",
                py: 1.8,
                color: "primary.main",
                fontWeight: 600,
              }}
            >
              View all notifications
            </ListItemButton>
          </motion.div>
          </Portal>
        )}

        {/* Desktop Dropdown (reuses same layout) */}
        {!isMobile && open && (
          <Portal>
          <motion.div
            key="desktopMenu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              right: 24,
              top: 72,
              zIndex: 9999,
              background:
                theme.palette.mode === "dark"
                  ? "rgba(18,18,18,0.95)"
                  : "rgba(255,255,255,0.92)",
              borderRadius: 18,
              border:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(10,58,103,0.12)",
              boxShadow: "0 18px 40px rgba(10,58,103,0.25)",
              backdropFilter: "blur(14px)",
              width: 400,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={handleMarkAll}
                >
                  <CheckCheck size={16} /> Mark all read
                </Typography>
              )}
            </Box>
            <Divider />

            <List
              dense
              sx={{
                maxHeight: 360,
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: "4px",
                },
              }}
            >
              <AnimatePresence>
                {recent.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{
                      py: 3,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    No notifications
                  </Typography>
                ) : (
                  recent.map((n, i) => {
                    const unread = !n.read && !n.is_read;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <ListItemButton
                          onClick={() => handleClickNotif(n)}
                          sx={{
                            alignItems: "flex-start",
                            borderRadius: unread ? 0 : 2,
                            mb: 0.5,
                            transition: "all 0.2s ease",
                            bgcolor: unread
                              ? "rgba(25, 118, 210, 0.08)"
                              : "transparent",
                            /* left accent removed - keep background highlight only */
                            borderLeft: 'none',
                            "&:hover": {
                              bgcolor:
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(0,0,0,0.04)",
                            },
                          }}
                        >
                          <ListItemText
                            primaryTypographyProps={{
                              variant: "subtitle2",
                              fontWeight: unread ? 600 : 500,
                            }}
                            secondaryTypographyProps={{
                              variant: "body2",
                              color: "text.secondary",
                            }}
                            primary={n.title || "Notification"}
                            secondary={n.message || ""}
                          />
                          {unread && (
                            <Dot
                              size={16}
                              color="#1976d2"
                              style={{ marginTop: 6 }}
                            />
                          )}
                        </ListItemButton>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </List>

            <Divider />
            <ListItemButton
              component={RouterLink}
              to="/notifications"
              onClick={handleClose}
              sx={{
                justifyContent: "center",
                borderRadius: 0,
                py: 1.5,
                color: "primary.main",
                fontWeight: 500,
              }}
            >
              View all notifications
            </ListItemButton>
          </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </Box>
  );
}
