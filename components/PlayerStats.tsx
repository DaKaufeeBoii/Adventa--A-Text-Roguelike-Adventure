// Fix: Implemented PlayerStats component
import React from 'react';
import { PlayerStats as PlayerStatsType } from '../types';

interface PlayerStatsProps {
  stats: PlayerStatsType | null;
  onOpenInventory: () => void;
}

const StatDisplay: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="text-center">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-xl font-bold text-gray-100">{value}</p>
    </div>
);


const PlayerStats: React.FC<PlayerStatsProps> = ({ stats, onOpenInventory }) => {
  if (!stats) {
    return (
      <div className="bg-slate-800/50 p-4 rounded-lg shadow-inner border border-slate-700 animate-pulse h-[220px]">
        <div className="h-6 bg-slate-700 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  const hpPercentage = (stats.hp / stats.maxHp) * 100;

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg shadow-inner flex flex-col justify-between border border-slate-700">
      <div>
        <h2 className="text-2xl font-bold text-amber-400 text-center font-serif">{stats.name}</h2>
        <p className="text-center text-slate-400 mb-4">The {stats.characterClass}</p>

        {/* HP Bar */}
        <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-bold text-gray-200">HP</span>
                <span className="text-sm font-mono text-gray-300">{stats.hp} / {stats.maxHp}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div 
                    className="bg-red-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${hpPercentage}%` }}
                ></div>
            </div>
        </div>

        {/* Other Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
            <StatDisplay label="Attack" value={stats.attack} />
            <StatDisplay label="Defense" value={stats.defense} />
        </div>
      </div>

      {/* Inventory */}
      <div>
        <h3 className="text-lg font-bold text-amber-400 mb-2 border-t border-slate-600 pt-3">Inventory</h3>
        {stats.inventory.length > 0 ? (
          <button 
                onClick={onOpenInventory}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left flex items-center justify-between"
            >
                <span>View Inventory</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-sm font-mono">{stats.inventory.length}</span>
            </button>
        ) : (
          <p className="text-slate-500 text-sm italic">Your pockets are empty.</p>
        )}
      </div>
    </div>
  );
};

export default PlayerStats;