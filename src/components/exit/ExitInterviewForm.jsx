// src/components/ExitInterviewForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, FormControl, InputLabel,
  Select, MenuItem, Alert, Box, Chip
} from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import { createInterview, updateInterview, getInterviewTemplates } from '../../services/exitInterviewService';

const INTERVIEW_TYPES = {
  exit: [
    { key: 'prompted_reason', text: 'What prompted your decision to step down?' },
    { key: 'spiritual_health', text: 'Do you feel spiritually healthy?' },
    { key: 'enjoyed_most', text: 'What did you enjoy most as a cell leader?' },
    { key: 'greatest_challenges', text: 'What were your greatest challenges?' },
    { key: 'consider_return', text: 'Would you consider returning in the future?' },
    { key: 'advice_successor', text: 'What advice would you give your successor?' }
  ],
  transition: [
    { key: 'reason_leaving', text: 'What is the main reason for your transition?' },
    { key: 'future_plans', text: 'What are your future plans?' },
    { key: 'support_needed', text: 'What support do you need during this transition?' },
    { key: 'lessons_learned', text: 'What are the key lessons you\'ve learned?' },
    { key: 'recommendations', text: 'What recommendations do you have for the church?' }
  ],
  reinstatement: [
    { key: 'reason_return', text: 'What prompted your decision to return?' },
    { key: 'changes_experience', text: 'How has your experience changed you?' },
    { key: 'expectations', text: 'What are your expectations for your return?' },
    { key: 'support_needed', text: 'What support do you need to reintegrate?' }
  ],
  visit: [
    { key: 'visit_date', text: 'Date of visit (auto-filled on save)' },
    { key: 'location', text: 'Where did the visit take place?' },
    { key: 'purpose', text: 'Purpose of visit / focus' },
    { key: 'outcome', text: 'Outcome of the visit' },
    { key: 'next_steps', text: 'Recommended next steps or follow-up' }
  ],
  followup: [
    { key: 'followup_date', text: 'Date of follow-up (auto-filled on save)' },
    { key: 'status', text: 'Current status / progress' },
    { key: 'notes', text: 'Notes about follow-up' },
    { key: 'assigned_to', text: 'Assigned to (person responsible)' }
  ]
};

export default function ExitInterviewForm({ open, onClose, onSaved, exitId=null, memberId=null, editId=null, interviewData=null, initialInterviewType=null }) {
  const { fetchWithAuth } = useContext(AuthContext);

  const [interviewType, setInterviewType] = useState('exit');
  const [summary, setSummary] = useState('');
  const [answers, setAnswers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load interview templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!fetchWithAuth || !open) return;
      setLoadingTemplates(true);
      try {
        const tmpls = await getInterviewTemplates(fetchWithAuth);
        setTemplates(tmpls);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, [fetchWithAuth, open]);

  // Initialize form data
  useEffect(() => {
    if (!open) {
      setInterviewType('exit');
      setSummary('');
      setAnswers([]);
      return;
    }

    // If editing existing interview
    if (interviewData) {
      setInterviewType(interviewData.interview_type || 'exit');
      setSummary(interviewData.summary || '');
      const currentQuestions = templates[interviewData.interview_type || 'exit'] || INTERVIEW_TYPES[interviewData.interview_type || 'exit'] || [];
      const existingAnswers = interviewData.interview_answers || [];
      setAnswers(currentQuestions.map(q => {
        const existing = existingAnswers.find(a => a.question_key === q.key);
        return {
          question_key: q.key,
          question_text: q.text,
          answer_text: existing?.answer_text || ''
        };
      }));
    } else {
      // New interview: honor initialInterviewType if provided
      const chosenType = initialInterviewType || interviewType || 'exit';
      setInterviewType(chosenType);
      const defaultQuestions = templates[chosenType] || INTERVIEW_TYPES[chosenType] || [];
      setAnswers(defaultQuestions.map(q => ({
        question_key: q.key,
        question_text: q.text,
        answer_text: ''
      })));
    }
  }, [open, interviewData, interviewType, templates, initialInterviewType]);

  // Update answers when interview type changes (for new interviews)
  useEffect(() => {
    if (!open || interviewData) return; // Don't change if editing existing

    const questions = templates[interviewType] || INTERVIEW_TYPES[interviewType] || [];
    setAnswers(questions.map(q => ({
      question_key: q.key,
      question_text: q.text,
      answer_text: ''
    })));
  }, [interviewType, open, interviewData, templates]);

  const handleAnswerChange = (idx, value) => {
    setAnswers(a => {
      const copy = [...a];
      copy[idx] = { ...copy[idx], answer_text: value };
      return copy;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        exit_id: exitId,
        member_id: memberId,
        summary,
        answers,
        interview_type: interviewType
      };

      let res;
      if (editId) {
        res = await updateInterview(fetchWithAuth, editId, payload);
      } else {
        res = await createInterview(fetchWithAuth, payload);
      }

      onSaved && onSaved(res);
      onClose();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        {editId ? 'Edit Interview' : 'Conduct Interview'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Structured Interview Process
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This interview helps us understand member experiences and improve our ministry.
          </Typography>
        </Box>

        {!editId && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Interview Type</InputLabel>
                <Select
                  value={interviewType}
                  label="Interview Type"
                  onChange={(e) => setInterviewType(e.target.value)}
                  disabled={loadingTemplates}
                >
                  <MenuItem value="exit">Exit Interview</MenuItem>
                  <MenuItem value="transition">Transition Interview</MenuItem>
                  <MenuItem value="reinstatement">Reinstatement Interview</MenuItem>
                  <MenuItem value="visit">Visit</MenuItem>
                  <MenuItem value="followup">Follow-up</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Chip
                  label={`${answers.length} questions`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {loadingTemplates ? (
          <Typography>Loading interview templates...</Typography>
        ) : answers.length === 0 ? (
          <Alert severity="info">No questions available for this interview type.</Alert>
        ) : (
          <Grid container spacing={2}>
            {answers.map((q, i) => (
              <Grid item xs={12} key={q.question_key}>
                <TextField
                  label={`${i + 1}. ${q.question_text}`}
                  value={q.answer_text}
                  onChange={e => handleAnswerChange(i, e.target.value)}
                  multiline
                  rows={q.question_key === 'advice_successor' || q.question_key === 'recommendations' ? 4 : 2}
                  fullWidth
                  placeholder="Enter your response here..."
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <TextField
                label="Summary / Key Insights / Recommendations"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Summarize key insights, recommendations, or follow-up actions..."
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || answers.length === 0}
        >
          {saving ? 'Saving...' : (editId ? 'Update Interview' : 'Save Interview')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
