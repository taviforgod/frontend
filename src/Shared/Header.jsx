import React, { useContext, useState } from "react";
import {
   AppBar, Toolbar, Typography, Box, IconButton, Button, Tooltip, Menu, MenuItem,
   ListItemIcon, ListItemText, Drawer, List, Collapse, InputBase, Paper, Divider,
   ListItem, ListItemButton, ListItemAvatar, Avatar, Stack, useTheme, useMediaQuery
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext";
import NotificationBell from "../components/notifications/NotificationBell";
import {
  ChevronDown, ChevronRight, ChevronLeft, Menu as MenuIcon, LogOut, User,
  Home, Users, BarChart, FileText, BookOpen, Settings, Heart, Bell,
  Search as SearchIcon, X as CloseIcon
} from 'lucide-react';
import {
  HomeOutline, PieChartOutline, PeopleOutline, CallOutline, GiftOutline,
  DocumentsOutline, SettingsOutline, BookOutline, HeartOutline, HandLeftOutline,
  RibbonOutline, TrashOutline, CreateOutline, HelpOutline, NotificationsOutline,
  SwapHorizontalOutline, SunnyOutline, MoonOutline
} from 'ionicons/icons';

// Theme-aware icon wrapper (Ionicons or Lucide)
// Accepts either `iconPath` (ionicon) or `Icon` (lucide component)
const ThemeIcon = ({ iconPath, Icon, size = 20, ...props }) => {
  const theme = useTheme();
  const accentColor = theme.palette.secondary.main;

  if (Icon) {
    // lucide components accept `size` and `color` props
    return <Icon size={size} color={accentColor} {...props} />;
  }

  // small alias map for Ionicons names we use in the app
  const aliasMap = {
    people: 'people-outline',
    trash: 'trash-outline',
    'pie-chart': 'pie-chart-outline',
    call: 'call-outline',
    documents: 'document-text-outline',
    'hand-left': 'hand-left-outline',
    ribbon: 'ribbon-outline',
    book: 'book-outline',
    'document-text': 'document-text-outline',
    create: 'create-outline',
    'alert-circle': 'alert-circle-outline',
    'eye-off': 'eye-off-outline',
    'swap-horizontal': 'swap-horizontal-outline',
    heart: 'heart-outline',
    gift: 'gift-outline',
    chatbox: 'chatbubble-ellipses-outline',
    alarm: 'alarm-outline',
    notifications: 'notifications-outline'
  };

  const name = iconPath ? (aliasMap[iconPath] || (iconPath.includes('-') ? iconPath : `${iconPath}-outline`)) : '';

  return (
    <ion-icon
      name={name}
      style={{
        color: accentColor,
        fontSize: `${size}px`,
        display: 'flex',
        alignItems: 'center'
      }}
      {...props}
    />
  );
};

// Nav links
const navLinks = [
  { to: "/dashboard", label: "Home", icon: <ThemeIcon Icon={Home} size={20} /> },
  {
    label: "Membership",
    icon: <ThemeIcon Icon={Users} size={20} />,
    submenu: [
      { to: "/members", label: "Members", icon: <ThemeIcon iconPath="people" size={18} /> },
      { to: "/inactive-exits", label: "Exits", icon: <ThemeIcon iconPath="trash" size={18} /> },
    ],
  },
  {
    label: "Ministry",
    icon: <ThemeIcon Icon={FileText} size={20} />,
    submenu: [
      // Core Ministry
      { to: "/cell-groups", label: "Cell Groups", icon: <ThemeIcon iconPath="people" size={18} />, group: "Core Ministry" },
      { to: "/cell-groups-dashboard", label: "Cell Dashboard", icon: <ThemeIcon iconPath="pie-chart" size={18} />, group: "Core Ministry" },
      { to: "/visitors", label: "Visitors", icon: <ThemeIcon iconPath="call" size={18} />, group: "Core Ministry" },
      { to: "/weekly-reports", label: "Weekly Reports", icon: <ThemeIcon iconPath="documents" size={18} />, group: "Core Ministry" },

      // Outreach
      { to: "/evangelism", label: "Evangelism", icon: <ThemeIcon iconPath="hand-left" size={18} />, group: "Outreach" },
      { to: "/outreach-events", label: "Outreach Events", icon: <ThemeIcon iconPath="ribbon" size={18} />, permission: "create_member", group: "Outreach" },
      { to: "/cell-visitor-integration", label: "Visitor Integration", icon: <ThemeIcon iconPath="call" size={18} />, permission: "create_member", group: "Outreach" },

    ]
  },
  {
    label: "Discipleship",
    icon: <ThemeIcon Icon={BookOpen} size={20} />,
    submenu: [
      // Discipleship
      { to: "/foundation-school", label: "Foundation School", icon: <ThemeIcon iconPath="book" size={18} />, group: "Discipleship" },
      { to: "/foundation-school-progress", label: "Foundation Progress", icon: <ThemeIcon iconPath="pie-chart" size={18} />, permission: "view_members", group: "Discipleship" },
      { to: "/baptism-register", label: "Baptism Register", icon: <ThemeIcon iconPath="document-text" size={18} />, permission: "create_member", group: "Discipleship" },
      { to: "/baptism-prep-checklist", label: "Baptism Prep", icon: <ThemeIcon iconPath="create" size={18} />, permission: "create_member", group: "Discipleship" },
      { to: "/bible-teaching-calendar", label: "Bible Teaching", icon: <ThemeIcon iconPath="book" size={18} />, permission: "bible_teaching_view", group: "Discipleship" },
      { to: "/meeting-agendas", label: "Meeting Agendas", icon: <ThemeIcon iconPath="documents" size={18} />, permission: "view_members", group: "Discipleship" },

      // Leadership
      { to: "/leadership", label: "Leadership", icon: <ThemeIcon iconPath="people" size={18} />, group: "Leadership" },
      { to: "/cell-growth-dashboard", label: "Cell Growth", icon: <ThemeIcon iconPath="pie-chart" size={18} />, permission: "create_member", group: "Leadership" },
      { to: "/personal-growth-tracker", label: "Personal Growth", icon: <ThemeIcon iconPath="pie-chart" size={18} />, permission: "create_member", group: "Leadership" },
      { to: "/leadership/approvals", label: "Approvals", icon: <ThemeIcon iconPath="create" size={18} />, permission: "update_member", group: "Leadership" }
    ]
  },
  {
    label: "Care",
    icon: <ThemeIcon Icon={Heart} size={20} />,
    submenu: [
      { to: "/prayers", label: "Prayers", icon: <ThemeIcon iconPath="heart" size={18} />, group: "Care" },
      { to: "/crisis-followups", label: "Crisis Care", icon: <ThemeIcon iconPath="alert-circle" size={18} />, group: "Care" },
      { to: "/absentee-followup", label: "Absentee Follow-up", icon: <ThemeIcon iconPath="eye-off" size={18} />, permission: "absentees_view", group: "Care" },
      { to: "/conflict-management", label: "Conflict Management", icon: <ThemeIcon iconPath="swap-horizontal" size={18} />, permission: "create_member", group: "Care" },
      { to: "/celebrations-events", label: "Celebrations", icon: <ThemeIcon iconPath="ribbon" size={18} />, permission: "create_member", group: "Care" },
      { to: "/giving-testimony", label: "Giving & Testimony", icon: <ThemeIcon iconPath="gift" size={18} />, permission: "create_member", group: "Care" }
    ]
  },

  {
    label: "Reports",
    icon: <ThemeIcon Icon={BarChart} size={20} />,
    submenu: [
      { to: "/reports", label: "Report Dashboard", icon: <ThemeIcon iconPath="pie-chart" size={18} /> },
      { to: "/automated-reports", label: "Automated Reports", icon: <ThemeIcon iconPath="documents" size={18} />, permission: "create_member" },
      { to: "/comprehensive-reports", label: "Comprehensive Reports", icon: <ThemeIcon iconPath="documents" size={18} />, permission: "create_member" }
    ]
  },

  {
    label: "Settings",
    icon: <ThemeIcon iconPath="settings" size={20} />,
    submenu: [
      { to: "/roles", label: "Roles", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/permissions", label: "Permissions", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/rbac-matrix", label: "Roles Management", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/lookups", label: "Look ups", icon: <ThemeIcon iconPath="settings" size={18} /> },
      //{ to: "/settings/departments", label: "Departments", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/settings/zones", label: "Zone Settings", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/settings/zone-management", label: "Zone Management", icon: <ThemeIcon iconPath="settings" size={18} /> },
      {to: "/foundation-classes", label: "Foundation Classes", icon: <ThemeIcon iconPath="book" size={18} /> },
      { to: "/users", label: "Users", icon: <ThemeIcon iconPath="people" size={18} /> },
      { to: "/user-role-matrix", label: "Users Management", icon: <ThemeIcon iconPath="people" size={18} /> },
      { to: "/devices", label: "Devices", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/admin/products", label: "Products", icon: <ThemeIcon iconPath="gift" size={18} />, permission: "products_view" },
      { to: "/admin/exit-type-mappings", label: "Exit Mappings", icon: <ThemeIcon iconPath="settings" size={18} /> },

      // Notifications (moved here from top-level to reduce header clutter)
      { to: "/notifications/center", label: "Notifications Center", icon: <ThemeIcon iconPath="notifications" size={18} /> },
      { to: "/notifications/preferences", label: "Notification Preferences", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/notifications/templates", label: "Notification Templates", icon: <ThemeIcon iconPath="document-text" size={18} /> },
      { to: "/notifications/reminders", label: "Reminders", icon: <ThemeIcon iconPath="alarm" size={18} /> },
      { to: "/notifications/logs", label: "Notification Logs", icon: <ThemeIcon iconPath="documents" size={18} /> },
      { to: "/admin/reminders-monitor", label: "Reminders Monitor", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/superadmin/templates", label: "Templates Master", icon: <ThemeIcon iconPath="settings" size={18} /> },
      { to: "/user/digest-history", label: "Digest History (User)", icon: <ThemeIcon iconPath="documents" size={18} /> },
      { to: "/message-board", label: "Message Board", icon: <ThemeIcon iconPath="chatbox" size={18} /> },
    ],
  }
];
export default function Header() {
   const { mode, toggleTheme } = useContext(ThemeContext);
   const { user, logout, ready } = useContext(AuthContext);
   const location = useLocation();
   const navigate = useNavigate();
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
 
   // Desktop submenu state
   const [anchorEl, setAnchorEl] = useState(null);
   const [openMenuIdx, setOpenMenuIdx] = useState(null);

   // Mobile drawer state
   const [drawerOpen, setDrawerOpen] = useState(false);
   const [mobileOpenSubmenu, setMobileOpenSubmenu] = useState({});

   // Search state
   const [search, setSearch] = useState("");

   // User menu (profile / logout)
   const [userMenuAnchor, setUserMenuAnchor] = useState(null);

   // Permissions
  const hasPermission = (route) => {
  const permMap = {
    "/dashboard": "dashboard_view",
    "/users": "users_view",
    "/roles": "roles_view",
    "/permissions": "permissions_view",
    "/absentee-followup": "absentees_view",
    "/rbac-matrix": "roles_management_view",
    "/user-role-matrix": "users_management_view",
    "/devices": "devices_view",
    "/members": "members_view",
    "/prayers": "prayers_view",
    "/leadership": "leadership_view",
    "/evangelism": "evangelism_view",
    "/cell-groups": "cell_groups_view",
    "/visitors": "visitors_view",
    "/lookups": "lookups_view",
    "/inactive-exits":"inactive_exits_view",
    "/weekly-reports": "weekly_reports_view",
    "/bible-teaching-calendar": "bible_teaching_view",
    "/absentees": "absentees_view",
    "/notifications": "notifications_view",
    "/notifications/center": "notifications_center_view",
    "/notifications/preferences": "notifications_preferences_view",
    "/notifications/templates": "notifications_templates_view",
    "/notifications/reminders": "notifications_reminders_view",
    "/notifications/logs": "notifications_logs_view",
    "/admin/reminders-monitor": "admin_reminders_monitor_view",
    "/superadmin/templates": "superadmin_templates_view",
    "/admin/products": "products_view",
    "/user/digest-history": "user_digest_history_view",
    "/crisis-followups": "crisis_followups_view",
    "/comprehensive-reports": "reports_view",
    "/cell-groups-dashboard": "cell_groups_dashboard_view",
    "/foundation-classes": "foundation_classes_view",
    "/admin/exit-type-mappings": "manage_exit_mappings",
    "/settings/zones": "manage_zone",
    "/settings/zone-management": "manage_zone",
  };
  const requiredPermission = permMap[route];

  // If no permission is required for this route, allow access
  if (!requiredPermission) return true;

  // Admin role fallback: allow zone management for Admin/Super_Admin even if permission list is missing
  const isAdminRole = user?.role === 'Admin' || user?.role === 'Super_Admin';
  if (requiredPermission === 'manage_zone' && isAdminRole) return true;

  // If user or permissions don't exist, deny access for protected routes
  if (!user || !user.permissions) return false;

  // Check if user has the required permission
  return user.permissions.includes(requiredPermission);
};

   const hasAnySubPermission = (submenu) =>
     submenu.some((item) => hasPermission(item.to));

   // Handlers
   const handleMenuClick = (event, idx) => {
     if (openMenuIdx === idx) {
       setOpenMenuIdx(null);
       setAnchorEl(null);
     } else {
       setOpenMenuIdx(idx);
       setAnchorEl(event.currentTarget);
     }
   };

   const handleMenuClose = () => {
     setOpenMenuIdx(null);
     setAnchorEl(null);
   };

   const toggleDrawer = (open) => () => setDrawerOpen(open);

   const toggleMobileSubmenu = (label) => {
     setMobileOpenSubmenu((prev) => ({
       ...prev,
       [label]: !prev[label],
     }));
   };

   if (!ready) return <div style={{ height: 56 }} />;

   return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={1}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar + 10,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(17,25,40,0.8) 0%, rgba(25,30,50,0.8) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{
          minHeight: 56,
          display: "flex",
          justifyContent: "space-between",
          gap: 3,
          px: { xs: 1, sm: 2, md: 3 }
        }}>
          {/* Left side: (logo removed) */}
          <Box sx={{ display: "flex", alignItems: "center" }}>

            {/* --- Logo --- */}
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 12, marginLeft: 4, marginRight: 24 }}>
              <img src="/cmms.png" alt="CMMS" style={{ height: 48, width: 'auto', display: 'block' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', display: { xs: 'none', sm: 'block' } }}></Typography>
            </Link>
            {/* --- End Search Bar --- */}

            {/* Desktop nav */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, alignItems: 'center' }}>
              {navLinks.map((link, idx) =>
                link.submenu ? (
                  hasAnySubPermission(link.submenu) && (
                    <Box key={link.label} sx={{ position: "relative" }}>
                      {/* --- Desktop nav submenu highlighting --- */}
                      <Button
                        endIcon={<ChevronDown size={16} />}
                        sx={{
                          color: link.submenu.some((item) => location.pathname === item.to)
                            ? "primary.main"
                            : "text.secondary",
                          fontWeight: link.submenu.some((item) => location.pathname === item.to)
                            ? 700
                            : 500,
                          borderBottom: link.submenu.some((item) => location.pathname === item.to)
                            ? 2
                            : 0,
                          borderColor: "primary.main",
                          borderRadius: 0,
                          px: 2,
                          py: 1,
                          minWidth: 0,
                          textTransform: "none",
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: 'primary.main',
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(99, 102, 241, 0.08)'
                              : 'rgba(99, 102, 241, 0.04)',
                          }
                        }}
                        aria-controls={openMenuIdx === idx ? "submenu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={openMenuIdx === idx ? "true" : undefined}
                        onClick={(e) => handleMenuClick(e, idx)}
                      >
                        {link.icon}
                        <span style={{ marginLeft: 8 }}>{link.label}</span>
                      </Button>
                      <Menu
                        id="submenu"
                        anchorEl={anchorEl}
                        open={openMenuIdx === idx}
                        onClose={handleMenuClose}
                        MenuListProps={{ sx: { minWidth: 180, p: 1 } }}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        transformOrigin={{ vertical: "top", horizontal: "left" }}
                        slotProps={{
                          paper: {
                            sx: {
                              mt: 1.5,
                              borderRadius: 2.5,
                              boxShadow: theme.palette.mode === 'dark'
                                ? '0 22px 40px -10px rgba(0,0,0,0.6)'
                                : '0 18px 40px rgba(16,24,40,0.08)',
                              border: 1,
                              borderColor: 'divider',
                              transition: 'transform 0.18s ease, opacity 0.18s ease',
                              zIndex: (theme) => theme.zIndex.modal + 10,
                              backdropFilter: 'blur(6px)'
                            }
                          },
                        }}
                      >
                        {(() => {
                          // Check if this is the Ministry menu (has grouped items)
                          const hasGroups = link.submenu.some(item => item.group);

                          if (hasGroups) {
                            // Group submenu items by their group for grouped menus
                            const groupedItems = link.submenu.reduce((acc, item) => {
                              const group = item.group || 'Other';
                              if (!acc[group]) acc[group] = [];
                              acc[group].push(item);
                              return acc;
                            }, {});

                          // Get all groups in order: Core Ministry, Discipleship, Outreach, Leadership, Care, Reports
                          const groupOrder = ['Core Ministry', 'Discipleship', 'Outreach', 'Leadership', 'Care', 'Reports'];
                          const allGroups = groupOrder.filter(group => groupedItems[group]);

                          // Smart column distribution: large groups get their own column
                          const largeGroups = allGroups.filter(group => groupedItems[group].length >= 5); // 5+ items = large
                          const smallGroups = allGroups.filter(group => groupedItems[group].length < 5);  // <5 items = small

                          // Calculate optimal column layout
                          const totalLargeGroups = largeGroups.length;
                          const totalSmallGroups = smallGroups.length;

                          // Large groups always get their own column
                          // Small groups are distributed among remaining columns
                          let columns = [];
                          let columnCount = 0;

                          // Add large groups as individual columns
                          largeGroups.forEach(group => {
                            columns.push([group]);
                            columnCount++;
                          });

                          // Distribute small groups among remaining columns
                          if (totalSmallGroups > 0) {
                            const remainingSlots = Math.max(1, 4 - columnCount); // Max 4 columns total
                            const smallGroupsPerColumn = Math.ceil(totalSmallGroups / remainingSlots);

                            for (let i = 0; i < totalSmallGroups; i += smallGroupsPerColumn) {
                              const columnGroups = smallGroups.slice(i, i + smallGroupsPerColumn);
                              columns.push(columnGroups);
                              columnCount++;
                            }
                          }

                          return (
                            <Box sx={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, 1fr)`,
                              gap: 0,
                              position: 'relative',
                              minWidth: columns.length > 3 ? 700 : columns.length > 2 ? 600 : columns.length > 1 ? 500 : 400
                            }}>
                              {columns.map((columnGroups, columnIndex) => (
                                <Box key={`column-${columnIndex}`} sx={{ p: 1 }}>
                                  {columnGroups.map((groupName) => (
                                    <Box key={groupName} sx={{ mb: columnGroups.length > 1 ? 2 : 0 }}>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{
                                          fontWeight: 700,
                                          color: 'primary.main',
                                          mb: 1,
                                          textTransform: 'uppercase',
                                          fontSize: '0.75rem',
                                          letterSpacing: 1
                                        }}
                                      >
                                        {groupName}
                                      </Typography>
                                      {groupedItems[groupName].map(
                                        (item) =>
                                          hasPermission(item.to) && (
                                            <MenuItem
                                              key={item.to}
                                              component={Link}
                                              to={item.to}
                                              selected={location.pathname === item.to}
                                              onClick={handleMenuClose}
                                              sx={{
                                                fontWeight: location.pathname === item.to ? 700 : 400,
                                                color: location.pathname === item.to ? "primary.main" : "text.primary",
                                                py: 0.75,
                                                px: 1,
                                                borderRadius: 1,
                                                mb: 0.25,
                                                '&:hover': {
                                                  bgcolor: 'action.hover'
                                                }
                                              }}
                                            >
                                              <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}>{item.icon}</ListItemIcon>
                                              <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{
                                                  component: 'span',
                                                  sx: { fontSize: '0.875rem' }
                                                }}
                                              />
                                            </MenuItem>
                                          )
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              ))}
                              {/* Vertical dividers for multi-column layout */}
                              {columns.length > 1 && columns.map((_, index) => {
                                if (index === 0) return null; // No divider before first column
                                const dividerPosition = `${(index / columns.length) * 100}%`;
                                return (
                                  <Divider
                                    key={`divider-${index}`}
                                    orientation="vertical"
                                    sx={{
                                      position: 'absolute',
                                      left: dividerPosition,
                                      top: 8,
                                      bottom: 8,
                                      borderColor: 'divider',
                                      opacity: 0.3,
                                    }}
                                  />
                                );
                              })}
                            </Box>
                            );
                          } else {
                            // Original logic for other menus
                            return link.submenu.length > 4 ? (
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, position: 'relative' }}>
                                {/* First column */}
                                <Box>
                                  {link.submenu.slice(0, Math.ceil(link.submenu.length / 2)).map(
                                    (item) =>
                                      hasPermission(item.to) && (
                                        <MenuItem
                                          key={item.to}
                                          component={Link}
                                          to={item.to}
                                          selected={location.pathname === item.to}
                                          onClick={handleMenuClose}
                                          sx={{
                                            fontWeight: location.pathname === item.to ? 700 : 400,
                                            color: location.pathname === item.to ? "primary.main" : "text.primary",
                                            py: 1,
                                          }}
                                        >
                                          <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                                          <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{ component: 'span' }}
                                          />
                                        </MenuItem>
                                      )
                                  )}
                                </Box>
                                {/* Second column */}
                                <Box>
                                  {link.submenu.slice(Math.ceil(link.submenu.length / 2)).map(
                                    (item) =>
                                      hasPermission(item.to) && (
                                        <MenuItem
                                          key={item.to}
                                          component={Link}
                                          to={item.to}
                                          selected={location.pathname === item.to}
                                          onClick={handleMenuClose}
                                          sx={{
                                            fontWeight: location.pathname === item.to ? 700 : 400,
                                            color: location.pathname === item.to ? "primary.main" : "text.primary",
                                            py: 1,
                                          }}
                                        >
                                          <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                                          <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{ component: 'span' }}
                                          />
                                        </MenuItem>
                                      )
                                  )}
                                </Box>
                                {/* Vertical divider */}
                                <Divider
                                  orientation="vertical"
                                  flexItem
                                  sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: 8,
                                    bottom: 8,
                                    mx: 0,
                                    borderColor: 'divider',
                                    opacity: 0.5,
                                  }}
                                />
                              </Box>
                            ) : (
                              link.submenu.map(
                                (item) =>
                                  hasPermission(item.to) && (
                                    <MenuItem
                                      key={item.to}
                                      component={Link}
                                      to={item.to}
                                      selected={location.pathname === item.to}
                                      onClick={handleMenuClose}
                                      sx={{
                                        fontWeight: location.pathname === item.to ? 700 : 400,
                                        color: location.pathname === item.to ? "primary.main" : "text.primary",
                                      }}
                                    >
                                      <ListItemIcon>{item.icon}</ListItemIcon>
                                      <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{ component: 'span' }}
                                      />
                                    </MenuItem>
                                  )
                              )
                            );
                          }
                        })()}
                      </Menu>
                    </Box>
                  )
                ) : (
                  hasPermission(link.to) && (
                    // --- Top-level nav highlighting (no submenu) ---
                    <Button
                      key={link.to}
                      component={Link}
                      to={link.to}
                      startIcon={link.icon}
                      sx={{
                        color: location.pathname === link.to ? "primary.main" : "text.secondary",
                        fontWeight: location.pathname === link.to ? 700 : 500,
                        borderBottom: location.pathname === link.to ? 2 : 0,
                        borderColor: "primary.main",
                        borderRadius: 0,
                        px: 2,
                        py: 1,
                        minWidth: 0,
                        textTransform: "none",
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: 'primary.main',
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(99, 102, 241, 0.08)'
                            : 'rgba(99, 102, 241, 0.04)',
                        }
                      }}
                    >
                      {link.label}
                    </Button>
                  )
                )
              )}
            </Box>
          </Box>

          {/* Right side: actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton onClick={toggleTheme} color="inherit" size="medium">
                {mode === "dark" ? (
                  <ion-icon name="sunny" style={{ fontSize: '20px' }} />
                ) : (
                  <ion-icon name="moon" style={{ fontSize: '20px' }} />
                )}
              </IconButton>
            </Tooltip>
            {/* Notification Bell (uses NotificationContext internally) */}
            <NotificationBell sx={{ mr: 0.5 }} />

            {user && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1.5, borderLeft: 1, borderColor: 'divider' }}>
                  <Tooltip title={user.name || user.email}>
                    <IconButton color="inherit" onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
                      <User size={20} />
                      <ChevronDown size={14} style={{ marginLeft: 4 }} />
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                      paper: { sx: { mt: 1, borderRadius: 2, boxShadow: 3, zIndex: (theme) => theme.zIndex.modal + 10 } },
                    }}
                  >
                    <MenuItem component={Link} to="/profile" onClick={() => setUserMenuAnchor(null)}>
                      <ListItemIcon><User size={18} /></ListItemIcon>
                      <ListItemText>Profile</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { setUserMenuAnchor(null); logout(); }}>
                      <ListItemIcon><LogOut size={18} /></ListItemIcon>
                      <ListItemText>Logout</ListItemText>
                    </MenuItem>
                  </Menu>
                </Box>
              </>
            )}

            {/* Mobile menu button */}
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton onClick={toggleDrawer(true)} color="inherit">
                <MenuIcon size={24} />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer - stylish, grouped and responsive */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: 300, sm: 340 },
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(17,25,40,0.98) 0%, rgba(25,30,50,0.98) 100%)'
              : 'linear-gradient(180deg, rgba(249,250,251,0.98) 0%, rgba(240,245,250,0.98) 100%)',
            color: theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer header */}
          <Box sx={{
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider'
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42 }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                </Avatar>
              </ListItemAvatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {user?.name || 'Guest'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {user?.email || ''}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={toggleDrawer(false)} sx={{ color: 'rgba(255,255,255,0.9)' }}>
                <CloseIcon size={16} />
              </IconButton>
            </Box>
          </Box>

          {/* Mobile search */}
          <Box sx={{ p: 2 }}>
            <Paper
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: '6px 10px',
                bgcolor: 'rgba(255,255,255,0.03)'
              }}
            >
              <SearchIcon size={14} />
              <InputBase
                placeholder="Search..."
                inputProps={{ 'aria-label': 'mobile-search' }}
                sx={{ ml: 1, flex: 1, color: 'common.white' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <IconButton size="small" onClick={() => {/* optional search action */}} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <ChevronRight size={16} />
              </IconButton>
            </Paper>
          </Box>

          <Divider sx={{ borderColor: 'divider', opacity: 0.06 }} />

          {/* Nav list */}
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            <List disablePadding>
              {navLinks.map((link) =>
                link.submenu ? (
                  hasAnySubPermission(link.submenu) && (
                    <Box key={link.label}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => toggleMobileSubmenu(link.label)}
                          sx={{ px: 2.5, py: 1.25, justifyContent: 'space-between' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ color: 'primary.main' }}>{link.icon}</Box>
                            <ListItemText primary={link.label} primaryTypographyProps={{ sx: { fontWeight: 600 } }} />
                          </Box>
                          {mobileOpenSubmenu[link.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </ListItemButton>
                      </ListItem>

                      <Collapse in={mobileOpenSubmenu[link.label]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {(() => {
                            // Check if this is a grouped menu (has grouped items)
                            const hasGroups = link.submenu.some(item => item.group);

                            if (hasGroups) {
                              // Group submenu items by their group for mobile grouped menus
                              const groupedItems = link.submenu.reduce((acc, item) => {
                                const group = item.group || 'Other';
                                if (!acc[group]) acc[group] = [];
                                acc[group].push(item);
                                return acc;
                              }, {});

                              // Get all groups in order
                              const groupOrder = ['Core Ministry', 'Discipleship', 'Outreach', 'Leadership', 'Care', 'Reports'];
                              const orderedGroups = groupOrder.filter(group => groupedItems[group]);

                              return orderedGroups.map((groupName) => (
                                <Box key={groupName}>
                                  <ListItem sx={{ pl: 4, py: 0.5 }}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        fontWeight: 700,
                                        color: 'primary.main',
                                        textTransform: 'uppercase',
                                        fontSize: '0.75rem',
                                        letterSpacing: 1
                                      }}
                                    >
                                      {groupName}
                                    </Typography>
                                  </ListItem>
                                  {groupedItems[groupName].map(
                                    (item) =>
                                      hasPermission(item.to) && (
                                        <ListItem key={item.to} disablePadding>
                                          <ListItemButton
                                            component={Link}
                                            to={item.to}
                                            onClick={toggleDrawer(false)}
                                            sx={{
                                              pl: 6,
                                              py: 1,
                                              color: location.pathname === item.to ? 'primary.main' : 'rgba(255,255,255,0.9)',
                                              background: location.pathname === item.to ? 'rgba(99,102,241,0.08)' : 'transparent'
                                            }}
                                          >
                                            <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>{item.icon}</ListItemIcon>
                                            <ListItemText primary={item.label} primaryTypographyProps={{ component: 'span' }} />
                                          </ListItemButton>
                                        </ListItem>
                                      )
                                  )}
                                </Box>
                              ));
                            } else {
                              // Original logic for other menus
                              return link.submenu.map(
                                (item) =>
                                  hasPermission(item.to) && (
                                    <ListItem key={item.to} disablePadding>
                                      <ListItemButton
                                        component={Link}
                                        to={item.to}
                                        onClick={toggleDrawer(false)}
                                        sx={{
                                          pl: 6,
                                          py: 1,
                                          color: location.pathname === item.to ? 'primary.main' : 'rgba(255,255,255,0.9)',
                                          background: location.pathname === item.to ? 'rgba(99,102,241,0.08)' : 'transparent'
                                        }}
                                      >
                                        <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.label} primaryTypographyProps={{ component: 'span' }} />
                                      </ListItemButton>
                                    </ListItem>
                                  )
                              );
                            }
                          })()}
                        </List>
                      </Collapse>
                    </Box>
                  )
                ) : (
                  hasPermission(link.to) && (
                    <ListItem key={link.to} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={link.to}
                        onClick={toggleDrawer(false)}
                        sx={{
                          px: 2.5,
                          py: 1.25,
                          color: location.pathname === link.to ? 'primary.main' : 'rgba(255,255,255,0.92)',
                          background: location.pathname === link.to ? 'rgba(99,102,241,0.08)' : 'transparent'
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>{link.icon}</ListItemIcon>
                        <ListItemText primary={link.label} primaryTypographyProps={{ sx: { fontWeight: 600 } }} />
                      </ListItemButton>
                    </ListItem>
                  )
                )
              )}
            </List>
          </Box>

          <Divider sx={{ borderColor: 'divider', opacity: 0.06 }} />

          {/* Drawer footer: quick actions */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              onClick={() => { setDrawerOpen(false); navigate('/profile'); }}
              sx={{ textTransform: 'none', bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Profile
            </Button>
            <Button
              variant="outlined"
              onClick={() => { logout(); setDrawerOpen(false); }}
              sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

// debug helpers - remove after debugging


// validate navLinks icons
navLinks.forEach((l) => {
  try {
    // React.isValidElement requires React, so check element validity
    // and also log if icon is an object (common failure)
    
  } catch (e) {
    
  }
});
