import React from 'react';
import { Box } from '@mui/material';
import LogoImg from '../assets/logo.png'; // Or PNG

const Logo = ({ size = 32 }) => (
  <Box component="img" src={LogoImg} alt="Logo" height={size} />
);

export default Logo;
