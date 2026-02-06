import * as yup from 'yup';

const contactSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email address'),
  contact_primary: yup
    .string()
    .required('Primary contact is required')
    .matches(/^\+?[1-9]\d{7,14}$/, 'Enter a valid international phone number'),
  contact_secondary: yup
    .string()
    .matches(/^\+?[1-9]\d{7,14}$/, 'Enter a valid international phone number')
    .notRequired()
    .nullable(),
  physical_address: yup
    .string()
    .required('Physical address is required')
    .min(5, 'Address is too short')
    .max(100, 'Address is too long')
    .test('no-invalid-chars', 'Address contains invalid characters', value => !/[<>]/.test(value || '')),
});

export default contactSchema;