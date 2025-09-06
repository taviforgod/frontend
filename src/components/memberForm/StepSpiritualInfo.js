import React from 'react';
import { Grid, TextField, MenuItem } from '@mui/material';
import * as yup from 'yup';

// Yup validation schema
const schema = yup.object().shape({
  date_joined_church: yup
    .string()
    .required('Date Joined Church is required')
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Joined Church cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  date_born_again: yup
    .string()
    .required('Date Born Again is required')
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Born Again cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  date_baptized_immersion: yup
    .string()
    .nullable()
    .notRequired()
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Baptized cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  date_received_holy_ghost: yup
    .string()
    .nullable()
    .notRequired()
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Received Holy Ghost cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  foundation_school_grad_date: yup
    .string()
    .nullable()
    .notRequired()
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Foundation School Grad Date cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  baptized_in_christ_embassy: yup
    .string()
    .required('Baptized in Christ Embassy is required')
    .oneOf(['true', 'false'], 'Baptized in Christ Embassy is required'),
});

export default function StepSpiritualInfo({
  formValues,
  handleChange,
  validationErrors,
  setValidationErrors,
}) {
  // Live validation
  const handleFieldChange = fieldObj => {
    const [field, value] = Object.entries(fieldObj)[0];
    schema
      .validateAt(field, { ...formValues, [field]: value })
      .then(() => setValidationErrors(prev => ({ ...prev, [field]: '' })))
      .catch(err => setValidationErrors(prev => ({ ...prev, [field]: err.message })));
    handleChange(fieldObj);
  };

  const handleFieldBlur = field => {
    schema
      .validateAt(field, formValues)
      .then(() => setValidationErrors(prev => ({ ...prev, [field]: '' })))
      .catch(err => setValidationErrors(prev => ({ ...prev, [field]: err.message })));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Date Joined Church"
          name="date_joined_church"
          type="date"
          value={formValues.date_joined_church || ''}
          onChange={e => handleFieldChange({ date_joined_church: e.target.value })}
          onBlur={() => handleFieldBlur('date_joined_church')}
          error={!!validationErrors.date_joined_church}
          helperText={validationErrors.date_joined_church || 'Required, not in future'}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Date Born Again"
          name="date_born_again"
          type="date"
          value={formValues.date_born_again || ''}
          onChange={e => handleFieldChange({ date_born_again: e.target.value })}
          onBlur={() => handleFieldBlur('date_born_again')}
          error={!!validationErrors.date_born_again}
          helperText={validationErrors.date_born_again || 'Required, not in future'}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Date Baptized (Immersion)"
          name="date_baptized_immersion"
          type="date"
          value={formValues.date_baptized_immersion || ''}
          onChange={e => handleFieldChange({ date_baptized_immersion: e.target.value })}
          onBlur={() => handleFieldBlur('date_baptized_immersion')}
          error={!!validationErrors.date_baptized_immersion}
          helperText={validationErrors.date_baptized_immersion || 'Optional, not in future'}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Date Received Holy Ghost"
          name="date_received_holy_ghost"
          type="date"
          value={formValues.date_received_holy_ghost || ''}
          onChange={e => handleFieldChange({ date_received_holy_ghost: e.target.value })}
          onBlur={() => handleFieldBlur('date_received_holy_ghost')}
          error={!!validationErrors.date_received_holy_ghost}
          helperText={validationErrors.date_received_holy_ghost || 'Optional, not in future'}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Baptized in Christ Embassy"
          name="baptized_in_christ_embassy"
          value={formValues.baptized_in_christ_embassy || ''}
          onChange={e => handleFieldChange({ baptized_in_christ_embassy: e.target.value })}
          onBlur={() => handleFieldBlur('baptized_in_christ_embassy')}
          error={!!validationErrors.baptized_in_christ_embassy}
          helperText={validationErrors.baptized_in_christ_embassy || 'Required'}
          fullWidth
        >
          <MenuItem value="true">Yes</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Foundation School Grad Date"
          name="foundation_school_grad_date"
          type="date"
          value={formValues.foundation_school_grad_date || ''}
          onChange={e => handleFieldChange({ foundation_school_grad_date: e.target.value })}
          onBlur={() => handleFieldBlur('foundation_school_grad_date')}
          error={!!validationErrors.foundation_school_grad_date}
          helperText={validationErrors.foundation_school_grad_date || 'Optional, not in future'}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>
    </Grid>
  );
}