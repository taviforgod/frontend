import React, { useEffect, useState, useContext } from 'react';
import { Card, CardContent, Typography, List, ListItem, Box } from '@mui/material';
import { getRoles, getAlerts } from '../../services/leadershipService';
import { AuthContext } from '../../contexts/AuthContext';

export default function LeadershipDashboard() {
  const { fetchWithAuth } = useContext(AuthContext);
  const [leaders, setLeaders] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    getRoles(fetchWithAuth)
      .then(data => setLeaders(data || []))
      .catch(() => setLeaders([]));
    getAlerts(fetchWithAuth)
      .then(data => setAlerts(data || []))
      .catch(() => setAlerts([]));
  }, [fetchWithAuth]);

  return (
    <>
      <Typography variant="h5" gutterBottom>Leadership Dashboard</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Leaders</Typography>
            <List>
              {leaders.map(leader => (
                <ListItem key={leader.id}>
                  <Box>
                    <Typography variant="body1">
                      {leader.first_name} {leader.surname} ({leader.role})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assigned: {leader.assigned_at?.substring(0,10)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Leadership Alerts</Typography>
            <List>
              {alerts.length === 0 && (
                <ListItem>
                  <Typography>No active alerts</Typography>
                </ListItem>
              )}
              {alerts.map(alert => (
                <ListItem key={alert.id}>
                  <Box>
                    <Typography variant="body2" color={alert.type === 'burnout' ? 'error' : 'primary'}>
                      [{alert.type}] {alert.message}
                    </Typography>
                    <Typography variant="caption">
                      Created: {alert.created_at?.substring(0,10)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}