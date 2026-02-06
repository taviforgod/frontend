import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberDetailPanel from '../MemberDetailPanel';
import * as service from '../../../services/memberService';
import { AuthContext } from '../../../contexts/AuthContext';

jest.mock('../../../services/memberService');

describe('MemberDetailPanel integration', () => {
  beforeEach(() => jest.resetAllMocks());

  test('optimistically updates relationships list when child returns created relationship', async () => {
    const member = { id: 1, first_name: 'John', surname: 'Doe' };
    const createdRel = { id: 500, relationship_type: 'parent', related_first_name: 'Alice', related_surname: 'Parent' };

    // searchMembers and createRelationship used by dialog
    service.searchMembers.mockResolvedValue([{ id: 123, first_name: 'Alice', surname: 'Parent' }]);
    service.createRelationship.mockResolvedValue(createdRel);

    const fetchWithAuth = jest.fn();

    // wrap with MUI ThemeProvider and app ThemeContext used by child dialogs/components
    const { ThemeProvider, createTheme } = require('@mui/material/styles');
    const theme = createTheme();
    const { ThemeContext } = require('../../../contexts/ThemeContext');
    const fakeAppTheme = {
      palette: {
        mode: 'light',
        primary: { main: '#1976d2', contrastText: '#fff', dark: '#115293' },
        grey: { 200: '#eeeeee' },
        action: { hover: '#f5f5f5' }
      }
    };

    render(
      <AuthContext.Provider value={{ fetchWithAuth }}>
        <ThemeContext.Provider value={{ theme: fakeAppTheme }}>
          <ThemeProvider theme={theme}>
            <MemberDetailPanel member={member} />
          </ThemeProvider>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );

    // Open Family Links tab
    const familyTab = screen.getByRole('tab', { name: /Family Links/i });
    await userEvent.click(familyTab);

    // Click Add Relationship
    const addButton = await screen.findByRole('button', { name: /Add Relationship/i });
    await userEvent.click(addButton);

    // Fill search
    const searchInput = screen.getByLabelText(/Search member by name/i);
    await userEvent.type(searchInput, 'Alice');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(service.searchMembers).toHaveBeenCalled());

    // Select member
    const select = screen.getByLabelText(/Select member/i);
    await userEvent.click(select);
    const option = await screen.findByRole('option', { name: /Alice Parent/ });
    await userEvent.click(option);

    // Choose relationship type
    const relType = screen.getByLabelText(/Relationship type/i);
    await userEvent.click(relType);
    const relOpt = await screen.findByRole('option', { name: /parent/i });
    await userEvent.click(relOpt);

    // Add relationship
    const add = screen.getByRole('button', { name: /^Add$/i });
    await userEvent.click(add);

    // After onSuccess, the new relationship should be visible in the list
    await waitFor(() => screen.getByText(/parent: Alice Parent/i));
    expect(screen.getByText(/parent: Alice Parent/i)).toBeInTheDocument();
  });
});