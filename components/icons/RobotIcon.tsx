import React from 'react';

const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <style>
      {`
        @keyframes robot-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes antenna-blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.5; }
        }
        .robot-body { animation: robot-bob 2s ease-in-out infinite; }
        .robot-antenna { animation: antenna-blink 1.5s linear infinite; }
      `}
    </style>
    <g className="robot-body">
      <path d="M4.5 7.5A2.5 2.5 0 017 5h10a2.5 2.5 0 012.5 2.5v7.5a2.5 2.5 0 01-2.5 2.5H7a2.5 2.5 0 01-2.5-2.5V7.5z" />
      <path
        fillRule="evenodd"
        d="M6 10.5a.5.5 0 01.5-.5h11a.5.5 0 010 1H6.5a.5.5 0 01-.5-.5zm.25 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zm3.5 0a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z"
        clipRule="evenodd"
      />
      <circle cx="15.5" cy="13.25" r="1.25" fill="rgba(0,0,0,0.3)" />
    </g>
    <path
      className="robot-antenna"
      d="M12 5a.75.75 0 01-.75-.75V3a.75.75 0 011.5 0v1.25A.75.75 0 0112 5z"
    />
    <circle className="robot-antenna" cx="12" cy="2" r="1" fill="yellow" />
  </svg>
);

export default RobotIcon;
