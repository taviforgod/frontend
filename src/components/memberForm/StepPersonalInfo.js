import React, { useEffect, useState, useContext } from 'react';
import {
  Grid, TextField, Autocomplete, Button, Box, Avatar, CircularProgress
} from '@mui/material';
import * as yup from 'yup';
import {
  getTitles, getGenders, getNationalities, getMaritalStatuses
} from '../../services/lookupService';
import { AuthContext } from '../../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';

// ================= Validation Schema =================
const schema = yup.object().shape({
  first_name: yup.string()
    .required('First name is required')
    .min(2)
    .max(50)
    .matches(/^[A-Za-z\s'-]+$/, 'First name must contain only letters'),
  surname: yup.string()
    .required('Surname is required')
    .min(2)
    .max(50)
    .matches(/^[A-Za-z\s'-]+$/, 'Surname must contain only letters'),
  date_of_birth: yup.string()
    .required('Date of birth is required')
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date of birth cannot be in the future', value => !value || new Date(value) <= new Date()),
  num_children: yup.number()
    .typeError('Number of children is required')
    .required('Number of children is required')
    .integer('Enter a valid non-negative integer')
    .min(0, 'Enter a valid non-negative integer'),
});

// ================= Component =================
export default function StepPersonalInfo({
  formValues,
  handleChange,
  handleFile,
  validationErrors,
  setValidationErrors
}) {
  const { fetchWithAuth } = useContext(AuthContext);

  const [titles, setTitles] = useState([]);
  const [genders, setGenders] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');

  // ================= Load Lookups =================
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingLookups(true);
      try {
        const [titlesRes, gendersRes, nationalitiesRes, maritalStatusesRes] = await Promise.all([
          getTitles(fetchWithAuth).catch(() => []),
          getGenders(fetchWithAuth).catch(() => []),
          getNationalities(fetchWithAuth).catch(() => []),
          getMaritalStatuses(fetchWithAuth).catch(() => []),
        ]);
        if (!mounted) return;
        setTitles(titlesRes);
        setGenders(gendersRes);
        setNationalities(nationalitiesRes);
        setMaritalStatuses(maritalStatusesRes);
      } catch (err) {
        console.error('Lookup load failed', err);
        setError(err?.message || 'Failed to load lookups');
      } finally {
        if (mounted) setLoadingLookups(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchWithAuth]);

  // ================= Live Validation =================
  const handleFieldChange = (field, value) => {
    schema.validateAt(field, { ...formValues, [field]: value })
      .then(() => setValidationErrors(prev => ({ ...prev, [field]: '' })))
      .catch(err => setValidationErrors(prev => ({ ...prev, [field]: err.message })));
    handleChange(field, value);
  };

  const handleFieldBlur = field => {
    schema.validateAt(field, formValues)
      .then(() => setValidationErrors(prev => ({ ...prev, [field]: '' })))
      .catch(err => setValidationErrors(prev => ({ ...prev, [field]: err.message })));
  };

  // ================= Profile Photo Upload =================
  const uploadProfilePhoto = async (file) => {
    if (!file) return;
    setError('');
    setUploadingPhoto(true);

    try {
      // Call handleFile to set the file in parent stepper state
      if (handleFile) {
        handleFile(file);
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          handleChange('profile_photo', e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Upload error', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loadingLookups) return <div>Loading lookups...</div>;

  // ================= Render =================
  return (
    <Grid container spacing={2}>
      {/* Title */}
      <Grid item xs={12} sm={3}>
        <Autocomplete
          options={titles}
          getOptionLabel={option => option.name || ''}
          value={titles.find(t => t.id === formValues.title_id) || null}
          onChange={(_, value) => handleChange('title_id', value ? value.id : '')}
          renderInput={params => <TextField {...params} label="Title" fullWidth />}
        />
      </Grid>

      {/* First Name */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="First Name"
          name="first_name"
          value={formValues.first_name || ''}
          onChange={e => handleFieldChange('first_name', e.target.value)}
          onBlur={() => handleFieldBlur('first_name')}
          error={!!validationErrors.first_name}
          helperText={validationErrors.first_name || 'Only letters, min 2 chars'}
          required
          fullWidth
        />
      </Grid>

      {/* Surname */}
      <Grid item xs={12} sm={5}>
        <TextField
          label="Surname"
          name="surname"
          value={formValues.surname || ''}
          onChange={e => handleFieldChange('surname', e.target.value)}
          onBlur={() => handleFieldBlur('surname')}
          error={!!validationErrors.surname}
          helperText={validationErrors.surname || 'Only letters, min 2 chars'}
          required
          fullWidth
        />
      </Grid>

      {/* Date of Birth */}
      <Grid item xs={12} sm={4}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <DatePicker
            label="Date of Birth"
            value={formValues.date_of_birth ? DateTime.fromISO(formValues.date_of_birth) : null}
            onChange={value => handleFieldChange('date_of_birth', value ? value.toISODate() : '')}
            onError={reason => setValidationErrors(prev => ({ ...prev, date_of_birth: reason || '' }))}
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
                error: !!validationErrors.date_of_birth,
                helperText: validationErrors.date_of_birth || 'Required, not in future',
                InputLabelProps: { shrink: true },
              }
            }}
            disableFuture
          />
        </LocalizationProvider>
      </Grid>

      {/* Gender */}
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={genders}
          getOptionLabel={option => option.name || ''}
          value={genders.find(g => g.id === formValues.gender_id) || null}
          onChange={(_, value) => handleChange('gender_id', value ? value.id : '')}
          renderInput={params => <TextField {...params} label="Gender" fullWidth />}
        />
      </Grid>

      {/* Nationality */}
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={nationalities}
          getOptionLabel={option => option.name || ''}
          value={nationalities.find(n => n.id === formValues.nationality_id) || null}
          onChange={(_, value) => handleChange('nationality_id', value ? value.id : '')}
          renderInput={params => <TextField {...params} label="Nationality" fullWidth />}
        />
      </Grid>

      {/* Marital Status */}
      <Grid item xs={12} sm={4}>
        <Autocomplete
          options={maritalStatuses}
          getOptionLabel={option => option.name || ''}
          value={maritalStatuses.find(m => m.id === formValues.marital_status_id) || null}
          onChange={(_, value) => handleChange('marital_status_id', value ? value.id : '')}
          renderInput={params => <TextField {...params} label="Marital Status" fullWidth />}
        />
      </Grid>

      {/* Number of Children */}
      <Grid item xs={12} sm={4}>
        <TextField
          label="Number of Children"
          name="num_children"
          type="number"
          value={formValues.num_children || ''}
          onChange={e => handleFieldChange('num_children', e.target.value)}
          onBlur={() => handleFieldBlur('num_children')}
          error={!!validationErrors.num_children}
          helperText={validationErrors.num_children || 'Non-negative integer'}
          required
          fullWidth
          inputProps={{ min: 0, step: 1 }}
        />
      </Grid>

      {/* Profile Photo */}
      <Grid item xs={12} sm={6}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="profile-photo-upload"
          type="file"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadProfilePhoto(file);
            e.target.value = ''; // reset input to allow re-upload
          }}
        />
        <label htmlFor="profile-photo-upload">
          <Button variant="outlined" component="span" fullWidth disabled={uploadingPhoto}>
            {uploadingPhoto ? <CircularProgress size={24} /> : (formValues.profile_photo ? 'Change Photo' : 'Upload Photo')}
          </Button>
        </label>
        <Box mt={1}>
          {formValues.profile_photo ? (
            <img
              src={formValues.profile_photo}
              alt="Profile Preview"
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
            />
          ) : (
            <Avatar sx={{ width: 80, height: 80, fontSize: 32 }}>
              {(formValues.first_name?.[0] || '') + (formValues.surname?.[0] || '')}
            </Avatar>
          )}
        </Box>
        {error && <Box mt={1} sx={{ color: 'red' }}>{error}</Box>}
      </Grid>
    </Grid>
  );
}
