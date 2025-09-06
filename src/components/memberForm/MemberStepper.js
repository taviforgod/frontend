import React, { useState, useEffect, useMemo } from 'react';
import { Stepper, Step, StepLabel, Button, Box, CircularProgress } from '@mui/material';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import * as yup from 'yup';

import StepPersonalInfo from './StepPersonalInfo';
import StepContactInfo from './StepContactInfo';
import StepSpiritualInfo from './StepSpiritualInfo';
import StepProfessionalInfo from './StepProfessionalInfo';
import StepSummary from './StepSummary';

import {
  createMember,
  updateMember,
  checkDuplicate
} from '../../services/memberService';
import personalSchema from './schemas/personalSchema';
import contactSchema from './schemas/contactSchema';
import spiritualSchema from './schemas/spiritualSchema';
import professionalSchema from './schemas/professionalSchema';

const steps = [
  'Personal Info',
  'Contact Info',
  'Spiritual Info',
  'Professional Info',
  'Summary',
];

const stepSchemas = [
  personalSchema,
  contactSchema,
  spiritualSchema,
  professionalSchema,
];

// Utility to get only changed fields
function getChangedFields(original, updated) {
  const changed = {};
  Object.keys(updated).forEach(key => {
    if (updated[key] !== original[key]) {
      changed[key] = updated[key];
    }
  });
  return changed;
}

export default function MemberStepper({
  initialValues = {},
  isEditMode = false,
  onSuccess,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [formValues, setFormValues] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedId, setSelectedId] = useState(null);

  const stableInitial = useMemo(() => initialValues, [initialValues]);

  useEffect(() => {
    if (isEditMode && Object.keys(stableInitial).length) {
      setFormValues(stableInitial);
    }
  }, [stableInitial, isEditMode]);

  const handleNext = async () => {
    const isValid = await validateStep(activeStep);
    if (!isValid) {
      showSnackbar('Fix validation errors before proceeding', 'error');
      return;
    }
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleChange = (newVals) => {
    setFormValues((fv) => ({ ...fv, ...newVals }));
    setValidationErrors({});
  };

  const handleFile = (file) => setProfilePhoto(file);

  const showSnackbar = (msg, sev = 'success') => setSnackbar({ open: true, message: msg, severity: sev });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const validateStep = async (step) => {
    const errors = {};
    const schema = stepSchemas[step];
    if (schema) {
      try {
        await schema.validate(formValues, { abortEarly: false });
        // Uniqueness checks for contact info step
        if (step === 1 && !isEditMode) {
          const [dupEmail, dupPhone] = await Promise.all([
            checkDuplicate('email', formValues.email),
            checkDuplicate('contact_primary', formValues.contact_primary)
          ]);
          if (dupEmail.exists) errors.email = 'Email already exists';
          if (dupPhone.exists) errors.contact_primary = 'Phone already exists';
        }
      } catch (err) {
        if (err.inner) {
          err.inner.forEach(e => {
            errors[e.path] = e.message;
          });
        } else if (err.path) {
          errors[err.path] = err.message;
        }
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = await validateStep(activeStep);
    if (!isValid) {
      showSnackbar('Fix validation errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let data;
      if (isEditMode) {
        // Only send changed fields
        const changedFields = getChangedFields(stableInitial, formValues);
        data = new FormData();
        Object.entries(changedFields).forEach(([k, v]) => data.append(k, v));
        if (profilePhoto) data.append('profile_photo', profilePhoto);
        await updateMember(formValues.id, data);
        showSnackbar('Member updated successfully!');
      } else {
        data = new FormData();
        Object.entries(formValues).forEach(([k, v]) => data.append(k, v));
        if (profilePhoto) data.append('profile_photo', profilePhoto);
        await createMember(data);
        showSnackbar('Member created successfully!');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      showSnackbar(err.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step) => {
    const props = {
      formValues,
      handleChange,
      handleFile,
      validationErrors,
      setValidationErrors, 
    };
    switch (step) {
      case 0:
        return <StepPersonalInfo {...props} />;
      case 1:
        return <StepContactInfo {...props} />;
      case 2:
        return <StepSpiritualInfo {...props} />;
      case 3:
        return <StepProfessionalInfo {...props} />;
      case 4:
        return <StepSummary values={formValues} profilePhoto={profilePhoto} handleFile={handleFile} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>{getStepContent(activeStep)}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} /> : isEditMode ? 'Update' : 'Submit'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
      </Box>

          <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}