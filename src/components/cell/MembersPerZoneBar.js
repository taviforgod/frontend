import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function MembersPerZoneBar({ groups=[] }) {
  const data = Object.entries(
    groups.reduce((acc, g) => {
      const zone = g.zone_name || "Unzoned";
      acc[zone] = (acc[zone] || 0) + (g.member_count || 0);
      return acc;
    }, {})
  ).map(([zone, members]) => ({ zone, members }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="zone" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="members" fill="#1976d2" />
      </BarChart>
    </ResponsiveContainer>
  );
}