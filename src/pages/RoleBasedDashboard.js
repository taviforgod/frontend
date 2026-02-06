import React, { useContext } from 'react';
import ModernDashboard from '../dashboards/ModernDashboard.jsx';
import PFCCLeaderDashboard from '../dashboards/PFCCLeaderDashboard';
import MemberDashboard from '../dashboards/MemberDashboard';
import PastorDashboard from '../dashboards/PastorDashboard';
import BibleTeacherDashboard from '../dashboards/BibleTeacherDashboard';
import ZonalPastorDashboard from '../dashboards/ZonalPastorDashboard';
import AdminDashboard from './Dashboard';
import { AuthContext } from '../contexts/AuthContext';

export default function RoleBasedDashboard() {
  const { user, fetchWithAuth } = useContext(AuthContext); // <-- fetchWithAuth available

  const rawRole = user?.role || 'member';
  const role = String(rawRole).trim().toLowerCase().replace(/[\s-]+/g, '_');

  // Example: Use fetchWithAuth for a side effect or pass to dashboards if needed
  // React.useEffect(() => {
  //   if (fetchWithAuth) {
  //     fetchWithAuth('/api/some-authenticated-endpoint');
  //   }
  // }, [fetchWithAuth]);

  if (role === 'admin' || role === 'super_admin') return <AdminDashboard fetchWithAuth={fetchWithAuth} />;
  if (role === 'zonal_pastor') return <ZonalPastorDashboard fetchWithAuth={fetchWithAuth} />;
  if (role === 'bible_teacher') return <BibleTeacherDashboard fetchWithAuth={fetchWithAuth} />;
  if (role === 'cell_leader') return <ModernDashboard fetchWithAuth={fetchWithAuth} />;
  if (role === 'pfc_leader' || role === 'pfcc_leader') return <PFCCLeaderDashboard fetchWithAuth={fetchWithAuth} />;
  if (role === 'pastor') return <PastorDashboard fetchWithAuth={fetchWithAuth} />;
  if (role === 'member') return <MemberDashboard fetchWithAuth={fetchWithAuth} />;
  return <div>No dashboard available for your role.</div>;
}
