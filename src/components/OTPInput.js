import React, { useRef } from 'react';

export default function OTPInput({ value = '', onChange, length = 6 }) {
  const inputsRef = useRef([]);

  const focusAt = (idx) => {
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  const buildArray = (val) => {
    const arr = Array.from({ length }, (_, i) => (val && val[i] ? val[i] : ''));
    return arr;
  };

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(0, 1);
    const arr = buildArray(value);
    arr[idx] = char;
    const newVal = arr.join('');
    onChange(newVal);
    if (char && idx < length - 1) focusAt(idx + 1);
  };

  const handleKeyDown = (e, idx) => {
    const key = e.key;
    if (key === 'Backspace') {
      const arr = buildArray(value);
      if (arr[idx]) {
        arr[idx] = '';
        onChange(arr.join(''));
        return;
      }
      if (idx > 0) {
        focusAt(idx - 1);
        const prevArr = buildArray(value);
        prevArr[idx - 1] = '';
        onChange(prevArr.join(''));
      }
    } else if (key === 'ArrowLeft' && idx > 0) {
      focusAt(idx - 1);
    } else if (key === 'ArrowRight' && idx < length - 1) {
      focusAt(idx + 1);
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, length);
    if (!paste) return;
    const padded = paste.padEnd(length, '').slice(0, length);
    onChange(padded);
    const lastIdx = Math.min(paste.length - 1, length - 1);
    if (inputsRef.current[lastIdx]) inputsRef.current[lastIdx].focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={(value && value[idx]) || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          style={{
            width: 44,
            height: 44,
            textAlign: 'center',
            fontSize: 20,
            border: '1px solid #ccc',
            borderRadius: 6,
            outline: 'none',
          }}
        />
      ))}
    </div>
  );
}