import React, { useState } from 'react';
import { Match, LeagueId } from '../types';
import { LEAGUES } from '../data/mockFootballData';
import { Search, Calendar, Sparkles, Activity, Clock, CheckCircle2, Bookmark, ArrowRight } from 'lucide-react';

interface MatchesViewProps {
  matches: Match[];
  selectedLeague: LeagueId | 'all';
  setSelectedLeague: (league: LeagueId | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectMatch: (match: Match) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  selectedLeague,
  setSelectedLeague,
  searchQuery,
  setSearchQuery,
  onSelectMatch,
  favorites,
  toggleFavorite,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'FINISHED'>('ALL');

  const filtered = matches.filter((m) => {
    const matchesLeague = selectedLeague === 'all' || m.leagueId === selectedLeague;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesQuery =
      !searchQuery ||
      m.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLeague && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5 pb-20">
      {/* Title & Stats summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <span>Football Fixtures & Live Scores</span>
          </h1>
          <p className="text-xs text-slate-400">Detailed stats, xG predictions & betting odds</p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {(['ALL', 'LIVE', 'UPCOMING', 'FINISHED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'LIVE' ? '🔴 Live' : st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Search and League Selector */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* League selector row */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedLeague('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedLeague === 'all'
                ? 'bg-slate-800 text-white font-bold border border-slate-700'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Competitions
          </button>
          {LEAGUES.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLeague(l.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedLeague === l.id
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No matches found</h3>
          <p className="text-xs text-slate-500">Try adjusting your league or search filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => {
            const isFav = favorites.includes(match.id);

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match)}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all hover:bg-slate-900 cursor-pointer group shadow-lg"
              >
                {/* Match Header */}
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">
                      {LEAGUES.find((l) => l.id === match.leagueId)?.name || 'Match'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="truncate max-w-[180px]">{match.venue}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {match.status === 'LIVE' && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        {match.minute}' LIVE
                      </span>
                    )}
                    {match.status === 'UPCOMING' && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {match.startTime}
                      </span>
                    )}
                    {match.status === 'FINISHED' && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        FT
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(match.id);
                      }}
                      className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Scoreline Box */}
                <div className="grid grid-cols-12 items-center py-2">
                  {/* Home Team */}
                  <div className="col-span-5 flex items-center gap-3">
                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-9 h-9 object-contain" />
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                        {match.homeTeam.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">Odds: {match.odds.homeWin}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-center">
                    {match.status === 'LIVE' || match.status === 'FINISHED' ? (
                      <span className="text-2xl font-black font-mono text-cyan-400">
                        {match.homeTeam.score} - {match.awayTeam.score}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="col-span-5 flex items-center justify-end gap-3 text-right">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                        {match.awayTeam.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">Odds: {match.odds.awayWin}</p>
                    </div>
                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-9 h-9 object-contain" />
                  </div>
                </div>

                {/* Footer preview stats */}
                {match.aiInsight && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Predicted Score: <strong className="text-cyan-300 font-mono">{match.aiInsight.predictedScore}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Full Stats & Lineup</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
