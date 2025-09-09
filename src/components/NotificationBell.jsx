import React, { useContext, useEffect, useState, useRef } from 'react';
import { IconButton, Badge, Menu, List, ListItem, ListItemText, Button, Avatar } from '@mui/material';
import { Bell, Check } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { getNotifications, markRead } from '../services/notificationsService';

const WS_URL = process.env.REACT_APP_WS_URL || (process.env.REACT_APP_API_URL || 'http://localhost:5000');

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notes, setNotes] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    load();
    const socket = io(WS_URL, { withCredentials: true, transports: ['websocket','polling'] });
    socketRef.current = socket;
    socket.on('notification', (payload) => {
      setNotes(prev => [payload, ...prev]);
      setUnread(u => u + (payload.read ? 0 : 1));
    });
    return () => { try { socket.disconnect(); socket.off(); } catch (e) {} };
  }, [user]);

  async function load() {
    try {
      const data = await getNotifications({ page:0, limit:50 });
      const list = data.notifications || data;
      setNotes(list);
      setUnread(list.filter(n => !n.read).length);
    } catch (err) { console.error(err); }
  }

  async function doMarkRead(n) {
    try {
      await markRead(n.id);
      setNotes(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(prev => Math.max(0, prev - (n.read ? 0 : 1)));
    } catch (err) { console.error(err); }
  }

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unread} color="error"><Bell size={18} /></Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <List sx={{ width: 360, maxWidth: '100%', maxHeight: 480, overflow: 'auto' }}>
          {notes.length === 0 && <ListItem><ListItemText primary="No notifications" /></ListItem>}
          {notes.map(n => (
            <ListItem key={n.id} divider secondaryAction={<Button size="small" onClick={() => doMarkRead(n)}><Check size={14} /></Button>}>
              <Avatar sx={{ mr:1 }}>{(n.metadata?.sender_name||'S')[0]}</Avatar>
              <ListItemText primary={n.title} secondary={n.message} />
            </ListItem>
          ))}
        </List>
      </Menu>
    </>
  );
}
