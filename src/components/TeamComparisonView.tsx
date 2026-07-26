import React, { useState, useEffect } from 'react';
import { TeamStats, Match } from '../types';
import { fetchHeadToHead } from '../services/footballApi';
import { GitCompare, Sparkles, RefreshCw, Trophy, ArrowRightLeft, Calendar } from 'lucide-react';

interface TeamComparisonViewProps {
  teams: TeamStats[];
  defaultTeamAId?: string;
  onOpenAiChat: (prompt: string) => void;
}

export const TeamComparisonView: React.FC<TeamComparisonViewProps> = ({
  teams,
  defaultTeamAId,
  onOpenAiChat,
}) => {
  const [teamAId, setTeamAId] = useState<string>(defaultTeamAId || teams[0]?.id || '33');
  const [teamBId, setTeamBId] = useState<string>(
    teams.find((t) => t.id !== (defaultTeamAId || teams[0]?.id))?.id || '40'
  );

  const [h2hMatches, setH2hMatches] = useState<Match[]>([]);
  const [loadingH2h, setLoadingH2h] = useState(false);

  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  const teamA = teams.find((t) => t.id === teamAId) || teams[0] || {
    id: teamAId,
    name: 'Team A',
    shortName: 'TMA',
    leagueId: 'epl',
    logo: '',
    stadium: 'Stadium',
    manager: 'Manager',
    marketValue: 'N/A',
    form: [],
    stats: { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0, cleanSheets: 0, xGAverage: 0, xGAConcededAverage: 0, expectedAssistsAverage: 0, avgPossession: 0, ppda: 0, cornersPerGame: 0, cardsPerGame: { yellow: 0, red: 0 }, homeRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }, awayRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 } },
    goalDistribution: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90+': 0 }
  };

  const teamB = teams.find((t) => t.id === teamBId) || teams[1] || {
    id: teamBId,
    name: 'Team B',
    shortName: 'TMB',
    leagueId: 'epl',
    logo: '',
    stadium: 'Stadium',
    manager: 'Manager',
    marketValue: 'N/A',
    form: [],
    stats: { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0, cleanSheets: 0, xGAverage: 0, xGAConcededAverage: 0, expectedAssistsAverage: 0, avgPossession: 0, ppda: 0, cornersPerGame: 0, cardsPerGame: { yellow: 0, red: 0 }, homeRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }, awayRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 } },
    goalDistribution: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90+': 0 }
  };

  useEffect(() => {
    if (teamA?.id && teamB?.id) {
      setLoadingH2h(true);
      fetchHeadToHead(teamA.id, teamB.id).then((matches) => {
        setH2hMatches(matches);
        setLoadingH2h(false);
      });
    }
  }, [teamA?.id, teamB?.id]);

  const handleSwap = () => {
    setTeamAId(teamBId);
    setTeamBId(teamAId);
  };

  const generateH2hAnalysis = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Provide a head-to-head tactical comparison between ${teamA.name} and ${teamB.name}. Compare xG efficiency, pressing intensity, defensive solidity, and key tactical matchups.`,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setAiReport(data.reply);
      }
    } catch (err) {
      console.error('H2H AI analysis error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-cyan-400" />
          <span>Team Head-to-Head Comparison</span>
        </h1>
        <p className="text-xs text-slate-400">Side-by-side metric comparison & Gemini tactical advantage breakdown</p>
      </div>

      {/* Team Selectors Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-11 items-center gap-4">
        {/* Team A Picker */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-cyan-400">Team A</label>
          <select
            value={teamAId}
            onChange={(e) => setTeamAId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:border-cyan-500"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === teamBId}>
                {t.name} ({t.leagueId.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:scale-110 transition-transform"
            title="Swap Teams"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Team B Picker */}
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-emerald-400">Team B</label>
          <select
            value={teamBId}
            onChange={(e) => setTeamBId(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:border-emerald-500"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                {t.name} ({t.leagueId.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#101827] to-slate-950 border border-slate-800 shadow-2xl">
        <div className="grid grid-cols-3 items-center text-center">
          {/* Team A */}
          <div className="flex flex-col items-center gap-2">
            <img src={teamA.logo} alt={teamA.name} className="w-16 h-16 object-contain" />
            <h3 className="font-extrabold text-sm text-cyan-400">{teamA.name}</h3>
            <span className="text-[10px] text-slate-400">Val: {teamA.marketValue}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-2xl font-black text-white">VS</span>
            <span className="text-[10px] text-slate-400 mt-1">Season Comparison</span>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2">
            <img src={teamB.logo} alt={teamB.name} className="w-16 h-16 object-contain" />
            <h3 className="font-extrabold text-sm text-emerald-400">{teamB.name}</h3>
            <span className="text-[10px] text-slate-400">Val: {teamB.marketValue}</span>
          </div>
        </div>

        {/* Side-by-side Metric Comparison Bars */}
        <div className="mt-8 space-y-4 pt-6 border-t border-slate-800">
          {[
            {
              label: 'Win Ratio %',
              valA: Math.round((teamA.stats.wins / teamA.stats.matchesPlayed) * 100),
              valB: Math.round((teamB.stats.wins / teamB.stats.matchesPlayed) * 100),
              fmtA: `${Math.round((teamA.stats.wins / teamA.stats.matchesPlayed) * 100)}%`,
              fmtB: `${Math.round((teamB.stats.wins / teamB.stats.matchesPlayed) * 100)}%`,
            },
            {
              label: 'Average xG per Match',
              valA: teamA.stats.xGAverage,
              valB: teamB.stats.xGAverage,
              fmtA: teamA.stats.xGAverage.toFixed(2),
              fmtB: teamB.stats.xGAverage.toFixed(2),
            },
            {
              label: 'Average Possession %',
              valA: teamA.stats.avgPossession,
              valB: teamB.stats.avgPossession,
              fmtA: `${teamA.stats.avgPossession}%`,
              fmtB: `${teamB.stats.avgPossession}%`,
            },
            {
              label: 'Goals Scored',
              valA: teamA.stats.goalsScored,
              valB: teamB.stats.goalsScored,
              fmtA: teamA.stats.goalsScored,
              fmtB: teamB.stats.goalsScored,
            },
            {
              label: 'Clean Sheets',
              valA: teamA.stats.cleanSheets,
              valB: teamB.stats.cleanSheets,
              fmtA: teamA.stats.cleanSheets,
              fmtB: teamB.stats.cleanSheets,
            },
            {
              label: 'PPDA Pressing (Lower = Higher Intensity)',
              valA: teamA.stats.ppda,
              valB: teamB.stats.ppda,
              fmtA: teamA.stats.ppda,
              fmtB: teamB.stats.ppda,
            },
          ].map((metric, i) => {
            const sum = Number(metric.valA) + Number(metric.valB) || 1;
            const pctA = Math.round((Number(metric.valA) / sum) * 100);

            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-cyan-400 font-mono">{metric.fmtA}</span>
                  <span className="text-slate-400 text-[11px] font-semibold">{metric.label}</span>
                  <span className="text-emerald-400 font-mono">{metric.fmtB}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 overflow-hidden flex">
                  <div style={{ width: `${pctA}%` }} className="bg-cyan-500 h-full" />
                  <div style={{ width: `${100 - pctA}%` }} className="bg-emerald-500 h-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Head to Head History */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Historical API-Football H2H Meetings</span>
          </div>
          {loadingH2h && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
        </h3>

        <div className="space-y-2">
          {loadingH2h ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading Head-to-Head history...</div>
          ) : h2hMatches.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No historical Head-to-Head match records returned by API-Football for these teams.
            </div>
          ) : (
            h2hMatches.map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">{m.startTime} • {m.venue}</span>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{m.homeTeam.name}</span>
                  <span className="text-cyan-400 font-mono font-black bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {m.homeTeam.score} - {m.awayTeam.score}
                  </span>
                  <span>{m.awayTeam.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gemini H2H Tactical Analysis AI Generator */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gemini Tactical Advantage Report</span>
            </h3>
            <p className="text-xs text-slate-400">Generate deep tactical breakdown of pressing schemes and offensive xG efficiency.</p>
          </div>

          <button
            onClick={generateH2hAnalysis}
            disabled={loadingAi}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? 'Analyzing Tactics...' : 'Generate H2H Report'}</span>
          </button>
        </div>

        {aiReport && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {aiReport}
          </div>
        )}
      </div>
    </div>
  );
};
