import React from 'react';
import { Grid, TextField, MenuItem } from '@mui/material';
import * as yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';

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
  const handleFieldChange = (field, value) => {
    schema
      .validateAt(field, { ...formValues, [field]: value })
      .then(() => setValidationErrors(prev => ({ ...prev, [field]: '' })))
      .catch(err => setValidationErrors(prev => ({ ...prev, [field]: err.message })));
    handleChange(field, value);
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
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <DatePicker
            label="Date Joined Church"
            value={formValues.date_joined_church ? DateTime.fromISO(formValues.date_joined_church) : null}
            onChange={value => handleFieldChange('date_joined_church', value ? value.toISODate() : '')}
            onError={reason => setValidationErrors(prev => ({ ...prev, date_joined_church: reason || '' }))}
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
                error: !!validationErrors.date_joined_church,
                helperText: validationErrors.date_joined_church || 'Required, not in future',
                InputLabelProps: { shrink: true },
              }
            }}
            disableFuture
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <DatePicker
            label="Date Born Again"
            value={formValues.date_born_again ? DateTime.fromISO(formValues.date_born_again) : null}
            onChange={value => handleFieldChange('date_born_again', value ? value.toISODate() : '')}
            onError={reason => setValidationErrors(prev => ({ ...prev, date_born_again: reason || '' }))}
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
                error: !!validationErrors.date_born_again,
                helperText: validationErrors.date_born_again || 'Required, not in future',
                InputLabelProps: { shrink: true },
              }
            }}
            disableFuture
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <DatePicker
            label="Date Baptized (Immersion)"
            value={formValues.date_baptized_immersion ? DateTime.fromISO(formValues.date_baptized_immersion) : null}
            onChange={value => handleFieldChange('date_baptized_immersion', value ? value.toISODate() : '')}
            onError={reason => setValidationErrors(prev => ({ ...prev, date_baptized_immersion: reason || '' }))}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!validationErrors.date_baptized_immersion,
                helperText: validationErrors.date_baptized_immersion || 'Optional, not in future',
                InputLabelProps: { shrink: true },
              }
            }}
            disableFuture
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <DatePicker
            label="Date Received Holy Ghost"
            value={formValues.date_received_holy_ghost ? DateTime.fromISO(formValues.date_received_holy_ghost) : null}
            onChange={value => handleFieldChange('date_received_holy_ghost', value ? value.toISODate() : '')}
            onError={reason => setValidationErrors(prev => ({ ...prev, date_received_holy_ghost: reason || '' }))}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!validationErrors.date_received_holy_ghost,
                helperText: validationErrors.date_received_holy_ghost || 'Optional, not in future',
                InputLabelProps: { shrink: true },
              }
            }}
            disableFuture
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Baptized in Christ Embassy"
          name="baptized_in_christ_embassy"
          value={formValues.baptized_in_christ_embassy || ''}
          onChange={e => handleFieldChange('baptized_in_christ_embassy', e.target.value)}
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
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <DatePicker
            label="Foundation School Grad Date"
            value={formValues.foundation_school_grad_date ? DateTime.fromISO(formValues.foundation_school_grad_date) : null}
            onChange={value => handleFieldChange('foundation_school_grad_date', value ? value.toISODate() : '')}
            onError={reason => setValidationErrors(prev => ({ ...prev, foundation_school_grad_date: reason || '' }))}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!validationErrors.foundation_school_grad_date,
                helperText: validationErrors.foundation_school_grad_date || 'Optional, not in future',
                InputLabelProps: { shrink: true },
              }
            }}
            disableFuture
          />
        </LocalizationProvider>
      </Grid>
    </Grid>
  );
}