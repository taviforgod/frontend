import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApprovalsInbox from '../ApprovalsInbox';
import { AuthContext } from '../../../contexts/AuthContext';

const mockPendingPage = (n = 1) => ({
  pending: Array.from({ length: 2 }).map((_, i) => ({
    leader_id: i + (n - 1) * 2 + 1,
    leader_name: `Leader ${i + 1}`,
    requested_at: new Date().toISOString(),
    readiness_score: 70
  })),
  page: n - 1,
  limit: 2,
  hasMore: n < 3,
  total: 6
});

function createFetchMock(pages = 3) {
  return jest.fn(async (url) => {
    if (url.startsWith('/api/leadership/approvals/pending')) {
      // parse page param
      const m = url.match(/page=(\d+)/);
      const p = m ? Number(m[1]) : 0;
      return { ok: true, headers: { get: () => 'application/json' }, json: async () => mockPendingPage(p + 1) };
    }
    return { ok: false, status: 404, text: async () => 'Not found' };
  });
}

function MockProvider({ children }) {
  return <AuthContext.Provider value={{ permissions: ['update_member'], fetchWithAuth: createFetchMock() }}>{children}</AuthContext.Provider>;
}

describe('ApprovalsInbox pagination & filtering', () => {
  it('applies search and pagination params when loading', async () => {
    const fetchMock = createFetchMock();

    render(
      <AuthContext.Provider value={{ permissions: ['update_member'], fetchWithAuth: fetchMock }}>
        <ApprovalsInbox />
      </AuthContext.Provider>
    );

    // wait for initial load
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/leadership/approvals/pending')));

    // enter search and apply
    const search = screen.getByLabelText(/Search/i);
    fireEvent.change(search, { target: { value: 'John' } });
    const applyBtn = screen.getByText(/Apply/i);
    fireEvent.click(applyBtn);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/leadership/approvals/pending')));

    // wait for search call to resolve then use Go to jump
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('search=John')));
    // verify page display and jump (use Go to go to page 2)
    await waitFor(() => expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument());
    const goInput = screen.getByLabelText(/Go to/i);
    fireEvent.change(goInput, { target: { value: '2' } });
    const goBtn = screen.getByText(/^Go$/i);
    const prev = fetchMock.mock.calls.length;
    fireEvent.click(goBtn);

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(prev));
  });
});
