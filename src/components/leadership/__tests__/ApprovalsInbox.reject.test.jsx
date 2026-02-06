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

describe('ApprovalsInbox reject flow', () => {
  beforeEach(() => jest.resetAllMocks());

  it('requires a reason before allowing reject', async () => {
    getPendingApprovals.mockResolvedValue({ pending: [{ leader_id: 1, leader_name: 'Alice', requested_at: new Date().toISOString(), readiness_score: 50 }] });

    render(
      <MockProvider value={{ permissions: ['update_member'], fetchWithAuth: jest.fn() }}>
        <ApprovalsInbox />
      </MockProvider>
    );

    // wait for item
    expect(await screen.findByText(/Alice/)).toBeInTheDocument();

    // open reject dialog
    fireEvent.click(screen.getByText(/Reject/));

    // confirm button should be present and disabled
    const confirmBtn = await screen.findByRole('button', { name: /Confirm Reject/i });
    expect(confirmBtn).toBeDisabled();

    // enter reason (required for reject)
    fireEvent.change(screen.getByPlaceholderText(/Reason for rejection/i), { target: { value: 'Incomplete training' } });

    // now button should be enabled
    await waitFor(() => expect(confirmBtn).toBeEnabled());

    // click confirm
    rejectLeader.mockResolvedValue({ message: 'Leader rejected' });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(rejectLeader).toHaveBeenCalledWith(expect.any(Function), 1, { reason: 'Incomplete training' }));
  });
});