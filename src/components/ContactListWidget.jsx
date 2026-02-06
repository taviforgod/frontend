import React, { useEffect, useState, useContext } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';
import { listContacts } from '../services/evangelismService';
import { AuthContext } from '../contexts/AuthContext'; 
import { DateTime } from 'luxon'; 

export default function ContactListWidget({ church_id }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchWithAuth } = useContext(AuthContext); 

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const data = fetchWithAuth
          ? await listContacts(fetchWithAuth, { church_id })
          : await listContacts({ church_id });
        setContacts(data || []);
      } catch (e) {
        setContacts([]);
      }
      setLoading(false);
    }
    fetchContacts();
  }, [church_id, fetchWithAuth]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Evangelism Contacts
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={80}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense>
            {contacts.length === 0 && (
              <Typography color="text.secondary">No contacts found.</Typography>
            )}
            {contacts.map((c) => (
              <ListItem key={c.id}>
                <ListItemText
                  primary={`${c.first_name} ${c.surname || ''}`}
                  secondary={
                    <>
                      {c.phone || c.email || ''}
                      {c.contact_date && (
                        <span>
                          {" • "}
                          {DateTime.fromISO(c.contact_date).toLocaleString(DateTime.DATE_MED)}
                        </span>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}