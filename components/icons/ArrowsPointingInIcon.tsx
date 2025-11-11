import React from 'react';

const ArrowsPointingInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M8.25 3.5a.75.75 0 00-1.06 0l-4.5 4.5a.75.75 0 000 1.06l4.5 4.5a.75.75 0 001.06-1.06L4.81 9.25h3.44a.75.75 0 000-1.5H4.81L8.25 4.56a.75.75 0 000-1.06zM11.75 3.5a.75.75 0 000 1.06L15.19 8H11.75a.75.75 0 000 1.5h3.44L11.75 13.94a.75.75 0 001.06 1.06l4.5-4.5a.75.75 0 000-1.06l-4.5-4.5a.75.75 0 00-1.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default ArrowsPointingInIcon;
