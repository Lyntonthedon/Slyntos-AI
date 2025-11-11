import React from 'react';

const ArrowsPointingOutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M4.25 3.5a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0V5.06l4.22 4.22a.75.75 0 001.06-1.06L6.06 4.25h1.69a.75.75 0 000-1.5H4.25zm11.5 0a.75.75 0 00-1.5 0h1.69L11.72 8.16a.75.75 0 101.06 1.06l4.22-4.22V6.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75h-2.5zM4.25 15.75V14a.75.75 0 00-1.5 0v2.5a.75.75 0 00.75.75h2.5a.75.75 0 000-1.5H5.06l4.22-4.22a.75.75 0 10-1.06-1.06L4.25 14.06zm11.5 0v-1.69L11.72 18.28a.75.75 0 101.06 1.06l4.22-4.22V16.5a.75.75 0 001.5 0v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 000 1.5h1.69z"
      clipRule="evenodd"
    />
  </svg>
);

export default ArrowsPointingOutIcon;
