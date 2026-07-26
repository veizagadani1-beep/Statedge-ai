import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { PitchHeatMap } from './PitchHeatMap';
import { User, X, Zap, Award, BarChart2, Shield } from 'lucide-react';

interface PlayersViewProps {
  player: PlayerStats | null;
  onClose: () => void;
  onOpenAiChat: (prompt: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({ player, onClose, onOpenAiChat }) => {
  if (!player) return null;

  const attrs = player.attributes || {
    pace: 80,
    shooting: 80,
    passing: 80,
    dribbling: 80,
    defending: 50,
    physical: 75,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0E1524] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm text-white">Player Performance Index</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Profile Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#131C2E] to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <img
                src={player.photo}
                alt={player.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
              />
              <div>
                <h2 className="text-xl font-black text-white">{player.name}</h2>
                <p className="text-xs text-slate-400">
                  {player.teamName} • #{player.number} • {player.position}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-300">
                  <span>{player.nationality}</span>
                  <span>•</span>
                  <span>{player.age} y/o</span>
                  <span>•</span>
                  <span className="text-amber-400 font-mono font-bold">{player.marketValue}</span>
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">StatEdge Rating</span>
              <p className="text-2xl font-black font-mono text-amber-400">{player.rating}</p>
            </div>
          </div>

          {/* Key Per 90 Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Goals (xG)</span>
              <p className="text-lg font-mono font-black text-white">{player.goals} <span className="text-xs text-slate-500">({player.expectedGoals})</span></p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Assists (xA)</span>
              <p className="text-lg font-mono font-black text-white">{player.assists} <span className="text-xs text-slate-500">({player.expectedAssists})</span></p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Key Passes / 90</span>
              <p className="text-lg font-mono font-black text-cyan-400">{player.keyPassesPer90}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Dribbles / 90</span>
              <p className="text-lg font-mono font-black text-emerald-400">{player.dribblesCompletedPer90}</p>
            </div>
          </div>

          {/* Player Individual Pitch Coverage Heat Map */}
          {player.heatMapPoints && player.heatMapPoints.length > 0 && (
            <PitchHeatMap
              homeHeatMap={player.heatMapPoints}
              homeTeamName={`${player.name} (${player.position}) Touch Heat Map`}
            />
          )}

          {/* Attribute Radar Attribute Bars */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Attribute Rating Breakdown</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                { label: 'Pace', val: attrs.pace, color: 'bg-cyan-500' },
                { label: 'Shooting', val: attrs.shooting, color: 'bg-amber-500' },
                { label: 'Passing', val: attrs.passing, color: 'bg-emerald-500' },
                { label: 'Dribbling', val: attrs.dribbling, color: 'bg-teal-500' },
                { label: 'Defending', val: attrs.defending, color: 'bg-rose-500' },
                { label: 'Physicality', val: attrs.physical, color: 'bg-purple-500' },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className="text-white font-mono">{stat.val}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div style={{ width: `${stat.val}%` }} className={`h-full ${stat.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenAiChat(`Provide a scout report and tactical analysis for ${player.name} (${player.teamName})`);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 shadow-lg shadow-amber-500/20"
            >
              <span>Ask Gemini Scout Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
