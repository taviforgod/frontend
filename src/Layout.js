import React from "react";
import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <Box minHeight="100vh" sx={{ pt: { xs: 4, sm: 6 }, bgcolor: "background.default" }}>
      <Container maxWidth={false} disableGutters sx={{ px: { xs: 0.5, sm: 1 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
