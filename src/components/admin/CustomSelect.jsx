'use client';

import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, defaultOption, style, className, allowEmpty = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value 
    ? options.find(o => o.value === value)?.label || defaultOption
    : defaultOption;

  return (
    <div className={`custom-select-container ${className || ''}`} style={style} ref={containerRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'custom-select-trigger--open' : ''} ${!value ? 'custom-select-trigger--placeholder' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`custom-select-icon ${isOpen ? 'custom-select-icon--open' : ''}`}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown">
          {allowEmpty && (
            <div 
              className={`custom-select-option ${!value ? 'custom-select-option--selected' : ''}`}
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              {defaultOption}
            </div>
          )}
          {options.map((opt) => (
            <div 
              key={opt.value}
              data-value={opt.value}
              className={`custom-select-option ${value === opt.value ? 'custom-select-option--selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
