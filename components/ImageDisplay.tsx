
import React from 'react';

interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, isLoading }) => {
  return (
    <div className="w-full aspect-video bg-slate-800 rounded-lg shadow-xl overflow-hidden relative border border-slate-700">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          <div className="text-slate-500">Generating scene...</div>
        </div>
      )}
      {!isLoading && imageUrl && (
        <img src={imageUrl} alt="Generated scene" className="w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-100" />
      )}
       {!isLoading && !imageUrl && (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <div className="text-slate-500 text-center p-4">
             <i className="fas fa-image text-5xl mb-4"></i>
            <p>The ethereal mists have yet to reveal this scene.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
