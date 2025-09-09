import * as yup from 'yup';

const personalSchema = yup.object().shape({
  first_name: yup
    .string()
    .required('First name is required')
    .min(2, 'First name is too short')
    .max(50, 'First name is too long')
    .matches(/^[A-Za-z\s'-]+$/, 'First name must contain only letters'),
  surname: yup
    .string()
    .required('Surname is required')
    .min(2, 'Surname is too short')
    .max(50, 'Surname is too long')
    .matches(/^[A-Za-z\s'-]+$/, 'Surname must contain only letters'),
  date_of_birth: yup
    .string()
    .required('Date of birth is required')
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date of birth cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  num_children: yup
    .number()
    .typeError('Number of children is required')
    .required('Number of children is required')
    .integer('Enter a valid non-negative integer')
    .min(0, 'Enter a valid non-negative integer'),
});

export default personalSchema;