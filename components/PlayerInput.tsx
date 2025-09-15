import React, { useState } from 'react';

interface PlayerInputProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Or type your own command..."
        disabled={isLoading}
        className="flex-grow bg-slate-700 border border-slate-600 text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-800 disabled:cursor-not-allowed"
        aria-label="Custom command input"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div> : 'Submit'}
      </button>
    </form>
  );
};

export default PlayerInput;
