import * as yup from 'yup';

const professionalSchema = yup.object().shape({
  profession: yup
    .string()
    .required('Profession is required')
    .min(2, 'Profession is too short')
    .max(50, 'Profession is too long')
    .test('no-invalid-chars', 'Profession contains invalid characters', value => !/[<>]/.test(value || '')),
  occupation: yup
    .string()
    .required('Occupation is required')
    .min(2, 'Occupation is too short')
    .max(50, 'Occupation is too long')
    .test('no-invalid-chars', 'Occupation contains invalid characters', value => !/[<>]/.test(value || '')),
  work_address: yup
    .string()
    .required('Work address is required')
    .min(5, 'Work address is too short')
    .max(100, 'Work address is too long')
    .test('no-invalid-chars', 'Work address contains invalid characters', value => !/[<>]/.test(value || '')),
  rfid_tag: yup
    .string()
    .notRequired()
    .nullable()
    .test(
      'rfid-format',
      'RFID must be 5-30 letters, numbers, or dashes',
      value => !value || /^[A-Za-z0-9\-]{5,30}$/.test(value)
    ),
});

export default professionalSchema;