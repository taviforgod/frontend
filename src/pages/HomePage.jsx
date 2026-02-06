import { 
  Calendar, Users, Heart, Target, BookOpen, DollarSign, 
  TrendingUp, Network, BarChart3, ArrowRight, CheckCircle2,
  Zap, Shield, Globe
} from 'lucide-react';
import React, { useState } from 'react';
import { 
  Box, Container, Button, Dialog, DialogContent, 
  Typography, Stack, Paper, useTheme, alpha, Fade 
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import Login from './Auth/Login';
import Register from './Auth/Register';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

// Styled Components
const GradientText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.4)
    : alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: alpha(theme.palette.secondary.main, 0.4),
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const IconContainer = styled(Box)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: theme.shape.borderRadius,
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
}));

const StyledButton = styled(Button)(({ theme, variant: buttonVariant }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: '12px 32px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  ...(buttonVariant === 'primary' && {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: theme.palette.primary.contrastText,
    border: 'none',
    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    },
  }),
  ...(buttonVariant === 'secondary' && {
    background: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    border: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    backdropFilter: 'blur(8px)',
    '&:hover': {
      transform: 'translateY(-2px)',
      background: alpha(theme.palette.primary.main, 0.15),
      borderColor: theme.palette.primary.main,
    },
  }),
}));

const modules = [
  { id: 1, title: 'Cell Meeting Planning', description: 'Plan agendas, schedule venues, track attendance, and maintain Bible teaching calendars.', icon: Calendar },
  { id: 2, title: 'Relationship Management', description: 'Maintain member profiles, log pastoral care, and track conflict resolution.', icon: Users },
  { id: 3, title: 'Mission Field & Evangelism', description: 'Plan outreach activities, maintain contact lists, and track soul-winning progress.', icon: Target },
  { id: 4, title: 'Discipleship & Integration', description: 'Track follow-up visits, monitor spiritual milestones, and assign mentors.', icon: BookOpen },
  { id: 5, title: 'Finance & Giving', description: 'Track giving sessions, record offerings and tithes, and generate accountability reports.', icon: DollarSign },
  { id: 6, title: 'Leadership Development', description: 'Track mentee progress, record assessments, and monitor ministry involvement.', icon: TrendingUp },
  { id: 7, title: 'Cell Growth & Multiplication', description: 'Track the WBS Cycle, document multiplication readiness, and maintain transition records.', icon: Network },
  { id: 8, title: 'Personal Growth', description: 'Record development activities, track self-assessment, and monitor spiritual disciplines.', icon: Heart },
  { id: 9, title: 'Reporting & Accountability', description: 'Compile comprehensive reports and generate leadership performance dashboards.', icon: BarChart3 }
];

const features = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance for seamless ministry management' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security protecting your data' },
  { icon: Globe, title: 'Accessible Anywhere', desc: 'Cloud-based platform accessible from any device' }
];

const benefits = [
  'Streamline cell meeting coordination',
  'Track spiritual growth milestones',
  'Generate insightful analytics',
  'Multiply cells effectively',
  'Manage relationships with care',
  'Automate administrative tasks'
];

export default function HomePage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const theme = useTheme();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      {/* Animated Aurora Background */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.3)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: `${float} 8s ease-in-out infinite`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-10%',
          right: '20%',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.25)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(100px)',
          animation: `${float} 10s ease-in-out 1s infinite`,
        }
      }} />

      {/* Navigation Header */}
      <Box component="header" sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
      }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: theme.shape.borderRadius,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}>
                <Heart size={24} color={theme.palette.primary.contrastText} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                  Cell Ministry
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Management Platform
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <StyledButton
                variant="secondary"
                onClick={() => setLoginOpen(true)}
              >
                Sign In
              </StyledButton>
              <StyledButton
                variant="primary"
                onClick={() => setRegisterOpen(true)}
              >
                Register
              </StyledButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box component="section" sx={{ position: 'relative', zIndex: 1, pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Fade in timeout={800}>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                backdropFilter: 'blur(12px)',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                px: 2,
                py: 1,
                borderRadius: 8,
              }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  bgcolor: theme.palette.secondary.main,
                  borderRadius: '50%',
                  animation: `${pulse} 2s ease-in-out infinite`,
                }} />
                <Typography variant="caption" sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  Comprehensive Cell Ministry Solution
                </Typography>
              </Box>
            </Fade>

            <Fade in timeout={1000}>
              <Box>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                    mb: 2,
                    lineHeight: 1.1
                  }}
                >
                  Empowering{' '}
                  <GradientText component="span" variant="h1" sx={{ 
                    fontWeight: 800,
                    fontSize: 'inherit',
                    display: 'inline'
                  }}>
                    Church Leaders
                  </GradientText>
                  {' '}to Build Thriving Communities
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'text.secondary',
                    maxWidth: 700,
                    mx: 'auto',
                    fontWeight: 400,
                    lineHeight: 1.6
                  }}
                >
                  A complete platform to manage cell meetings, nurture relationships, 
                  track discipleship, and multiply impact across your ministry.
                </Typography>
              </Box>
            </Fade>

            <Fade in timeout={1200}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <StyledButton
                  variant="primary"
                  onClick={() => setRegisterOpen(true)}
                  endIcon={<ArrowRight size={20} />}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Get Started Free
                </StyledButton>
                <StyledButton
                  variant="secondary"
                  sx={{ px: 4, py: 1.5 }}
                >
                  Watch Demo
                </StyledButton>
              </Stack>
            </Fade>

            {/* Benefits Row */}
            <Fade in timeout={1400}>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={3} 
                sx={{ pt: 4 }}
                flexWrap="wrap"
                justifyContent="center"
              >
                {benefits.slice(0, 3).map((benefit, idx) => (
                  <Stack 
                    key={idx}
                    direction="row" 
                    spacing={1} 
                    alignItems="center"
                    sx={{ color: 'text.secondary' }}
                  >
                    <CheckCircle2 size={18} color={theme.palette.success.main} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {benefit}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Fade>
          </Stack>
        </Container>
      </Box>

      {/* Features Highlight */}
      <Box component="section" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={3}
          >
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <GlassCard 
                  key={idx}
                  sx={{ 
                    p: 3, 
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    mx: 'auto',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IconComponent size={28} color={theme.palette.primary.main} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {feature.desc}
                  </Typography>
                </GlassCard>
              );
            })}
          </Stack>
        </Container>
      </Box>

      {/* Modules Section */}
      <Box component="section" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Stack spacing={2} sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem' }
              }}
            >
              Nine Integrated Modules
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
              Everything you need to effectively lead, grow, and multiply your cell ministry
            </Typography>
          </Stack>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              lg: 'repeat(3, 1fr)' 
            },
            gap: 3
          }}>
            {modules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <GlassCard key={module.id} sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <IconContainer>
                      <IconComponent size={24} color={theme.palette.primary.main} />
                    </IconContainer>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {module.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {module.description}
                      </Typography>
                    </Box>
                  </Stack>
                </GlassCard>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box component="section" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <GlassCard sx={{ 
            p: { xs: 4, md: 6 }, 
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
              animation: `${shimmer} 3s infinite`,
            }
          }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Ready to Transform Your Ministry?
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 500, mx: 'auto' }}>
              Join hundreds of church leaders who are already using our platform to grow thriving cell communities.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <StyledButton
                variant="primary"
                onClick={() => setRegisterOpen(true)}
                endIcon={<ArrowRight size={20} />}
                sx={{ px: 4, py: 1.5 }}
              >
                Start Your Free Trial
              </StyledButton>
              <StyledButton
                variant="secondary"
                onClick={() => setLoginOpen(true)}
                sx={{ px: 4, py: 1.5 }}
              >
                Sign In
              </StyledButton>
            </Stack>
          </GlassCard>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(20px)',
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        py: 4,
        mt: 6
      }}>
        <Container maxWidth="lg">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cell Ministry Platform
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 500 }}>
              Building disciples, multiplying leaders, transforming communities through effective cell ministry management.
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', pt: 2 }}>
              © {new Date().getFullYear()} Cell Ministry Platform. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Login Modal */}
      <Dialog 
        open={loginOpen} 
        onClose={() => setLoginOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ 
          sx: { 
            bgcolor: 'transparent', 
            boxShadow: 'none',
            backgroundImage: 'none'
          } 
        }}
      >
        <DialogContent sx={{ p: 0, bgcolor: 'transparent' }}>
          <Login 
            modal 
            onClose={() => setLoginOpen(false)} 
            onSwitchToRegister={() => { 
              setLoginOpen(false); 
              setRegisterOpen(true); 
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog 
        open={registerOpen} 
        onClose={() => setRegisterOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ 
          sx: { 
            bgcolor: 'transparent', 
            boxShadow: 'none',
            backgroundImage: 'none'
          } 
        }}
      >
        <DialogContent sx={{ p: 0, bgcolor: 'transparent' }}>
          <Register 
            modal 
            onClose={() => setRegisterOpen(false)} 
            onSwitchToLogin={() => { 
              setRegisterOpen(false); 
              setLoginOpen(true); 
            }} 
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
