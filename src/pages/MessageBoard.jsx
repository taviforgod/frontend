import React, { useEffect, useState, useContext } from "react";
import { useMessageBoardService } from "../services/messageBoardService";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box, Paper, Typography, List, ListItem, ListItemText,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox
} from "@mui/material";
import NotificationContext from "../contexts/NotificationContext";

export default function MessageBoard() {
  const { getPosts, createPost, updatePost, deletePost } = useMessageBoardService();
  const notifCtx = useContext(NotificationContext);
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const { postId: routePostId } = useParams(); // optional route /message-board/:postId
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    title: "",
    content: "",
    starred: false,
    metadata: {},
    link: "",
    visibility: "public",
    target: "",
    notifyMembers: true,
    pinned: false
  });

  const loadPosts = async () => {
    try {
      const data = await getPosts({ limit: 50 });
      const list = data?.posts || data?.rows || data || [];
      setPosts(list);
      // if route param present, open that post
      if (routePostId) {
        const match = list.find(p => String(p.id) === String(routePostId));
        if (match) openDialog(match);
      } else {
        // support ?post= query param deep link
        const q = new URLSearchParams(location.search).get('post');
        if (q) {
          const match = list.find(p => String(p.id) === String(q));
          if (match) openDialog(match);
        }
      }
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const openDialog = (post) => {
    if (post) {
      setEditId(post.id);
      setForm({
        ...post,
        visibility: post.visibility || "public",
        target: post.target || "",
        notifyMembers: true,
        pinned: !!post.pinned
      });
    } else {
      setEditId(null);
      setForm({ title: "", content: "", starred: false, metadata: {}, link: "", visibility: "public", target: "", notifyMembers: true, pinned: false });
    }
    setOpen(true);
  };
  const closeDialog = () => {
    setOpen(false);
    // clear route if deep-linked
    if (routePostId) navigate('/message-board', { replace: true });
  };

  const handleSave = async () => {
    let saved = null;
    if (editId) saved = await updatePost(editId, form);
    else saved = await createPost(form);
    await loadPosts();
    closeDialog();

    const postId = saved?.id || `mb-${Date.now()}`;
    const baseNotif = {
      id: `mb-${postId}`,
      type: form.visibility === "group" ? "group" : "announcement",
      title: editId ? "Message updated" : "New message",
      message: form.title || (form.content && form.content.slice(0, 120)) || "Message board updated",
      url: `/message-board/${postId}`,
      read: false,
      meta: { origin: "message_board", post_id: postId, visibility: form.visibility, target: form.target || null }
    };

    if (notifCtx && typeof notifCtx.addNotification === "function") {
      if (form.notifyMembers) notifCtx.addNotification(baseNotif);
      if (typeof notifCtx.reload === "function") notifCtx.reload();
    }

    // If backend createPost supports notifyMembers, it should persist + emit notifications server-side.
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    await deletePost(id);
    await loadPosts();
    if (notifCtx && typeof notifCtx.addNotification === "function") {
      notifCtx.addNotification({
        id: `mb-del-${Date.now()}`,
        type: "system",
        title: "Message deleted",
        message: `A message was deleted`,
        url: "/message-board",
        read: false,
        meta: { broadcast: true }
      });
      if (typeof notifCtx.reload === "function") notifCtx.reload();
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Message Board</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => openDialog()}>Add Post</Button>
      <List>
        {posts.length === 0 && <ListItem>No posts.</ListItem>}
        {posts.map(post => (
          <ListItem key={post.id} alignItems="flex-start"
            secondaryAction={
              <>
                <Button size="small" onClick={() => openDialog(post)}>Edit</Button>
                <Button size="small" color="error" onClick={() => handleDelete(post.id)}>Delete</Button>
              </>
            }>
            <ListItemText
              primary={<strong>
                <a href={`/message-board/${post.id}`} onClick={(e) => { e.preventDefault(); openDialog(post); }}>{post.title}</a>
              </strong>}
              secondary={<span>{post.content}<br />
                {post.starred ? <span style={{color:'gold'}}>★ Starred</span> : null}
                {post.link ? (<a href={post.link}>Link</a>) : null}
                <br/>
                {post.created_at ? new Date(post.created_at).toLocaleString() : ''}
              </span>}
            />
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit Post" : "Add Post"}</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth margin="normal" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <TextField label="Content" fullWidth multiline minRows={3} margin="normal" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          <TextField label="Link" fullWidth margin="normal" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />

          <FormControl fullWidth margin="normal">
            <InputLabel id="visibility-label">Visibility</InputLabel>
            <Select labelId="visibility-label" value={form.visibility} label="Visibility" onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}>
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="church">Church-only</MenuItem>
              <MenuItem value="group">Group-only</MenuItem>
              <MenuItem value="role">Role-only</MenuItem>
            </Select>
          </FormControl>

          {(form.visibility === "group" || form.visibility === "role") && (
            <TextField label={form.visibility === "group" ? "Group ID" : "Role name"} fullWidth margin="normal" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
          )}

          <FormControlLabel
            control={<Checkbox checked={form.notifyMembers} onChange={e => setForm(f => ({ ...f, notifyMembers: e.target.checked }))} />}
            label="Notify members"
          />
          <FormControlLabel
            control={<Checkbox checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />}
            label="Pin post"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? "Save" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}