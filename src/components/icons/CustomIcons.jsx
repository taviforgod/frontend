import React from 'react';

// Custom SVG Icons for CMMS - Simple, clean design matching provided examples
export const HomeIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

export const ChurchIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9h18l-9-7z"/>
    <path d="M12 2v20"/>
    <path d="M5 9v12h14V9"/>
    <path d="M8 17h8"/>
  </svg>
);

export const NotificationIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export const DiscipleshipIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 3-3 3-3-3z"/>
    <path d="M12 8v6"/>
    <circle cx="12" cy="18" r="3"/>
    <path d="M10 18h4"/>
  </svg>
);

export const CareIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export const CommunityIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.5"/>
    <circle cx="16" cy="8" r="2.5"/>
    <path d="M3 20c1-3 6-3 7 0"/>
    <path d="M14 20c1-3 6-3 7 0"/>
  </svg>
);

export const EvangelismIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
    <path d="M12 6l4 4"/>
    <path d="M12 6l-4 4"/>
  </svg>
);

export const LeadershipIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3 7h6l-5 4 2 7-6-5-6 5 2-7-5-4h6z"/>
  </svg>
);

export const ReportsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <line x1="16" y1="3" x2="16" y2="7"/>
    <line x1="8" y1="3" x2="8" y2="7"/>
    <line x1="3" y1="11" x2="21" y2="11"/>
  </svg>
);

export const AdminIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export const PrayerIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4v7l-2 3"/>
    <path d="M13 4v7l2 3"/>
    <path d="M9 20c0-3 1-5 3-5s3 2 3 5"/>
  </svg>
);

export const GrowthIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v5"/>
    <path d="M5 10l7-5 7 5"/>
    <rect x="6" y="10" width="12" height="10" rx="1"/>
  </svg>
);

export const BaptismIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3 3"/>
  </svg>
);

export const CrisisIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h11a3 3 0 0 1 3 3v11"/>
    <path d="M4 5v14a2 2 0 0 0 2 2h12"/>
    <line x1="9" y1="5" x2="9" y2="21"/>
  </svg>
);

// Icon mapping for easy usage
export const CustomIcons = {
  home: HomeIcon,
  church: ChurchIcon,
  discipleship: DiscipleshipIcon,
  care: CareIcon,
  community: CommunityIcon,
  evangelism: EvangelismIcon,
  leadership: LeadershipIcon,
  reports: ReportsIcon,
  admin: AdminIcon,
  prayer: PrayerIcon,
  growth: GrowthIcon,
  baptism: BaptismIcon,
  crisis: CrisisIcon,
  notification: NotificationIcon,
};

// Default export for compatibility
export default CustomIcons;