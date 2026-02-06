import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { ThemeProviderCustom, ThemeContext } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Onboard from "./pages/Auth/Onboard";
import PhoneVerification from "./pages/Auth/VerifyPhone";
import EmailVerification from "./pages/Auth/VerifyEmail"; 

import Profile from "./pages/RBAC/Profile";
import Users from "./pages/RBAC/Users";
import Roles from "./pages/RBAC/Roles";
import Permissions from "./pages/RBAC/Permissions";
import RBACMatrix from "./pages/RBAC/RBACMatrix";
import UserRoleMatrix from "./pages/RBAC/UserRoleMatrix";

import MembersPage from "./pages/MemberPage";
import Layout from "./Layout";
import Header from "./Shared/Header";

import LookupsPage from "./pages/Settings/LookupsPage";
import ZoneSettings from "./pages/Settings/ZoneSettings";
import ZoneManagementPage from "./pages/Settings/ZoneManagement";
import StatusTypesPage from "./components/StatusTypesPage";
import ExitTypeMappings from "./pages/Settings/ExitTypeMappings";
import ZonesPage from "./components/ZonesPage";
import AdminPrayerList from "./pages/prayer/AdminPrayerList";
import PrayerDashboard from "./pages/prayer/PrayerDashboard";
import PrayerForm from "./components/prayer/PrayerForm";

import MilestoneTemplates from "./components/spiritual/MilestoneTemplates";
import GrowthDashboard from "./components/spiritual/GrowthDashboard";
import RoleBasedDashboard from "./pages/RoleBasedDashboard";

import LeadershipPage from "./components/leadership/LeaderList";
import LeaderEvaluationSummary from "./components/leadership/LeaderEvaluationSummary";
import ApprovalsInbox from "./components/leadership/ApprovalsInbox";
import EvangelismDashboard from "./pages/EvangelismDashboard";

import CellGroupListTablePage from "./pages/cell/CellGroupListTablePage";
import VisitorsList from "./pages/visitors/VisitorsList";
import VisitorDetail from "./pages/visitors/VisitorDetail";

import ExportsPage from "./components/ExportsPage";
import FollowUpModal from "./components/FollowUpModal";
import HealthDashboard from "./components/HealthDashboard";
import InactiveExitList from "./components/exit/InactiveExitList";
import WeeklyReports from "./components/WeeklyReports";

// Notification modules
import NotificationBell from "./components/notifications/NotificationBell";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationPreferencesDashboard from "./pages/NotificationPreferencesDashboard";
import NotificationTemplatesDashboard from "./pages/NotificationTemplatesDashboard";
import RemindersDashboard from "./pages/RemindersDashboard";
import NotificationLogsDashboard from "./pages/NotificationLogsDashboard";
import MessageBoard from "./pages/MessageBoard";
import AdminRemindersMonitor from "./pages/AdminRemindersMonitor";
import SuperAdminTemplatesDashboard from "./pages/SuperAdminTemplatesDashboard";
import UserDigestHistory from "./pages/UserDigestHistory";
import CrisisFollowupPage from "./pages/CrisisFollowupPage";
import CellGroupsDashboardPage from "./pages/cell/CellGroupsDashboardPage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import FoundationClassManager from "./components/FoundationClassManager";
import AbsenteeFollowup from "./pages/AbsenteeFollowup";
import BibleTeachingCalendar from "./pages/BibleTeachingCalendar";
import FoundationSchoolTracker from "./pages/FoundationSchoolTracker";
import NewBelieverIntegration from "./pages/NewBelieverIntegration";
import MeetingAgendas from "./pages/MeetingAgendas";
import OutreachEvents from "./pages/OutreachEvents";
import BaptismRegister from "./pages/BaptismRegister";
import BaptismPrepChecklist from "./pages/BaptismPrepChecklist";
import FoundationSchoolProgress from "./pages/FoundationSchoolProgress";
import ConflictManagement from "./pages/ConflictManagement";
import CelebrationsEvents from "./pages/CelebrationsEvents";
import GivingTestimony from "./pages/GivingTestimony";
import CellGrowthDashboard from "./pages/CellGrowthDashboard";
import PersonalGrowthTracker from "./pages/PersonalGrowthTracker";
import AutomatedReports from "./pages/AutomatedReports";
import ComprehensiveReports from "./pages/ComprehensiveReports";
import ReportDashboard from "./pages/reports/ReportDashboard";
import ReportViewer from "./pages/reports/ReportViewer";
import HomePage from "./pages/HomePage";
import { Settings } from 'luxon';

// Set Luxon global config
Settings.defaultLocale = 'en'; 
Settings.defaultZone = 'Africa/Lagos'; 

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

// RootRoute component — show Home for guests, Protected layout for signed-in users
function RootRoute() {
  const { user, ready } = useContext(AuthContext);
  if (!ready) return null; // avoid flicker while auth initializes
  if (!user) return <HomePage />;
  return (
    <ProtectedRoute>
      <Header />
      <Layout />
    </ProtectedRoute>
  );
}

// The main app with theming
function AppWithTheme() {
  const { theme } = useContext(ThemeContext);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>                {/* <-- wrap here so NotificationContext can use AuthContext */}
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboard" element={<Onboard />} />
              <Route path="/verify-phone" element={<PhoneVerification />} />
              <Route path="/verify-email" element={<EmailVerification />} />

              {/* Root route: Home for guests, Protected layout for signed-in users */}
              <Route path="/" element={<RootRoute />}> 
                {/* General */}
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<RoleBasedDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<EditProfilePage />} /> {/* <-- Added route for editing profile */}
                <Route path="users" element={<Users />} />
                <Route path="roles" element={<Roles />} />
                <Route path="permissions" element={<Permissions />} />
                <Route path="rbac-matrix" element={<RBACMatrix />} />
                <Route path="user-role-matrix" element={<UserRoleMatrix />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="lookups" element={<LookupsPage />} />
                <Route path="zone-management" element={<Navigate to="/settings/zone-management" replace />} />
                <Route path="settings/departments" element={<Navigate to="/lookups?focus=departments" replace />} />
                <Route path="settings/zones" element={<ZoneSettings />} />
                <Route path="settings/zone-management" element={<ZoneManagementPage />} />
                <Route path="status-types" element={<StatusTypesPage />} />
                <Route path="admin/exit-type-mappings" element={<ExitTypeMappings />} />
                <Route path="zones" element={<ZonesPage />} />
                <Route path="prayers" element={<PrayerDashboard />} />
                <Route path="prayers/admin" element={<AdminPrayerList />} />
                <Route path="prayers/new" element={<PrayerForm />} />
                <Route path="prayers/edit/:id" element={<PrayerForm />} />

                {/* Cells and Visitors */}
                <Route path="cell-groups" element={<CellGroupListTablePage />} />
                <Route path="visitors" element={<VisitorsList />} />
                <Route path="visitors/:id" element={<VisitorDetail />} />

                {/* Reports & Exports */}
                <Route path="reports" element={<ReportDashboard />} />
                <Route path="reports/:id" element={<ReportViewer />} />
                <Route path="exports" element={<ExportsPage />} />
                <Route path="followups" element={<FollowUpModal />} />

                {/* Health & Evangelism */}
                <Route path="health-dashboard" element={<HealthDashboard />} />
                <Route path="evangelism" element={<EvangelismDashboard />} />
                <Route path="inactive-exits" element={<InactiveExitList />} />

                {/* Spiritual & Leadership */}
                <Route path="spiritual/milestones" element={<MilestoneTemplates />} />
                <Route path="spiritual/dashboard" element={<GrowthDashboard />} />
                <Route path="leadership" element={<LeadershipPage />} />
                <Route path="leadership/summary/:leaderId" element={<LeaderEvaluationSummary />} />
                <Route path="leadership/approvals" element={<ApprovalsInbox />} />

                <Route path="weekly-reports" element={<WeeklyReports />} />

                {/* Notification module routes */}
                <Route path="notifications/bell" element={<NotificationBell />} />
                <Route path="notifications/center" element={<NotificationCenter />} />
                <Route path="notifications/preferences" element={<NotificationPreferencesDashboard />} />
                <Route path="notifications/templates" element={<NotificationTemplatesDashboard />} />
                <Route path="notifications/reminders" element={<RemindersDashboard />} />
                <Route path="notifications/logs" element={<NotificationLogsDashboard />} />
                <Route path="message-board" element={<MessageBoard />} />
                <Route path="admin/reminders-monitor" element={<AdminRemindersMonitor />} />
                <Route path="superadmin/templates" element={<SuperAdminTemplatesDashboard />} />
                <Route path="user/digest-history" element={<UserDigestHistory />} />
                <Route path="crisis-followups" element={<CrisisFollowupPage />} />
                <Route path="cell-groups-dashboard" element={<CellGroupsDashboardPage />} />
                <Route path="foundation-classes" element={<FoundationClassManager />} />
                <Route path="bible-teaching-calendar" element={<BibleTeachingCalendar />} />
                <Route path="meeting-agendas" element={<MeetingAgendas />} />
                <Route path="outreach-events" element={<OutreachEvents />} />
                <Route path="baptism-register" element={<BaptismRegister />} />
                <Route path="baptism-prep-checklist" element={<BaptismPrepChecklist />} />
                <Route path="conflict-management" element={<ConflictManagement />} />
                <Route path="celebrations-events" element={<CelebrationsEvents />} />
                <Route path="giving-testimony" element={<GivingTestimony />} />
                <Route path="cell-growth-dashboard" element={<CellGrowthDashboard />} />
                <Route path="personal-growth-tracker" element={<PersonalGrowthTracker />} />
                <Route path="automated-reports" element={<AutomatedReports />} />
                <Route path="comprehensive-reports" element={<ComprehensiveReports />} />
                <Route path="foundation-school" element={<FoundationSchoolTracker />} />
                <Route path="foundation-school-progress" element={<FoundationSchoolProgress />} />
                <Route path="cell-visitor-integration" element={<NewBelieverIntegration />} />
                <Route path="absentee-followup" element={<AbsenteeFollowup />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Direct dashboard route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </NotificationProvider>
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
