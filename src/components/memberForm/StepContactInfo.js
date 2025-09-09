import React from 'react';
import { Grid, TextField, InputAdornment } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import * as yup from 'yup';

// Yup validation schema
const schema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email address'),
  contact_primary: yup
    .string()
    .required('Primary contact is required')
    .matches(/^\+?[1-9]\d{7,14}$/, 'Enter a valid international phone number'),
  contact_secondary: yup
    .string()
    .matches(/^\+?[1-9]\d{7,14}$/, 'Enter a valid international phone number')
    .notRequired()
    .nullable(),
  physical_address: yup
    .string()
    .required('Physical address is required')
    .min(5, 'Address is too short')
    .max(100, 'Address is too long')
    .test('no-invalid-chars', 'Address contains invalid characters', value => !/[<>]/.test(value || '')),
});

export default function StepContactInfo({
  formValues,
  handleChange,
  validationErrors,
  setValidationErrors,
}) {
  // Validate on change and blur
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

  // Helper for adornment icons
  const getAdornment = field =>
    validationErrors[field] ? (
      <InputAdornment position="end">
        <ErrorIcon color="error" />
      </InputAdornment>
    ) : formValues[field] ? (
      <InputAdornment position="end">
        <CheckCircleIcon color="success" />
      </InputAdornment>
    ) : null;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Email"
          name="email"
          value={formValues.email || ''}
          onChange={e => handleFieldChange({ email: e.target.value })}
          onBlur={() => handleFieldBlur('email')}
          error={!!validationErrors.email}
          helperText={validationErrors.email || 'e.g. user@example.com'}
          required
          fullWidth
          autoFocus={!!validationErrors.email}
          InputProps={{
            endAdornment: getAdornment('email'),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Primary Contact"
          name="contact_primary"
          value={formValues.contact_primary || ''}
          onChange={e => handleFieldChange({ contact_primary: e.target.value })}
          onBlur={() => handleFieldBlur('contact_primary')}
          error={!!validationErrors.contact_primary}
          helperText={validationErrors.contact_primary || 'e.g. +1234567890'}
          required
          fullWidth
          InputProps={{
            endAdornment: getAdornment('contact_primary'),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Secondary Contact"
          name="contact_secondary"
          value={formValues.contact_secondary || ''}
          onChange={e => handleFieldChange({ contact_secondary: e.target.value })}
          onBlur={() => handleFieldBlur('contact_secondary')}
          error={!!validationErrors.contact_secondary}
          helperText={validationErrors.contact_secondary || 'Optional'}
          fullWidth
          InputProps={{
            endAdornment: getAdornment('contact_secondary'),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Physical Address"
          name="physical_address"
          value={formValues.physical_address || ''}
          onChange={e => handleFieldChange({ physical_address: e.target.value })}
          onBlur={() => handleFieldBlur('physical_address')}
          error={!!validationErrors.physical_address}
          helperText={
            validationErrors.physical_address
              ? validationErrors.physical_address
              : `Enter full address (${formValues.physical_address?.length || 0}/100)`
          }
          required
          fullWidth
          inputProps={{ maxLength: 100 }}
          InputProps={{
            endAdornment: getAdornment('physical_address'),
          }}
        />
      </Grid>
    </Grid>
  );
}