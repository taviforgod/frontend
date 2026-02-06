import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

// groups: [{ created_at, member_count }, ...]
function groupByMonth(groups) {
  const monthMap = {};
  groups.forEach(g => {
    const month = g.created_at?.slice(0, 7) || 'Unknown';
    if (!monthMap[month]) monthMap[month] = { month, groups: 0, members: 0 };
    monthMap[month].groups += 1;
    monthMap[month].members += g.member_count || 0;
  });
  return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
}

export default function RecentGrowthChart({ groups = [] }) {
  const data = groupByMonth(groups);
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="groups" name="New Groups" fill="#1976d2" />
        <Bar dataKey="members" name="New Members" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
}