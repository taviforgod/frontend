import * as yup from 'yup';

const spiritualSchema = yup.object().shape({
  date_joined_church: yup
    .string()
    .required('Date Joined Church is required')
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Joined Church cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  date_born_again: yup
    .string()
    .required('Date Born Again is required')
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Born Again cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  date_baptized_immersion: yup
    .string()
    .nullable()
    .notRequired()
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Baptized cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  date_received_holy_ghost: yup
    .string()
    .nullable()
    .notRequired()
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Date Received Holy Ghost cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  foundation_school_grad_date: yup
    .string()
    .nullable()
    .notRequired()
    .test('valid-date', 'Invalid date', value => !value || !isNaN(Date.parse(value)))
    .test('not-in-future', 'Foundation School Grad Date cannot be in the future', value => {
      if (!value) return true;
      return new Date(value) <= new Date();
    }),
  baptized_in_christ_embassy: yup
    .string()
    .required('Baptized in Christ Embassy is required')
    .oneOf(['true', 'false'], 'Baptized in Christ Embassy is required'),
});

export default spiritualSchema;