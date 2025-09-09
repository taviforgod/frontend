import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Box,
  InputBase,
  Button,
  useTheme,
  useMediaQuery,
  Paper,
  Typography,
  Divider,
  ListItemIcon,
  Drawer,
} from '@mui/material';
import {
  Sun,
  Moon,
  User,
  Search as SearchIcon,
  LayoutGrid,
  Users as UsersIcon,
  BadgeCheck,
  ShieldCheck,
  BarChart2,
  Ticket,
  FileText,
  HeartPulse,
  Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import Logo from './Logo';

/* NotificationBell kept as-is; ensure component exists at ../components/NotificationBell */
import NotificationBell from '../components/NotificationBell';
import MenuIcon from '@mui/icons-material/Menu';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Header = () => {
  const { toggleTheme, mode } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [businessAnchorEl, setBusinessAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleBusinessMenuOpen = (e) => setBusinessAnchorEl(e.currentTarget);
  const handleBusinessMenuClose = () => setBusinessAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      if (typeof logout === 'function') logout();
      navigate("/login");
    } catch (err) {
      alert("Logout failed");
    }
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  // Business submenus for mobile (only show business-related links)
  const businessMenuMobile = (
    <Box sx={{ p: 2, pt: 1 }}>
      <Typography variant="subtitle2" sx={menuTitleStyles(theme)}>Business Module</Typography>
      <Divider sx={{ my: 1 }} />
      <MenuItem onClick={() => { setDrawerOpen(false); navigate('/users'); }}>
        <ListItemIcon><UsersIcon size={18} /></ListItemIcon> Manage Users
      </MenuItem>
      <MenuItem onClick={() => { setDrawerOpen(false); navigate('/roles'); }}>
        <ListItemIcon><BadgeCheck size={18} /></ListItemIcon> Roles & Permissions
      </MenuItem>
      <MenuItem onClick={() => { setDrawerOpen(false); navigate('/lookups'); }}>
        <ListItemIcon><Ticket size={18} /></ListItemIcon> Lookup Settings
      </MenuItem>
      <MenuItem onClick={() => { setDrawerOpen(false); navigate('/cell-groups'); }}>
        <ListItemIcon><LayoutGrid size={18} /></ListItemIcon> Cell Groups
      </MenuItem>
      <MenuItem onClick={() => { setDrawerOpen(false); navigate('/weekly-reports'); }}>
        <ListItemIcon><FileText size={18} /></ListItemIcon> Weekly Reports
      </MenuItem>
      <MenuItem onClick={() => { setDrawerOpen(false); navigate('/notifications'); }}>
        <ListItemIcon><Bell size={18} /></ListItemIcon> Notifications
      </MenuItem>
    </Box>
  );

  // Drawer content for mobile (only business submenus if opened from bottom nav)
  const drawerContent = (
    <Box sx={{ width: 270, p: 0 }}>
      {businessMenuMobile}
    </Box>
  );

  const role = user?.role;
  const isAdmin = role === 'admin' || role === 'Super_Admin';
  const isPastor = role === 'pastor';
  const isPFCC = role === 'pfcc_leader';

  return (
    <Paper
      elevation={2}
      square
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          boxShadow: 'none',
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ minHeight: 56, px: { xs: 1, sm: 3 }, justifyContent: 'space-between', gap: 2 }}>
          {/* Logo or Hamburger */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            {isSmallScreen ? (
              <>
                <IconButton
                  edge="start"
                  color="primary"
                  aria-label="menu"
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    mr: 1,
                    bgcolor: theme.palette.action.hover,
                    borderRadius: 2,
                    p: 1.2,
                    boxShadow: 1,
                    '&:hover': {
                      bgcolor: theme.palette.action.selected,
                    },
                  }}
                  size="large"
                >
                  <MenuIcon sx={{ fontSize: 32 }} />
                </IconButton>
                <Logo size={44} />
              </>
            ) : (
              <Logo size={80} />
            )}
          </Box>

          {/* Search (desktop only) */}
          {!isSmallScreen && (
            <Box
              sx={{
                flex: 1,
                maxWidth: 400,
                mx: 2,
                display: 'flex',
                alignItems: 'center',
                bgcolor: '#eef3f8',
                borderRadius: 2,
                px: 2,
                py: 0.5,
              }}
            >
              <SearchIcon size={20} style={{ marginRight: 8, color: '#666' }} />
              <InputBase
                placeholder="Search"
                inputProps={{ 'aria-label': 'search' }}
                sx={{ width: '100%', color: '#333', fontSize: 15 }}
              />
            </Box>
          )}

          {/* Right Side */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {!isSmallScreen && user && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Dashboard: Only for Admin/Super_Admin */}
                {isAdmin && (
                  <Button
                    sx={buttonStyles}
                    onClick={() => navigate('/dashboard')}
                    startIcon={<User size={18} />}
                  >
                    Dashboard
                  </Button>
                )}
                {/* Health Dashboard & Spiritual Growth Dashboard: Admin, Super_Admin, Pastor, PFCC */}
                {(isAdmin || isPastor || isPFCC) && (
                  <>
                    <Button
                      sx={buttonStyles}
                      onClick={() => navigate('/health-dashboard')}
                      startIcon={<HeartPulse size={18} />}
                    >
                      Health Dashboard
                    </Button>
                    <Button
                      sx={buttonStyles}
                      onClick={() => navigate('/spiritual/dashboard')}
                      startIcon={<HeartPulse size={18} />}
                    >
                      Spiritual Growth Dashboard
                    </Button>
                  </>
                )}
                {/* Business menu: show icon for all roles */}
                <Tooltip title="For Business">
                  <IconButton onClick={handleBusinessMenuOpen} sx={iconButtonStyle(theme)}>
                    <LayoutGrid size={22} />
                  </IconButton>
                </Tooltip>
                {/* NotificationBell stays as-is */}
                <NotificationBell />
              </Box>
            )}

            {/* Theme Toggle */}
            <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={toggleTheme} sx={iconButtonStyle(theme)}>
                {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            {user && (
              <>
                <Tooltip title="Account">
                  <IconButton onClick={handleMenuOpen}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                      {user?.name?.[0]?.toUpperCase() || <User size={16} />}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ sx: { mt: 1 } }}
                >
                  <MenuItem onClick={handleProfile}>View Profile</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            )}

            {/* Business Menu Content (desktop only) */}
            <Menu
              anchorEl={businessAnchorEl}
              open={Boolean(businessAnchorEl)}
              onClose={handleBusinessMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  minWidth: 500,
                  maxWidth: 700,
                  p: 2,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 3,
                  borderRadius: 3,
                  color: theme.palette.text.primary,
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
                {/* Manage Users & RBAC: Admin, Super_Admin, Pastor */}
                {(isAdmin || isPastor) && (
                  <Box sx={{ minWidth: 220 }}>
                    <Typography variant="subtitle2" sx={menuTitleStyles(theme)}>Manage Users</Typography>
                    <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/users'); }}>
                      <ListItemIcon><UsersIcon size={18} /></ListItemIcon> Users
                    </MenuItem>
                    <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/user-role-matrix'); }}>
                      <ListItemIcon><BarChart2 size={18} /></ListItemIcon> User-Role Matrix
                    </MenuItem>
                    <Typography variant="subtitle2" sx={{ ...menuTitleStyles(theme), mt: 2 }}>Manage RBAC</Typography>
                    <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/roles'); }}>
                      <ListItemIcon><BadgeCheck size={18} /></ListItemIcon> Roles
                    </MenuItem>
                    <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/permissions'); }}>
                      <ListItemIcon><ShieldCheck size={18} /></ListItemIcon> Permissions
                    </MenuItem>
                    <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/rbac-matrix'); }}>
                      <ListItemIcon><BarChart2 size={18} /></ListItemIcon> RBAC Matrix
                    </MenuItem>
                    <Typography variant="subtitle2" sx={{ ...menuTitleStyles(theme), mt: 2 }}>Manage Members</Typography>
                    <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/members'); }}>
                      <ListItemIcon><UsersIcon size={18} /></ListItemIcon> Members
                    </MenuItem>
                  </Box>
                )}
                {/* Settings Module + Cell Module: visible for all roles */}
                <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: theme.palette.divider }} />
                <Box sx={{ minWidth: 220 }}>
                  <Typography variant="subtitle2" sx={menuTitleStyles(theme)}>Settings Module</Typography>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/lookups'); }}>
                    <ListItemIcon><Ticket size={18} /></ListItemIcon> Lookup Settings
                  </MenuItem>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/zones'); }}>
                    <ListItemIcon><LayoutGrid size={18} /></ListItemIcon> Zones
                  </MenuItem>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/status-types'); }}>
                    <ListItemIcon><LayoutGrid size={18} /></ListItemIcon> Status Types
                  </MenuItem>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/spiritual/milestones'); }}>
                    <ListItemIcon><LayoutGrid size={18} /></ListItemIcon> Milestone Template
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={menuTitleStyles(theme)}>Cell Module</Typography>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/cell-groups'); }}>
                    <ListItemIcon><LayoutGrid size={18} /></ListItemIcon> Cell Groups
                  </MenuItem>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/weekly-reports'); }}>
                    <ListItemIcon><FileText size={18} /></ListItemIcon> Weekly Reports
                  </MenuItem>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/visitors'); }}>
                    <ListItemIcon><Bell size={18} /></ListItemIcon> Visitors
                  </MenuItem>
                  <MenuItem onClick={() => { handleBusinessMenuClose(); navigate('/notifications'); }}>
                    <ListItemIcon><Bell size={18} /></ListItemIcon> Notifications
                  </MenuItem>
                </Box>
              </Box>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            bgcolor: theme.palette.background.default,
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Bottom Navigation (mobile only) */}
      {isSmallScreen && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.drawer + 2,
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            py: 1,
          }}
        >
          <IconButton color="primary" onClick={() => navigate('/dashboard')}>
            <User size={26} />
          </IconButton>
          <IconButton color="primary" onClick={() => navigate('/health-dashboard')}>
            <HeartPulse size={26} />
          </IconButton>
          <IconButton color="primary" onClick={() => navigate('/members')}>
            <UsersIcon size={26} />
          </IconButton>
          {/* Only opens business submenus */}
          <IconButton color="primary" onClick={() => setDrawerOpen(true)}>
            <LayoutGrid size={26} />
          </IconButton>
          <IconButton color="primary" onClick={handleProfile}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 14 }}>
              {user?.name?.[0]?.toUpperCase() || <User size={16} />}
            </Avatar>
          </IconButton>
        </Paper>
      )}
    </Paper>
  );
};

const buttonStyles = {
  color: 'text.secondary',
  fontWeight: 500,
  textTransform: 'none',
  fontSize: 15,
  px: 1.5,
  borderRadius: 2,
  minWidth: 0,
  '&:hover': {
    bgcolor: 'action.hover',
    color: 'text.primary',
  },
};

const iconButtonStyle = (theme) => ({
  color: theme.palette.text.secondary,
  borderRadius: 2,
  '&:hover': {
    bgcolor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
});

const menuTitleStyles = (theme) => ({
  mb: 1,
  color: theme.palette.text.secondary,
  fontWeight: 700,
});

export default Header;
