import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete } from '@mui/material';
import * as yup from 'yup';
import { getMemberTypes, getMemberStatuses } from '../../services/lookupService';

// Yup validation schema
const schema = yup.object().shape({
  profession: yup
    .string()
    .required('Profession is required')
    .min(2, 'Profession is too short')
    .max(50, 'Profession is too long')
    .test('no-invalid-chars', 'Profession contains invalid characters', value => !/[<>]/.test(value || '')),
  occupation: yup
    .string()
    .required('Occupation is required')
    .min(2, 'Occupation is too short')
    .max(50, 'Occupation is too long')
    .test('no-invalid-chars', 'Occupation contains invalid characters', value => !/[<>]/.test(value || '')),
  work_address: yup
    .string()
    .required('Work address is required')
    .min(5, 'Work address is too short')
    .max(100, 'Work address is too long')
    .test('no-invalid-chars', 'Work address contains invalid characters', value => !/[<>]/.test(value || '')),
  rfid_tag: yup
    .string()
    .notRequired()
    .nullable()
    .test(
      'rfid-format',
      'RFID must be 5-30 letters, numbers, or dashes',
      value => !value || /^[A-Za-z0-9\-]{5,30}$/.test(value)
    ),
});

export default function StepProfessionalInfo({
  formValues,
  handleChange,
  validationErrors,
  setValidationErrors,
}) {
  const [memberTypes, setMemberTypes] = useState([]);
  const [memberStatuses, setMemberStatuses] = useState([]);

  useEffect(() => {
    getMemberTypes().then(setMemberTypes).catch(() => setMemberTypes([]));
    getMemberStatuses().then(setMemberStatuses).catch(() => setMemberStatuses([]));
  }, []);

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
          label="Profession"
          name="profession"
          value={formValues.profession || ''}
          onChange={e => handleFieldChange({ profession: e.target.value })}
          onBlur={() => handleFieldBlur('profession')}
          error={!!validationErrors.profession}
          helperText={validationErrors.profession || 'Required, 2-50 chars'}
          required
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Occupation"
          name="occupation"
          value={formValues.occupation || ''}
          onChange={e => handleFieldChange({ occupation: e.target.value })}
          onBlur={() => handleFieldBlur('occupation')}
          error={!!validationErrors.occupation}
          helperText={validationErrors.occupation || 'Required, 2-50 chars'}
          required
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Work Address"
          name="work_address"
          value={formValues.work_address || ''}
          onChange={e => handleFieldChange({ work_address: e.target.value })}
          onBlur={() => handleFieldBlur('work_address')}
          error={!!validationErrors.work_address}
          helperText={
            validationErrors.work_address
              ? validationErrors.work_address
              : `Required, 5-100 chars (${formValues.work_address?.length || 0}/100)`
          }
          required
          fullWidth
          inputProps={{ maxLength: 100 }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={memberStatuses}
          getOptionLabel={option => option.name || ''}
          value={memberStatuses.find(s => s.id === formValues.member_status_id) || null}
          onChange={(_, value) => handleChange({ member_status_id: value ? value.id : '' })}
          renderInput={params => (
            <TextField {...params} label="Status" fullWidth required />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={memberTypes}
          getOptionLabel={option => option.name || ''}
          value={memberTypes.find(t => t.id === formValues.member_type_id) || null}
          onChange={(_, value) => handleChange({ member_type_id: value ? value.id : '' })}
          renderInput={params => (
            <TextField {...params} label="Member Type" fullWidth required />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="RFID Tag"
          name="rfid_tag"
          value={formValues.rfid_tag || ''}
          onChange={e => handleFieldChange({ rfid_tag: e.target.value })}
          onBlur={() => handleFieldBlur('rfid_tag')}
          error={!!validationErrors.rfid_tag}
          helperText={validationErrors.rfid_tag || 'Optional, 5-30 letters/numbers/dashes'}
          fullWidth
        />
      </Grid>
    </Grid>
  );
}