import React, { useState } from 'react';
import { TeamStats, PlayerStats, LeagueId } from '../types';
import { LEAGUES } from '../data/mockFootballData';
import { FormTenGuide } from './AnalyticsCharts';
import { PitchHeatMap } from './PitchHeatMap';
import { Shield, Search, Award, TrendingUp, BarChart, Users, ChevronRight } from 'lucide-react';

interface TeamsViewProps {
  teams: TeamStats[];
  players: PlayerStats[];
  selectedLeague: LeagueId | 'all';
  setSelectedLeague: (league: LeagueId | 'all') => void;
  onSelectTeamDetail: (team: TeamStats) => void;
  onSelectPlayerDetail: (player: PlayerStats) => void;
  onOpenCompare: (teamAId: string) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  players,
  selectedLeague,
  setSelectedLeague,
  onSelectTeamDetail,
  onSelectPlayerDetail,
  onOpenCompare,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const filteredTeams = teams.filter((t) => {
    const matchesLeague = selectedLeague === 'all' || t.leagueId === selectedLeague;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchesLeague && matchesSearch;
  });

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || filteredTeams[0] || teams[0];
  const selectedTeamPlayers = activeTeam ? players.filter((p) => p.teamId === activeTeam.id || p.teamName.toLowerCase().includes(activeTeam.name.toLowerCase())) : [];

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span>Team Statistics & Analytics</span>
          </h1>
          <p className="text-xs text-slate-400">Tactical profile, PPDA pressing, xG efficiency & squad profiles</p>
        </div>

        <button
          onClick={() => onOpenCompare(activeTeam.id)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto hover:opacity-90 shadow-md shadow-cyan-500/20"
        >
          <span>Compare {activeTeam.shortName} H2H</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* League Selector */}
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedLeague('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedLeague === 'all'
                ? 'bg-slate-800 text-white font-bold'
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

      {/* Main Content Layout: Left list of teams, Right team detail breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Team List Selector */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            Select Team ({filteredTeams.length})
          </p>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredTeams.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                No teams returned for this league filter.
              </div>
            ) : (
              filteredTeams.map((team) => {
                const isSelected = activeTeam?.id === team.id;

                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500/50 text-white shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                  <div className="flex items-center gap-3">
                    <img src={team.logo} alt={team.name} className="w-9 h-9 object-contain" />
                    <div>
                      <h3 className="font-bold text-xs">{team.name}</h3>
                      <p className="text-[10px] text-slate-400">{team.stadium}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-cyan-400">
                      {team.stats.wins}W-{team.stats.draws}D-{team.stats.losses}L
                    </span>
                    <p className="text-[10px] text-slate-400">{team.marketValue}</p>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Selected Team Comprehensive Profile */}
        <div className="lg:col-span-8 space-y-6">
          {activeTeam && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#101827] to-slate-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={activeTeam.logo} alt={activeTeam.name} className="w-16 h-16 object-contain p-1 rounded-2xl bg-slate-900/80 border border-slate-700" />
                    <div>
                      <h2 className="text-xl font-black text-white">{activeTeam.name}</h2>
                      <p className="text-xs text-slate-400">
                        Manager: <span className="text-cyan-300 font-semibold">{activeTeam.manager}</span> • Stadium: {activeTeam.stadium}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Squad Value</span>
                    <p className="text-lg font-black font-mono text-cyan-400">{activeTeam.marketValue}</p>
                  </div>
                </div>

                {/* 10 Match Form Breakdown */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <FormTenGuide
                    form={activeTeam.form10Matches || ['W', 'W', 'D', 'W', 'L', 'W', 'W', 'D', 'W', 'W']}
                    title={`${activeTeam.shortName} Last 10 Matches Performance`}
                  />
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Avg Possession</span>
                    <p className="text-lg font-mono font-black text-white">{activeTeam.stats.avgPossession}%</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">xG per Match</span>
                    <p className="text-lg font-mono font-black text-cyan-400">{activeTeam.stats.xGAverage}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Clean Sheets</span>
                    <p className="text-lg font-mono font-black text-emerald-400">{activeTeam.stats.cleanSheets}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">PPDA Pressing</span>
                    <p className="text-lg font-mono font-black text-amber-400">{activeTeam.stats.ppda}</p>
                  </div>
                </div>
              </div>

              {/* Tactical Activity Heat Map */}
              {activeTeam.heatMapPoints && (
                <PitchHeatMap
                  homeHeatMap={activeTeam.heatMapPoints}
                  homeTeamName={`${activeTeam.name} Season Pitch Footprint`}
                  players={selectedTeamPlayers}
                />
              )}

              {/* Goal Distribution by Minute */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-cyan-400" />
                  <span>Goal Timing Distribution (15-Min Intervals)</span>
                </h3>

                <div className="grid grid-cols-6 gap-2 text-center pt-2">
                  {Object.entries(activeTeam.goalDistribution).map(([time, count]) => {
                    const numCount = Number(count);
                    return (
                      <div key={time} className="space-y-1">
                        <div className="h-20 bg-slate-950 rounded-xl p-1 flex flex-col justify-end">
                          <div
                            style={{ height: `${(numCount / 15) * 100}%` }}
                            className="w-full bg-gradient-to-t from-cyan-600 to-emerald-400 rounded-lg transition-all"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-cyan-400 font-mono">{numCount} goals</span>
                        <p className="text-[9px] text-slate-500">{time}'</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Squad Stars */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Featured Key Players ({selectedTeamPlayers.length})</span>
                  </h3>
                </div>

                {selectedTeamPlayers.length === 0 ? (
                  <p className="text-xs text-slate-500">No registered player profiles available for this squad.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTeamPlayers.map((player) => (
                      <div
                        key={player.id}
                        onClick={() => onSelectPlayerDetail(player)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img src={player.photo} alt={player.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                          <div>
                            <h4 className="font-bold text-xs text-white">{player.name}</h4>
                            <span className="text-[10px] text-slate-400">#{player.number} • {player.position}</span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-cyan-400">{player.goals} G / {player.assists} A</span>
                          <p className="text-[10px] text-slate-500">Rating: {player.rating}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
