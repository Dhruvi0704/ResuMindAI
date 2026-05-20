import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils'; // Assuming Shadcn's class merger exists

export interface EditableFieldProps {
  value: string;
  field: string;
  sectionId: string;
  variant: 'single' | 'multiline' | 'heading';
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onUpdate: (value: string) => void;
}

export default function EditableField({
  value,
  field,
  sectionId,
  variant,
  placeholder = "Click to edit...",
  className = "",
  style,
  onUpdate
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync internal state with external value changes when not editing
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  // Focus the input automatically when entering edit mode, and move cursor to end
  useEffect(() => {
    if (isEditing && inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.focus();
      if (inputRef.current.setSelectionRange) {
        inputRef.current.setSelectionRange(length, length);
      }
    }
  }, [isEditing]);

  // Handle auto-resizing for multiline textareas
  useEffect(() => {
    if (isEditing && variant === 'multiline' && inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [tempValue, isEditing, variant]);

  const handleSave = () => {
    if (tempValue.trim() !== value.trim()) {
      onUpdate(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancel();
      return;
    }

    // For single line or heading, enter saves.
    if (e.key === 'Enter') {
      if (variant !== 'multiline' || (variant === 'multiline' && !e.shiftKey && e.ctrlKey)) {
        // Normally Shift+Enter pushes new line in multiline. 
        // For simplicity, multiline requires blur to save, or Ctrl+Enter.
        if (variant !== 'multiline') {
          e.preventDefault();
          handleSave();
        } else if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSave();
        }
      }
    }
  };

  const viewStyles = cn(
    "cursor-text px-1.5 py-0.5 rounded transition-colors duration-200 border border-transparent",
    "hover:bg-[#6C63FF]/[0.08]", 
    !value && "text-slate-400 italic opacity-80",
    variant === 'heading' ? "font-bold text-2xl" : "",
    className
  );

  const editStyle: React.CSSProperties = {
    background: '#1e1e2e',
    color: '#ffffff',
    border: '2px solid #6C63FF',
    borderRadius: '4px',
    padding: '2px 6px',
    outline: 'none',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    fontWeight: 'inherit',
    width: '100%',
    caretColor: '#6C63FF',
    boxShadow: '0 0 0 3px rgba(108,99,255,0.2)'
  };

  if (isEditing) {
    if (variant === 'multiline') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`cv-editable-input ${className}`}
          style={{
            ...editStyle,
            ...style, // allow external overrides
            resize: 'vertical',
            minHeight: '60px',
            lineHeight: '1.5'
          }}
          placeholder={placeholder}
          rows={3}
          autoFocus
        />
      );
    }

    if (variant === 'heading') {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`cv-editable-input ${className}`}
          style={{
            ...editStyle,
            ...style,
            fontSize: 'inherit',
            fontWeight: 'inherit',
            letterSpacing: 'inherit'
          }}
          placeholder={placeholder}
          autoFocus
        />
      );
    }

    // single (default)
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`cv-editable-input ${className}`}
        style={{ ...editStyle, ...style }}
        placeholder={placeholder}
        autoFocus
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className={viewStyles}
      style={{
        ...style,
        cursor: 'text',
        borderRadius: '3px',
        padding: '1px 3px',
        transition: 'background 0.15s',
        color: value ? 'inherit' : '#888',
        fontStyle: value ? 'normal' : 'italic',
        display: 'inline-block',
        minWidth: '20px'
      }}
      role="textbox"
      tabIndex={0}
      onFocus={() => setIsEditing(true)}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(108,99,255,0.15)';
        e.currentTarget.style.outline = '1px dashed rgba(108,99,255,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.outline = 'none';
      }}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  );
}
