import React from 'react';

const DisclaimerWebsite: React.FC = () => {
  return (
    <div className="bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
      <strong className="font-bold">Developer Tip: </strong>
      <span className="block sm:inline">
        The generated code is a starting point. Always review and test it thoroughly. Image and audio assets are not created directly; placeholders are used instead.
      </span>
    </div>
  );
};

export default DisclaimerWebsite;
