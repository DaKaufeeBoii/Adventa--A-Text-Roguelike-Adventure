import React from 'react';
import { EnemyStats as EnemyStatsType } from '../types';

interface EnemyStatsProps {
  stats: EnemyStatsType | null;
}

const EnemyStats: React.FC<EnemyStatsProps> = ({ stats }) => {
  if (!stats) {
    return null;
  }

  const hpPercentage = stats.hp > 0 ? (stats.hp / stats.maxHp) * 100 : 0;

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg shadow-inner flex flex-col justify-between border border-red-700/50 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-red-400 text-center font-serif">{stats.name}</h2>
        <p className="text-center text-slate-400 mb-4 italic">{stats.description}</p>

        {/* HP Bar */}
        <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-bold text-gray-200">HP</span>
                <span className="text-sm font-mono text-gray-300">{stats.hp} / {stats.maxHp}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${hpPercentage}%` }}
                ></div>
            </div>
        </div>

        {/* Other Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
                <p className="text-sm text-slate-400">Attack</p>
                <p className="text-xl font-bold text-gray-100">{stats.attack}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-slate-400">Defense</p>
                <p className="text-xl font-bold text-gray-100">{stats.defense}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EnemyStats;