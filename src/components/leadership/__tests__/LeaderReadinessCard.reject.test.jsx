import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeaderReadinessCard from '../LeaderReadinessCard';
import { AuthContext } from '../../../contexts/AuthContext';

jest.mock('../../../services/leadershipService', () => ({
  getReadiness: jest.fn(),
  getMilestoneTemplates: jest.fn(),
  getMilestoneRecords: jest.fn(),
  approveLeader: jest.fn(),
  rejectLeader: jest.fn()
}));
import { getReadiness, rejectLeader } from '../../../services/leadershipService';

function MockProvider({ children, value }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

describe('LeaderReadinessCard reject flow', () => {
  beforeEach(() => jest.resetAllMocks());

  it('requires a reason before allowing reject through the card dialog', async () => {
    getReadiness.mockResolvedValue({ readiness: { score: 40, status: 'pending', breakdown: {}, history: [] } });

    const mockFetch = jest.fn();
    const user = { id: 99, permissions: ['update_member'] };

    render(
      <MockProvider value={{ permissions: ['update_member'], user }}>
        <LeaderReadinessCard leaderId={1} fetchWithAuth={mockFetch} showSnackbar={jest.fn()} />
      </MockProvider>
    );

    // wait for the score to be displayed
    expect(await screen.findByText(/40%/)).toBeInTheDocument();

    // open reject dialog
    fireEvent.click(screen.getByText(/Reject/));

    // find the reject confirm button and ensure it's disabled
    const rejectBtn = await screen.findByRole('button', { name: /Reject/i });
    expect(rejectBtn).toBeDisabled();

    // enter a reason
    fireEvent.change(screen.getByPlaceholderText(/Reason for rejection/i), { target: { value: 'Insufficient milestones' } });

    await waitFor(() => expect(rejectBtn).toBeEnabled());

    // trigger reject
    rejectLeader.mockResolvedValue({ message: 'Leader rejected' });
    fireEvent.click(rejectBtn);

    await waitFor(() => expect(rejectLeader).toHaveBeenCalledWith(expect.any(Function), 1, { reason: 'Insufficient milestones' }));
  });
});