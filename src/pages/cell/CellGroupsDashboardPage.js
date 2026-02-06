import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Grid, Paper, Stack, Button } from "@mui/material";
import CellGroupMetrics from "../../components/cell/CellGroupMetrics";
import MembersPerZoneBar from "../../components/cell/MembersPerZoneBar";
import GroupsPerStatusPie from "../../components/cell/GroupsPerStatusPie";
import RecentGrowthChart from "../../components/cell/RecentGrowthChart";
import ZoneHeatmap from "../../components/cell/ZoneHeatmap";
import TopGroupsTable from "../../components/cell/TopGroupsTable";
import { exportGroupsToExcel } from "../../utils/exportExcel";
import { exportGroupsToPDF } from "../../utils/exportPDF";
import { getCellGroups } from "../../services/cellGroupService";
import { AuthContext } from '../../contexts/AuthContext'; // <-- Add this import
import { DateTime } from 'luxon'; // <-- Add this import

export default function CellGroupsDashboardPage() {
  const [groups, setGroups] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  useEffect(() => {
    getCellGroups(fetchWithAuth).then(setGroups);
  }, [fetchWithAuth]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Cell Groups Dashboard</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => exportGroupsToExcel(groups)}>Export Excel</Button>
          <Button variant="outlined" onClick={() => exportGroupsToPDF(groups)}>Export PDF</Button>
        </Stack>
      </Stack>
      <CellGroupMetrics groups={groups} />
      <Grid container spacing={2}>
        <Grid item md={6} xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" mb={1}>Recent Growth (New Groups/Members per Month)</Typography>
            <RecentGrowthChart groups={groups} />
          </Paper>
        </Grid>
        <Grid item md={6} xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" mb={1}>Members Per Zone</Typography>
            <MembersPerZoneBar groups={groups} />
          </Paper>
        </Grid>
        <Grid item md={6} xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" mb={1}>Groups Per Status</Typography>
            <GroupsPerStatusPie groups={groups} />
          </Paper>
        </Grid>
        <Grid item md={6} xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" mb={1}>Zone Heatmap (Readiness/Activity)</Typography>
            <ZoneHeatmap groups={groups} />
          </Paper>
        </Grid>
      </Grid>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" mb={1}>Top 5 Largest Groups</Typography>
        <TopGroupsTable groups={groups} count={5} onGroupClick={setSelectedId} />
      </Paper>
      {/* Optionally, show group detail modal here for drilldown */}
      {/* {selectedId && <CellGroupDetail groupId={selectedId} onClose={() => setSelectedId(null)} />} */}
    </Box>
  );
}