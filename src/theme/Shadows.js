// Shadows.js
// Professional elevation system for modern dashboards

const shadows = [
  'none',
  '0px 2px 4px rgba(0, 0, 0, 0.04), 0px 1px 2px rgba(0, 0, 0, 0.02)',  // level 1 - subtle
  '0px 4px 8px rgba(0, 0, 0, 0.06), 0px 2px 4px rgba(0, 0, 0, 0.04)',  // level 2 - cards
  '0px 8px 16px rgba(0, 0, 0, 0.08), 0px 4px 6px rgba(0, 0, 0, 0.06)', // level 3 - elevated cards
  '0px 12px 24px rgba(0, 0, 0, 0.10), 0px 6px 12px rgba(0, 0, 0, 0.08)', // level 4 - dialogs
  '0px 16px 32px rgba(0, 0, 0, 0.12), 0px 8px 16px rgba(0, 0, 0, 0.10)', // level 5 - drawers
  '0px 20px 40px rgba(0, 0, 0, 0.14), 0px 10px 20px rgba(0, 0, 0, 0.12)', // level 6 - modals
  ...Array(19).fill('none'), // fill remaining indices for compatibility
];

export default shadows;
