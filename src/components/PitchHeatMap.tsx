import React, { useState } from 'react';
import { HeatMapPoint, PlayerPosition } from '../types';
import { Flame, Eye, Layers } from 'lucide-react';

interface PitchHeatMapProps {
  homeHeatMap?: HeatMapPoint[];
  awayHeatMap?: HeatMapPoint[];
  playerHeatMap?: HeatMapPoint[];
  homeTeamName?: string;
  awayTeamName?: string;
  playerName?: string;
  players?: PlayerPosition[];
  onPlayerSelect?: (player: PlayerPosition) => void;
  selectedPlayerId?: string;
}

export const PitchHeatMap: React.FC<PitchHeatMapProps> = ({
  homeHeatMap = [],
  awayHeatMap = [],
  playerHeatMap,
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  playerName,
  players = [],
  onPlayerSelect,
  selectedPlayerId,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'away' | 'both' | 'player'>(
    playerHeatMap ? 'player' : 'both'
  );
  const [heatRadius, setHeatRadius] = useState<number>(32);
  const [showPlayerNodes, setShowPlayerNodes] = useState<boolean>(true);

  let pointsToRender: HeatMapPoint[] = [];

  if (activeTab === 'player' && playerHeatMap) {
    pointsToRender = playerHeatMap;
  } else if (activeTab === 'home') {
    pointsToRender = homeHeatMap;
  } else if (activeTab === 'away') {
    pointsToRender = awayHeatMap;
  } else {
    pointsToRender = [...homeHeatMap, ...awayHeatMap];
  }

  return (
    <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Tactical Heat Map
              {playerName && <span className="text-cyan-400 text-sm font-normal">({playerName})</span>}
            </h3>
            <p className="text-xs text-slate-400">Positional touch density & activity zones</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {!playerHeatMap && (
            <>
              <button
                onClick={() => setActiveTab('both')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'both'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'home'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {homeTeamName}
              </button>
              <button
                onClick={() => setActiveTab('away')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'away'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {awayTeamName}
              </button>
            </>
          )}

          {players.length > 0 && (
            <button
              onClick={() => setShowPlayerNodes(!showPlayerNodes)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 border ${
                showPlayerNodes
                  ? 'bg-slate-800 border-cyan-500/40 text-cyan-300'
                  : 'bg-transparent border-slate-800 text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Positions
            </button>
          )}
        </div>
      </div>

      {/* Football Pitch SVG Container */}
      <div className="relative w-full aspect-[16/10] bg-emerald-950/40 rounded-xl overflow-hidden border border-emerald-500/30 shadow-inner group">
        {/* Pitch Lines */}
        <svg
          className="absolute inset-0 w-full h-full stroke-emerald-400/30 fill-none"
          strokeWidth="1.5"
          viewBox="0 0 1000 650"
          preserveAspectRatio="none"
        >
          {/* Pitch boundary */}
          <rect x="20" y="20" width="960" height="610" rx="4" />
          {/* Center line */}
          <line x1="500" y1="20" x2="500" y2="630" />
          {/* Center circle */}
          <circle cx="500" cy="325" r="90" />
          <circle cx="500" cy="325" r="3" fill="#10B981" />

          {/* Left Penalty Area */}
          <rect x="20" y="145" width="165" height="360" />
          <rect x="20" y="235" width="55" height="180" />
          <circle cx="130" cy="325" r="3" fill="#10B981" />
          <path d="M 185 260 A 90 90 0 0 1 185 390" />

          {/* Right Penalty Area */}
          <rect x="815" y="145" width="165" height="360" />
          <rect x="925" y="235" width="55" height="180" />
          <circle cx="870" cy="325" r="3" fill="#10B981" />
          <path d="M 815 260 A 90 90 0 0 0 815 390" />

          {/* Corner arcs */}
          <path d="M 20 35 A 15 15 0 0 1 35 20" />
          <path d="M 20 615 A 15 15 0 0 0 35 630" />
          <path d="M 980 35 A 15 15 0 0 0 965 20" />
          <path d="M 980 615 A 15 15 0 0 1 965 630" />
        </svg>

        {/* Tactical Stripes Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_50%,transparent_50%)] bg-[length:10%_100%] pointer-events-none" />

        {/* Heat Map Spots Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {pointsToRender.map((point, idx) => {
            const size = heatRadius * (0.8 + point.intensity * 0.6);
            return (
              <div
                key={idx}
                className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `radial-gradient(circle, rgba(239, 68, 68, ${point.intensity * 0.85}) 0%, rgba(245, 158, 11, ${point.intensity * 0.6}) 40%, rgba(6, 182, 212, ${point.intensity * 0.3}) 75%, transparent 100%)`,
                  filter: 'blur(8px)',
                }}
              />
            );
          })}
        </div>

        {/* Optional Player Node Overlay */}
        {showPlayerNodes &&
          players.map((player) => {
            const isSelected = selectedPlayerId === player.id;
            return (
              <button
                key={player.id}
                onClick={() => onPlayerSelect && onPlayerSelect(player)}
                style={{ left: `${player.x}%`, top: `${player.y}%` }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group/player z-10 transition-all ${
                  isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-colors border ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 border-white shadow-cyan-400/50'
                      : 'bg-slate-900/90 text-cyan-300 border-cyan-500/50 group-hover/player:border-cyan-300'
                  }`}
                >
                  {player.number}
                </div>
                <span className="text-[10px] font-semibold text-slate-200 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap shadow">
                  {player.name.split(' ').pop()}
                  {player.rating && (
                    <span className="ml-1 text-cyan-400 font-mono">({player.rating})</span>
                  )}
                </span>
              </button>
            );
          })}

        {/* Pitch Direction Legend */}
        <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] text-emerald-400/80 font-mono uppercase bg-slate-950/70 px-2.5 py-1 rounded-md border border-emerald-500/20 backdrop-blur-sm">
          <span>Attacking Direction &#x2192;</span>
        </div>
      </div>

      {/* Heat Density Scale Legend */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          Intensity Scale:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px]">Low</span>
          <div className="w-28 h-2 rounded-full bg-gradient-to-r from-cyan-500/40 via-amber-500/80 to-red-600 shadow-inner" />
          <span className="text-[10px] text-red-400 font-bold">High (Hot Zone)</span>
        </div>
      </div>
    </div>
  );
};
