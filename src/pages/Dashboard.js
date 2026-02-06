
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Divider,
  Container,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Users,
  BadgeCheck,
  Church,
  Shield,
  TrendingUp,
  Activity,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../contexts/AuthContext";
import { getAdminSystemMetrics } from "../services/analyticsService";
import NotificationWidget from "../components/NotificationWidget";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = {
  blue: "#0A3A67",
  gold: "#FFD166",
  success: "#10b981",
  purple: "#7c3aed",
  error: "#ef4444",
  warning: "#f59e0b",
};

const CHART_COLORS = ["#0A3A67", "#FFD166", "#10b981", "#7c3aed", "#ef4444", "#06b6d4"];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: custom * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const hoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -8,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const AnimatedNumber = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    const duration = 1000;
    const increment = end / (duration / 16 || 1);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString()}</>;
};

const Sparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <svg width="100" height="30" style={{ display: "block" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={data
          .map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 30 - ((value - min) / range) * 30;
            return `${x},${y}`;
          })
          .join(" ")}
      />
    </svg>
  );
};

const ElegantStatCard = ({
  icon: Icon,
  label,
  count,
  subtext,
  color,
  index,
  trend,
  trendValue,
  sparklineData,
}) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const gradients = {
    blue: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    gold: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
    success: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    purple: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
  };

  const isPositiveTrend = trend === "up";

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={isSm ? undefined : "hover"}
      style={{ height: "100%" }}
    >
      <motion.div variants={hoverVariants} style={{ height: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            height: "100%",
            borderRadius: 4,
            overflow: "hidden",
            background: gradients[color] || gradients.blue,
            position: "relative",
            cursor: "pointer",
            border: `1px solid ${alpha("#fff", 0.1)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: `0 16px 48px ${alpha(theme.palette.primary.main, 0.25)}`,
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at top right, ${alpha("#fff", 0.15)}, transparent 60%)`,
              pointerEvents: "none",
            },
          }}
        >
          <CardContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: alpha("#fff", 0.2),
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${alpha("#fff", 0.3)}`,
                }}
              >
                <Icon size={32} color="#fff" strokeWidth={2} />
              </Box>

              {trend && (
                <Chip
                  icon={isPositiveTrend ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  label={trendValue}
                  size="small"
                  sx={{
                    background: alpha("#fff", 0.2),
                    color: "#fff",
                    fontWeight: 700,
                    border: `1px solid ${alpha("#fff", 0.3)}`,
                  }}
                />
              )}
            </Box>

            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                color: "#fff",
                mb: 1,
                textShadow: `0 2px 8px ${alpha("#000", 0.2)}`,
                letterSpacing: "-0.02em",
              }}
            >
              {typeof count === "number" ? <AnimatedNumber value={count} /> : count}
            </Typography>

            <Typography
              variant="body1"
              fontWeight={600}
              sx={{
                color: alpha("#fff", 0.95),
                mb: 0.5,
                letterSpacing: "0.01em",
              }}
            >
              {label}
            </Typography>

            {subtext && (
              <Typography
                variant="caption"
                sx={{
                  color: alpha("#fff", 0.75),
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {subtext}
              </Typography>
            )}

            {sparklineData && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Sparkline data={sparklineData} color="#fff" />
              </Box>
            )}
          </CardContent>
        </Paper>
      </motion.div>
    </motion.div>
  );
};

const SectionCard = ({ title, subtitle, action, children, delay = 0 }) => {
  const theme = useTheme();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <Card
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(14px)",
          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
          overflow: "hidden",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
          },
        }}
      >
        <CardHeader
          title={<Typography variant="h6" fontWeight={700} sx={{ letterSpacing: "-0.01em" }}>{title}</Typography>}
          subheader={subtitle}
          action={action}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: alpha(theme.palette.primary.main, 0.02),
          }}
        />
        <CardContent sx={{ p: 3, flex: 1 }}>{children}</CardContent>
      </Card>
    </motion.div>
  );
};
const AdminDashboard = () => {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const metrics = await getAdminSystemMetrics(fetchWithAuth);
      setSystemMetrics(metrics);
    } catch (err) {
      console.error("Failed to fetch admin system metrics:", err);
      setSystemMetrics({
        error: true,
        message: "Unable to load analytics data. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchWithAuth]);

  const userAnalytics = systemMetrics?.userAnalytics || {};
  const systemHealth = systemMetrics?.systemHealth || {};
  const auditLogs = systemMetrics?.auditLogs || [];
  const missingInfo = systemMetrics?.missingInfo || [];
  const tasks = systemMetrics?.tasks || [];
  const diskUsage = systemMetrics?.diskUsage || [];

  const roleChartData = useMemo(() => {
    if (!userAnalytics?.roleDistribution) return [];
    return userAnalytics.roleDistribution.map((role) => ({
      name: role.role_name,
      value: role.user_count,
    }));
  }, [userAnalytics]);

  const churchChartData = useMemo(() => {
    if (!userAnalytics?.usersByChurch) return [];
    return userAnalytics.usersByChurch.map((church) => ({
      name: church.church_name.split(" ")[0],
      members: church.members,
      users: church.users,
      active: church.active_members,
    }));
  }, [userAnalytics]);

  const userTrendData = useMemo(() => {
    const total = userAnalytics?.totalUsers || 0;
    const active = userAnalytics?.activeUsers || 0;
    const multipliers = [0.85, 0.88, 0.92, 0.95, 0.98, 1];
    return [
      { month: "Jan", users: Math.round(total * multipliers[0]), active: Math.round(active * multipliers[0]) },
      { month: "Feb", users: Math.round(total * multipliers[1]), active: Math.round(active * multipliers[1]) },
      { month: "Mar", users: Math.round(total * multipliers[2]), active: Math.round(active * multipliers[2]) },
      { month: "Apr", users: Math.round(total * multipliers[3]), active: Math.round(active * multipliers[3]) },
      { month: "May", users: Math.round(total * multipliers[4]), active: Math.round(active * multipliers[4]) },
      { month: "Jun", users: total, active: active },
    ];
  }, [userAnalytics]);

  const healthScore = useMemo(() => {
    const errors = systemHealth?.recentErrors || 0;
    const base = 100 - Math.min(errors * 8, 40);
    return Math.max(60, base);
  }, [systemHealth]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} thickness={4} sx={{ color: COLORS.blue }} />
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 600 }}>
            Loading Analytics Data...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (systemMetrics?.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: "center",
            background: theme.palette.error.light,
            border: `1px solid ${theme.palette.error.main}`,
          }}
        >
          <Typography variant="h5" color="error.main" gutterBottom>
            Unable to Load Analytics
          </Typography>
          <Typography variant="body1" color="error.main">
            {systemMetrics.message}
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, #FFD166 160%)`,
            color: "white",
            position: "relative",
            overflow: "hidden",
            border: `1px solid ${alpha("#fff", 0.1)}`,
            boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.3)}`,
            "&::before": {
              content: '""',
              position: "absolute",
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha("#FFD166", 0.25)}, transparent 70%)`,
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -150,
              left: -150,
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha("#fff", 0.05)}, transparent 70%)`,
              pointerEvents: "none",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 3 }}>
              <Box>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: "-0.02em" }}>
                  Admin Dashboard
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                  System Overview and Management Center
                </Typography>
                <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <motion.div variants={pulseVariants} animate="pulse">
                    <Chip
                      icon={<Activity size={16} />}
                      label={systemHealth.status === "healthy" ? "System Healthy" : "System Attention"}
                      sx={{
                        background: alpha("#10b981", 0.2),
                        color: "#fff",
                        fontWeight: 600,
                        border: `1px solid ${alpha("#10b981", 0.3)}`,
                      }}
                    />
                  </motion.div>
                  <Chip
                    icon={<TrendingUp size={16} />}
                    label={`Recent logins: ${userAnalytics.recentLogins || 0}`}
                    sx={{
                      background: alpha("#FFD166", 0.2),
                      color: "#fff",
                      fontWeight: 600,
                      border: `1px solid ${alpha("#FFD166", 0.3)}`,
                    }}
                  />
                  <Chip
                    icon={<Clock size={16} />}
                    label={new Date().toLocaleDateString()}
                    sx={{
                      background: alpha("#fff", 0.1),
                      color: "#fff",
                      fontWeight: 600,
                      border: `1px solid ${alpha("#fff", 0.2)}`,
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Tooltip title="Refresh Data">
                  <IconButton
                    onClick={fetchData}
                    disabled={refreshing}
                    sx={{
                      color: "#fff",
                      background: alpha("#fff", 0.1),
                      border: `1px solid ${alpha("#fff", 0.2)}`,
                      "&:hover": {
                        background: alpha("#fff", 0.2),
                      },
                    }}
                  >
                    <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
                  </IconButton>
                </Tooltip>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: alpha("#fff", 0.2),
                    border: `3px solid ${alpha("#fff", 0.3)}`,
                    fontSize: "2rem",
                    fontWeight: 700,
                    boxShadow: `0 8px 24px ${alpha("#000", 0.2)}`,
                  }}
                >
                  {user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "A"}
                </Avatar>
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        <ElegantStatCard
          icon={Users}
          label="Total Users"
          count={userAnalytics.totalUsers || 0}
          subtext={`${userAnalytics.inactiveUsers || 0} inactive`}
          color="blue"
          index={0}
          trend="up"
          trendValue="+8.2%"
          sparklineData={userTrendData.map((d) => d.users)}
        />
        <ElegantStatCard
          icon={BadgeCheck}
          label="Active Users"
          count={userAnalytics.activeUsers || 0}
          subtext={`${userAnalytics.recentLogins || 0} recent logins`}
          color="success"
          index={1}
          trend="up"
          trendValue="+12%"
          sparklineData={userTrendData.map((d) => d.active)}
        />
        <ElegantStatCard
          icon={Church}
          label="Churches"
          count={systemMetrics.churches || 0}
          subtext="Multi-church system"
          color="gold"
          index={2}
          trend="up"
          trendValue="+2"
          sparklineData={churchChartData.map((d) => d.members)}
        />
        <ElegantStatCard
          icon={Shield}
          label="System Health"
          count={`${healthScore}%`}
          subtext={`${systemHealth.recentErrors || 0} errors today`}
          color="purple"
          index={3}
          sparklineData={[95, 96, 97, 98, 98, healthScore]}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          gap: 3,
          mb: 4,
        }}
      >
        <SectionCard
          title="User Growth Trends"
          subtitle="Last 6 months overview"
          action={
            <Chip
              icon={<TrendingUp size={14} />}
              label="+27% vs last period"
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${COLORS.success}, #059669)`,
                color: "#fff",
                fontWeight: 600,
              }}
            />
          }
          delay={0.2}
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={userTrendData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
              <YAxis stroke={theme.palette.text.secondary} />
              <RechartsTooltip
                contentStyle={{
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="users" stroke={COLORS.blue} strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" name="Total Users" />
              <Area type="monotone" dataKey="active" stroke={COLORS.success} strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" name="Active Users" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          title="Role Distribution"
          subtitle="User roles breakdown"
          action={
            <Chip
              icon={<PieChartIcon size={14} />}
              label={`${roleChartData.length} Roles`}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${COLORS.purple}, #6d28d9)`,
                color: "#fff",
                fontWeight: 600,
              }}
            />
          }
          delay={0.25}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={roleChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {roleChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </Box>

      <Box sx={{ mb: 4 }}>
        <SectionCard
          title="Church Member Statistics"
          subtitle="Comparison across all churches"
          action={
            <Chip
              icon={<BarChart3 size={14} />}
              label={`${churchChartData.length} Churches`}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${COLORS.gold}, #d97706)`,
                color: "#fff",
                fontWeight: 600,
              }}
            />
          }
          delay={0.3}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={churchChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
              <YAxis stroke={theme.palette.text.secondary} />
              <RechartsTooltip
                contentStyle={{
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                }}
              />
              <Legend />
              <Bar dataKey="members" fill={COLORS.blue} radius={[8, 8, 0, 0]} name="Total Members" />
              <Bar dataKey="users" fill={COLORS.gold} radius={[8, 8, 0, 0]} name="Registered Users" />
              <Bar dataKey="active" fill={COLORS.success} radius={[8, 8, 0, 0]} name="Active Members" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
        <Box>
          <SectionCard title="Church Details" subtitle="Comprehensive member statistics" delay={0.35}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Church Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Members</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Users</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Active</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(userAnalytics.usersByChurch || []).map((church, index) => {
                    const activeRate = church.members ? ((church.active_members / church.members) * 100).toFixed(1) : "0.0";
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          transition: "all 0.2s ease",
                          "&:hover": {
                            background: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {church.church_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={church.members}
                            size="small"
                            sx={{
                              background: alpha(COLORS.blue, 0.1),
                              color: COLORS.blue,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={church.users}
                            size="small"
                            sx={{
                              background: alpha(COLORS.gold, 0.1),
                              color: COLORS.gold,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={church.active_members}
                            size="small"
                            sx={{
                              background: alpha(COLORS.success, 0.1),
                              color: COLORS.success,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={parseFloat(activeRate)}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                background: alpha(COLORS.success, 0.1),
                                "& .MuiLinearProgress-bar": {
                                  background: `linear-gradient(90deg, ${COLORS.success}, #059669)`,
                                  borderRadius: 3,
                                },
                              }}
                            />
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              {activeRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <Box sx={{ mt: 3 }}>
            <SectionCard
              title="Recent Activity"
              subtitle="Latest system events and audit logs"
              action={
                <Badge badgeContent={auditLogs.length} color="primary">
                  <Chip
                    icon={<Activity size={14} />}
                    label="Live"
                    size="small"
                    sx={{
                      background: alpha(COLORS.success, 0.1),
                      color: COLORS.success,
                      fontWeight: 600,
                    }}
                  />
                </Badge>
              }
              delay={0.4}
            >
              <Stack spacing={0} divider={<Divider />}>
                <AnimatePresence>
                  {auditLogs.map((log, index) => {
                    const icons = {
                      user_created: Users,
                      role_updated: Shield,
                      church_added: Church,
                      permission_changed: BadgeCheck,
                      user_login: CheckCircle,
                    };
                    const colors = {
                      user_created: COLORS.blue,
                      role_updated: COLORS.purple,
                      church_added: COLORS.gold,
                      permission_changed: COLORS.success,
                      user_login: "#06b6d4",
                    };
                    const Icon = icons[log.action] || Activity;
                    const iconColor = colors[log.action] || COLORS.blue;

                    return (
                      <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                        <Box
                          sx={{
                            py: 2,
                            px: 1,
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            transition: "all 0.2s ease",
                            borderRadius: 2,
                            "&:hover": {
                              background: alpha(theme.palette.primary.main, 0.03),
                              transform: "translateX(8px)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: alpha(iconColor, 0.1),
                              border: `1px solid ${alpha(iconColor, 0.2)}`,
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={20} color={iconColor} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                              {log.action.replace("_", " ").toUpperCase()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {log.details}
                            </Typography>
                          </Box>
                          <Chip icon={<Clock size={12} />} label={new Date(log.timestamp).toLocaleDateString()} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                        </Box>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </Stack>
            </SectionCard>
          </Box>
        </Box>

        <Box>
          <Stack spacing={3}>
            <SectionCard title="System Health Monitor" subtitle="Real-time performance metrics" delay={0.25}>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <motion.div variants={pulseVariants} animate="pulse">
                  <Box
                    sx={{
                      width: 140,
                      height: 140,
                      borderRadius: "50%",
                      background: `conic-gradient(${COLORS.success} ${healthScore * 3.6}deg, ${alpha(COLORS.success, 0.1)} 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 2,
                      boxShadow: `0 8px 32px ${alpha(COLORS.success, 0.3)}`,
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: 8,
                        borderRadius: "50%",
                        background: theme.palette.background.paper,
                      },
                    }}
                  >
                    <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                      <Typography variant="h2" fontWeight={800} sx={{ color: COLORS.success }}>
                        {healthScore}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        Health Score
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
                <Chip
                  icon={<Zap size={14} />}
                  label="Excellent Performance"
                  sx={{
                    background: `linear-gradient(135deg, ${COLORS.success}, #059669)`,
                    color: "#fff",
                    fontWeight: 700,
                  }}
                />
              </Box>

              <Stack spacing={2}>
                {[
                  { label: "Database Connections", value: systemHealth.databaseConnections, color: "primary", icon: Database },
                  { label: "Active Sessions", value: systemHealth.activeSessions, color: "success", icon: Users },
                  { label: "Recent Errors", value: systemHealth.recentErrors, color: "error", icon: AlertCircle },
                ].map((item, index) => (
                  <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + index * 0.1 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: alpha(theme.palette[item.color].main, 0.05),
                        border: `1px solid ${alpha(theme.palette[item.color].main, 0.1)}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          transform: "translateX(4px)",
                          boxShadow: `0 4px 12px ${alpha(theme.palette[item.color].main, 0.15)}`,
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: alpha(theme.palette[item.color].main, 0.1),
                          }}
                        >
                          <item.icon size={16} color={theme.palette[item.color].main} />
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.label}
                        </Typography>
                      </Box>
                      <Chip label={item.value || 0} size="small" color={item.color} sx={{ fontWeight: 700 }} />
                    </Box>
                  </motion.div>
                ))}
              </Stack>
            </SectionCard>

            <SectionCard
              title="Data Quality Alerts"
              subtitle="Records requiring attention"
              action={
                <Badge badgeContent={missingInfo.reduce((sum, item) => sum + item.count, 0)} color="warning">
                  <AlertCircle size={20} color={COLORS.warning} />
                </Badge>
              }
              delay={0.35}
            >
              <Stack spacing={2}>
                {missingInfo.map((item, index) => (
                  <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + index * 0.05 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: alpha(COLORS.warning, 0.05),
                        border: `1px solid ${alpha(COLORS.warning, 0.2)}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "translateX(4px)",
                          background: alpha(COLORS.warning, 0.08),
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                          {item.type.replace("_", " ").toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Click to view and fix
                        </Typography>
                      </Box>
                      <Chip
                        label={item.count}
                        size="medium"
                        sx={{
                          background: `linear-gradient(135deg, ${COLORS.warning}, #d97706)`,
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "1rem",
                          height: 36,
                          minWidth: 50,
                        }}
                      />
                    </Box>
                  </motion.div>
                ))}
              </Stack>

              <Button
                fullWidth
                variant="contained"
                startIcon={<CheckCircle size={18} />}
                sx={{
                  mt: 2,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${COLORS.warning}, #d97706)`,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  boxShadow: `0 4px 12px ${alpha(COLORS.warning, 0.3)}`,
                  "&:hover": {
                    background: `linear-gradient(135deg, #d97706, ${COLORS.warning})`,
                    boxShadow: `0 6px 20px ${alpha(COLORS.warning, 0.4)}`,
                  },
                }}
              >
                Review All Issues
              </Button>
            </SectionCard>

            <SectionCard title="Notifications" subtitle="Latest system notifications" delay={0.4}>
              <NotificationWidget role="admin" limit={6} onViewAll={() => navigate("/notifications")} />
            </SectionCard>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ mt: 3, mb: 4, width: "100%" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, alignItems: "stretch", gridAutoRows: "1fr", width: "100%" }}>
          <SectionCard title="Quick Actions" subtitle="Frequently used tools" delay={0.45}>
            <Stack spacing={1.5}>
              {[
                { icon: "Churches & Lookups", href: "/lookups", color: COLORS.blue },
                { icon: "Permissions", href: "/permissions", color: COLORS.purple },
                { icon: "Analytics", href: "/reports", color: COLORS.success },
                { icon: "Data Export", href: "/exports", color: COLORS.gold },
              ].map((action, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + index * 0.05 }}>
                  <Button
                    fullWidth
                    variant={index === 0 ? "contained" : "outlined"}
                    onClick={() => navigate(action.href)}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: "0.95rem",
                      ...(index === 0
                        ? {
                            background: `linear-gradient(135deg, ${action.color}, ${alpha(action.color, 0.8)})`,
                            color: "#fff",
                            boxShadow: `0 4px 12px ${alpha(action.color, 0.3)}`,
                            "&:hover": {
                              background: `linear-gradient(135deg, ${alpha(action.color, 0.9)}, ${action.color})`,
                              boxShadow: `0 6px 20px ${alpha(action.color, 0.4)}`,
                            },
                          }
                        : {
                            borderWidth: 2,
                            borderColor: alpha(action.color, 0.3),
                            color: action.color,
                            "&:hover": {
                              borderWidth: 2,
                              borderColor: action.color,
                              background: alpha(action.color, 0.05),
                            },
                          }),
                    }}
                  >
                    {action.icon}
                  </Button>
                </motion.div>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Active Tasks" subtitle="Pending requests and tasks" delay={0.5}>
            <Stack spacing={1.5}>
              {tasks.map((task, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.description || "No description"}
                    </Typography>
                  </Box>
                  <Chip label={task.status} size="small" color={task.status === "open" ? "warning" : "info"} />
                </Box>
              ))}
              {tasks.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "left", py: 1 }}>
                  No active tasks
                </Typography>
              )}
            </Stack>
          </SectionCard>

          <SectionCard title="Database Storage" subtitle="Largest tables by size" delay={0.55}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {diskUsage.map((table, index) => (
                <Chip
                  key={index}
                  label={`${table.tablename} • ${table.size}`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: alpha(COLORS.blue, 0.08),
                    color: COLORS.blue,
                    border: `1px solid ${alpha(COLORS.gold, 0.35)}`
                  }}
                />
              ))}
              {diskUsage.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                  No storage data
                </Typography>
              )}
            </Box>
          </SectionCard>
        </Box>
      </Box>
    </Container>
  );
};

export default function Dashboard() {
  return <AdminDashboard />;
}
