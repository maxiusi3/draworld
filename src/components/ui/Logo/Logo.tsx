import React from 'react';

export const Logo = () => {
  return (
    <div className="flex items-center">
      <svg height="32" width="32">
        <circle cx="16" cy="16" r="16" fill="#EC4899" />
      </svg>
      <span className="ml-2 text-lg font-bold">Draworld</span>
    </div>
  );
};