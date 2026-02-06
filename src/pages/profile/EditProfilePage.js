import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Stepper, Step, StepLabel,
  Card, CardContent, Stack, Button, Alert, CircularProgress
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import PersonalInfoStep from '../../components/profile/steps/PersonalInfoStep';
import ContactInfoStep from '../../components/profile/steps/ContactInfoStep';
import AddressWorkStep from '../../components/profile/steps/AddressWorkStep';
import PhotoStep from '../../components/profile/steps/PhotoStep';
import ReviewStep from '../../components/profile/steps/ReviewStep';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function EditProfilePage() {
  const { theme } = useContext(ThemeContext);
  const { fetchWithAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [lookupData, setLookupData] = useState({
    genders: [],
    nationalities: [],
    maritalStatuses: []
  });

  const steps = ['Personal Info', 'Contact Info', 'Address & Work', 'Photo', 'Review'];

  // Load profile and lookups on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch member profile
        const profileRes = await fetchWithAuth(`${API_URL}/api/members/me`);
        if (!profileRes.ok) {
          setError('Failed to load profile');
          return;
        }
        const profileData = await profileRes.json();
        setProfile(profileData);
        setOriginalProfile(JSON.parse(JSON.stringify(profileData)));

        // Fetch lookup data in parallel
        const [gRes, nRes, mRes] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/lookups/genders`),
          fetchWithAuth(`${API_URL}/api/lookups/nationalities`),
          fetchWithAuth(`${API_URL}/api/lookups/marital-statuses`)
        ]);

        const lookups = {};
        if (gRes.ok) lookups.genders = await gRes.json();
        if (nRes.ok) lookups.nationalities = await nRes.json();
        if (mRes.ok) lookups.maritalStatuses = await mRes.json();
        
        setLookupData(lookups);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };

    if (fetchWithAuth) {
      loadData();
    }
  }, [fetchWithAuth]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetchWithAuth(`${API_URL}/api/members/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (res.ok) {
        const result = await res.json();
        setProfile(result.member);
        setOriginalProfile(JSON.parse(JSON.stringify(result.member)));
        setSuccess(true);
        
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = profile && originalProfile &&
    JSON.stringify(profile) !== JSON.stringify(originalProfile);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box display="flex" alignItems="center" mb={3} gap={2}>
            <Button
              variant="text"
              startIcon={<ArrowLeft size={20} />}
              onClick={() => navigate('/profile')}
              sx={{ textTransform: 'none', fontSize: 16 }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Edit Your Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Update your personal information step by step
              </Typography>
            </Box>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Profile saved successfully! Redirecting...
            </Alert>
          )}

          {/* Stepper */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Stepper activeStep={activeStep} sx={{ pt: 0 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
            <CardContent>
              {activeStep === 0 && (
                <PersonalInfoStep profile={profile} setProfile={setProfile} />
              )}
              {activeStep === 1 && (
                <ContactInfoStep profile={profile} setProfile={setProfile} />
              )}
              {activeStep === 2 && (
                <AddressWorkStep profile={profile} setProfile={setProfile} />
              )}
              {activeStep === 3 && (
                <PhotoStep profile={profile} setProfile={setProfile} fetchWithAuth={fetchWithAuth} />
              )}
              {activeStep === 4 && (
                <ReviewStep profile={profile} originalProfile={originalProfile} />
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              Back
            </Button>

            <Stack direction="row" spacing={2}>
              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(0)}
                  >
                    Start Over
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    sx={{ minWidth: 160 }}
                  >
                    {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </LocalizationProvider>
  );
}