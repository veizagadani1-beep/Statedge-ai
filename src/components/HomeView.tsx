import React from 'react';
import { Match, LeagueId, TeamStats, PlayerStats } from '../types';
import { LEAGUES } from '../data/mockFootballData';
import {
  Flame,
  Activity,
  Sparkles,
  ChevronRight,
  Bookmark,
  ArrowUpRight,
  Shield,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface HomeViewProps {
  matches: Match[];
  loadingMatches?: boolean;
  fetchError?: string | null;
  todayDateMadrid?: string;
  onRetryMatches?: () => void;
  teams: TeamStats[];
  players: PlayerStats[];
  selectedLeague: LeagueId | 'all';
  setSelectedLeague: (league: LeagueId | 'all') => void;
  onSelectMatch: (match: Match) => void;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (player: PlayerStats) => void;
  onNavigate: (tab: any) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  matches,
  loadingMatches = false,
  fetchError = null,
  todayDateMadrid,
  onRetryMatches,
  teams,
  players,
  selectedLeague,
  setSelectedLeague,
  onSelectMatch,
  onSelectTeam,
  onSelectPlayer,
  onNavigate,
  favorites,
  toggleFavorite,
}) => {
  const filteredMatches = selectedLeague === 'all'
    ? matches
    : matches.filter((m) => m.leagueId === selectedLeague);

  const liveMatches = filteredMatches.filter((m) => m.status === 'LIVE');
  const upcomingMatches = filteredMatches.filter((m) => m.status === 'UPCOMING');
  const finishedMatches = filteredMatches.filter((m) => m.status === 'FINISHED');

  // Dynamically select featured match from today's real matches (Live > Upcoming > Finished)
  const highlightMatch = liveMatches[0] || upcomingMatches[0] || finishedMatches[0] || filteredMatches[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & League Chips */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Match Center</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </h1>
            <p className="text-xs text-slate-400">Live scores, team performance & AI match intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            {todayDateMadrid && (
              <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 shadow-inner">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{todayDateMadrid} (Madrid)</span>
              </div>
            )}

            <button
              onClick={() => onNavigate('matches')}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* League Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedLeague('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedLeague === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 All Competitions
          </button>
          {LEAGUES.map((league) => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedLeague === league.id
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{league.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loadingMatches && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-cyan-500/30 flex flex-col items-center justify-center gap-3 text-center py-10 animate-pulse">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <div>
            <h3 className="text-sm font-bold text-white">Loading Today's Live Fixtures...</h3>
            <p className="text-xs text-slate-400 mt-1">Connecting to API-Football for Europe/Madrid fixtures</p>
          </div>
        </div>
      )}

      {/* Visible API Failure Banner & Retry Button (Requirement #5) */}
      {!loadingMatches && fetchError && (
        <div className="p-5 rounded-3xl bg-rose-950/40 border border-rose-500/50 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-rose-300 flex items-center gap-2">
                <span>API-Football Request Error</span>
              </h3>
              <p className="text-xs text-rose-200/90 mt-1 font-mono break-all max-w-xl">
                {fetchError}
              </p>
            </div>
          </div>

          {onRetryMatches && (
            <button
              onClick={onRetryMatches}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry API Connection</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State when 0 Fixtures today */}
      {!loadingMatches && !fetchError && matches.length === 0 && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Calendar className="w-10 h-10 text-cyan-400/60 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Fixtures Scheduled Today</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are no matches scheduled for {todayDateMadrid || 'today'} in Europe/Madrid timezone for the selected filter. Try selecting "All Competitions".
          </p>
        </div>
      )}

      {/* Hero Featured AI Match Card (Rendered only when real match exists) */}
      {!loadingMatches && !fetchError && highlightMatch && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1524] to-slate-950 border border-cyan-500/30 p-5 sm:p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-[10px] font-extrabold uppercase tracking-wider border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Featured Today Match
              </span>
              {highlightMatch.status === 'LIVE' && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  LIVE {highlightMatch.minute}'
                </span>
              )}
              {highlightMatch.status === 'FINISHED' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  FINISHED
                </span>
              )}
            </div>

            <button
              onClick={() => toggleFavorite(highlightMatch.id)}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Bookmark
                className={`w-5 h-5 ${favorites.includes(highlightMatch.id) ? 'fill-cyan-400 text-cyan-400' : ''}`}
              />
            </button>
          </div>

          {/* Teams Header */}
          <div className="grid grid-cols-3 items-center text-center my-4">
            {/* Home Team */}
            <div
              onClick={() => onSelectTeam(highlightMatch.homeTeam.id)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <img
                src={highlightMatch.homeTeam.logo}
                alt={highlightMatch.homeTeam.name}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full p-1 bg-slate-900/80 border border-slate-700/80 group-hover:scale-110 transition-transform shadow-md"
              />
              <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                {highlightMatch.homeTeam.name}
              </span>
            </div>

            {/* Score / vs */}
            <div className="flex flex-col items-center">
              {highlightMatch.status === 'LIVE' || highlightMatch.status === 'FINISHED' ? (
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {highlightMatch.homeTeam.score} - {highlightMatch.awayTeam.score}
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-300 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
                  {highlightMatch.startTime}
                </div>
              )}
              <span className="text-[11px] text-slate-400 mt-1">{highlightMatch.venue}</span>
            </div>

            {/* Away Team */}
            <div
              onClick={() => onSelectTeam(highlightMatch.awayTeam.id)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <img
                src={highlightMatch.awayTeam.logo}
                alt={highlightMatch.awayTeam.name}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full p-1 bg-slate-900/80 border border-slate-700/80 group-hover:scale-110 transition-transform shadow-md"
              />
              <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                {highlightMatch.awayTeam.name}
              </span>
            </div>
          </div>

          {/* AI Win Probability Bar */}
          {highlightMatch.aiInsight && (
            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="text-emerald-400">{highlightMatch.homeTeam.shortName} {highlightMatch.aiInsight.winProbabilityHome}%</span>
                <span className="text-slate-400">Draw {highlightMatch.aiInsight.winProbabilityDraw}%</span>
                <span className="text-cyan-400">{highlightMatch.awayTeam.shortName} {highlightMatch.aiInsight.winProbabilityAway}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden flex">
                <div style={{ width: `${highlightMatch.aiInsight.winProbabilityHome}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${highlightMatch.aiInsight.winProbabilityDraw}%` }} className="bg-slate-500 h-full" />
                <div style={{ width: `${highlightMatch.aiInsight.winProbabilityAway}%` }} className="bg-cyan-500 h-full" />
              </div>
              <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                "{highlightMatch.aiInsight.summary}"
              </p>
            </div>
          )}

          {/* Action button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onSelectMatch(highlightMatch)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
            >
              <span>Match Center & Tactical Pitch</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Live Matches List */}
      {!loadingMatches && !fetchError && liveMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Live Matches ({liveMatches.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-slate-900 group shadow-md"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-bold text-slate-300">⚽ {m.venue}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    {m.minute}' LIVE
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5 flex-1">
                    <img src={m.homeTeam.logo} alt={m.homeTeam.name} className="w-7 h-7 object-contain" />
                    <span className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">
                      {m.homeTeam.name}
                    </span>
                  </div>
                  <span className="font-mono font-black text-lg text-cyan-400 px-3">
                    {m.homeTeam.score} - {m.awayTeam.score}
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">
                      {m.awayTeam.name}
                    </span>
                    <img src={m.awayTeam.logo} alt={m.awayTeam.name} className="w-7 h-7 object-contain" />
                  </div>
                </div>

                {m.stats && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Possession: {m.stats.possession[0]}% - {m.stats.possession[1]}%</span>
                    <span>xG: {m.stats.expectedGoals[0]} - {m.stats.expectedGoals[1]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming / Scheduled Fixtures Today */}
      {!loadingMatches && !fetchError && upcomingMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Today's Upcoming Matches ({upcomingMatches.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-slate-900 group shadow-md"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-bold text-slate-300">⚽ {m.venue}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                    {m.startTime}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5 flex-1">
                    <img src={m.homeTeam.logo} alt={m.homeTeam.name} className="w-7 h-7 object-contain" />
                    <span className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">
                      {m.homeTeam.name}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500 px-3">
                    VS
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">
                      {m.awayTeam.name}
                    </span>
                    <img src={m.awayTeam.logo} alt={m.awayTeam.name} className="w-7 h-7 object-contain" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finished Matches Today */}
      {!loadingMatches && !fetchError && finishedMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Finished Matches Today ({finishedMatches.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {finishedMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:bg-slate-900 group shadow-md"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-bold text-slate-300">⚽ {m.venue}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                    FT
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5 flex-1">
                    <img src={m.homeTeam.logo} alt={m.homeTeam.name} className="w-7 h-7 object-contain" />
                    <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                      {m.homeTeam.name}
                    </span>
                  </div>
                  <span className="font-mono font-black text-base text-emerald-400 px-3">
                    {m.homeTeam.score} - {m.awayTeam.score}
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                      {m.awayTeam.name}
                    </span>
                    <img src={m.awayTeam.logo} alt={m.awayTeam.name} className="w-7 h-7 object-contain" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Top Teams & Top Player Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Teams Form Leaderboard */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Team Form & xG Leaders</span>
            </h3>
            <button
              onClick={() => onNavigate('teams')}
              className="text-[11px] font-semibold text-cyan-400 hover:underline"
            >
              All Teams
            </button>
          </div>

          <div className="space-y-2.5">
            {teams.slice(0, 4).map((team) => (
              <div
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                  <div>
                    <h4 className="font-bold text-xs text-white">{team.name}</h4>
                    <span className="text-[10px] text-slate-400">xG/match: {team.stats.xGAverage}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-emerald-400">{team.stats.wins}W - {team.stats.draws}D - {team.stats.losses}L</p>
                    <p className="text-[10px] text-slate-400">{team.stats.goalsScored} Goals</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Players Performance */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Player Metric Leaders</span>
            </h3>
            <button
              onClick={() => onNavigate('teams')}
              className="text-[11px] font-semibold text-cyan-400 hover:underline"
            >
              Player Index
            </button>
          </div>

          <div className="space-y-2.5">
            {players.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                  <div>
                    <h4 className="font-bold text-xs text-white">{p.name}</h4>
                    <span className="text-[10px] text-slate-400">{p.teamName} • {p.position}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-amber-400">{p.goals} G • {p.assists} A</p>
                    <p className="text-[10px] text-slate-400">Rating: {p.rating}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
