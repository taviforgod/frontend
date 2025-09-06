import React, { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete } from '@mui/material';
import * as yup from 'yup';
import { getTitles, getGenders, getNationalities, getMaritalStatuses } from '../../services/lookupService';

// Yup validation schema
const schema = yup.object().shape({
  first_name: yup
    .string()
    .required('First name is required')
    .min(2, 'First name is too short')
    .max(50, 'First name is too long')
    .matches(/^[A-Za-z\s'-]+$/, 'First name must contain only letters'),
  surname: yup
    .string()
    .required('Surname is required')
    .min(2, 'Surname is too short')
    .max(50, 'Surname is too long')
    .matches(/^[A-Za-z\s'-]+$/, 'Surname must contain only letters'),
  date_of_birth: yup
    .string()
    .required('Date of birth is required')
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date of birth cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  num_children: yup
    .number()
    .typeError('Number of children is required')
    .required('Number of children is required')
    .integer('Enter a valid non-negative integer')
    .min(0, 'Enter a valid non-negative integer'),
});

export default function StepPersonalInfo({
  formValues,
  handleChange,
  validationErrors,
  setValidationErrors,
}) {
  const [titles, setTitles] = useState([]);
  const [genders, setGenders] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTitles().catch(err => { console.error('Titles error:', err); setError('Titles error'); return []; }),
      getGenders().catch(err => { console.error('Genders error:', err); setError('Genders error'); return []; }),
      getNationalities().catch(err => { console.error('Nationalities error:', err); setError('Nationalities error'); return []; }),
      getMaritalStatuses().catch(err => { console.error('Marital Statuses error:', err); setError('Marital Statuses error'); return []; }),
    ]).then(([titles, genders, nationalities, maritalStatuses]) => {
      setTitles(titles);
      setGenders(genders);
      setNationalities(nationalities);
      setMaritalStatuses(maritalStatuses);
      setLoading(false);
    });
  }, []);

  // Live validation on change
  const handleFieldChange = fieldObj => {
    const [field, value] = Object.entries(fieldObj)[0];
    schema
      .validateAt(field, { ...formValues, [field]: value })
      .then(() => setValidationErrors(prev => ({ ...prev, [field]: '' })))
      .catch(err => setValidationErrors(prev => ({ ...prev, [field]: err.message })));
    handleChange(fieldObj);
  };

  // Validation on blur
  const handleFieldBlur = field => {
    schema
      .validateAt(field, formValues)
      .then(() => setValidationErrors(prev => ({ ...prev, [field]: '' })))
      .catch(err => setValidationErrors(prev => ({ ...prev, [field]: err.message })));
  };

  if (loading) return <div>Loading lookups...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={3}>
        <Autocomplete
          options={titles}
          getOptionLabel={option => option.name || ''}
          value={titles.find(t => t.id === formValues.title_id) || null}
          onChange={(_, value) => handleChange({ title_id: value ? value.id : '' })}
          renderInput={params => (
            <TextField {...params} label="Title" fullWidth />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="First Name"
          name="first_name"
          value={formValues.first_name || ''}
          onChange={e => handleFieldChange({ first_name: e.target.value })}
          onBlur={() => handleFieldBlur('first_name')}
          error={!!validationErrors.first_name}
          helperText={validationErrors.first_name || 'Only letters, min 2 chars'}
          required
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={5}>
        <TextField
          label="Surname"
          name="surname"
          value={formValues.surname || ''}
          onChange={e => handleFieldChange({ surname: e.target.value })}
          onBlur={() => handleFieldBlur('surname')}
          error={!!validationErrors.surname}
          helperText={validationErrors.surname || 'Only letters, min 2 chars'}
          required
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Date of Birth"
          name="date_of_birth"
          type="date"
          value={formValues.date_of_birth || ''}
          onChange={e => handleFieldChange({ date_of_birth: e.target.value })}
          onBlur={() => handleFieldBlur('date_of_birth')}
          error={!!validationErrors.date_of_birth}
          helperText={validationErrors.date_of_birth || 'Required, not in future'}
          InputLabelProps={{ shrink: true }}
          required
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={genders}
          getOptionLabel={option => option.name || ''}
          value={genders.find(g => g.id === formValues.gender_id) || null}
          onChange={(_, value) => handleChange({ gender_id: value ? value.id : '' })}
          renderInput={params => (
            <TextField {...params} label="Gender" fullWidth />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={nationalities}
          getOptionLabel={option => option.name || ''}
          value={nationalities.find(n => n.id === formValues.nationality_id) || null}
          onChange={(_, value) => handleChange({ nationality_id: value ? value.id : '' })}
          renderInput={params => (
            <TextField {...params} label="Nationality" fullWidth />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={maritalStatuses}
          getOptionLabel={option => option.name || ''}
          value={maritalStatuses.find(m => m.id === formValues.marital_status_id) || null}
          onChange={(_, value) => handleChange({ marital_status_id: value ? value.id : '' })}
          renderInput={params => (
            <TextField {...params} label="Marital Status" fullWidth />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Number of Children"
          name="num_children"
          type="number"
          value={formValues.num_children || ''}
          onChange={e => handleFieldChange({ num_children: e.target.value })}
          onBlur={() => handleFieldBlur('num_children')}
          error={!!validationErrors.num_children}
          helperText={validationErrors.num_children || 'Non-negative integer'}
          required
          fullWidth
          inputProps={{ min: 0, step: 1 }}
        />
      </Grid>
    </Grid>
  );
}