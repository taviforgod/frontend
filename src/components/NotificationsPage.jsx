import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableRow, Button, Pagination } from '@mui/material';
import { getNotifications, markAllRead } from '../services/notificationsService';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => { load(); }, [page, limit]);

  async function load() {
    try {
      const data = await getNotifications({ page, limit });
      setNotifications(data.notifications || data);
      setTotal(data.total || (data.notifications && data.notifications.length) || 0);
    } catch (err) { console.error(err); }
  }

  async function doMarkAll() {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Paper sx={{ p:2 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
          <Typography variant="h5">Notifications</Typography>
          <Button variant="contained" onClick={doMarkAll}>Mark all read</Button>
        </Box>

        <Table size="small">
          <TableBody>
            {notifications.map(n => (
              <TableRow key={n.id} sx={{ background: n.read ? 'transparent' : 'rgba(0,120,212,0.03)' }}>
                <TableCell>{n.title}</TableCell>
                <TableCell>{n.message}</TableCell>
                <TableCell>{new Date(n.created_at).toLocaleString()}</TableCell>
                <TableCell>{n.read ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mt:2 }}>
          <Typography>{total} total</Typography>
          <Pagination page={page+1} count={Math.max(1, Math.ceil(total/limit))} onChange={(e,p)=>setPage(p-1)} />
        </Box>
      </Paper>
    </Box>
  );
}
