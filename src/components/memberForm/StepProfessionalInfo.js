import React, { useEffect, useState, useContext } from 'react';
import { Grid, TextField, Autocomplete } from '@mui/material';
import * as yup from 'yup';
import { getMemberTypes, getMemberStatuses } from '../../services/lookupService';
import { AuthContext } from '../../contexts/AuthContext';

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
  // top-level hook only
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [memberTypes, setMemberTypes] = useState([]);
  const [memberStatuses, setMemberStatuses] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // normalize options to objects { id, name } and keep stable references
  const memberTypesNormalized = Array.isArray(memberTypes)
    ? memberTypes.map(t => (t && typeof t === 'object' ? t : { id: t, name: String(t) }))
    : [];
  const memberStatusesNormalized = Array.isArray(memberStatuses)
    ? memberStatuses.map(s => (s && typeof s === 'object' ? s : { id: s, name: String(s) }))
    : [];

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!fetchWithAuth) {
        return;
      }
      setLoadingLookups(true);
      try {
        const [types, statuses] = await Promise.all([
          getMemberTypes(fetchWithAuth).catch(() => []),
          getMemberStatuses(fetchWithAuth).catch(() => []),
        ]);
        
        if (!mounted) return;
        setMemberTypes(Array.isArray(types) ? types : []);
        setMemberStatuses(Array.isArray(statuses) ? statuses : []);
        // dev fallback so you can see the dropdown while debugging
        if (process.env.NODE_ENV === 'development' && (!types || types.length === 0) && (!statuses || statuses.length === 0)) {
          setTimeout(() => {
            if (!mounted) return;
            setMemberTypes([{ id: 1, name: 'Regular' }, { id: 2, name: 'Associate' }]);
            setMemberStatuses([{ id: 1, name: 'Active' }, { id: 2, name: 'Inactive' }]);
          }, 50);
        }
      } catch (err) {
        console.error('Failed to load member lookups', err);
        if (mounted) {
          setMemberTypes([]);
          setMemberStatuses([]);
        }
      } finally {
        if (mounted) setLoadingLookups(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchWithAuth]);

  // basic local validation helper (optional)
  const validateField = async (name, value) => {
    try {
      await schema.validateAt(name, { [name]: value });
      setValidationErrors && setValidationErrors(prev => ({ ...(prev || {}), [name]: null }));
    } catch (err) {
      setValidationErrors && setValidationErrors(prev => ({ ...(prev || {}), [name]: err.message }));
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Profession"
          value={formValues.profession || ''}
          onChange={e => handleChange('profession', e.target.value)}
          error={!!validationErrors.profession}
          helperText={validationErrors.profession}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Occupation"
          fullWidth
          value={formValues.occupation || ''}
          onChange={(e) => {
            handleChange('occupation', e.target.value);
            validateField('occupation', e.target.value);
          }}
          error={!!validationErrors?.occupation}
          helperText={<span>{validationErrors?.occupation || 'Enter your occupation (2-50 chars)'}</span>}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Work address"
          fullWidth
          value={formValues.work_address || ''}
          onChange={(e) => {
            handleChange('work_address', e.target.value);
            validateField('work_address', e.target.value);
          }}
          error={!!validationErrors?.work_address}
          helperText={<span>{validationErrors?.work_address || 'Enter your work address (5-100 chars)'}</span>}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={memberTypesNormalized}
          getOptionLabel={(opt) => opt?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id == value?.id}
          value={memberTypesNormalized.find(t => t.id == formValues.member_type_id) || null}
          onChange={(_, val) => handleChange('member_type_id', val?.id ?? '')}
          renderInput={(params) => <TextField {...params} label="Member type" />}
          disabled={loadingLookups}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={memberStatusesNormalized}
          getOptionLabel={(opt) => opt?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id == value?.id}
          value={memberStatusesNormalized.find(s => s.id == formValues.member_status_id) || null}
          onChange={(_, val) => handleChange('member_status_id', val?.id ?? '')}
          renderInput={(params) => <TextField {...params} label="Member status" />}
          disabled={loadingLookups}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="RFID tag"
          fullWidth
          value={formValues.rfid_tag || ''}
          onChange={(e) => {
            handleChange('rfid_tag', e.target.value);
            validateField('rfid_tag', e.target.value);
          }}
          error={!!validationErrors?.rfid_tag}
          helperText={validationErrors?.rfid_tag}
        />
      </Grid>
    </Grid>
  );
}