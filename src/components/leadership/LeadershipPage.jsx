import React, { useState, useContext } from 'react';
import LeadershipDashboard from './LeadershipDashboard.jsx';
import LeaderList from './LeaderList.jsx';
import LeadershipMilestonesModal from './LeadershipMilestones.jsx';
import MentorshipAssignmentsModal from './MentorshipAssignments.jsx';
import LeaderEvaluationsModal from './LeaderEvaluations.jsx'; 
import EvaluationForm from './EvaluationForm.jsx'; 
import { Box, Button } from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext'; // <-- Add this import

export default function LeadershipPage() {
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [mentorshipOpen, setMentorshipOpen] = useState(false);
  const [evaluationsOpen, setEvaluationsOpen] = useState(false);
  const [evaluationFormOpen, setEvaluationFormOpen] = useState(false);
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth if needed

  return (
    <Box sx={{ p: 2 }}>
      <LeadershipDashboard />
      <Box sx={{ height: 32 }} />

      <LeaderList onSelectLeader={setSelectedLeader} />

      {selectedLeader && (
        <>
          <Box
            sx={{
              position: { xs: 'static', sm: 'sticky' },
              bottom: 0,
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              p: 2,
              mt: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              zIndex: 10,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              sx={{ minWidth: 180 }}
              onClick={() => setEvaluationFormOpen(true)}
            >
              Evaluate Leader
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ minWidth: 180 }}
              onClick={() => setEvaluationsOpen(true)}
            >
              View Evaluations
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ minWidth: 180 }}
              onClick={() => setMilestoneOpen(true)}
            >
              View Leadership Milestones
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ minWidth: 180 }}
              onClick={() => setMentorshipOpen(true)}
            >
              View Mentorship Assignments
            </Button>
          </Box>

          {/* Evaluation Form Modal */}
          <EvaluationForm
            open={evaluationFormOpen}
            onClose={() => setEvaluationFormOpen(false)}
            leader={selectedLeader}
          />

          {/* Existing modals */}
          <LeaderEvaluationsModal
            open={evaluationsOpen}
            onClose={() => setEvaluationsOpen(false)}
            leaderId={selectedLeader.member_id}
          />
          <LeadershipMilestonesModal
            memberId={selectedLeader.member_id}
            open={milestoneOpen}
            onClose={() => setMilestoneOpen(false)}
          />
          <MentorshipAssignmentsModal
            leaderId={selectedLeader.member_id}
            open={mentorshipOpen}
            onClose={() => setMentorshipOpen(false)}
          />
        </>
      )}
    </Box>
  );
}
