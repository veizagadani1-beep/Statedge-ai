import React, { useState, useEffect } from 'react';
import { Match, AiPredictionReport, MatchStats, MatchEvent, Lineup, PlayerPosition } from '../types';
import { PitchHeatMap } from './PitchHeatMap';
import { XGTimelineChart, PossessionMomentumChart, CornersAndCardsBreakdown } from './AnalyticsCharts';
import { fetchMatchStatistics, fetchMatchEvents } from '../services/footballApi';
import { X, Sparkles, Activity, Shield, Clock, RefreshCw } from 'lucide-react';

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
  onOpenAiChat: (prompt: string) => void;
}

/**
 * Helper to fetch and parse official lineups from API-Football
 */
const fetchMatchLineupsFromApi = async (fixtureId: string): Promise<{ home: Lineup; away: Lineup } | null> => {
  try {
    const res = await fetch(`/api/football/lineups?fixture=${fixtureId}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.response || !Array.isArray(json.response) || json.response.length < 2) {
      return null;
    }

    const parseTeamLineup = (teamData: any): Lineup => {
      const formation = teamData.formation || '4-3-3';
      const startXI = teamData.startXI || [];

      const posGroups: Record<string, any[]> = { GK: [], DEF: [], MID: [], FWD: [] };

      startXI.forEach((item: any) => {
        const p = item.player || {};
        const posRaw = String(p.pos || 'M').toUpperCase();
        let posCat: 'GK' | 'DEF' | 'MID' | 'FWD' = 'MID';
        if (posRaw === 'G') posCat = 'GK';
        else if (posRaw === 'D') posCat = 'DEF';
        else if (posRaw === 'M') posCat = 'MID';
        else if (posRaw === 'F') posCat = 'FWD';
        posGroups[posCat].push(p);
      });

      const players: PlayerPosition[] = startXI.map((item: any, idx: number) => {
        const p = item.player || {};
        const posRaw = String(p.pos || '').toUpperCase();
        let posCat: 'GK' | 'DEF' | 'MID' | 'FWD' = 'MID';
        if (posRaw === 'G' || idx === 0) posCat = 'GK';
        else if (posRaw === 'D' || (idx >= 1 && idx <= 4)) posCat = 'DEF';
        else if (posRaw === 'M' || (idx >= 5 && idx <= 7)) posCat = 'MID';
        else if (posRaw === 'F' || idx >= 8) posCat = 'FWD';

        let x = 50;
        let y = 50;

        if (p.grid && typeof p.grid === 'string' && p.grid.includes(':')) {
          const parts = p.grid.split(':').map((n: string) => parseInt(n, 10));
          const row = parts[0] || 1;
          const col = parts[1] || 1;

          x = Math.min(88, Math.max(14, row * 18));
          const colCountInRow = startXI.filter((i: any) => i.player?.grid?.startsWith(`${row}:`)).length || 1;
          if (colCountInRow === 1) {
            y = 50;
          } else {
            const step = 80 / (colCountInRow + 1);
            y = Math.round(step * col);
          }
        } else {
          const list = posGroups[posCat] || [];
          const listIndex = list.findIndex((i) => i.id === p.id);
          const idxInGroup = listIndex >= 0 ? listIndex : 0;
          const count = list.length || 1;

          if (posCat === 'GK') {
            x = 15;
            y = 50;
          } else if (posCat === 'DEF') {
            x = 35;
            y = Math.round((80 / (count + 1)) * (idxInGroup + 1));
          } else if (posCat === 'MID') {
            x = 60;
            y = Math.round((80 / (count + 1)) * (idxInGroup + 1));
          } else {
            x = 80;
            y = Math.round((80 / (count + 1)) * (idxInGroup + 1));
          }
        }

        return {
          id: String(p.id || `p-${idx}`),
          name: p.name || `Player ${p.number || idx + 1}`,
          number: p.number || idx + 1,
          position: posCat,
          x,
          y,
          rating: 7.0,
        };
      });

      return {
        formation,
        players,
      };
    };

    return {
      home: parseTeamLineup(json.response[0]),
      away: parseTeamLineup(json.response[1]),
    };
  } catch (err) {
    console.warn('API-Football lineups fetch error:', err);
    return null;
  }
};

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  onClose,
  onOpenAiChat,
}) => {
  if (!match) return null;

  const [activeTab, setActiveTab] = useState<'stats' | 'heatmap' | 'events' | 'lineups' | 'ai'>('stats');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<AiPredictionReport | null>(null);

  // Live Statistics, Events & Lineups State from API-Football
  const [liveStats, setLiveStats] = useState<MatchStats | null>(null);
  const [liveEvents, setLiveEvents] = useState<MatchEvent[]>([]);
  const [liveLineups, setLiveLineups] = useState<{ home: Lineup; away: Lineup } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoadingDetails(true);
    setLiveStats(null);
    setLiveEvents([]);
    setLiveLineups(null);

    if (match.id) {
      Promise.all([
        fetchMatchStatistics(match.id),
        fetchMatchEvents(match.id),
        fetchMatchLineupsFromApi(match.id),
      ]).then(([st, evts, lu]) => {
        if (isMounted) {
          if (st) setLiveStats(st);
          if (evts && evts.length > 0) setLiveEvents(evts);
          if (lu) setLiveLineups(lu);
          setLoadingDetails(false);
        }
      }).catch((err) => {
        console.warn('Error loading match details from API-Football:', err);
        if (isMounted) setLoadingDetails(false);
      });
    } else {
      setLoadingDetails(false);
    }

    return () => {
      isMounted = false;
    };
  }, [match.id]);

  const stats = liveStats || match.stats || null;
  const events = liveEvents.length > 0 ? liveEvents : (match.events || []);
  const lineups = liveLineups || match.lineups || null;

  const generateAiReport = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          venue: match.venue,
          league: match.leagueId,
          homeForm: match.homeTeam.form.join('-'),
          awayForm: match.awayTeam.form.join('-'),
        }),
      });
      const data = await res.json();
      if (data.prediction) {
        setAiReport(data.prediction);
      }
    } catch (err) {
      console.error('Prediction report failed:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0E1524] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Banner Header */}
        <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-white">StatEdge Match Center</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Match Score Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#121B2D] to-slate-950 border border-slate-800 relative">
            <div className="grid grid-cols-3 items-center text-center">
              {/* Home */}
              <div className="flex flex-col items-center gap-2">
                <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-16 h-16 object-contain" />
                <span className="font-extrabold text-sm text-white">{match.homeTeam.name}</span>
                {match.odds?.homeWin ? (
                  <span className="text-[10px] text-slate-400">Odds: {match.odds.homeWin}</span>
                ) : null}
              </div>

              {/* Scoreline */}
              <div className="flex flex-col items-center">
                {match.status === 'LIVE' || match.status === 'FINISHED' ? (
                  <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-400">
                    {match.homeTeam.score} - {match.awayTeam.score}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-400 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800">
                    {match.startTime}
                  </span>
                )}
                <span className="text-[11px] text-slate-400 mt-1 font-medium">{match.venue}</span>
                {match.referee && (
                  <span className="text-[10px] text-slate-500 mt-0.5">Ref: {match.referee}</span>
                )}
              </div>

              {/* Away */}
              <div className="flex flex-col items-center gap-2">
                <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-16 h-16 object-contain" />
                <span className="font-extrabold text-sm text-white">{match.awayTeam.name}</span>
                {match.odds?.awayWin ? (
                  <span className="text-[10px] text-slate-400">Odds: {match.odds.awayWin}</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center justify-start gap-2 overflow-x-auto border-b border-slate-800/80 pb-2 scrollbar-none">
            {[
              { id: 'stats', label: 'Match Stats & xG' },
              { id: 'heatmap', label: 'Heat Maps' },
              { id: 'events', label: 'Timeline & Goals' },
              { id: 'lineups', label: 'Tactical Pitch' },
              { id: 'ai', label: 'Gemini Tactical AI' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content 1: STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {loadingDetails ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                  <p className="text-xs text-slate-400">Loading fixture statistics from API-Football...</p>
                </div>
              ) : !stats ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No Statistics Available</h4>
                  <p className="text-xs text-slate-500">Live statistics for this fixture have not been reported by API-Football yet.</p>
                </div>
              ) : (
                <>
                  {/* xG Step Timeline Graph */}
                  {stats.xgTimeline && (
                    <XGTimelineChart
                      timeline={stats.xgTimeline}
                      homeTeamName={match.homeTeam.name}
                      awayTeamName={match.awayTeam.name}
                      homeXg={stats.expectedGoals?.[0] || 0}
                      awayXg={stats.expectedGoals?.[1] || 0}
                    />
                  )}

                  {/* Momentum Pressure Chart */}
                  {stats.possessionTimeline && (
                    <PossessionMomentumChart
                      timeline={stats.possessionTimeline}
                      homeTeamName={match.homeTeam.name}
                      awayTeamName={match.awayTeam.name}
                    />
                  )}

                  {/* Corners & Cards Breakdown */}
                  <CornersAndCardsBreakdown
                    stats={stats}
                    homeTeamName={match.homeTeam.name}
                    awayTeamName={match.awayTeam.name}
                  />

                  {/* Head to Head Comparison Bars */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Head-to-Head Performance Breakdown</span>
                    </h3>

                    {[
                      { label: 'Expected Goals (xG)', val: stats.expectedGoals || [0, 0], format: (v: number) => Number(v || 0).toFixed(2) },
                      { label: 'Expected Assists (xA)', val: stats.expectedAssists || [0, 0], format: (v: number) => Number(v || 0).toFixed(2) },
                      { label: 'Possession %', val: stats.possession || [50, 50], format: (v: number) => `${v}%` },
                      { label: 'Shots Total', val: stats.shotsTotal || [0, 0], format: (v: number) => v },
                      { label: 'Shots on Target', val: stats.shotsOnTarget || [0, 0], format: (v: number) => v },
                      { label: 'Pass Accuracy', val: stats.passAccuracy || [0, 0], format: (v: number) => `${v}%` },
                      { label: 'Fouls Committed', val: stats.fouls || [0, 0], format: (v: number) => v },
                    ].map((item, idx) => {
                      const total = Number(item.val[0] || 0) + Number(item.val[1] || 0) || 1;
                      const pctHome = Math.round((Number(item.val[0] || 0) / total) * 100);

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-300">
                            <span className="text-cyan-400 font-mono">{item.format(item.val[0])}</span>
                            <span className="text-slate-400 font-medium text-[11px]">{item.label}</span>
                            <span className="text-emerald-400 font-mono">{item.format(item.val[1])}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                            <div style={{ width: `${pctHome}%` }} className="bg-cyan-500 h-full" />
                            <div style={{ width: `${100 - pctHome}%` }} className="bg-emerald-500 h-full" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab Content 2: HEATMAP */}
          {activeTab === 'heatmap' && (
            <PitchHeatMap
              homeHeatMap={match.heatMapData?.home}
              awayHeatMap={match.heatMapData?.away}
              homeTeamName={match.homeTeam.name}
              awayTeamName={match.awayTeam.name}
              players={[
                ...(lineups?.home.players || []),
                ...(lineups?.away.players || []),
              ]}
            />
          )}

          {/* Tab Content 3: EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Match Events Timeline</span>
              </h3>

              {loadingDetails ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                  <p className="text-xs text-slate-400">Loading events timeline from API-Football...</p>
                </div>
              ) : events.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No key events recorded yet for this fixture.</p>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-1/2 before:-translate-x-1/2 before:w-0.5 before:bg-slate-800">
                  {events.map((ev) => {
                    const isHome = ev.teamId === match.homeTeam.id;

                    return (
                      <div
                        key={ev.id}
                        className={`flex items-center gap-4 text-xs font-medium ${
                          isHome ? 'justify-start pr-1/2' : 'justify-end pl-1/2 text-right'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl border max-w-xs ${
                            isHome
                              ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-mono text-[10px]">
                              {ev.minute}'
                            </span>
                            <span>{ev.player}</span>
                          </div>
                          {ev.detail && <p className="text-[10px] opacity-80 mt-0.5">{ev.detail}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 4: TACTICAL PITCH LINEUPS */}
          {activeTab === 'lineups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Tactical Pitch Formations</span>
                </h3>

                {lineups && (
                  <div className="text-xs text-slate-400 font-mono">
                    {match.homeTeam.shortName} ({lineups.home.formation || '4-3-3'}) vs {match.awayTeam.shortName} ({lineups.away.formation || '4-3-3'})
                  </div>
                )}
              </div>

              {loadingDetails ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                  <p className="text-xs text-slate-400">Loading starting XI lineups from API-Football...</p>
                </div>
              ) : !lineups ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">Lineups Not Announced</h4>
                  <p className="text-xs text-slate-500">Official starting XI lineups have not been confirmed by API-Football yet.</p>
                </div>
              ) : (
                /* Pitch Visualizer */
                <div className="relative w-full h-80 rounded-2xl bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 border-2 border-emerald-500/40 overflow-hidden shadow-inner flex flex-col justify-between p-3">
                  {/* Center Pitch Line & Circle */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/40 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-emerald-400/40 rounded-full -translate-x-1/2 -translate-y-1/2" />

                  {/* Home Pitch Players (Top Half) */}
                  <div className="relative h-1/2 w-full">
                    {lineups.home.players.map((p) => (
                      <div
                        key={p.id}
                        style={{ left: `${p.y}%`, top: `${p.x * 0.9}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg border border-white group-hover:scale-125 transition-transform">
                          {p.number}
                        </div>
                        <span className="text-[9px] font-bold text-white bg-slate-900/90 px-1 rounded mt-0.5 whitespace-nowrap">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Away Pitch Players (Bottom Half) */}
                  <div className="relative h-1/2 w-full">
                    {lineups.away.players.map((p) => (
                      <div
                        key={p.id}
                        style={{ left: `${p.y}%`, bottom: `${p.x * 0.9}%` }}
                        className="absolute -translate-x-1/2 translate-y-1/2 flex flex-col items-center group cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-lg border border-white group-hover:scale-125 transition-transform">
                          {p.number}
                        </div>
                        <span className="text-[9px] font-bold text-white bg-slate-900/90 px-1 rounded mt-0.5 whitespace-nowrap">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 5: GEMINI AI REPORT */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>StatEdge Gemini Tactical Intelligence Report</span>
                </h3>

                <button
                  onClick={generateAiReport}
                  disabled={loadingAi}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                  <span>{loadingAi ? 'Analyzing...' : 'Generate Full Analysis'}</span>
                </button>
              </div>

              {aiReport ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-4 text-xs text-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Predicted Score</span>
                      <p className="font-mono font-black text-cyan-400 text-sm">{aiReport.predictedScore}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Home Win %</span>
                      <p className="font-mono font-black text-emerald-400 text-sm">{aiReport.winProbabilities?.homeWin}%</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Expected Goals</span>
                      <p className="font-mono font-black text-amber-400 text-sm">{aiReport.expectedGoals?.homeXG} - {aiReport.expectedGoals?.awayXG}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400">Risk Factor</span>
                      <p className="font-mono font-black text-rose-400 text-sm">{aiReport.riskFactor || 'Medium'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-1">🎯 Tactical Key Battle:</h4>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      {aiReport.keyMatchup}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-1">🧠 Strategic Insight:</h4>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      {aiReport.tacticalInsight}
                    </p>
                  </div>

                  {aiReport.recommendedBet && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 flex items-center justify-between">
                      <span>Analytics Value Market:</span>
                      <strong className="font-bold text-white">{aiReport.recommendedBet}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <Sparkles className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
                  <p className="text-xs text-slate-300">
                    Click "Generate Full Analysis" to unleash Gemini AI match prediction, xG matrix, and tactical pressing triggers.
                  </p>
                  <button
                    onClick={() => onOpenAiChat(`Analyze ${match.homeTeam.name} vs ${match.awayTeam.name}`)}
                    className="text-xs font-bold text-cyan-400 underline hover:text-cyan-300"
                  >
                    Or ask StatEdge AI Assistant directly
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
