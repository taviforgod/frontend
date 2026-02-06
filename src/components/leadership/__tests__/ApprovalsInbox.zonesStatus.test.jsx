import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApprovalsInbox from '../ApprovalsInbox';
import { AuthContext } from '../../../contexts/AuthContext';

const mockZones = [{ id: 10, name: 'Zone X' }, { id: 20, name: 'Zone Y' }];
const mockPending = { pending: [], page: 0, limit: 20, hasMore: false, total: 0 };

function createFetchMock() {
  return jest.fn(async (url) => {
    if (url.startsWith('/api/zones')) {
      return { ok: true, headers: { get: () => 'application/json' }, json: async () => mockZones, text: async () => JSON.stringify(mockZones) };
    }
    if (url.startsWith('/api/leadership/approvals/pending')) {
      return { ok: true, headers: { get: () => 'application/json' }, json: async () => mockPending, text: async () => JSON.stringify(mockPending) };
    }
    return { ok: false, status: 404, text: async () => 'Not found' };
  });
}

function MockProvider({ children }) {
  return <AuthContext.Provider value={{ permissions: ['update_member'], fetchWithAuth: createFetchMock() }}>{children}</AuthContext.Provider>;
}

describe('ApprovalsInbox zones & status', () => {
  it('loads zones and calls API with selected zone and status', async () => {
    const fetchMock = createFetchMock();
    render(
      <AuthContext.Provider value={{ permissions: ['update_member'], fetchWithAuth: fetchMock }}>
        <ApprovalsInbox />
      </AuthContext.Provider>
    );

    // Wait for zones to be loaded and select to appear
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/zones'));

    // select zone
    const zoneSelect = screen.getByLabelText(/Zone/i);
    fireEvent.mouseDown(zoneSelect);
    const zoneOption = await screen.findByText('Zone X');
    fireEvent.click(zoneOption);

    // select status
    const statusSelect = screen.getByLabelText(/Status/i);
    fireEvent.mouseDown(statusSelect);
    const statusOption = await screen.findByText('Certified');
    fireEvent.click(statusOption);

    // click apply
    const applyBtn = screen.getByText(/Apply/i);
    fireEvent.click(applyBtn);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/leadership/approvals/pending')));
  });
});
