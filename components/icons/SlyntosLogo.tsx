import React from 'react';

const SlyntosLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Slyntos AI Logo"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#8B5CF6' }} /> 
        <stop offset="100%" style={{ stopColor: '#3B82F6' }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#glow)">
      {/* Main S-shape / chat bubble */}
      <path 
        d="M62.5,15 C45,15 30,27.5 30,45 C30,55 35,65 45,70 L45,85 L60,70 C70,68 85,60 85,45 C85,27.5 77.5,15 62.5,15 Z" 
        fill="url(#logoGradient)"
        transform="rotate(-15, 57.5, 50)"
      />
      
      {/* Inner sparkle/star */}
      <path 
        d="M50 40 L52.5 47.5 L60 50 L52.5 52.5 L50 60 L47.5 52.5 L40 50 L47.5 47.5 Z" 
        fill="white"
        opacity="0.9"
      />
    </g>
  </svg>
);

export default SlyntosLogo;
