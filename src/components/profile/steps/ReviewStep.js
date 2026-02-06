import React from 'react';
import {
  Box, Typography, Stack, Divider, Grid, Card, CardContent,
  Chip, Avatar
} from '@mui/material';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ReviewStep({ profile, originalProfile }) {
  const getChangedFields = () => {
    const changes = [];
    if (!originalProfile || !profile) return changes;

    const fields = [
      { key: 'first_name', label: 'First Name' },
      { key: 'surname', label: 'Surname' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'gender_id', label: 'Gender' },
      { key: 'email', label: 'Email' },
      { key: 'contact_primary', label: 'Primary Phone' },
      { key: 'contact_secondary', label: 'Secondary Phone' },
      { key: 'physical_address', label: 'Physical Address' },
      { key: 'profession', label: 'Profession' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'work_address', label: 'Work Address' },
      { key: 'nationality_id', label: 'Nationality' },
      { key: 'marital_status_id', label: 'Marital Status' },
      { key: 'num_children', label: 'Number of Children' }
    ];

    fields.forEach(field => {
      if (profile[field.key] !== originalProfile[field.key]) {
        changes.push({
          label: field.label,
          old: originalProfile[field.key],
          new: profile[field.key]
        });
      }
    });

    return changes;
  };

  const changedFields = getChangedFields();

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Box sx={{ p: 1, bgcolor: '#dbeafe', borderRadius: 2 }}>
          <CheckCircle size={24} color="#0369a1" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Review Your Changes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please review the changes before submitting
          </Typography>
        </Box>
      </Stack>

      {changedFields.length === 0 ? (
        <Card sx={{ bgcolor: '#f0fdf4', borderLeft: '4px solid #16a34a' }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CheckCircle size={24} color="#16a34a" />
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  No changes detected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't made any changes to your profile.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                {changedFields.map((change, idx) => (
                  <Box key={idx}>
                    {idx > 0 && <Divider />}
                    <Stack spacing={1} py={idx > 0 ? 2 : 0}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {change.label}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Old Value
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                              {change.old || '(empty)'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              New Value
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                              {change.new || '(empty)'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: '#eff6ff', borderLeft: '4px solid #0284c7' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <AlertCircle size={20} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Important Note
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    If you're changing your email or phone number, these changes will also update your login credentials. Make sure you remember your new information.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}