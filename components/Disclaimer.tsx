
import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
      <strong className="font-bold">Important: </strong>
      <span className="block sm:inline">
        This AI is designed to produce original, academic-style content. However, always verify its output and use it as a writing assistant, not a final source. It is your responsibility to ensure academic integrity and avoid plagiarism.
      </span>
    </div>
  );
};

export default Disclaimer;
