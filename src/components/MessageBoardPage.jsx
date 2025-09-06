import React, { useEffect, useState, useContext } from 'react';
import { Box, Paper, TextField, Button, List, ListItem, ListItemText, Divider, Select, MenuItem } from '@mui/material';
import { listBoards, listMessages, postMessage } from '../services/messageboardService';
import { AuthContext } from '../contexts/AuthContext';

export default function MessageBoardPage() {
  const { user } = useContext(AuthContext);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const b = await listBoards();
        setBoards(b || []);
        if (b && b.length) setSelectedBoard(b[0].id);
      } catch (err) { console.error(err); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBoard) return;
    loadMessages();
  }, [selectedBoard]);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await listMessages(selectedBoard, { page:0, limit:100 });
      setMessages(res.messages || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handlePost() {
    if (!content.trim()) return;
    try {
      await postMessage(selectedBoard, content);
      setContent('');
      await loadMessages();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to post');
    }
  }

  return (
    <Box sx={{ mt:3 }}>
      <Paper sx={{ p:2 }}>
        <Box sx={{ display:'flex', gap:2, alignItems:'center', mb:2 }}>
          <Select value={selectedBoard || ''} onChange={(e)=>setSelectedBoard(e.target.value)}>
            {boards.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </Select>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!user}>New message</Button>
        </Box>

        <Box sx={{ mb:2 }}>
          <TextField fullWidth multiline rows={3} value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Write a message..." />
          <Box sx={{ display:'flex', justifyContent:'flex-end', mt:1 }}>
            <Button onClick={handlePost} variant="contained">Post</Button>
          </Box>
        </Box>

        <Divider />

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {messages.map(m => (
            <ListItem key={m.id} alignItems="flex-start">
              <ListItemText primary={m.author_name || 'Unknown'} secondary={<><div style={{whiteSpace:'pre-wrap'}}>{m.content}</div><small>{new Date(m.created_at).toLocaleString()}</small></>} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
