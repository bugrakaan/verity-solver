'use client'

import { useState, useRef, useEffect } from 'react'

export default function CustomDropdown({ options, value, onChange, className = '', size = 'normal' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={`customDropdown ${size} ${className} ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <div 
        className="dropdownHeader"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label || 'Select an option'}</span>
        <svg 
          className="arrow"
          width={size === 'small' ? "12" : "16"} 
          height={size === 'small' ? "12" : "16"} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      
      <div className="dropdownOptions">
        {options.map((option) => (
          <div
            key={option.value}
            className={`dropdownOption ${value === option.value ? 'selected' : ''}`}
            onClick={() => {
              onChange(option.value)
              setIsOpen(false)
            }}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  )
} 