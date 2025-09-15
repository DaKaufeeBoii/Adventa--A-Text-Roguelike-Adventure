// Fix: Implemented CharacterCreation component
import React, { useState } from 'react';
import Loader from './Loader';
import { audioService } from '../services/audioService';

interface CharacterCreationProps {
  onCharacterCreate: (name: string, characterClass: string) => void;
  isLoading: boolean;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onCharacterCreate, isLoading }) => {
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('Warrior');

  const classes = ['Warrior', 'Mage', 'Rogue'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      audioService.start(); // This user interaction is required to enable audio
      onCharacterCreate(name.trim(), characterClass);
    }
  };

  if (isLoading) {
      return <Loader message="The Dungeon Master is crafting your destiny..." />;
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-slate-800/50 border border-slate-700 rounded-lg shadow-2xl text-white animate-fade-in">
        <h2 className="text-3xl font-bold text-amber-400 text-center mb-6 font-serif">Create Your Hero</h2>
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <label htmlFor="name" className="block text-slate-300 text-sm font-bold mb-2">
                    What is your name?
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="e.g., Kaelen the Brave"
                    required
                />
            </div>
            <div className="mb-8">
                <label className="block text-slate-300 text-sm font-bold mb-2">
                    Choose your class:
                </label>
                <div className="flex justify-center gap-4">
                    {classes.map((c) => (
                        <button
                            type="button"
                            key={c}
                            onClick={() => setCharacterClass(c)}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                characterClass === c 
                                ? 'bg-amber-500 text-slate-900 ring-2 ring-amber-300 shadow-lg' 
                                : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>
            <button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="w-full bg-amber-500 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                Begin Your Adventure
            </button>
        </form>
    </div>
  );
};

export default CharacterCreation;
