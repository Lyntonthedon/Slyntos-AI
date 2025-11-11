import React from 'react';

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M11 2a1 1 0 00-1-1H6a1 1 0 00-1 1v1H4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1v-1h5v1a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-1V2zm-2 0h-2v1h2V2zM4 5h12v9H4V5zm1-1v-.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4H5z" clipRule="evenodd" />
    <path d="M9 7a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" />
  </svg>
);

export default ClipboardIcon;