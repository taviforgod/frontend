import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ApprovalsInbox from '../ApprovalsInbox';
import { AuthContext } from '../../../contexts/AuthContext';

jest.mock('../../../services/leadershipService', () => ({
  getPendingApprovals: jest.fn()
}));
import { getPendingApprovals } from '../../../services/leadershipService';

function MockProvider({ children, value }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('ApprovalsInbox', () => {
  it('shows permission message when user lacks update_member', () => {
    render(
      <MockProvider value={{ permissions: [] }}>
        <ApprovalsInbox />
      </MockProvider>
    );
    expect(screen.getByText(/Approvals Inbox/i)).toBeInTheDocument();
    expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
  });

  it('renders pending approvals list when permission exists', async () => {
    getPendingApprovals.mockResolvedValue({ pending: [{ leader_id: 1, leader_name: 'Alice', requested_at: new Date().toISOString(), readiness_score: 50 }] });

    render(
      <MockProvider value={{ permissions: ['update_member'], fetchWithAuth: jest.fn() }}>
        <ApprovalsInbox />
      </MockProvider>
    );

    await waitFor(() => expect(getPendingApprovals).toHaveBeenCalled());
    // wait for the list item to appear
    expect(await screen.findByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Approve/)).toBeInTheDocument();
    expect(screen.getByText(/Reject/)).toBeInTheDocument();
  });
});