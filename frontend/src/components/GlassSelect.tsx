"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowDown2 } from "iconsax-react";

interface GlassSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function GlassSelect({ value, onChange, options, placeholder = "Select an option..." }: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={selectRef} tabIndex={0} style={{ position: 'relative', width: '100%', marginTop: '0.5rem', outline: 'none' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: `1px solid ${isOpen ? '#2ecc71' : 'rgba(255, 255, 255, 0.1)'}`,
          backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          color: selectedOption ? '#fff' : 'rgba(255, 255, 255, 0.4)',
          fontSize: '0.95rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(46, 204, 113, 0.1)' : 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ArrowDown2 
          size="18" 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.3s ease',
            color: isOpen ? '#2ecc71' : 'rgba(255,255,255,0.4)',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          backgroundColor: 'rgba(10, 31, 18, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(46, 204, 113, 0.2)',
          borderRadius: '12px',
          maxHeight: '250px',
          overflowY: 'auto',
          zIndex: 50,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8)',
          padding: '0.5rem'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                color: value === opt.value ? '#2ecc71' : '#e2f5e9',
                backgroundColor: value === opt.value ? 'rgba(46, 204, 113, 0.1)' : 'transparent',
                fontWeight: value === opt.value ? 600 : 400,
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9rem' }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
