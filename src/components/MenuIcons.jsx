import React from 'react';
import { SvgIcon } from '@mui/material';

/**
 * Christian-themed Menu Icons (Hollow Outline Style)
 * People-focused designs inspired by Getty Images charity icons
 * Hollow outlines with clear strokes
 */

// HOME - Kingdom Foundation
export const HomeIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </SvgIcon>
);

// DASHBOARD - Ministry Overview Grid
export const DashboardIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </SvgIcon>
);

// MEMBERS - People Fellowship
export const MembersIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3"></circle>
    <path d="M6 13a3 3 0 0 0-3 3v2h6v-2a3 3 0 0 0-3-3z"></path>
    <circle cx="15" cy="7" r="3"></circle>
    <path d="M12 13a3 3 0 0 0-3 3v2h6v-2a3 3 0 0 0-3-3z"></path>
  </SvgIcon>
);

// GROUPS - Connected Community
export const GroupsIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="8" r="2.5"></circle>
    <circle cx="12" cy="4" r="2.5"></circle>
    <circle cx="18" cy="8" r="2.5"></circle>
    <circle cx="12" cy="14" r="2.5"></circle>
    <line x1="6" y1="10.5" x2="12" y2="11.5"></line>
    <line x1="12" y1="6.5" x2="18" y2="10.5"></line>
    <line x1="12" y1="6.5" x2="12" y2="11.5"></line>
    <line x1="12" y1="16.5" x2="18" y2="10.5"></line>
  </SvgIcon>
);

// EVENTS - Party & Celebrations
export const EventsIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l2 4M12 2l2 4M18 2l2 4"></path>
    <circle cx="12" cy="13" r="8"></circle>
    <path d="M8 12s2 2 4 2 4-2 4-2"></path>
    <circle cx="10" cy="10" r="1"></circle>
    <circle cx="14" cy="10" r="1"></circle>
  </SvgIcon>
);

// GIVING - Hands & Heart Offering
export const GivingIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.5 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3-2.5-2h3l1.5-3z"></path>
    <line x1="12" y1="11" x2="12" y2="22"></line>
  </SvgIcon>
);

// REPORTS - Open Book
export const ReportsIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="6" width="16" height="12" rx="1"></rect>
    <line x1="12" y1="6" x2="12" y2="18"></line>
    <line x1="8" y1="9" x2="10" y2="9"></line>
    <line x1="8" y1="12" x2="10" y2="12"></line>
    <line x1="8" y1="15" x2="10" y2="15"></line>
    <line x1="14" y1="9" x2="16" y2="9"></line>
    <line x1="14" y1="12" x2="16" y2="12"></line>
    <line x1="14" y1="15" x2="16" y2="15"></line>
  </SvgIcon>
);

// SETTINGS - Gear/Admin
export const SettingsIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6"></path>
    <path d="M4.22 4.22l4.24 4.24"></path>
    <path d="M15.54 15.54l4.24 4.24"></path>
    <path d="M19.78 4.22l-4.24 4.24"></path>
    <path d="M8.46 15.54l-4.24 4.24"></path>
  </SvgIcon>
);

// EVANGELISM - Dove
export const EvangelismIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="2"></circle>
    <path d="M8 11l2-3 2 2 2-2 2 3"></path>
    <line x1="12" y1="8" x2="12" y2="4"></line>
    <path d="M4 14l3-1"></path>
    <path d="M20 14l-3-1"></path>
  </SvgIcon>
);

// DISCIPLESHIP - Person with Growth
export const DiscipleshipIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3"></circle>
    <path d="M12 11v6"></path>
    <path d="M5 18c1-2 4-3 7-3s6 1 7 3"></path>
    <polyline points="12 11 14 9 16 11"></polyline>
  </SvgIcon>
);

// COUNSELING - Heart with Care
export const CounselingIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    <path d="M6 14l2 2"></path>
  </SvgIcon>
);

// PRAYER - Hands Clasped
export const PrayerIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 8l4-4 4 4"></path>
    <path d="M8 12v8h8v-8"></path>
    <line x1="12" y1="4" x2="12" y2="12"></line>
  </SvgIcon>
);

// WORSHIP - Joyful Face
export const WorshipIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 13s2 2 4 2 4-2 4-2"></path>
    <circle cx="9" cy="9" r="1"></circle>
    <circle cx="15" cy="9" r="1"></circle>
  </SvgIcon>
);

// OUTREACH - Helping Hands
export const OutreachIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M7 12h10"></path>
    <path d="M12 7v10"></path>
    <path d="M9 9l3-3 3 3"></path>
    <path d="M9 15l3 3 3-3"></path>
  </SvgIcon>
);

// CHILDREN - Kids & Protection
export const ChildrenIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="9" r="2.5"></circle>
    <circle cx="16" cy="9" r="2.5"></circle>
    <path d="M6 16c1-2 3-3 6-3s5 1 6 3v2H6v-2z"></path>
  </SvgIcon>
);

// YOUTH - Star/Rising Leaders
export const YouthIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6l3-6z"></path>
  </SvgIcon>
);

// ADMIN - Shield
export const AdminIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l6 3v6c0 5-6 8-6 8s-6-3-6-8V5l6-3z"></path>
    <circle cx="12" cy="11" r="2"></circle>
  </SvgIcon>
);

// HELP - Question Mark Circle
export const HelpIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </SvgIcon>
);

// CRISIS - Emergency Star
export const CrisisIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6l3-6z"></path>
  </SvgIcon>
);

// BIBLE TEACHING - Open Book Learning
export const BibleTeachingIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h20v18H2z"></path>
    <line x1="12" y1="3" x2="12" y2="21"></line>
    <path d="M6 7h4M6 11h4M6 15h4"></path>
    <path d="M14 7h4M14 11h4M14 15h4"></path>
  </SvgIcon>
);

// FOUNDATION - Layered Strength
export const FoundationIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="9" rx="1"></rect>
    <rect x="3" y="12" width="18" height="9" rx="1"></rect>
    <line x1="9" y1="7.5" x2="15" y2="7.5"></line>
  </SvgIcon>
);

// BAPTISM - Water & Renewal
export const BaptismIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v5"></path>
    <circle cx="12" cy="14" r="5"></circle>
    <path d="M12 19v3"></path>
    <line x1="8" y1="14" x2="16" y2="14"></line>
  </SvgIcon>
);

// CELL GROUPS - Network Connection
export const CellGroupIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="8" r="2"></circle>
    <circle cx="12" cy="4" r="2"></circle>
    <circle cx="18" cy="8" r="2"></circle>
    <circle cx="12" cy="14" r="2"></circle>
    <line x1="6" y1="10" x2="12" y2="12"></line>
    <line x1="12" y1="6" x2="18" y2="10"></line>
    <line x1="12" y1="6" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="18" y2="10"></line>
  </SvgIcon>
);

// ATTENDANCE - Presence/Check
export const AttendanceIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
    <rect x="2" y="2" width="20" height="20" rx="2"></rect>
  </SvgIcon>
);

// FINANCE - Stewardship Dollar
export const FinanceIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8"></circle>
    <path d="M12 6v2"></path>
    <path d="M12 16v2"></path>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </SvgIcon>
);

// LEADERSHIP - Servant Leader
export const LeadershipIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3"></circle>
    <path d="M5 16c1-2 4-3 7-3s6 1 7 3"></path>
    <path d="M8 16l-1 4h10l-1-4"></path>
  </SvgIcon>
);

// LOOKUP - Eyes/Vision/Seek
export const LookupIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </SvgIcon>
);

// BIBLE - Holy Scripture
export const BibleIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3h14c1 0 2 1 2 2v14c0 1-1 2-2 2H5c-1 0-2-1-2-2V5c0-1 1-2 2-2z"></path>
    <line x1="12" y1="3" x2="12" y2="19"></line>
    <path d="M8 7h2M8 11h2M8 15h2"></path>
    <path d="M16 7h-2M16 11h-2M16 15h-2"></path>
  </SvgIcon>
);

// OPEN BOOK - Knowledge & Teaching
export const OpenBookIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h20v18H2z"></path>
    <line x1="12" y1="3" x2="12" y2="21"></line>
    <path d="M6 7h4M6 11h4M6 15h4"></path>
    <path d="M14 7h4M14 11h4M14 15h4"></path>
  </SvgIcon>
);

// CHURCH/MINISTRY - Building with Cross
export const ChurchIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 6v13H4V8l8-6z"></path>
    <line x1="12" y1="6" x2="12" y2="14"></line>
    <line x1="8" y1="10" x2="16" y2="10"></line>
    <path d="M6 21v-4h3v4"></path>
    <path d="M15 21v-4h3v4"></path>
  </SvgIcon>
);
