
import React from 'react';
import type { PlayerState } from '../types';

interface PlayerStatsProps {
  playerState: PlayerState;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerState }) => {
  const healthPercentage = Math.max(0, playerState.health);

  const getHealthColor = () => {
    if (healthPercentage > 60) return 'bg-green-500';
    if (healthPercentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg shadow-lg border border-slate-700">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-gray-300">Health</span>
          <span className="font-bold text-white">{playerState.health} / 100</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getHealthColor()}`}
            style={{ width: `${healthPercentage}%` }}
          ></div>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-300 mb-2">Inventory</h3>
        <div className="flex flex-wrap gap-2">
            {playerState.inventory.length > 0 ? (
                playerState.inventory.map((item, index) => (
                    <div key={index} className="bg-slate-700 text-sm text-gray-200 px-3 py-1 rounded-full">
                        {item}
                    </div>
                ))
            ) : (
                <p className="text-slate-400 text-sm italic">Your pockets are empty.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
