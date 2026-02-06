import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApprovalsInbox from '../ApprovalsInbox';
import { AuthContext } from '../../../contexts/AuthContext';

jest.mock('../../../services/leadershipService', () => ({
  getPendingApprovals: jest.fn(),
  approveLeader: jest.fn(),
  rejectLeader: jest.fn()
}));
import { getPendingApprovals, rejectLeader } from '../../../services/leadershipService';

function MockProvider({ children, value }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('ApprovalsInbox snackbar on error', () => {
  beforeEach(() => jest.resetAllMocks());

  it('displays server 400 message when reject API returns error', async () => {
    getPendingApprovals.mockResolvedValue({ pending: [{ leader_id: 1, leader_name: 'Alice', requested_at: new Date().toISOString(), readiness_score: 50 }] });
    // simulate server-side validation error
    rejectLeader.mockRejectedValue(new Error('Rejection reason is required'));

    render(
      <MockProvider value={{ permissions: ['update_member'], fetchWithAuth: jest.fn() }}>
        <ApprovalsInbox />
      </MockProvider>
    );

    expect(await screen.findByText(/Alice/)).toBeInTheDocument();

    // open reject dialog and enter reason
    fireEvent.click(screen.getByText(/Reject/));
    fireEvent.change(screen.getByPlaceholderText(/Reason for rejection/i), { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Reject/i }));

    // snackbar with server message should appear
    expect(await screen.findByText(/Rejection reason is required/)).toBeInTheDocument();
  });
});