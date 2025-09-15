
import React from 'react';

const Loader: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mb-4"></div>
      <p className="text-lg font-semibold">{message}</p>
    </div>
  );
};

export default Loader;
