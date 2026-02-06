import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('../../services/memberService');
const { getDepartments, assignDepartment } = require('../../services/memberService');

import AssignDepartmentDialog from './AssignDepartmentDialog';
import { AuthContext } from '../../contexts/AuthContext';

describe('AssignDepartmentDialog', () => {
  const fetchWithAuth = jest.fn();
  const memberId = 1;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('loads departments and assigns with optimistic callbacks', async () => {
    getDepartments.mockResolvedValue([{ id: 10, name: 'Worship' }]);
    assignDepartment.mockResolvedValue({ id: 555, department_id: 10, department_name: 'Worship' });

    const onClose = jest.fn();
    const onOptimisticAdd = jest.fn();
    const onOptimisticCommit = jest.fn();

    const { ThemeProvider, createTheme } = require('@mui/material/styles');
    const theme = createTheme();

    const { container } = render(
      <AuthContext.Provider value={{ fetchWithAuth }}>
        <ThemeProvider theme={theme}>
          <AssignDepartmentDialog open={true} onClose={onClose} memberId={memberId} onOptimisticAdd={onOptimisticAdd} onOptimisticCommit={onOptimisticCommit} />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getDepartments).toHaveBeenCalledWith(fetchWithAuth));

    const select = await screen.findByLabelText(/Department/i);
    // MUI renders a hidden native input with class MuiSelect-nativeInput; change that value
    const { container } = require('@testing-library/react');
    const nativeInput = container.querySelector('.MuiSelect-nativeInput');
    expect(nativeInput).toBeTruthy();
    fireEvent.change(nativeInput, { target: { value: '10' } });

    const roleInput = screen.getByLabelText(/Role/i);
    await userEvent.type(roleInput, 'Leader');

    const assignBtn = screen.getByRole('button', { name: /assign/i });
    await userEvent.click(assignBtn);

    await waitFor(() => expect(onOptimisticAdd).toHaveBeenCalled());
    await waitFor(() => expect(assignDepartment).toHaveBeenCalled());
    await waitFor(() => expect(onOptimisticCommit).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });
});
