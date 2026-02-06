import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#845EC2', '#B39CD0'];

export default function GroupsPerStatusPie({ groups=[] }) {
  const data = Object.entries(
    groups.reduce((acc, g) => {
      const st = g.status_name || "Unstated";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, value]) => ({ status, value }));

  return (
    <PieChart width={350} height={250}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="status"
        cx="50%" cy="50%"
        outerRadius={80}
        label
      >
        {data.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}