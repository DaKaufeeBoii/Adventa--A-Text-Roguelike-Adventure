import React, { useEffect, useRef } from 'react';

interface LogModalProps {
  history: string[];
  isOpen: boolean;
  onClose: () => void;
}

const LogModal: React.FC<LogModalProps> = ({ history, isOpen, onClose }) => {
  const endOfLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-2xl font-bold text-amber-400 font-serif">Adventure Log</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-light">&times;</button>
        </header>
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          {history.map((entry, index) => (
            <p key={index} className={`font-serif text-lg mb-3 ${entry.startsWith('>') ? 'text-amber-300 italic pl-4 border-l-2 border-amber-500/30' : 'text-gray-300'}`}>
              {entry.startsWith('>') ? entry.substring(1).trim() : entry}
            </p>
          ))}
          <div ref={endOfLogRef} />
        </div>
      </div>
    </div>
  );
};

export default LogModal;
