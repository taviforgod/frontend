import React, { useEffect, useState, useContext } from "react";
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, Avatar, Stack, Chip, Divider, List, ListItem, ListItemAvatar, ListItemText,
} from "@mui/material";
import {
  Users, BarChart2, Calendar, User, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { getAgeDemographics, getMembersSummary, getGrowthTrend, getUpcomingBirthdays, getMembersGender } from "../../services/dashboardService";
import { AuthContext } from '../../contexts/AuthContext'; // <-- Add this import

export default function MemberAnalyticsWidget() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [genderData, setGenderData] = useState([]);
  const [ages, setAges] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, g, a, gr, b] = await Promise.all([
          getMembersSummary(fetchWithAuth),
          getMembersGender(fetchWithAuth),
          getAgeDemographics(fetchWithAuth),
          getGrowthTrend(fetchWithAuth),
          getUpcomingBirthdays(fetchWithAuth),
        ]);
        setSummary(s);
        setGenderData(g);
        setAges(a);
        setGrowth(gr);
        setBirthdays(b);
      } catch (err) {
        console.warn("Widget load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchWithAuth]);

  if (loading) return <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>;

  const genderColors = ["#6A5ACD", "#FF6B6B"];
  const chartAges = [
    { group: "<18", count: ages.under_18 },
    { group: "18-35", count: ages.age_18_35 },
    { group: "36-60", count: ages.age_36_60 },
    { group: "60+", count: ages.above_60 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ borderRadius: 4, boxShadow: 4, overflow: "hidden" }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={2}>
            <Users size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Member Analytics
          </Typography>

          <Grid container spacing={3} alignItems="stretch">
            {/* --- SUMMARY --- */}
            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "primary.light",
                  borderRadius: 3,
                  color: "primary.contrastText",
                  height: "100%",
                }}
              >
                <Typography variant="h6">Overview</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Total Members: <b>{summary?.total_members ?? "—"}</b>
                </Typography>
                <Typography variant="body2">Active: <b>{summary?.active_members ?? "—"}</b></Typography>
                <Typography variant="body2">Visitors: <b>{summary?.visitors ?? "—"}</b></Typography>
                <Typography variant="body2">Leaders: <b>{summary?.leaders ?? "—"}</b></Typography>
              </Box>
            </Grid>

            {/* --- GENDER PIE --- */}
            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Gender Ratio
                  </Typography>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={genderData} dataKey="count" nameKey="gender" outerRadius={60} label>
                        {genderData.map((_, i) => <Cell key={i} fill={genderColors[i % genderColors.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* --- AGE DISTRIBUTION --- */}
            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Age Groups
                  </Typography>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={chartAges}>
                      <XAxis dataKey="group" />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* --- GROWTH TREND --- */}
            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Growth Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={growth}>
                      <XAxis dataKey="month" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* --- UPCOMING BIRTHDAYS --- */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" mb={1}>
              <Calendar size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Upcoming Birthdays
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <List dense>
              {birthdays.slice(0, 5).map((b) => (
                <ListItem key={b.member_id}>
                  <ListItemAvatar>
                    <Avatar>{b.first_name?.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${b.first_name} ${b.last_name}`}
                    secondary={new Date(b.birth_date).toLocaleDateString()}
                  />
                </ListItem>
              ))}
              {!birthdays.length && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No upcoming birthdays.
                </Typography>
              )}
            </List>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
