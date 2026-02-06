// frontend/src/components/ContactKanban.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef, useContext } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Stack,
  Paper,
  IconButton,
  Divider,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
  Button,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DateTime } from "luxon";
import { listContacts, updateContactStatus } from "../services/evangelismService";
import { MoreHorizontal, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext"; 

const STATUSES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "in_progress", label: "In Progress" },
  { id: "discipled", label: "Discipled" },
  { id: "closed", label: "Closed" },
];

function getInitials(first, last) {
  if (!first && !last) return "?";
  return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase();
}
function formatLastContact(dateStr) {
  if (!dateStr) return "Never";
  try {
    const dt = DateTime.fromJSDate(new Date(dateStr));
    if (!dt.isValid) return dateStr;
    return dt.toFormat("MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

const ContactCard = React.memo(
  React.forwardRef(function ContactCard(
    {
      contact,
      isSelected,
      onSelect,
      providedPropsStyle,
      snapshotDragging,
      isCompact = false,
      ...rest
    },
    ref
  ) {
    return (
      <Card
        ref={ref}
        elevation={snapshotDragging ? 12 : 2}
        tabIndex={0}
        role="button"
        aria-pressed={!!isSelected}
        onClick={() => onSelect(contact.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(contact.id);
          }
        }}
        sx={{
          mb: 1,
          borderRadius: 2,
          cursor: snapshotDragging ? "grabbing" : "grab",
          userSelect: "none",
          background: isSelected
            ? "linear-gradient(90deg, rgba(79,70,229,0.06), rgba(255,255,255,1))"
            : "#fff",
          outline: isSelected ? "2px solid rgba(79,70,229,0.18)" : "none",
          willChange: "transform",
        }}
        style={{
          ...providedPropsStyle,
          transform: providedPropsStyle?.transform,
        }}
        {...rest}
      >
        <CardContent sx={{ py: isCompact ? 0.75 : 1, px: isCompact ? 1 : 1.25 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar sx={{ width: isCompact ? 36 : 44, height: isCompact ? 36 : 44, bgcolor: "#efe6ff", color: "#4b2fbf", fontSize: isCompact ? 14 : 16 }}>
                {getInitials(contact.first_name, contact.surname)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant={isCompact ? "subtitle2" : "subtitle2"} noWrap sx={{ fontWeight: 700, fontSize: isCompact ? "0.9rem" : undefined }}>
                  {contact.first_name} {contact.surname}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: isCompact ? "0.7rem" : undefined }}>
                  {contact.email || contact.phone || "No contact"}
                </Typography>
                <Stack direction="row" spacing={0.5} mt={0.5} alignItems="center">
                  {contact.source && <Chip label={contact.source} size="small" sx={{ height: 22 }} />}
                  {contact.interest && <Chip label={contact.interest} size="small" color="primary" sx={{ height: 22 }} />}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: isCompact ? "0.67rem" : undefined }}>
                    • Last: {formatLastContact(contact.last_contact_date)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title={contact.phone ? "Call" : "No phone"}>
                <span>
                  <IconButton
                    size={isCompact ? "small" : "small"}
                    disabled={!contact.phone}
                    onClick={(e) => {
                      e.stopPropagation();
                      contact.phone && window.open(`tel:${contact.phone}`);
                    }}
                    aria-label="call"
                  >
                    <Phone size={14} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={contact.email ? "Email" : "No email"}>
                <span>
                  <IconButton
                    size={isCompact ? "small" : "small"}
                    disabled={!contact.email}
                    onClick={(e) => {
                      e.stopPropagation();
                      contact.email && window.open(`mailto:${contact.email}`);
                    }}
                    aria-label="email"
                  >
                    <Mail size={14} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  })
);

export default function ContactKanban() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [selectedId, setSelectedId] = useState(null);
  const [compact, setCompact] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const inFlightRef = useRef(false);

  // Defensive dedupe similar to ContactList
  const uniqueContacts = useMemo(() => {
    if (!Array.isArray(contacts) || contacts.length === 0) return [];
    const normalizePhone = (p = '') => (String(p || '') || '').replace(/\D/g, '').replace(/^\+/, '');
    const keyFor = (c) => {
      const phone = normalizePhone(c.phone || c.whatsapp);
      if (phone) return `p:${phone}`;
      if (c.email) return `e:${String(c.email).toLowerCase().trim()}`;
      const name = `${(c.first_name||'').toLowerCase().trim()} ${(c.surname||'').toLowerCase().trim()}`.trim();
      const area = (c.area || '').toLowerCase().trim();
      return `n:${name}|${area}`;
    };

    const statusPriority = {
      member: 6,
      visitor: 5,
      converted: 5,
      interested: 4,
      'follow-up': 3,
      'follow_up': 3,
      contacted: 3,
      'in_progress': 2,
      'discipled': 2,
      closed: 1,
      new: 0
    };

    const map = new Map();
    contacts.forEach(c => {
      try {
        const key = keyFor(c);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, c);
          return;
        }

        const a = existing;
        const b = c;
        const ap = statusPriority[(a.status||'').toLowerCase()] || 0;
        const bp = statusPriority[(b.status||'').toLowerCase()] || 0;

        if (bp > ap) {
          map.set(key, b);
          return;
        }
        if (bp < ap) return;

        // tie-breaker = most recent contact_date
        const at = a.last_contact_date ? Date.parse(a.last_contact_date) : 0;
        const bt = b.last_contact_date ? Date.parse(b.last_contact_date) : 0;
        if (bt > at) map.set(key, b);
      } catch (e) {
        const k = `id:${c.id}`;
        if (!map.get(k)) map.set(k, c);
      }
    });

    const out = Array.from(map.values());
    if (out.length !== contacts.length) console.warn('ContactKanban: deduped contacts', { before: contacts.length, after: out.length });
    return out;
  }, [contacts]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isCompactMode = compact || isMobile;

  const auth = useContext(AuthContext);
  const fetchWithAuth = typeof auth?.fetchWithAuth === "function" ? auth.fetchWithAuth : undefined;

  // inject small CSS improving drag behavior (body class, z-index for previews, etc.)
  useEffect(() => {
    const id = "kanban-dnd-fixes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
        /* prevent text selection while dragging */
        .kanban-is-dragging, .kanban-is-dragging * { user-select: none !important; -webkit-user-select: none !important; }
        /* ensure the drag preview floats above other UI */
        .kanban-drag-preview { z-index: 4000 !important; pointer-events: none !important; }
        /* help touch devices (allow vertical scroll) */
        .kanban-column { touch-action: pan-y; -webkit-user-drag: none; }
        /* mobile: ensure columns are full width when stacked */
        @media (max-width: 600px) {
          .kanban-column { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {};
  }, []);

  // load list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = fetchWithAuth
          ? await listContacts(fetchWithAuth)
          : await listContacts();
        if (!mounted) return;
        setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load contacts");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchWithAuth]);

  // group unique contacts by status as a stable map
  const grouped = useMemo(() => {
    const map = {};
    STATUSES.forEach((s) => (map[s.id] = []));
    uniqueContacts.forEach((c) => {
      const s = c.status || "new";
      if (!map[s]) map[s] = [];
      map[s].push(c);
    });
    return map;
  }, [uniqueContacts]);

  // helper: reorder array
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // update local data structure after drag
  const updateLocalAfterDrag = useCallback((source, destination, draggableId) => {
    const from = source.droppableId;
    const to = destination.droppableId;
    const fromList = Array.from(grouped[from] || []);
    const toList = Array.from(grouped[to] || []);
    const item = fromList.find((c) => String(c.id) === String(draggableId));
    if (!item) return;

    fromList.splice(source.index, 1);
    toList.splice(destination.index, 0, { ...item, status: to });

    const other = contacts.filter((c) => c.status !== from && c.status !== to);
    const merged = [
      ...other,
      ...fromList,
      ...toList,
    ];
    setContacts(merged);
  }, [grouped, contacts]);

  // optimistic set status
  const setStatusOptimistic = useCallback((id, newStatus) => {
    setContacts((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, status: newStatus } : c)));
  }, []);

  // drag start: add body class + cursor
  const onDragStart = useCallback((start) => {
    document.body.classList.add("kanban-is-dragging");
    document.body.style.cursor = "grabbing";
  }, []);

  // drag end: remove body class + cursor and handle reorder/move
  const onDragEnd = useCallback(async (result) => {
    document.body.classList.remove("kanban-is-dragging");
    document.body.style.cursor = "";

    const { source, destination, draggableId } = result;
    if (!destination) return;

    // same column reorder (local only)
    if (source.droppableId === destination.droppableId) {
      const status = source.droppableId;
      const list = grouped[status] || [];
      const reordered = reorder(list, source.index, destination.index);
      setContacts((prev) => {
        const others = prev.filter((c) => c.status !== status);
        return [...others, ...reordered];
      });
      return;
    }

    // cross-column move: optimistic
    const id = draggableId;
    const newStatus = destination.droppableId;
    const previous = contacts;
    setStatusOptimistic(id, newStatus);
    updateLocalAfterDrag(source, destination, id);

    if (inFlightRef.current) {
      // allow optimistic update, but don't queue multiple calls
    }
    inFlightRef.current = true;
    try {
      await updateContactStatus(fetchWithAuth, id, newStatus);
      setSnack({ open: true, message: "Status updated", severity: "success" });
    } catch (err) {
      console.error(err);
      setContacts(previous); // rollback
      setSnack({ open: true, message: "Failed to update status", severity: "error" });
    } finally {
      inFlightRef.current = false;
    }
  }, [grouped, contacts, setStatusOptimistic, updateLocalAfterDrag, fetchWithAuth]);

  // keyboard controls: move selected card left/right
  useEffect(() => {
    const handler = async (e) => {
      if (!selectedId) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const sel = contacts.find((c) => String(c.id) === String(selectedId));
        if (!sel) return;
        const idx = STATUSES.findIndex((s) => s.id === sel.status);
        if (idx === -1) return;
        const delta = e.key === "ArrowLeft" ? -1 : 1;
        const newIdx = Math.max(0, Math.min(STATUSES.length - 1, idx + delta));
        if (newIdx === idx) return;
        const newStatus = STATUSES[newIdx].id;
        const previous = contacts;
        setStatusOptimistic(selectedId, newStatus);
        try {
          await updateContactStatus(fetchWithAuth, selectedId, newStatus);
          setSnack({ open: true, message: `Moved to ${STATUSES[newIdx].label}`, severity: "success" });
        } catch (err) {
          console.error(err);
          setContacts(previous);
          setSnack({ open: true, message: "Failed to move", severity: "error" });
        }
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, contacts, setStatusOptimistic, fetchWithAuth]);

  // toggle collapse for a column
  const toggleCollapse = (statusId) => {
    setCollapsed((prev) => ({ ...prev, [statusId]: !prev[statusId] }));
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Contacts Kanban</Typography>
          <FormControlLabel
            control={<Switch checked={compact} onChange={(e) => setCompact(e.target.checked)} />}
            label="Compact"
          />
          <Button size="small" onClick={() => { setSelectedId(null); setContacts((c) => [...c]); }}>
            Refresh
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">Select a card and use ← / → to move it</Typography>
      </Box>

      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: isMobile ? "visible" : "auto",
            py: 1,
            px: 1,
            height: isMobile ? "auto" : (compact ? "calc(100vh - 160px)" : "calc(100vh - 200px)"),
            alignItems: "stretch",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {STATUSES.map((status) => {
            const items = grouped[status.id] || [];
            const isCollapsed = !!collapsed[status.id];
            return (
              <Droppable droppableId={status.id} key={status.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="kanban-column"
                    sx={{
                      flex: isMobile ? "1 1 auto" : "0 0 300px",
                      width: isMobile ? "100%" : undefined,
                      minWidth: isMobile ? 0 : 240,
                      maxWidth: isMobile ? "100%" : 360,
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: snapshot.isDraggingOver ? "rgba(79,70,229,0.03)" : "transparent",
                      borderRadius: 2,
                      p: 1,
                    }}
                  >
                    <Paper elevation={0} sx={{ p: 1, borderRadius: 2, mb: 1, position: "sticky", top: isMobile ? 56 : 8, zIndex: 20 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{status.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <IconButton size="small" onClick={() => toggleCollapse(status.id)} aria-label={`toggle ${status.label}`}>
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                          </IconButton>
                          <Tooltip title="Column options"><IconButton size="small"><MoreHorizontal size={16} /></IconButton></Tooltip>
                        </Stack>
                      </Box>
                    </Paper>
                    {!isCollapsed ? (
                      <Box
                        sx={{
                          flex: 1,
                          overflowY: isMobile ? "visible" : "auto",
                          p: 0.5,
                          borderRadius: 2,
                          minHeight: 40,
                          maxHeight: isMobile ? "none" : "calc(100vh - 320px)",
                        }}
                      >
                        {items.length === 0 ? (
                          <Box sx={{ py: 2, px: 1 }}>
                            <Typography variant="body2" color="text.secondary">No contacts</Typography>
                          </Box>
                        ) : (
                          items.map((contact, index) => (
                            <Draggable key={String(contact.id)} draggableId={String(contact.id)} index={index}>
                              {(provided, snapshot) => {
                                const providedStyle = provided.draggableProps.style || {};
                                return (
                                  <ContactCard
                                    ref={provided.innerRef}
                                    contact={contact}
                                    isSelected={String(selectedId) === String(contact.id)}
                                    onSelect={(id) => setSelectedId((prev) => (String(prev) === String(id) ? null : id))}
                                    providedPropsStyle={providedStyle}
                                    snapshotDragging={snapshot.isDragging}
                                    isCompact={isCompactMode}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  />
                                );
                              }}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </Box>
                    ) : (
                      <Box sx={{ py: 2, px: 1 }}><Typography variant="body2" color="text.secondary">Collapsed</Typography></Box>
                    )}
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                )}
              </Droppable>
            );
          })}
        </Box>
      </DragDropContext>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
