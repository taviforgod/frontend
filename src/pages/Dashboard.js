import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Stack,
  useTheme,
} from "@mui/material";
import { Users, BadgeCheck, Church } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const fetchCount = async (endpoint) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      credentials: "include",
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error(err);
    return 0;
  }
};

const StatCard = ({ icon, label, count, link, color }) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        textAlign: "center",
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
        },
      }}
    >
      <Stack spacing={1} alignItems="center">
        {React.cloneElement(icon, { size: 32, color })}
        <Typography variant="subtitle2" color="textSecondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          {count}
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => navigate(link)}
          sx={{ mt: 1, fontSize: "0.8rem", textTransform: "none" }}
        >
          View All
        </Button>
      </Stack>
    </Paper>
  );
};

const PublicDashboard = () => {
  const [counts, setCounts] = useState({
    members: 0,
    roles: 0,
    churches: 0,
  });

  const theme = useTheme();

  useEffect(() => {
    const loadCounts = async () => {
      const [members, roles, churches] = await Promise.all([
        fetchCount("/api/members"),
        fetchCount("/api/roles"),
        fetchCount("/api/lookups/churches"),
      ]);
      setCounts({ members, roles, churches });
    };

    loadCounts();
  }, []);

  const cards = [
    {
      label: "Members",
      count: counts.members,
      icon: <Users />,
      link: "/members",
      color: theme.palette.primary.main,
    },
    {
      label: "Roles",
      count: counts.roles,
      icon: <BadgeCheck />,
      link: "/roles",
      color: theme.palette.secondary.main,
    },
    {
      label: "Churches",
      count: counts.churches,
      icon: <Church />,
      link: "/churches",
      color: theme.palette.success.main,
    },
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  return (
    <Box sx={{ px: { xs: 2, md: 4 } }}>
      <PublicDashboard />
    </Box>
  );
}
