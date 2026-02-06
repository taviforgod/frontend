import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddRelationshipDialog from '../AddRelationshipDialog';
import * as service from '../../../services/memberService';
import { AuthContext } from '../../../contexts/AuthContext';

jest.mock('../../../services/memberService');

describe('AddRelationshipDialog', () => {
  jest.setTimeout(10000);
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('searches members, creates relationship and calls onSuccess with created object', async () => {
    const fakeResults = [{ id: 42, first_name: 'Amy', surname: 'Test', contact_primary: '123' }];
    service.searchMembers.mockResolvedValue(fakeResults);
    const createdRel = { id: 999, relationship_type: 'spouse', related_member_id: 42, related_first_name: 'Amy', related_surname: 'Test' };
    service.createRelationship.mockResolvedValue(createdRel);

    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const fetchWithAuth = jest.fn();

    render(
      <AuthContext.Provider value={{ fetchWithAuth }}>
        <AddRelationshipDialog open={true} onClose={onClose} memberId={1} onSuccess={onSuccess} />
      </AuthContext.Provider>
    );

    const searchInput = screen.getByLabelText(/Search member by name/i);
    await userEvent.type(searchInput, 'Amy');
    const searchButton = screen.getByRole('button', { name: /Search/i });
    // trigger search by pressing Enter and clicking Search to be robust
    await userEvent.keyboard('{Enter}');
    await userEvent.click(searchButton);

    // wait for options to appear
    await waitFor(() => expect(service.searchMembers).toHaveBeenCalled());

    // wait for the option to be rendered and select it
    const option = await screen.findByRole('option', { name: /Amy Test/ }, { timeout: 5000 });
    await userEvent.click(option);

    // select the relationship type
    const relType = screen.getByLabelText(/Relationship type/i);
    await userEvent.click(relType);
    const relOption = await screen.findByRole('option', { name: /spouse/i });
    await userEvent.click(relOption);

    // click Add
    const addBtn = screen.getByRole('button', { name: /Add/i });
    await userEvent.click(addBtn);

    await waitFor(() => expect(service.createRelationship).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalledWith(createdRel);
    expect(onClose).toHaveBeenCalled();
  });
});