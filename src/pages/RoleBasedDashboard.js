import React, { useContext } from 'react';
import CellLeaderDashboard from '../dashboards/CellLeaderDashboard';
import PFCCLeaderDashboard from '../dashboards/PFCCLeaderDashboard';
import MemberDashboard from '../dashboards/MemberDashboard';
import PastorDashboard from '../dashboards/PastorDashboard';
import AdminDashboard from './Dashboard';
import { AuthContext } from '../contexts/AuthContext';

export default function RoleBasedDashboard() {
  const { user } = useContext(AuthContext);

  const role = user?.role || 'member';
 
  if (role === 'admin' || role === 'Super_Admin') return <AdminDashboard />;
  if (role === 'cell_leader') return <CellLeaderDashboard />;
  if (role === 'pfcc_leader') return <PFCCLeaderDashboard />;
  if (role === 'pastor') return <PastorDashboard />;
  if (role === 'member') return <MemberDashboard />;
  return <div>No dashboard available for your role.</div>;
}