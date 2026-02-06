// src/components/Dashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { getOverviewMetrics, getUpcomingMeetings } from "../services/cellService";
import { Users, UserPlus, Activity, AlertTriangle, Calendar } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext"; 
import { DateTime } from 'luxon';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    avg_attendance: 0,
    visitors: 0,
    conversions: 0,
    at_risk: 0,
  });
  const [meetings, setMeetings] = useState([]);
  const { fetchWithAuth } = useContext(AuthContext); 

  useEffect(() => {
    (async () => {
      try {
        const overview = fetchWithAuth
          ? await getOverviewMetrics(fetchWithAuth)
          : await getOverviewMetrics();
        setMetrics(overview);
        const meetingList = fetchWithAuth
          ? await getUpcomingMeetings(fetchWithAuth)
          : await getUpcomingMeetings();
        setMeetings(meetingList);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    })();
  }, [fetchWithAuth]);

  const cardStyle = {
    display: "flex",
    alignItems: "center",
    gap: 2,
    p: 2,
    borderRadius: 2,
    height: 120,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Cell Ministry Dashboard
      </Typography>

      {/* Top Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardStyle}>
            <Activity size={28} color="green" />
            <CardContent>
              <Typography variant="h6">{metrics.avg_attendance}</Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Attendance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardStyle}>
            <Users size={28} color="blue" />
            <CardContent>
              <Typography variant="h6">{metrics.visitors}</Typography>
              <Typography variant="body2" color="text.secondary">
                Visitors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardStyle}>
            <UserPlus size={28} color="purple" />
            <CardContent>
              <Typography variant="h6">{metrics.conversions}</Typography>
              <Typography variant="body2" color="text.secondary">
                Conversions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={cardStyle}>
            <AlertTriangle size={28} color="red" />
            <CardContent>
              <Typography variant="h6">{metrics.at_risk}</Typography>
              <Typography variant="body2" color="text.secondary">
                At-Risk Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Meetings */}
      <Typography variant="h6" gutterBottom>
        Upcoming Meetings
      </Typography>
      <Grid container spacing={2}>
        {meetings.length === 0 && (
          <Typography variant="body2" sx={{ ml: 2 }}>
            No upcoming meetings scheduled.
          </Typography>
        )}
        {meetings.map((m) => (
          <Grid item xs={12} md={6} lg={4} key={m.id}>
            <Card sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <Calendar size={24} />
              <Box>
                <Typography variant="subtitle1">{m.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Next Meeting:{" "}
                  {m.next_meeting_date
                    ? DateTime.fromISO(m.next_meeting_date).toLocaleString(DateTime.DATE_MED)
                    : "Not set"}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
