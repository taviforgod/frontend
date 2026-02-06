import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApprovalsInbox from '../ApprovalsInbox';
import { AuthContext } from '../../../contexts/AuthContext';

const mockPending = { pending: [{ leader_id: 1, leader_name: 'Leader 1', requested_at: new Date().toISOString(), readiness_score: 70 }], page: 0, limit: 20, hasMore: false, total: 1 };

function createFetchMock() {
  const mock = jest.fn(async (url, opts) => {
    if (url.startsWith('/api/leadership/approvals/pending')) return { ok: true, headers: { get: () => 'application/json' }, json: async () => mockPending, text: async () => JSON.stringify(mockPending) };
    if (url.startsWith('/api/leadership/1/reject') && opts && opts.method === 'POST') return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ message: 'Rejected' }), text: async () => JSON.stringify({ message: 'Rejected' }) };
    return { ok: false, status: 404, text: async () => 'Not found' };
  });
  return mock;
}

function MockProvider({ children }) {
  return <AuthContext.Provider value={{ permissions: ['update_member'], fetchWithAuth: createFetchMock() }}>{children}</AuthContext.Provider>;
}

describe('ApprovalsInbox inline reject', () => {
  it('requires reason and calls API on confirm', async () => {
    const fetchMock = createFetchMock();
    render(
      <AuthContext.Provider value={{ permissions: ['update_member'], fetchWithAuth: fetchMock }}>
        <ApprovalsInbox />
      </AuthContext.Provider>
    );

    // wait for load
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/leadership/approvals/pending')));

    // click Quick Reject
    const btn = await screen.findByText(/Quick Reject/i);
    fireEvent.click(btn);

    // confirm the dialog shows
    const confirmBtn = await screen.findByText(/Confirm Reject/i);
    expect(confirmBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Reason for rejection/i);
    fireEvent.change(textarea, { target: { value: 'Insufficient training' } });

    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/leadership/1/reject', expect.objectContaining({ method: 'POST' })));
  });
});
