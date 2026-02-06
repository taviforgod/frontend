import React, { useEffect, useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Card,
  LinearProgress,
  Chip,
  Collapse,
  Tooltip,
  Stack,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
  ExpandLess,
  Star,
  EmojiEvents,
  Close as CloseIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";
import {
  getMilestoneTemplates,
  getMilestoneRecords,
} from "../../services/leadershipService";
import { AuthContext } from "../../contexts/AuthContext";

export default function LeadershipMilestonesModal({ memberId, open, onClose }) {
  const [template, setTemplate] = useState([]);
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const { fetchWithAuth } = useContext(AuthContext);

  useEffect(() => {
    if (open) {
      const loadTemplates = async () => {
        try {
          const data = fetchWithAuth
            ? await getMilestoneTemplates(fetchWithAuth)
            : await getMilestoneTemplates();
          setTemplate(data || []);
        } catch {
          setTemplate([]);
        }
      };
      loadTemplates();
    }
  }, [open, fetchWithAuth]);

  useEffect(() => {
    if (open && memberId) {
      const loadRecords = async () => {
        try {
          const data = fetchWithAuth
            ? await getMilestoneRecords(fetchWithAuth, memberId)
            : await getMilestoneRecords(memberId);
          setRecords(data || []);
        } catch {
          setRecords([]);
        }
      };
      loadRecords();
    }
  }, [open, memberId, fetchWithAuth]);

  const milestones = template.map((tpl) => {
    const record = records.find((r) => r.milestone_name === tpl.name);
    return {
      id: tpl.id,
      milestone_name: tpl.name,
      notes: record?.notes || "",
      completed_at: record?.completed_at || null,
    };
  });

  const completedCount = milestones.filter((m) => m.completed_at).length;
  const progress =
    milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const nextMilestone = milestones.find((m) => !m.completed_at);

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getBadge = () => {
    if (progress === 100) return { label: "Gold", color: "#FFD700", emoji: "🥇" };
    if (progress >= 50) return { label: "Silver", color: "#C0C0C0", emoji: "🥈" };
    if (progress >= 25) return { label: "Bronze", color: "#CD7F32", emoji: "🥉" };
    return null;
  };

  const badge = getBadge();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Leadership Milestones
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 1, sm: 2, md: 3 }, height: "calc(100vh - 64px)", overflow: "auto" }}>
        <Box sx={{ mt: 1 }}>
          <Card
            sx={{
              borderRadius: 4,
              p: 2,
              background: "linear-gradient(135deg, #1976d2, #42a5f5)",
              color: "white",
              textAlign: "center",
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {completedCount === milestones.length && milestones.length > 0
                ? "🎉 Congratulations! You’ve completed all leadership milestones."
                : `🔥 You’re ${milestones.length - completedCount} step${
                    milestones.length - completedCount > 1 ? "s" : ""
                  } away from becoming a Leader`}
            </Typography>

            {nextMilestone && (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Next: <strong>{nextMilestone.milestone_name}</strong>
              </Typography>
            )}

            {badge && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Tooltip title={`${badge.label} Achievement`}>
                  <EmojiEvents sx={{ fontSize: 36, color: badge.color, mr: 1 }} />
                </Tooltip>
                <Typography variant="body1" fontWeight="600">
                  {badge.emoji} {badge.label} Milestone Unlocked!
                </Typography>
              </Box>
            )}
          </Card>

          <Card
            sx={{
              p: 3,
              borderRadius: 4,
              background: "linear-gradient(145deg, #fdfdfd, #fafafa)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="600">
                Leadership Journey
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedCount}/{milestones.length} Completed ({Math.round(progress)}%)
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mb: 3,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#f0f0f0",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 5,
                  backgroundColor: progress === 100 ? "#4caf50" : "#1976d2",
                  transition: "all 0.8s ease",
                },
              }}
            />

            <Stack
              direction="row"
              alignItems="flex-start"
              spacing={3}
              sx={{
                overflowX: "auto",
                width: "100%",
                pb: 2,
              }}
            >
              {milestones.map((milestone, index) => {
                const isCompleted = !!milestone.completed_at;
                const isNext = !isCompleted && milestone.id === nextMilestone?.id;

                return (
                  <Box
                    key={milestone.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 180,
                      position: "relative",
                      px: 1,
                    }}
                  >
                    {/* Connector line */}
                    {index < milestones.length - 1 && (
                      <Divider
                        orientation="horizontal"
                        flexItem
                        sx={{
                          position: "absolute",
                          top: 28,
                          right: -16,
                          width: 40,
                          borderColor: "#e0e0e0",
                          zIndex: 0,
                        }}
                      />
                    )}

                    <Box mb={1} zIndex={1}>
                      {isCompleted ? (
                        <CheckCircle color="success" />
                      ) : isNext ? (
                        <Star sx={{ color: "#1976d2" }} />
                      ) : (
                        <RadioButtonUnchecked color="disabled" />
                      )}
                    </Box>

                    <Typography
                      variant="subtitle2"
                      fontWeight={isNext ? "700" : "500"}
                      color={isNext ? "primary" : "inherit"}
                      align="center"
                      sx={{ minHeight: 32 }}
                    >
                      {milestone.milestone_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      {isCompleted
                        ? `Completed: ${milestone.completed_at.substring(0, 10)}`
                        : isNext
                        ? "Up Next"
                        : "Pending"}
                    </Typography>
                    <Chip
                      size="small"
                      label={isCompleted ? "Completed" : isNext ? "Next" : "Pending"}
                      color={isCompleted ? "success" : isNext ? "primary" : "default"}
                      sx={{ mt: 1 }}
                    />
                    {milestone.notes && (
                      <Box mt={1}>
                        <IconButton size="small" onClick={() => handleExpand(milestone.id)}>
                          <NotesIcon fontSize="small" />
                          {expandedId === milestone.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                        <Collapse in={expandedId === milestone.id}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, pl: 1, maxWidth: 160 }}
                          >
                            {milestone.notes}
                          </Typography>
                        </Collapse>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
