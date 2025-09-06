import React, { useRef } from 'react';

export default function OTPInput({ value, onChange, length = 6 }) {
  const inputsRef = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 1);
    let newValue = value.split('');
    newValue[idx] = val;
    newValue = newValue.join('');
    onChange(newValue);

    // Move to next input if filled
    if (val && idx < length - 1) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, length);
    if (paste) {
      onChange(paste.padEnd(length, ''));
      // Focus last filled input
      const lastIdx = paste.length - 1;
      if (inputsRef.current[lastIdx]) {
        inputsRef.current[lastIdx].focus();
      }
      e.preventDefault();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={el => inputsRef.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={e => handleChange(e, idx)}
          onPaste={handlePaste}
          style={{
            width: 40,
            height: 40,
            textAlign: 'center',
            fontSize: 24,
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        />
      ))}
    </div>
  );
}