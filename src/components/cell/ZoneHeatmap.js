import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper } from "@mui/material";

// groups: [{ zone_name, is_ready_for_multiplication, last_meeting_date }]
function getZoneHeatmap(groups) {
  const zoneStats = {};
  groups.forEach(g => {
    const zone = g.zone_name || "Unzoned";
    if (!zoneStats[zone]) zoneStats[zone] = { zone, ready: 0, total: 0, active: 0 };
    if (g.is_ready_for_multiplication) zoneStats[zone].ready++;
    if (g.last_meeting_date) zoneStats[zone].active++;
    zoneStats[zone].total++;
  });
  return Object.values(zoneStats);
}

function color(val, max) {
  if (max === 0) return "#eee";
  const pct = val / max;
  if (pct > 0.8) return "#2196F3";
  if (pct > 0.5) return "#64B5F6";
  if (pct > 0.2) return "#BBDEFB";
  return "#E3F2FD";
}

export default function ZoneHeatmap({ groups = [] }) {
  const data = getZoneHeatmap(groups);
  const maxReady = Math.max(...data.map(z => z.ready));
  const maxActive = Math.max(...data.map(z => z.active));

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell><b>Zone</b></TableCell>
            <TableCell align="center"><b>Ready (Color)</b></TableCell>
            <TableCell align="center"><b>Active (Color)</b></TableCell>
            <TableCell align="center"><b>Total Groups</b></TableCell>
          </TableRow>
          {data.map(z => (
            <TableRow key={z.zone}>
              <TableCell>{z.zone}</TableCell>
              <TableCell align="center" style={{ background: color(z.ready, maxReady) }}>{z.ready}</TableCell>
              <TableCell align="center" style={{ background: color(z.active, maxActive) }}>{z.active}</TableCell>
              <TableCell align="center">{z.total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}