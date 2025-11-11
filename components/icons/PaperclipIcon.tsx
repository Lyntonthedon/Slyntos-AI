import React from 'react';

const PaperclipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243l7-7a.75.75 0 011.06 1.06l-7 7a4.5 4.5 0 01-6.364-6.364l7-7a1.5 1.5 0 012.121 2.122l-5.303 5.303a.75.75 0 001.06 1.06l5.303-5.303a3 3 0 000-4.242z"
      clipRule="evenodd"
    />
  </svg>
);

export default PaperclipIcon;
