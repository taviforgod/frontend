import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { getUsers, getRoles as getUserRoles } from "../../services/userService";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  useTheme,
} from "@mui/material";

import { Add, UserCheck, UserPlus } from "lucide-react";

import AssignRolesDialog from "../../components/RBAC/AssignRolesDialog";
import SnackbarAlert from "../../Shared/SnackbarAlert";

export default function UsersPage() {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [rolesMap, setRolesMap] = useState({});
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Assign dialog
  const [assignDialog, setAssignDialog] = useState({ open: false, user: null });

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const usersList = await getUsers();
        setUsers(usersList);

        const rolesData = await Promise.all(
          usersList.map(async (user) => {
            try {
              const roles = await getUserRoles(user.id);
              return [
                user.id,
                roles.length > 0
                  ? roles.map((r) => r.name).join(", ")
                  : "No roles assigned",
              ];
            } catch {
              return [user.id, "Failed to load roles"];
            }
          })
        );
        setRolesMap(Object.fromEntries(rolesData));
      } catch (err) {
        setSnackbar({ open: true, message: err.message, severity: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [assignDialog.open]);

  // Pagination handlers
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status ? u.status === status : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box p={{ xs: 2, md: 4 }} maxWidth="1200px" mx="auto" bgcolor="#f9fafb">
      {/* Filters/Search/Add User Card */}
      <Card
        elevation={5}
        sx={{
          mb: 4,
          borderRadius: 3,
          px: { xs: 3, sm: 5 },
          py: { xs: 2.5, sm: 3.5 },
          bgcolor: "white",
          boxShadow:
            "0 4px 12px rgb(0 0 0 / 0.05), 0 1px 3px rgb(0 0 0 / 0.1)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <TextField
            label="Search by name or email"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flex: "1 1 300px", minWidth: 250 }}
          />

          <Select
            size="small"
            displayEmpty
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ flex: "0 0 160px" }}
            aria-label="Filter by status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>

          <Button
            variant="contained"
            startIcon={<UserPlus size={18} />}
            onClick={() => setAddUserDialogOpen(true)}
            sx={{
              height: 42,
              whiteSpace: "nowrap",
              fontWeight: 600,
              textTransform: "none",
              bgcolor: theme.palette.primary.main,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            Add User
          </Button>
        </Stack>
      </Card>

      {/* User Cards Grid */}
      <Box mb={3}>
        <Typography
          variant="h3"
          component="h1"
          fontWeight={700}
          color={theme.palette.primary.main}
          sx={{
            position: "relative",
            display: "inline-block",
            pb: 1,
            mb: 1,
            letterSpacing: "0.02em",
          }}
        >
          User Management
          <Box
            component="span"
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: 4,
              width: 60,
              bgcolor: theme.palette.primary.main,
              borderRadius: 2,
            }}
          />
        </Typography>
      </Box>

      {loading ? (
        <Box
          sx={{
            width: "100%",
            minHeight: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : filteredUsers.length === 0 ? (
        <Paper
          elevation={5}
          sx={{
            borderRadius: 4,
            p: 6,
            textAlign: "center",
            color: theme.palette.text.secondary,
            fontStyle: "italic",
            bgcolor: theme.palette.mode === "dark" ? "#222" : "white",
          }}
        >
          No users found.
        </Paper>
      ) : (
        <Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              },
              gap: 3,
            }}
          >
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((u) => (
                <Card
                  key={u.id}
                  elevation={4}
                  sx={{
                    minWidth: 0,
                    minHeight: 210,
                    borderRadius: 3,
                    bgcolor: theme.palette.mode === "dark" ? "#181c24" : "white",
                    color: theme.palette.text.primary,
                    boxShadow:
                      "0 4px 12px rgb(0 0 0 / 0.05), 0 1px 3px rgb(0 0 0 / 0.1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "box-shadow 0.2s",
                    "&:hover": {
                      boxShadow:
                        "0 8px 24px rgb(0 0 0 / 0.10), 0 2px 6px rgb(0 0 0 / 0.15)",
                    },
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={theme.palette.primary.dark}
                      gutterBottom
                      sx={{ wordBreak: "break-all" }}
                    >
                      {u.name || "N/A"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, wordBreak: "break-all" }}
                    >
                      {u.email}
                    </Typography>
                    <Chip
                      label={u.status || "Unknown"}
                      color={
                        u.status === "active"
                          ? "success"
                          : u.status === "inactive"
                          ? "default"
                          : "warning"
                      }
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: "0.03em",
                        mb: 1,
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : undefined,
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontStyle: "italic",
                        maxWidth: 250,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        mb: 1,
                      }}
                      title={rolesMap[u.id]}
                    >
                      {rolesMap[u.id] || "Loading..."}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      {u.created_at
                        ? new Date(u.created_at).toLocaleString()
                        : ""}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0, textAlign: "right" }}>
                    <Tooltip title={`Assign roles to ${u.email}`}>
                      <IconButton
                        color="primary"
                        onClick={() =>
                          setAssignDialog({ open: true, user: u })
                        }
                        aria-label={`Assign roles to ${u.email}`}
                        size="large"
                        sx={{
                          transition: "background-color 0.2s",
                          "&:hover": {
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? theme.palette.primary.dark
                                : theme.palette.primary.light,
                          },
                        }}
                      >
                        <UserCheck size={20} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              ))}
          </Box>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[6]}
            sx={{
              px: { xs: 0, sm: 3 },
              py: 1,
              mt: 2,
              bgcolor: theme.palette.mode === "dark" ? "#181c24" : "white",
              borderRadius: 2,
              ".MuiTablePagination-toolbar": {
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1,
              },
            }}
          />
        </Box>
      )}

      <AssignRolesDialog
        open={assignDialog.open}
        user={assignDialog.user}
        onClose={(success) => {
          setAssignDialog({ open: false, user: null });

          if (success === true) {
            setSnackbar({
              open: true,
              message: "Roles assigned successfully",
              severity: "success",
            });
          } else if (success === false) {
            setSnackbar({
              open: true,
              message: "Failed to assign roles",
              severity: "error",
            });
          }
        }}
      />

      {/* Add User Dialog placeholder */}

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        message={snackbar.message}
      />
    </Box>
  );
}
