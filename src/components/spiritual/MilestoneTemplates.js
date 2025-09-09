import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Dialog, DialogTitle, DialogContent, Stack, IconButton, Tooltip, Button, Divider, DialogActions, Skeleton, TextField, MenuItem, InputAdornment } from '@mui/material';
import Pagination from '@mui/material/Pagination';
import { Pencil, Trash2, Search as SearchIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import ConfirmDialog from '../../Shared/ConfirmDialog';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import { getMilestoneTemplates, createMilestoneTemplate, updateMilestoneTemplate, deleteMilestoneTemplate } from '../../services/milestoneService';

export default function MilestoneTemplates() {
  const [templates, setTemplates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open:false, message:'', severity:'success' });
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name:'', description:'', required_for_promotion:false }
  });

  useEffect(()=> { load(); }, []);
  useEffect(()=> { applyFilter(); }, [templates, search, sortOrder]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMilestoneTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setSnackbar({ open:true, message: err.message, severity:'error' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const s = search.toLowerCase();
    const sorted = [...templates].filter(t => t.name?.toLowerCase().includes(s))
      .sort((a,b)=> sortOrder==='asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    setFiltered(sorted);
  };

  const handleOpen = (t=null) => {
    if (t) {
      reset({ name: t.name, description: t.description, required_for_promotion: t.required_for_promotion });
      setEditTemplate(t);
    } else {
      reset({ name:'', description:'', required_for_promotion:false });
      setEditTemplate(null);
    }
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); reset(); setEditTemplate(null); };

  const onSubmit = async (data) => {
    try {
      if (editTemplate) {
        await updateMilestoneTemplate(editTemplate.id, data);
        setSnackbar({ open:true, message: 'Updated', severity:'success' });
      } else {
        await createMilestoneTemplate(data);
        setSnackbar({ open:true, message: 'Created', severity:'success' });
      }
      handleClose();
      load();
    } catch (err) {
      setSnackbar({ open:true, message: err.message, severity:'error' });
    }
  };

  const handleDeleteClick = (id) => { setDeleteId(id); setConfirmOpen(true); };

  const confirmDelete = async () => {
    try {
      await deleteMilestoneTemplate(deleteId);
      setSnackbar({ open:true, message:'Deleted', severity:'success' });
      load();
    } catch (err) {
      setSnackbar({ open:true, message: err.message, severity:'error' });
    } finally {
      setConfirmOpen(false); setDeleteId(null);
    }
  };

  const paginated = filtered.slice((page-1)*rowsPerPage, page*rowsPerPage);

  return (
    <Box p={{xs:1, sm:2, md:4}}>
      <Typography variant="h4" fontWeight="bold" mb={3}>Milestone Templates</Typography>
      <Card sx={{ mb:3, borderRadius:3, boxShadow:2 }}>
        <CardContent>
          <Stack direction={{xs:'column', sm:'row'}} spacing={2} alignItems={{xs:'stretch', sm:'center'}}>
            <TextField fullWidth placeholder="Search templates..." value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} size="small" InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon size={18}/></InputAdornment>) }} />
            <TextField select label="Sort" value={sortOrder} onChange={(e)=> setSortOrder(e.target.value)} size="small" sx={{ minWidth:140 }}>
              <MenuItem value="asc">A → Z</MenuItem>
              <MenuItem value="desc">Z → A</MenuItem>
            </TextField>
            <Button variant="contained" onClick={()=> handleOpen(null)} sx={{ minWidth:120 }}>Add Template</Button>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Stack spacing={2}>
          {[...Array(6)].map((_,i)=>(<Skeleton key={i} variant="rectangular" height={80} />))}
        </Stack>
      ) : filtered.length === 0 ? (
        <Typography textAlign="center" color="text.secondary">No templates found.</Typography>
      ) : (
        <Box sx={{ display:'grid', gridTemplateColumns: { xs:'1fr', sm:'1fr 1fr', md:'1fr 1fr 1fr' }, gap:2, mb:3 }}>
          {paginated.map(t => (
            <Card key={t.id} variant="outlined" sx={{ borderRadius:2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ wordBreak:'break-word' }}>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt:1 }}>{t.description}</Typography>
              </CardContent>
              <Box sx={{ p:1, pt:0, display:'flex', justifyContent:'flex-end' }}>
                <Tooltip title="Edit"><IconButton size="small" onClick={()=> handleOpen(t)}><Pencil size={16} /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=> handleDeleteClick(t.id)}><Trash2 size={16} /></IconButton></Tooltip>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {filtered.length > rowsPerPage && (
        <Box display="flex" justifyContent="center" px={2} pb={2}>
          <Pagination count={Math.ceil(filtered.length/rowsPerPage)} page={page} onChange={(e,v)=> setPage(v)} shape="rounded" />
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          <form id="template-form" onSubmit={handleSubmit(onSubmit)}>
            <TextField label="Name" fullWidth margin="normal" {...register('name', { required: 'Name required' })} error={!!errors.name} helperText={errors.name?.message} autoFocus />
            <TextField label="Description" fullWidth margin="normal" multiline minRows={3} {...register('description')} />
            <TextField select label="Required for Promotion" fullWidth margin="normal" {...register('required_for_promotion')}>
              <MenuItem value={true}>Yes</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </TextField>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="template-form" variant="contained">{editTemplate ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirmOpen} onClose={()=> setConfirmOpen(false)} onConfirm={confirmDelete} title="Delete Template" description="Delete this milestone template?" />
      <SnackbarAlert open={snackbar.open} onClose={()=> setSnackbar({...snackbar, open:false})} severity={snackbar.severity} message={snackbar.message} />
    </Box>
  );
}
