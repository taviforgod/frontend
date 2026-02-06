import React, { useContext, useEffect, useState } from "react";
import NotificationContext from "../contexts/NotificationContext";
import {
  Paper, Typography, List, ListItem, ListItemText, Button, TextField
} from "@mui/material";

export default function UserDigestHistory() {
  const [digests, setDigests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const { getNotifications, markAsRead } = useContext(NotificationContext);

  async function loadHistory() {
    setLoading(true);
    try {
      const params = { limit: 50, channel: 'email' };
      if (filterDate) params.q = filterDate;
      const data = typeof getNotifications === 'function'
        ? await getNotifications(params)
        : [];
      const items = Array.isArray(data) ? data : (data?.notifications ?? []);
      setDigests(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHistory(); }, [filterDate]);

  return (
    <Paper sx={{ p: 2, mt: 4 }}>
      <Typography variant="h5">My Digest History</Typography>
      <TextField
        label="Filter by Date (YYYY-MM-DD)"
        size="small"
        variant="outlined"
        sx={{ mt: 2, mb: 2 }}
        value={filterDate}
        onChange={e => setFilterDate(e.target.value)}
      />
      <Button variant="outlined" sx={{ ml: 1 }} onClick={loadHistory}>Filter</Button>
      <List>
        {loading ? <ListItem>Loading...</ListItem> :
          digests.length === 0 ? <ListItem>No digests found.</ListItem> :
            digests.map(d =>
              <ListItem key={d.id} secondaryAction={
                <Button onClick={async () => { if (typeof markAsRead === 'function') { await markAsRead(d.id); } await loadHistory(); }}>
                  Mark Read
                </Button>
              }>
                <ListItemText
                  primary={<b>{d.title}</b>}
                  secondary={<>
                    <span>{(d.message || '').substring(0, 100)}...</span><br />
                    {d.created_at ? new Date(d.created_at).toLocaleString() : null}
                  </>}
                />
              </ListItem>
            )
        }
      </List>
    </Paper>
  );
}