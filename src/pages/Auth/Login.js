import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Stack,
  Link,
  SvgIcon, 
} from '@mui/material';
import { Mail, Lock, Eye, EyeOff, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

export default function Login({ modal = false, onClose = () => {}, onSwitchToRegister = () => {} }) {
  const { login, setUser, fetchWithAuth } = useContext(AuthContext);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // allow parent modal to close after success
  const closeAfterSuccess = async () => { onClose && onClose(); };

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      // try fetch profile if available
      if (typeof fetchWithAuth === 'function') {
        const res = await fetchWithAuth('/api/users/profile');
        if (res && res.ok) {
          const u = await res.json();
          setUser && setUser(u);
        }
      }
      // close parent modal (if present) then navigate
      if (modal && typeof onClose === 'function') onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // subtle parallax offsets for blobs
  const offsetX = (mousePos.x - window.innerWidth / 2) * 0.02;
  const offsetY = (mousePos.y - window.innerHeight / 2) * 0.02;

  const formCard = (
    <Card
      sx={{
        width: '100%',
        maxWidth: 640,
        p: { xs: 3, sm: 6 },
        borderRadius: 3,
        boxShadow: { xs: '0 6px 18px rgba(16,24,40,0.06)', sm: '0 10px 30px rgba(16,24,40,0.08)' },
        position: 'relative',
        zIndex: 1,
        overflow: 'visible',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h5" align="center" fontWeight={700} mb={1}>
        Welcome Back
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary" mb={3}>
        Sign in to continue to your dashboard
      </Typography>

      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="Email or phone"
          fullWidth
          value={form.identifier}
          onChange={(e) => setForm((s) => ({ ...s, identifier: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Mail size={18} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Password"
          fullWidth
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock size={18} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((s) => !s)}
                  edge="end"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  size="small"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: -1 }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          color="secondary"
          sx={{
            mt: 1,
            py: 1.1,
            fontWeight: 700,
            borderRadius: 2,
          }}
        >
          {loading ? <Hourglass size={18} className="lucide-spin" /> : 'Sign In'}
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Link component="button" variant="body2" onClick={() => navigate('/forgot-password')}>
            Forgot password?
          </Link>
          <Link
            component="button"
            variant="body2"
            onClick={() => {
              if (modal) onSwitchToRegister(); else navigate('/register');
            }}
          >
            Don't have an account?
          </Link>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          <Typography variant="caption" color="text.secondary">
            or continue with
          </Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1}>
          <Button variant="outlined" fullWidth startIcon={<GoogleIcon />} onClick={() => { /* oauth */ }}>
            Google
          </Button>
          <Button variant="outlined" fullWidth startIcon={<MicrosoftIcon />} onClick={() => { /* oauth */ }}>
            Microsoft
          </Button>
          <Button variant="outlined" fullWidth startIcon={<AppleIcon />} onClick={() => { /* oauth */ }}>
            Apple
          </Button>
        </Stack>
      </Stack>
    </Card>
  );

  if (modal) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        {formCard}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #F7FAFC 0%, #F5F7FB 100%)',
        overflow: 'auto',
        p: 2,
      }}
    >
      <style>{`
        @keyframes float1 { 0%{transform: translateY(0) translateX(0)} 50%{transform: translateY(-24px) translateX(12px)} 100%{transform: translateY(0) translateX(0)} }
        @keyframes float2 { 0%{transform: translateY(0) translateX(0)} 50%{transform: translateY(30px) translateX(-16px)} 100%{transform: translateY(0) translateX(0)} }
        .blob { position: absolute; filter: blur(36px); opacity: 0.6; mix-blend-mode: multiply; border-radius: 48%; }
      `}</style>

      <Box
        className="blob"
        sx={{
          width: 360,
          height: 260,
          bgcolor: '#F0F7F6',
          top: -60 + offsetY,
          left: -80 + offsetX,
          zIndex: 0,
          animation: 'float1 8s ease-in-out infinite',
        }}
      />
      <Box
        className="blob"
        sx={{
          width: 300,
          height: 220,
          bgcolor: '#EEF7FA',
          top: '30%',
          right: -100 - offsetX,
          zIndex: 0,
          animation: 'float2 10s ease-in-out infinite',
        }}
      />
      <Box
        className="blob"
        sx={{
          width: 220,
          height: 180,
          bgcolor: '#FBF9F8',
          bottom: -60 - offsetY,
          left: '10%',
          zIndex: 0,
          animation: 'float1 12s ease-in-out infinite',
        }}
      />

      {formCard}
    </Box>
  );
}

// add icon components (place near bottom of the file)
function GoogleIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M21.6 12.227c0-.765-.069-1.497-.197-2.2H12v4.162h5.486c-.236 1.27-.95 2.35-2.026 3.08v2.56h3.278c1.919-1.77 3.028-4.37 3.028-7.602z" fill="#4285F4" />
      <path d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.278-2.56c-.91.61-2.07.97-3.352.97-2.578 0-4.764-1.74-5.544-4.08H3.06v2.56C4.71 19.7 8.02 22 12 22z" fill="#34A853" />
      <path d="M6.456 13.89A6.999 6.999 0 0 1 6 12c0-.66.1-1.3.284-1.89V7.55H3.06A10.99 10.99 0 0 0 1 12c0 1.8.41 3.5 1.13 5.01l3.326-3.12z" fill="#FBBC05" />
      <path d="M12 6.5c1.47 0 2.78.5 3.82 1.48l2.86-2.86C16.96 3.45 14.7 2.5 12 2.5 8.02 2.5 4.71 4.8 3.06 7.55l3.52 2.55C7.236 8.24 9.422 6.5 12 6.5z" fill="#EA4335" />
    </SvgIcon>
  );
}

function MicrosoftIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" fill="#F35325" />
      <rect x="13" y="3" width="8" height="8" fill="#81BC06" />
      <rect x="3" y="13" width="8" height="8" fill="#05A6F0" />
      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
    </SvgIcon>
  );
}

function AppleIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M16.365 1.43c0 1.02-.37 2.02-1.06 2.82-.82.95-1.95 1.54-3.12 1.54-.06-1.12.36-2.3 1.04-3.1.78-1 2.12-1.96 3.14-1.26.04.03.08.07.0.0z" />
      <path d="M20.21 8.49c-.85 0-1.86.5-2.44.5-.3 0-.93-.49-1.67-.49-1.04 0-2.77.8-3.61.8-.99 0-1.88-.79-2.87-.79C7.5 8.51 4.5 10.4 4.5 14.88c0 3.46 1.95 7.27 4.34 9.68 1.2 1.13 2.63 2.46 4.35 2.46.77 0 1.03-.49 2.01-.49 1.01 0 1.22.49 2.02.49 1.72 0 3.01-1.34 4.15-2.5 1.4-1.4 2.59-3.8 2.59-6.3 0-4.07-2.82-6.47-5.39-6.47z" />
    </SvgIcon>
  );
}