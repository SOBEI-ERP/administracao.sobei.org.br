'use client';

import { useState, useRef, useEffect } from 'react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function CustomDatePicker({ value, onChange, placeholder = 'dd/mm/aaaa', style, className }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [prevValue, setPrevValue] = useState(value);
  const containerRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const [y, m, d] = value.split('-');
      if (y && m && d) {
        setViewDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
      }
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setViewDate(today);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    // Empty slots for previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="custom-datepicker-day empty"></div>);
    }
    
    // Actual days
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = value === `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      
      days.push(
        <div 
          key={d} 
          className={`custom-datepicker-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleSelectDate(d); }}
        >
          {d}
        </div>
      );
    }
    
    return days;
  };

  const formatDisplayValue = (val) => {
    if (!val) return placeholder;
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className={`custom-datepicker-container ${className || ''}`} style={style} ref={containerRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'custom-select-trigger--open' : ''} ${!value ? 'custom-select-trigger--placeholder' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{formatDisplayValue(value)}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="custom-select-icon" style={{ transform: 'translateY(-50%)' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      
      {mounted && isOpen && (
        <div className="custom-datepicker-dropdown">
          <div className="custom-datepicker-header">
            <button className="custom-datepicker-nav" onClick={handlePrevMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span className="custom-datepicker-month-year">
              {MONTHS[viewDate.getMonth()]} de {viewDate.getFullYear()}
            </span>
            <button className="custom-datepicker-nav" onClick={handleNextMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          
          <div className="custom-datepicker-weekdays">
            {WEEKDAYS.map((day, idx) => (
              <div key={idx} className="custom-datepicker-weekday">{day}</div>
            ))}
          </div>
          
          <div className="custom-datepicker-grid">
            {renderCalendar()}
          </div>
          
          <div className="custom-datepicker-footer">
            <button className="custom-datepicker-action" onClick={handleClear}>Limpar</button>
            <button className="custom-datepicker-action" onClick={handleToday}>Hoje</button>
          </div>
        </div>
      )}
    </div>
  );
}
