import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InactiveExitList from './InactiveExitList';
import * as inactiveService from '../../services/inactiveExitService';
import * as interviewService from '../../services/exitInterviewService';
import { AuthContext } from '../../contexts/AuthContext';

jest.mock('../../services/inactiveExitService');
jest.mock('../../services/exitInterviewService');

const mockExits = [
  { id: 1, first_name: 'John', surname: 'Doe', exit_type: 'inactive', exit_date: '2025-12-01', visit_count: 0, followup_count:0 }
];

import { MemoryRouter } from 'react-router-dom';

function renderWithAuth(ui, { user = { permissions: ['create_exit_interviews'] } } = {}) {
  const fetchWithAuth = jest.fn();
  return render(
    <AuthContext.Provider value={{ fetchWithAuth, ready: true, user }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('InactiveExitList', () => {
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('consumes paginated API response and shows correct total in pagination', async () => {
    inactiveService.listExits.mockResolvedValue({ rows: mockExits, total_count: 123 });

    renderWithAuth(<InactiveExitList />);

    await waitFor(() => expect(inactiveService.listExits).toHaveBeenCalled());

    // TablePagination shows text like "1–25 of 123"
    expect(screen.getByText(/of 123/)).toBeInTheDocument();
  });

  test('quick log visit calls createInterview and shows undo which triggers deleteInterview and view navigates', async () => {
    inactiveService.listExits.mockResolvedValue({ rows: mockExits, total_count: 1 });
    interviewService.createInterview.mockResolvedValue({ id: 555, member_id: 42 });
    interviewService.deleteInterview.mockResolvedValue(true);

    renderWithAuth(<InactiveExitList />);

    await waitFor(() => expect(inactiveService.listExits).toHaveBeenCalled());

    const quickBtns = await screen.findAllByLabelText('Quick Log Visit');
    fireEvent.click(quickBtns[0]);

    await waitFor(() => expect(interviewService.createInterview).toHaveBeenCalled());

    // Snackbar should appear with Undo and View buttons
    expect(await screen.findByText(/Visit logged/)).toBeInTheDocument();

    const viewBtn = await screen.findByText('View');
    expect(viewBtn).toBeInTheDocument();

    fireEvent.click(viewBtn);

    // Expect navigation to the member's interview page
    expect(mockNavigate).toHaveBeenCalledWith('/members/42/exit-interviews/555');

    // Now test Undo still works
    const undoBtn = screen.getByText('Undo');
    fireEvent.click(undoBtn);

    await waitFor(() => expect(interviewService.deleteInterview).toHaveBeenCalledWith(expect.anything(), 555));

    expect(await screen.findByText(/Undo successful/)).toBeInTheDocument();
  });
});