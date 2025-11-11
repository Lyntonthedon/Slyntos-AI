import React from 'react';

const RocketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M10.899 2.11a1.5 1.5 0 00-1.798 0l-6.75 4.5a1.5 1.5 0 00.9 2.763l3.801-.95.01 4.328-1.28 1.28a.75.75 0 000 1.06l1.768 1.768a.75.75 0 001.06 0l1.28-1.28.01 3.582a1.5 1.5 0 002.898 0l.01-3.582 1.28 1.28a.75.75 0 001.06 0l1.768-1.768a.75.75 0 000-1.06l-1.28-1.28.01-4.328 3.801.95a1.5 1.5 0 00.9-2.763l-6.75-4.5z" />
    <path d="M12.25 18.5a.75.75 0 01-1.5 0V17a.75.75 0 011.5 0v1.5z" />
  </svg>
);

export default RocketIcon;
