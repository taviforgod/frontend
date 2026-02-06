import React, { useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import {
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button
} from "@mui/material";
import { DateTime } from 'luxon';

export default function AdminRemindersMonitor() {
  const { fetchWithAuth } = React.useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Recent jobs
        const resJob = await fetchWithAuth(`/api/notification-jobs?limit=50`);
        if (resJob.ok) {
          const jobData = await resJob.json();
          setJobs(jobData.jobs || []);
        }
        // Recent logs
        const resLog = await fetchWithAuth(`/api/notification-logs?limit=150`);
        if (resLog.ok) {
          const logData = await resLog.json();
          setLogs(logData.logs || []);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <Paper sx={{ p: 2, mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Admin: Reminder Jobs & Delivery Logs</Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>Recent/Scheduled Jobs</Typography>
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Next Run</TableCell>
            <TableCell>Last Run</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.length === 0 ? <TableRow><TableCell colSpan={6}>No jobs found.</TableCell></TableRow> :
            jobs.map(j => (
              <TableRow key={j.id}>
                <TableCell>{j.job_type}</TableCell>
                <TableCell>{j.title}</TableCell>
                <TableCell>{j.schedule}</TableCell>
                <TableCell>{j.status}</TableCell>
                <TableCell>{j.next_run ? DateTime.fromISO(j.next_run).toLocaleString(DateTime.DATETIME_MED) : ''}</TableCell>
                <TableCell>{j.last_run ? DateTime.fromISO(j.last_run).toLocaleString(DateTime.DATETIME_MED) : ''}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
      <Typography variant="h6" sx={{ mt: 4 }}>Recent Delivery Logs</Typography>
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>When</TableCell>
            <TableCell>Job/Chan</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>User/Member</TableCell>
            <TableCell>Error/Response</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.length === 0 ? <TableRow><TableCell colSpan={5}>No logs found.</TableCell></TableRow> :
            logs.map(l => (
              <TableRow key={l.id}>
                <TableCell>{l.sent_at ? DateTime.fromISO(l.sent_at).toLocaleString(DateTime.DATETIME_MED) : ''}</TableCell>
                <TableCell>{l.channel}</TableCell>
                <TableCell>{l.status}</TableCell>
                <TableCell>{l.recipient_user_id || l.recipient_member_id}</TableCell>
                <TableCell>{l.error || JSON.stringify(l.response)}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </Paper>
  );
}