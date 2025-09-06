import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProviderCustom, ThemeContext } from "./contexts/ThemeContext";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Onboard from "./pages/Auth/Onboard";
import PhoneVerification from "./pages/Auth/PhoneVerification";

import Profile from "./pages/RBAC/Profile";
import Users from "./pages/RBAC/Users";
import Roles from "./pages/RBAC/Roles";
import Permissions from "./pages/RBAC/Permissions";
import RBACMatrix from "./pages/RBAC/RBACMatrix";
import UserRoleMatrix from "./pages/RBAC/UserRoleMatrix";

import MembersPage from "./pages/MemberPage";
import Dashboard from "./pages/Dashboard";
import Layout from "./Layout";
import Header from "./Shared/Header";

import LookupsPage from "./pages/Settings/LookupsPage";
import MilestoneTemplateManager from "./pages/MilestoneTemplateManager";
import CellGroupList from "./components/CellGroupList";
import WeeklyReports from "./components/WeeklyReports";
import HealthDashboard from "./components/HealthDashboard";
import StatusTypesPage from "./components/StatusTypesPage";
import ZonesPage from "./components/ZonesPage";
import VisitorsPage from "./components/VisitorsPage";

/* --- UPDATED imports: use the new components provided in the Notifications module ZIP --- */
import NotificationsPage from "./components/NotificationsPage";      // new notifications list page
import MessageBoardPage from "./components/MessageBoardPage";       // message board UI

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

function AppWithTheme() {
  const { theme } = useContext(ThemeContext);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboard" element={<Onboard />} />
            <Route path="/verify-phone" element={<PhoneVerification />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Header />
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users" element={<Users />} />
              <Route path="roles" element={<Roles />} />
              <Route path="permissions" element={<Permissions />} />
              <Route path="rbac-matrix" element={<RBACMatrix />} />
              <Route path="user-role-matrix" element={<UserRoleMatrix />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="lookups" element={<LookupsPage />} />
              <Route path="cell-groups" element={<CellGroupList />} />
              <Route path="weekly-reports" element={<WeeklyReports />} />
              <Route path="health-dashboard" element={<HealthDashboard />} />

              {/* UPDATED: notifications & messageboard use the new components */}
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="message-board" element={<MessageBoardPage />} />

              <Route path="visitors" element={<VisitorsPage />} />
              <Route path="status-types" element={<StatusTypesPage />} />
              <Route path="zones" element={<ZonesPage />} />
              <Route path="milestone-templates" element={<MilestoneTemplateManager />} />

              {/* Default route */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ThemeProviderCustom>
      <AppWithTheme />
    </ThemeProviderCustom>
  );
}
