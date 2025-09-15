
import React, { useState, useEffect, useCallback } from 'react';

interface DialogueBoxProps {
  text: string;
  onFinished: () => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ text, onFinished }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const memoizedOnFinished = useCallback(onFinished, []);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      memoizedOnFinished(); // Ensure actions can show if text is empty
      return;
    }

    setIsTyping(true);
    setDisplayedText(text.charAt(0)); // Initialize with the first character to fix bug
    let i = 1;

    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        memoizedOnFinished();
      }
    }, 25); // Typewriter speed

    return () => clearInterval(typingInterval);
  }, [text, memoizedOnFinished]);

  return (
    <div className="border-4 border-double border-slate-500 bg-slate-800/70 p-6 rounded-lg shadow-lg h-full flex flex-col justify-between min-h-[200px] relative">
      <p className="text-gray-200 leading-relaxed font-serif text-xl whitespace-pre-wrap">
        {displayedText}
        {isTyping && <span className="inline-block w-2 h-5 bg-gray-200 animate-pulse ml-1" aria-hidden="true"></span>}
      </p>
      {!isTyping && text && (
        <div className="self-end mt-4 absolute bottom-4 right-4">
          <i className="fas fa-caret-down text-3xl text-amber-400 animate-bounce"></i>
        </div>
      )}
    </div>
  );
};

export default DialogueBox;
