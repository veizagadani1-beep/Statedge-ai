import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Match, TeamStats, PlayerStats, MatchEvent } from '../types';
import {
  fetchTodayMatches,
  fetchMatchStatistics,
  fetchMatchEvents,
  fetchMatchLineups,
  fetchTeams,
  fetchTopPlayers,
} from '../services/footballApi';
import { PitchHeatMap } from './PitchHeatMap';
import {
  Activity,
  BarChart2,
  TrendingUp,
  Target,
  Shield,
  Zap,
  Sparkles,
  Download,
  RefreshCw,
  GitCompare,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  UserCheck,
  Bot,
  Info,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PremiumAnalyticsModuleProps {
  initialMatch?: Match | null;
  teams?: TeamStats[];
  players?: PlayerStats[];
  onOpenAiChat?: (prompt: string) => void;
}

export const PremiumAnalyticsModule: React.FC<PremiumAnalyticsModuleProps> = ({
  initialMatch,
  teams: propTeams = [],
  players: propPlayers = [],
  onOpenAiChat,
}) => {
  const [matchList, setMatchList] = useState<Match[]>(initialMatch ? [initialMatch] : []);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(initialMatch || null);

  const [matchStats, setMatchStats] = useState<any>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [matchLineups, setMatchLineups] = useState<any[]>([]);
  const [loadingMatchData, setLoadingMatchData] = useState<boolean>(false);

  // Teams & Players for comparison
  const [teams, setTeams] = useState<TeamStats[]>(propTeams);
  const [players, setPlayers] = useState<PlayerStats[]>(propPlayers);

  // Player comparison state
  const [selectedPlayerAId, setSelectedPlayerAId] = useState<string>('');
  const [selectedPlayerBId, setSelectedPlayerBId] = useState<string>('');

  // Team comparison state
  const [selectedTeamAId, setSelectedTeamAId] = useState<string>('');
  const [selectedTeamBId, setSelectedTeamBId] = useState<string>('');

  // Gemini Predictor state
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // PDF Export state
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tactics' | 'dynamics' | 'comparison' | 'ai_predictor'
  >('overview');

  // Load matches if not initial
  useEffect(() => {
    if (!initialMatch) {
      fetchTodayMatches('all').then((res) => {
        if (res.matches.length > 0) {
          setMatchList(res.matches);
          setSelectedMatch(res.matches[0]);
        }
      });
    }
  }, [initialMatch]);

  // Fetch real teams and players if not supplied
  useEffect(() => {
    if (propTeams.length === 0) {
      fetchTeams('epl').then(setTeams);
    }
    if (propPlayers.length === 0) {
      fetchTopPlayers('epl').then(setPlayers);
    }
  }, [propTeams, propPlayers]);

  // Set default comparison selections
  useEffect(() => {
    if (players.length >= 2 && !selectedPlayerAId) {
      setSelectedPlayerAId(players[0].id);
      setSelectedPlayerBId(players[1].id);
    }
  }, [players]);

  useEffect(() => {
    if (teams.length >= 2 && !selectedTeamAId) {
      setSelectedTeamAId(teams[0].id);
      setSelectedTeamBId(teams[1].id);
    }
  }, [teams]);

  // Load match details when selectedMatch changes
  useEffect(() => {
    if (selectedMatch?.id) {
      setLoadingMatchData(true);
      setPredictionResult(null);

      Promise.all([
        fetchMatchStatistics(selectedMatch.id),
        fetchMatchEvents(selectedMatch.id),
        fetchMatchLineups(selectedMatch.id),
      ]).then(([statsData, eventsData, lineupsData]) => {
        setMatchStats(statsData);
        setMatchEvents(eventsData);
        setMatchLineups(lineupsData);
        setLoadingMatchData(false);
      });
    }
  }, [selectedMatch?.id]);

  // Function to run Gemini Match Predictor using only real API data
  const handleRunAiPrediction = async () => {
    if (!selectedMatch) return;
    setLoadingPrediction(true);
    setPredictionError(null);

    try {
      const payload = {
        homeTeam: selectedMatch.homeTeam.name,
        awayTeam: selectedMatch.awayTeam.name,
        venue: selectedMatch.venue || 'Stadium',
        league: selectedMatch.leagueId ? selectedMatch.leagueId.toUpperCase() : 'Top Competition',
        homeForm: selectedMatch.homeTeam.form?.join('-') || 'Data not available',
        awayForm: selectedMatch.awayTeam.form?.join('-') || 'Data not available',
      };

      const res = await fetch('/api/gemini/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Prediction request failed');
      }

      const json = await res.json();
      setPredictionResult(json.prediction);
    } catch (err: any) {
      setPredictionError(err.message || 'Failed to generate prediction');
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Function to export Analytics dashboard to PDF
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0B0F17',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`StatEdge-Premium-Analytics-${selectedMatch?.homeTeam.name}-vs-${selectedMatch?.awayTeam.name}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Selected player comparison instances
  const playerA = useMemo(
    () => players.find((p) => p.id === selectedPlayerAId) || players[0],
    [players, selectedPlayerAId]
  );
  const playerB = useMemo(
    () => players.find((p) => p.id === selectedPlayerBId) || players[1] || players[0],
    [players, selectedPlayerBId]
  );

  // Selected team comparison instances
  const teamA = useMemo(
    () => teams.find((t) => t.id === selectedTeamAId) || teams[0],
    [teams, selectedTeamAId]
  );
  const teamB = useMemo(
    () => teams.find((t) => t.id === selectedTeamBId) || teams[1] || teams[0],
    [teams, selectedTeamBId]
  );

  // Extract statistical metrics safely
  const homeStats = matchStats?.home;
  const awayStats = matchStats?.away;

  const possessionHome = matchStats?.possession?.[0] ?? null;
  const possessionAway = matchStats?.possession?.[1] ?? null;

  const xgHome = matchStats?.expectedGoals?.[0] ?? null;
  const xgAway = matchStats?.expectedGoals?.[1] ?? null;

  const xaHome = matchStats?.expectedAssists?.[0] ?? null;
  const xaAway = matchStats?.expectedAssists?.[1] ?? null;

  const shotsHome = matchStats?.shotsTotal?.[0] ?? null;
  const shotsAway = matchStats?.shotsTotal?.[1] ?? null;

  const passesAccHome = matchStats?.passAccuracy?.[0] ?? null;
  const passesAccAway = matchStats?.passAccuracy?.[1] ?? null;

  return (
    <div className="space-y-6 pb-24 text-slate-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-cyan-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Premium Analytics Engine
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 uppercase tracking-wider">
              API-Football Live
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time match metrics, tactical pitch maps, player comparisons & Gemini AI match predictions.
          </p>
        </div>

        {/* Top Actions: Match Picker & PDF Export */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <select
              value={selectedMatch?.id || ''}
              onChange={(e) => {
                const found = matchList.find((m) => m.id === e.target.value);
                if (found) setSelectedMatch(found);
              }}
              className="w-full bg-slate-950 text-slate-200 border border-slate-700 text-xs font-bold rounded-2xl px-3.5 py-2.5 appearance-none cursor-pointer hover:border-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {matchList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.homeTeam.name} vs {m.awayTeam.name} ({m.startTime})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/80">
        {[
          { id: 'overview', label: 'xG, xA & Possession', icon: Activity },
          { id: 'tactics', label: 'Tactical Pitch & Maps', icon: Layers },
          { id: 'dynamics', label: 'Momentum & Intensity', icon: TrendingUp },
          { id: 'comparison', label: 'Player & Team H2H', icon: GitCompare },
          { id: 'ai_predictor', label: 'Gemini Match Predictor', icon: Bot, isAi: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? tab.isAi
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive && tab.isAi ? 'text-slate-950' : isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.isAi && <Sparkles className="w-3 h-3 text-amber-300" />}
            </button>
          );
        })}
      </div>

      {/* Main Printable Content Container */}
      <div ref={reportRef} className="space-y-6 bg-[#0B0F17] p-2 rounded-2xl">
        {/* Match Header Info Badge */}
        {selectedMatch && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <img src={selectedMatch.homeTeam.logo} alt={selectedMatch.homeTeam.name} className="w-7 h-7 object-contain" />
              <span className="font-bold text-white text-sm">{selectedMatch.homeTeam.name}</span>
              <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-extrabold text-cyan-400">
                {selectedMatch.homeTeam.score ?? '-'} : {selectedMatch.awayTeam.score ?? '-'}
              </span>
              <span className="font-bold text-white text-sm">{selectedMatch.awayTeam.name}</span>
              <img src={selectedMatch.awayTeam.logo} alt={selectedMatch.awayTeam.name} className="w-7 h-7 object-contain" />
            </div>

            <div className="hidden sm:flex items-center gap-3 text-slate-400 font-mono text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {selectedMatch.startTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {selectedMatch.venue || 'Stadium'}
              </span>
            </div>
          </div>
        )}

        {/* 1. OVERVIEW & xG / xA TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expected Goals (xG) Timeline Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Expected Goals (xG)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">API-Football Metric</span>
              </div>

              {loadingMatchData ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading match statistics...</div>
              ) : xgHome !== null && xgAway !== null ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-cyan-400">{selectedMatch?.homeTeam.name}: {xgHome} xG</span>
                    <span className="text-slate-400">vs</span>
                    <span className="text-emerald-400">{selectedMatch?.awayTeam.name}: {xgAway} xG</span>
                  </div>

                  {/* xG Comparative Progress Bar */}
                  <div className="h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                    <div
                      style={{
                        width: `${
                          (Number(xgHome) / (Number(xgHome) + Number(xgAway) || 1)) * 100
                        }%`,
                      }}
                      className="bg-cyan-500 h-full rounded-l-full transition-all duration-500"
                    />
                    <div
                      style={{
                        width: `${
                          (Number(xgAway) / (Number(xgHome) + Number(xgAway) || 1)) * 100
                        }%`,
                      }}
                      className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    xG measures shot quality based on pitch position, angle, and defensive pressure recorded during play.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <AlertCircle className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <p className="font-bold text-white">Data not available</p>
                  <p className="text-[11px] text-slate-500">API-Football endpoint did not return xG values for this match.</p>
                </div>
              )}
            </div>

            {/* Expected Assists (xA) Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Expected Assists (xA)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">API-Football Metric</span>
              </div>

              {loadingMatchData ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading xA statistics...</div>
              ) : xaHome !== null && xaAway !== null ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-cyan-400">{selectedMatch?.homeTeam.name}: {xaHome} xA</span>
                    <span className="text-slate-400">vs</span>
                    <span className="text-emerald-400">{selectedMatch?.awayTeam.name}: {xaAway} xA</span>
                  </div>

                  <div className="h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                    <div
                      style={{
                        width: `${
                          (Number(xaHome) / (Number(xaHome) + Number(xaAway) || 1)) * 100
                        }%`,
                      }}
                      className="bg-cyan-500 h-full rounded-l-full transition-all duration-500"
                    />
                    <div
                      style={{
                        width: `${
                          (Number(xaAway) / (Number(xaHome) + Number(xaAway) || 1)) * 100
                        }%`,
                      }}
                      className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    xA evaluates the likelihood that a pass becomes a goal assist based on the receiver's shot placement.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <AlertCircle className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <p className="font-bold text-white">Data not available</p>
                  <p className="text-[11px] text-slate-500">API-Football endpoint did not return xA metrics for this match.</p>
                </div>
              )}
            </div>

            {/* Ball Possession Timeline */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Ball Possession Breakdown
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Full Time Stats</span>
              </div>

              {possessionHome !== null && possessionAway !== null ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-cyan-400">{selectedMatch?.homeTeam.name} ({possessionHome}%)</span>
                    <span className="text-emerald-400">{selectedMatch?.awayTeam.name} ({possessionAway}%)</span>
                  </div>

                  <div className="h-6 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
                    <div
                      style={{ width: `${possessionHome}%` }}
                      className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-l-lg flex items-center justify-center text-[10px] font-bold text-slate-950"
                    >
                      {possessionHome}%
                    </div>
                    <div
                      style={{ width: `${possessionAway}%` }}
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-r-lg flex items-center justify-center text-[10px] font-bold text-slate-950"
                    >
                      {possessionAway}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800">
                  Data not available (Possession stats not provided for this match).
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. TACTICAL PITCH & MAPS TAB */}
        {activeTab === 'tactics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real Player Positions & Heatmap Canvas */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Lineup Formations & Heat Map
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">API-Football Lineups</span>
              </div>

              {matchLineups.length > 0 ? (
                <div className="space-y-3">
                  <PitchHeatMap
                    homeTeamName={matchLineups[0]?.team?.name || selectedMatch?.homeTeam.name || 'Home'}
                    awayTeamName={matchLineups[1]?.team?.name || selectedMatch?.awayTeam.name || 'Away'}
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                  <p className="font-bold text-white">Data not available</p>
                  <p className="text-[11px] text-slate-500">API-Football did not return lineup grid positions for this fixture.</p>
                </div>
              )}
            </div>

            {/* Shot Map with Real Coordinates */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Shot Map Coordinates
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Pitch Plot</span>
              </div>

              <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="font-bold text-white">Data not available</p>
                <p className="text-[11px] text-slate-500">
                  API-Football v3 statistics endpoint does not provide individual shot x/y spatial coordinates for this fixture. Total shots on target recorded: {shotsHome ?? 0} (Home) / {shotsAway ?? 0} (Away).
                </p>
              </div>
            </div>

            {/* Pass Network Visualization */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Pass Network Visualization
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Pass Links</span>
              </div>

              <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                <p className="font-bold text-white">Data not available</p>
                <p className="text-[11px] text-slate-500">
                  API-Football endpoint does not include player-to-player passing node matrices. Overall pass accuracy: {passesAccHome || 'N/A'}% vs {passesAccAway || 'N/A'}%.
                </p>
              </div>
            </div>

            {/* Attack Direction Map */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Attack Direction Map
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Flank Breakdown</span>
              </div>

              <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                <p className="font-bold text-white">Data not available</p>
                <p className="text-[11px] text-slate-500">
                  API-Football endpoint does not provide left/center/right directional attack percentage metrics for this fixture.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. MATCH DYNAMICS & MOMENTUM TAB */}
        {activeTab === 'dynamics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Momentum Graph */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Team Momentum Timeline
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Match Events Wave</span>
              </div>

              {matchEvents.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Key event timeline derived from API-Football live match events:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {matchEvents.map((evt) => (
                      <div key={evt.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-cyan-400 min-w-[40px]">{evt.minute}'</span>
                        <div className="flex-1 px-3">
                          <span className="font-bold text-white">{evt.player}</span>
                          <span className="text-slate-400 text-[11px] block">{evt.detail}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 uppercase">
                          {evt.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                  <p className="font-bold text-white">Data not available</p>
                  <p className="text-[11px] text-slate-500">API-Football did not return minute-by-minute event logs for this match.</p>
                </div>
              )}
            </div>

            {/* Pressure Intensity Graph */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Pressure & Defensive Intensity Graph
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Fouls & Cards</span>
              </div>

              <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                <p className="font-bold text-white">Data not available</p>
                <p className="text-[11px] text-slate-500">
                  Minute-by-minute continuous pressure index is not directly supplied by API-Football endpoints. Total fouls recorded: {matchStats?.fouls?.[0] ?? 0} vs {matchStats?.fouls?.[1] ?? 0}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. PLAYER & TEAM COMPARISON TAB */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Player Comparison Section */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Player Head-to-Head Comparison
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">API-Football Top Players</span>
              </div>

              {/* Player Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Player 1</label>
                  <select
                    value={selectedPlayerAId}
                    onChange={(e) => setSelectedPlayerAId(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-700 text-xs font-bold rounded-xl p-2.5"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.teamName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Player 2</label>
                  <select
                    value={selectedPlayerBId}
                    onChange={(e) => setSelectedPlayerBId(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-700 text-xs font-bold rounded-xl p-2.5"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.teamName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side by Side Stats */}
              {playerA && playerB ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 text-center text-xs border-b border-slate-800 pb-2 font-bold">
                    <span className="text-cyan-400 truncate">{playerA.name}</span>
                    <span className="text-slate-500 uppercase text-[10px]">Metric</span>
                    <span className="text-emerald-400 truncate">{playerB.name}</span>
                  </div>

                  {[
                    { label: 'Goals', vA: playerA.goals, vB: playerB.goals },
                    { label: 'Assists', vA: playerA.assists, vB: playerB.assists },
                    { label: 'Minutes Played', vA: playerA.minutesPlayed, vB: playerB.minutesPlayed },
                    { label: 'Pass Accuracy', vA: `${playerA.passAccuracy}%`, vB: `${playerB.passAccuracy}%` },
                    { label: 'Shots on Target', vA: playerA.shotsOnTarget, vB: playerB.shotsOnTarget },
                    { label: 'Yellow Cards', vA: playerA.yellowCards, vB: playerB.yellowCards },
                  ].map((m, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-center text-xs py-1.5 border-b border-slate-900/60 font-mono">
                      <span className="font-bold text-cyan-300">{m.vA}</span>
                      <span className="text-slate-400 text-[11px] font-sans">{m.label}</span>
                      <span className="font-bold text-emerald-300">{m.vB}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Loading player comparison...</div>
              )}
            </div>

            {/* Team Comparison Section */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Team Head-to-Head Comparison
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">API-Football Teams</span>
              </div>

              {/* Team Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Team 1</label>
                  <select
                    value={selectedTeamAId}
                    onChange={(e) => setSelectedTeamAId(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-700 text-xs font-bold rounded-xl p-2.5"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Team 2</label>
                  <select
                    value={selectedTeamBId}
                    onChange={(e) => setSelectedTeamBId(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-700 text-xs font-bold rounded-xl p-2.5"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side by Side Team Stats */}
              {teamA && teamB ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-3 text-center text-xs border-b border-slate-800 pb-2 font-bold">
                    <span className="text-cyan-400 truncate">{teamA.name}</span>
                    <span className="text-slate-500 uppercase text-[10px]">Season Metric</span>
                    <span className="text-emerald-400 truncate">{teamB.name}</span>
                  </div>

                  {[
                    { label: 'Wins', vA: teamA.stats.wins, vB: teamB.stats.wins },
                    { label: 'Draws', vA: teamA.stats.draws, vB: teamB.stats.draws },
                    { label: 'Losses', vA: teamA.stats.losses, vB: teamB.stats.losses },
                    { label: 'Goals Scored', vA: teamA.stats.goalsScored, vB: teamB.stats.goalsScored },
                    { label: 'Goals Conceded', vA: teamA.stats.goalsConceded, vB: teamB.stats.goalsConceded },
                    { label: 'Clean Sheets', vA: teamA.stats.cleanSheets, vB: teamB.stats.cleanSheets },
                  ].map((m, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-center text-xs py-1.5 border-b border-slate-900/60 font-mono">
                      <span className="font-bold text-cyan-300">{m.vA}</span>
                      <span className="text-slate-400 text-[11px] font-sans">{m.label}</span>
                      <span className="font-bold text-emerald-300">{m.vB}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Loading team comparison...</div>
              )}
            </div>
          </div>
        )}

        {/* 5. GEMINI AI MATCH PREDICTOR TAB */}
        {activeTab === 'ai_predictor' && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B132B] to-cyan-950 border border-cyan-500/30 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Gemini AI Match Predictor
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated strictly using real API-Football data inputs (Gemini 3.6 Flash)
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAiPrediction}
                disabled={loadingPrediction || !selectedMatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg hover:opacity-90 disabled:opacity-50"
              >
                {loadingPrediction ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Run AI Match Prediction</span>
              </button>
            </div>

            {/* Error banner */}
            {predictionError && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{predictionError}</span>
              </div>
            )}

            {/* Prediction Output */}
            {predictionResult ? (
              <div className="space-y-4 pt-2">
                {/* Predicted Score & Probabilities */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Predicted Score</span>
                    <p className="text-2xl font-black font-mono text-cyan-400">
                      {predictionResult.predictedScore}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-center space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Win Probabilities</span>
                    <div className="flex items-center justify-between text-xs font-mono font-bold pt-1">
                      <span className="text-cyan-400">Home: {predictionResult.winProbabilities?.homeWin}%</span>
                      <span className="text-slate-400">Draw: {predictionResult.winProbabilities?.draw}%</span>
                      <span className="text-emerald-400">Away: {predictionResult.winProbabilities?.awayWin}%</span>
                    </div>
                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800 mt-1">
                      <div
                        style={{ width: `${predictionResult.winProbabilities?.homeWin}%` }}
                        className="bg-cyan-500 h-full"
                      />
                      <div
                        style={{ width: `${predictionResult.winProbabilities?.draw}%` }}
                        className="bg-slate-500 h-full"
                      />
                      <div
                        style={{ width: `${predictionResult.winProbabilities?.awayWin}%` }}
                        className="bg-emerald-500 h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Tactical Insights & Key Matchup */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase">Tactical Breakdown</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {predictionResult.tacticalInsight}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 uppercase">Key Matchup</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {predictionResult.keyMatchup}
                    </p>
                  </div>
                </div>

                {/* Bet Perspective & Risk Factor */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">Analytical Market View:</span>
                    <span className="text-emerald-400 font-bold">{predictionResult.recommendedBet}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Risk Factor:</span>
                    <span className="text-amber-400 font-mono font-bold">{predictionResult.riskFactor}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <Bot className="w-8 h-8 text-cyan-400/60 mx-auto" />
                <p className="font-bold text-white">Ready for AI Analysis</p>
                <p className="text-slate-400 max-w-sm mx-auto">
                  Click 'Run AI Match Prediction' to analyze real match attributes for {selectedMatch?.homeTeam.name} vs {selectedMatch?.awayTeam.name}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default PremiumAnalyticsModule;
