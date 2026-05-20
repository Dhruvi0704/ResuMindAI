import React, { useState } from 'react';

export default function EditableSection({ children, sectionName }: { children: React.ReactNode, sectionName: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative transition-colors duration-150 rounded"
      style={{
        backgroundColor: isHovered ? 'rgba(108, 99, 255, 0.05)' : 'transparent',
      }}
    >
      {isHovered && (
        <span 
          className="edit-overlay absolute top-0.5 right-0.5 text-[10px] text-white px-1.5 py-0.5 rounded opacity-80 pointer-events-none z-10 font-medium"
          style={{ backgroundColor: '#6C63FF' }}
        >
          ✏ {sectionName}
        </span>
      )}
      {children}
    </div>
  );
}
