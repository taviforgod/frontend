import React from "react";
import { Grid, Card, CardContent, Typography } from "@mui/material";

export default function CellGroupMetrics({ groups = [] }) {
  const totalGroups = groups.length;
  const totalMembers = groups.reduce((sum, g) => sum + (parseInt(g.member_count) || 0), 0);
  const readyToMultiply = groups.filter(g => g.is_ready_for_multiplication).length;
  const inactiveGroups = groups.filter(g => !g.is_active).length;

  return (
    <Grid container spacing={2} mb={2}>
      <Grid item><Card><CardContent>
        <Typography variant="h6">{totalGroups}</Typography>
        <Typography color="text.secondary">Total Groups</Typography>
      </CardContent></Card></Grid>
      <Grid item><Card><CardContent>
        <Typography variant="h6">{totalMembers}</Typography>
        <Typography color="text.secondary">Total Members</Typography>
      </CardContent></Card></Grid>
      <Grid item><Card><CardContent>
        <Typography variant="h6">{readyToMultiply}</Typography>
        <Typography color="text.secondary">Ready for Multiplication</Typography>
      </CardContent></Card></Grid>
      <Grid item><Card><CardContent>
        <Typography variant="h6">{inactiveGroups}</Typography>
        <Typography color="text.secondary">Inactive Groups</Typography>
      </CardContent></Card></Grid>
    </Grid>
  );
}