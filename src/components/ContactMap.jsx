// frontend/src/components/ContactMap.jsx
import React, { useEffect, useState, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { listContacts } from '../services/evangelismService';
import L from 'leaflet';
import { AuthContext } from '../contexts/AuthContext'; // <-- Add this import
import { DateTime } from 'luxon'; // <-- Add this import

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ContactMap({ filters = {} }) {
  const [contacts, setContacts] = useState([]);
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  // Defensive dedupe for map markers (keep best per phone/email/name+area)
  const uniqueContacts = React.useMemo(() => {
    if (!Array.isArray(contacts) || contacts.length === 0) return [];
    const normalizePhone = (p = '') => (String(p || '') || '').replace(/\D/g, '').replace(/^\+/, '');
    const keyFor = (c) => {
      const phone = normalizePhone(c.phone || c.whatsapp);
      if (phone) return `p:${phone}`;
      if (c.email) return `e:${String(c.email).toLowerCase().trim()}`;
      const name = `${(c.first_name||'').toLowerCase().trim()} ${(c.surname||'').toLowerCase().trim()}`.trim();
      const area = (c.area || '').toLowerCase().trim();
      return `n:${name}|${area}`;
    };

    const map = new Map();
    contacts.forEach(c => {
      const key = keyFor(c);
      if (!map.get(key)) map.set(key, c);
    });
    return Array.from(map.values());
  }, [contacts]);

  useEffect(() => {
    (async () => {
      try {
        const data = fetchWithAuth
          ? await listContacts(fetchWithAuth, filters)
          : await listContacts(filters);
        setContacts(data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [filters, fetchWithAuth]);

  const center = uniqueContacts.length
    ? [uniqueContacts[0].lat || -26.2041, uniqueContacts[0].lon || 28.0473]
    : [-26.2041, 28.0473];

  return (
    <MapContainer center={center} zoom={11} style={{ height: '60vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {uniqueContacts.map(c => c.lat && c.lon ? (
        <Marker key={c.id} position={[c.lat, c.lon]}>
          <Popup>
            <div><strong>{c.first_name} {c.surname}</strong></div>
            <div>{c.phone}</div>
            <div>{c.how_met}</div>
            {c.contact_date && (
              <div>
                Contacted: {DateTime.fromISO(c.contact_date).toLocaleString(DateTime.DATE_MED)}
              </div>
            )}
          </Popup>
        </Marker>
      ) : null)}
    </MapContainer>
  );
}
