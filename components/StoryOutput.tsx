
import React from 'react';
import DialogueBox from './DialogueBox';

interface StoryOutputProps {
  dialogue: string;
  onDialogueFinished: () => void;
  showActions: boolean;
  possibleActions: string[];
  onActionClick: (action: string) => void;
  isLoading: boolean;
  error: string | null;
}

const StoryOutput: React.FC<StoryOutputProps> = ({ 
  dialogue, 
  onDialogueFinished,
  showActions, 
  possibleActions, 
  onActionClick, 
  isLoading, 
  error 
}) => {
  
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-inner h-full flex flex-col border border-slate-700">
      <div className="flex-grow">
        <DialogueBox text={dialogue} onFinished={onDialogueFinished} />
      </div>
      
      {/* Action Area */}
      <div className="mt-6 pt-4 border-t border-slate-600 min-h-[120px]">
        {showActions && !isLoading && (
          <div>
            <h3 className="text-lg font-bold text-amber-400 mb-3 animate-fade-in">What do you do next?</h3>
            <div className="flex flex-wrap gap-2 animate-fade-in">
                {possibleActions.map((action, index) => (
                    <button key={index} onClick={() => onActionClick(action)} disabled={isLoading} className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed">
                        {action}
                    </button>
                ))}
            </div>
          </div>
        )}
        
        {isLoading && (
            <div className="flex items-center space-x-3 text-slate-400">
                <div className="h-2 w-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-amber-400 rounded-full animate-bounce"></div>
                <span className="text-sm">The Dungeon Master is thinking...</span>
            </div>
        )}
         {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default StoryOutput;
