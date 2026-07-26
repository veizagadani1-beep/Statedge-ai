import React, { useState, useEffect } from 'react';
import { LeagueId, StandingRow } from '../types';
import { LEAGUES } from '../data/mockFootballData';
import { fetchStandings } from '../services/footballApi';
import { BarChart2, RefreshCw, AlertCircle } from 'lucide-react';

interface StandingsViewProps {
  selectedLeague: LeagueId;
  setSelectedLeague: (league: LeagueId) => void;
  onSelectTeam: (teamId: string) => void;
}

export const StandingsView: React.FC<StandingsViewProps> = ({
  selectedLeague,
  setSelectedLeague,
  onSelectTeam,
}) => {
  const [split, setSplit] = useState<'OVERALL' | 'HOME' | 'AWAY'>('OVERALL');
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchStandings(selectedLeague).then((data) => {
      if (isMounted) {
        setRows(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedLeague]);

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-cyan-400" />
            <span>League Standings & Form Matrix</span>
          </h1>
          <p className="text-xs text-slate-400">Official league tables, UEFA spots, form history & goal differential</p>
        </div>

        {/* Overall / Home / Away Split Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {(['OVERALL', 'HOME', 'AWAY'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSplit(s)}
              className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                split === s
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* League Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {LEAGUES.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedLeague(l.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedLeague === l.id
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{l.name}</span>
          </button>
        ))}
      </div>

      {/* Standings Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-10">Pos</th>
                <th className="py-3 px-4">Club</th>
                <th className="py-3 px-2 text-center">P</th>
                <th className="py-3 px-2 text-center">W</th>
                <th className="py-3 px-2 text-center">D</th>
                <th className="py-3 px-2 text-center">L</th>
                <th className="py-3 px-2 text-center">GF</th>
                <th className="py-3 px-2 text-center">GA</th>
                <th className="py-3 px-2 text-center">GD</th>
                <th className="py-3 px-3 text-center font-black text-cyan-400">Pts</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">Form</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                    <span>Loading API-Football Standings...</span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="font-bold text-white text-xs">Standings Data Not Available</p>
                    <p className="text-[11px] text-slate-500">API-Football did not return table data for this competition season.</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.position || row.teamId}
                    onClick={() => onSelectTeam(row.teamId)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                  {/* Position with zone color indicator */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-black ${
                        row.zone === 'ucl'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : row.zone === 'uel'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : row.zone === 'relegation'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {row.position}
                    </span>
                  </td>

                  {/* Club */}
                  <td className="py-3.5 px-4 font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-3">
                    <img src={row.teamLogo} alt={row.teamName} className="w-6 h-6 object-contain" />
                    <span>{row.teamName}</span>
                  </td>

                  <td className="py-3.5 px-2 text-center font-mono">{row.played}</td>
                  <td className="py-3.5 px-2 text-center font-mono text-emerald-400 font-bold">{row.won}</td>
                  <td className="py-3.5 px-2 text-center font-mono text-amber-400">{row.drawn}</td>
                  <td className="py-3.5 px-2 text-center font-mono text-rose-400">{row.lost}</td>
                  <td className="py-3.5 px-2 text-center font-mono">{row.gf}</td>
                  <td className="py-3.5 px-2 text-center font-mono">{row.ga}</td>
                  <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-200">
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-black text-cyan-400 text-sm">
                    {row.points}
                  </td>

                  {/* Form Badges */}
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {row.form.map((f, i) => (
                        <span
                          key={i}
                          className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center text-white ${
                            f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500/30 border border-cyan-500/60" />
            UEFA Champions League
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/60" />
            UEFA Europa League
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/60" />
            Relegation Zone
          </span>
        </div>
      </div>
    </div>
  );
};
