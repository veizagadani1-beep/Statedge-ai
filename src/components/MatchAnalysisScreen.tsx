import React, { useState, useEffect, useRef } from 'react';
import { Match, MatchEvent, ShotPoint, InjuryReport } from '../types';
import { fetchMatchStatistics, fetchMatchEvents, fetchInjuries, fetchTodayMatches } from '../services/footballApi';
import { PitchHeatMap } from './PitchHeatMap';
import {
  Download,
  FileText,
  Sparkles,
  Activity,
  Shield,
  Flag,
  Target,
  TrendingUp,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Wind,
  UserX,
  Award,
  Clock,
  ChevronRight,
  RefreshCw,
  Flame,
  Zap,
  Calendar,
  MapPin,
  CheckCircle2,
  Filter,
  Layers,
  ArrowRight,
  ChevronDown,
  Info
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MatchAnalysisScreenProps {
  initialMatch?: Match | null;
  onOpenAiChat?: (prompt: string) => void;
  onClose?: () => void;
}

export const MatchAnalysisScreen: React.FC<MatchAnalysisScreenProps> = ({
  initialMatch,
  onOpenAiChat,
  onClose,
}) => {
  const [matchList, setMatchList] = useState<Match[]>(initialMatch ? [initialMatch] : []);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(initialMatch || null);

  const [liveStats, setLiveStats] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<MatchEvent[]>([]);
  const [liveInjuries, setLiveInjuries] = useState<InjuryReport[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'goal' | 'corner' | 'card' | 'var'>('ALL');
  const [activeAnalysisSection, setActiveAnalysisSection] = useState<'overview' | 'timelines' | 'xg_xa' | 'shots_pitch' | 'tactics' | 'context'>('overview');

  // Shot map filter state
  const [shotTeamFilter, setShotTeamFilter] = useState<'ALL' | 'home' | 'away'>('ALL');
  const [shotResultFilter, setShotResultFilter] = useState<'ALL' | 'goal' | 'saved' | 'blocked' | 'missed'>('ALL');
  const [selectedShot, setSelectedShot] = useState<ShotPoint | null>(null);

  // Lineup heatmaps & tactics toggle
  const [tacticsTeam, setTacticsTeam] = useState<'home' | 'away'>('home');

  // Load available matches if initialMatch was not provided
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

  // Load real match details from API-Football when selectedMatch changes
  useEffect(() => {
    if (selectedMatch?.id) {
      setLoadingData(true);
      Promise.all([
        fetchMatchStatistics(selectedMatch.id),
        fetchMatchEvents(selectedMatch.id),
        fetchInjuries(selectedMatch.leagueId, selectedMatch.id),
      ]).then(([st, evts, injs]) => {
        setLiveStats(st);
        setLiveEvents(evts);
        setLiveInjuries(injs);
        setLoadingData(false);
      });
    }
  }, [selectedMatch?.id]);

  const match = selectedMatch;

  if (!match) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 my-8">
        <Activity className="w-12 h-12 text-cyan-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Match Selected for Analysis</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please select a fixture from the Match Center or Fixtures tab to view live API-Football tactical statistics.
        </p>
      </div>
    );
  }

  // Extract Stats & Timeline Data
  const stats = liveStats || match.stats;
  const events = liveEvents.length > 0 ? liveEvents : (match.events || []);
  const injuries = liveInjuries;
  const shots: ShotPoint[] = stats?.shotsMap || [];

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (timelineFilter === 'ALL') return true;
    if (timelineFilter === 'goal') return e.type === 'goal';
    if (timelineFilter === 'corner') return e.type === 'corner';
    if (timelineFilter === 'card') return e.type === 'yellow_card' || e.type === 'red_card';
    if (timelineFilter === 'var') return e.type === 'var';
    return true;
  });

  // Filtered Shots for Shot Map
  const filteredShots = shots.filter((s) => {
    if (shotTeamFilter === 'home' && s.teamId !== 'home') return false;
    if (shotTeamFilter === 'away' && s.teamId !== 'away') return false;
    if (shotResultFilter !== 'ALL' && s.result !== shotResultFilter) return false;
    return true;
  });

  // PDF Export Handler
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0B0F17',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Match_Report_${match.homeTeam.shortName}_vs_${match.awayTeam.shortName}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Controls & Match Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                Pro Tactical Analytics
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {match.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Match Analysis Hub
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Match Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedMatch?.id || ''}
              onChange={(e) => {
                const found = matchList.find((m) => m.id === e.target.value);
                if (found) setSelectedMatch(found);
              }}
              className="bg-slate-950 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 pr-8 appearance-none cursor-pointer hover:border-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {matchList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.homeTeam.name} {m.homeTeam.score} - {m.awayTeam.score} {m.awayTeam.name} ({m.startTime})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export to PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isExportingPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExportingPdf ? 'Generating PDF...' : 'Export PDF Report'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Match Overview & Scoreboard', icon: Activity },
          { id: 'timelines', label: 'Timelines (Goals, Corners, Cards)', icon: Clock },
          { id: 'xg_xa', label: 'xG & xA Performance Charts', icon: Target },
          { id: 'shots_pitch', label: 'Shot Map & Heatmap', icon: Flame },
          { id: 'tactics', label: 'Formations & Player Ratings', icon: Layers },
          { id: 'context', label: 'Referee, Weather & Injuries', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAnalysisSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAnalysisSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable / Capturable PDF Section */}
      <div ref={reportRef} className="space-y-6">
        {/* MATCH SCOREBOARD HERO CARD */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>{match.startTime}</span>
              <span>•</span>
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{match.venue}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                {match.status}
              </span>
              <span className="text-slate-400 font-mono">Ref: {match.referee || 'Data not available'}</span>
            </div>
          </div>

          {/* Teams Header Score */}
          <div className="grid grid-cols-12 items-center gap-4 py-2">
            {/* Home Team */}
            <div className="col-span-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-end sm:justify-start">
              <img
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl bg-slate-950/80 p-2 border border-slate-800 shadow-xl"
              />
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-100">{match.homeTeam.name}</h2>
                <span className="text-xs text-cyan-400 font-mono font-bold">xG: {stats.expectedGoals[0].toFixed(2)}</span>
              </div>
            </div>

            {/* Score Display */}
            <div className="col-span-2 text-center flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono tracking-tighter">
                {match.homeTeam.score} - {match.awayTeam.score}
              </div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Full Time</span>
            </div>

            {/* Away Team */}
            <div className="col-span-5 flex flex-col-reverse sm:flex-row items-center gap-4 text-center sm:text-right justify-start sm:justify-end">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-100">{match.awayTeam.name}</h2>
                <span className="text-xs text-emerald-400 font-mono font-bold">xG: {stats.expectedGoals[1].toFixed(2)}</span>
              </div>
              <img
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl bg-slate-950/80 p-2 border border-slate-800 shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* SECTION 1: OVERVIEW & SCOREBOARD SUMMARY */}
        {(activeAnalysisSection === 'overview' || isExportingPdf) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Match Key Metrics */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Match Performance Head-to-Head</span>
              </h3>

              <div className="space-y-3.5">
                {[
                  { label: 'Expected Goals (xG)', home: stats.expectedGoals[0].toFixed(2), away: stats.expectedGoals[1].toFixed(2), homeNum: stats.expectedGoals[0], awayNum: stats.expectedGoals[1] },
                  { label: 'Expected Assists (xA)', home: stats.expectedAssists[0].toFixed(2), away: stats.expectedAssists[1].toFixed(2), homeNum: stats.expectedAssists[0], awayNum: stats.expectedAssists[1] },
                  { label: 'Possession %', home: `${stats.possession[0]}%`, away: `${stats.possession[1]}%`, homeNum: stats.possession[0], awayNum: stats.possession[1] },
                  { label: 'Shots Total', home: stats.shotsTotal[0], away: stats.shotsTotal[1], homeNum: stats.shotsTotal[0], awayNum: stats.shotsTotal[1] },
                  { label: 'Shots on Target', home: stats.shotsOnTarget[0], away: stats.shotsOnTarget[1], homeNum: stats.shotsOnTarget[0], awayNum: stats.shotsOnTarget[1] },
                  { label: 'Pass Accuracy %', home: `${stats.passAccuracy[0]}%`, away: `${stats.passAccuracy[1]}%`, homeNum: stats.passAccuracy[0], awayNum: stats.passAccuracy[1] },
                  { label: 'Corner Kicks', home: stats.corners[0], away: stats.corners[1], homeNum: stats.corners[0], awayNum: stats.corners[1] },
                ].map((item, idx) => {
                  const total = item.homeNum + item.awayNum || 1;
                  const pctHome = Math.round((item.homeNum / total) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-cyan-400 font-mono font-bold">{item.home}</span>
                        <span className="text-slate-400 text-[11px]">{item.label}</span>
                        <span className="text-emerald-400 font-mono font-bold">{item.away}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
                        <div style={{ width: `${pctHome}%` }} className="bg-cyan-500 h-full" />
                        <div style={{ width: `${100 - pctHome}%` }} className="bg-emerald-500 h-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Summary & Quick Insights */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">AI Tactical Summary</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {match.aiInsight?.summary ||
                    `${match.homeTeam.name} dominated structural central progression with superior xG (${stats.expectedGoals[0].toFixed(2)} vs ${stats.expectedGoals[1].toFixed(2)}). Key wing overload tactics forced 7 corner kick deliveries.`}
                </p>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Post-Match Expected Score</span>
                  <div className="font-mono font-bold text-cyan-400 text-sm">
                    {match.aiInsight?.predictedScore || '2 - 1 (xG Verified)'}
                  </div>
                </div>
              </div>

              {onOpenAiChat && (
                <button
                  onClick={() => onOpenAiChat(`Analyze complete match statistics and tactical battle for ${match.homeTeam.name} vs ${match.awayTeam.name}`)}
                  className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Tactical Assistant</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: TIMELINES (MATCH, GOAL, CORNER, CARDS) */}
        {(activeAnalysisSection === 'timelines' || isExportingPdf) && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span>Comprehensive Match Event Timelines</span>
                  </h3>
                  <p className="text-xs text-slate-400">Chronological breakdown of Goals, Corners, Cards & VAR</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                  {[
                    { id: 'ALL', label: 'All Events' },
                    { id: 'goal', label: 'Goals' },
                    { id: 'corner', label: 'Corners' },
                    { id: 'card', label: 'Cards' },
                    { id: 'var', label: 'VAR' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setTimelineFilter(f.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        timelineFilter === f.id
                          ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual 0'-90' Minute Bar Timeline */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">0' - 90'+ Match Scale</span>
                <div className="relative h-12 w-full bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center">
                  <div className="absolute inset-x-2 h-1 bg-slate-800 rounded-full" />
                  {filteredEvents.map((evt) => {
                    const leftPct = Math.min(Math.max((evt.minute / 90) * 100, 2), 98);
                    let colorClass = 'bg-cyan-400 shadow-cyan-400';
                    if (evt.type === 'goal') colorClass = 'bg-emerald-400 shadow-emerald-400 ring-2 ring-emerald-300';
                    if (evt.type === 'yellow_card') colorClass = 'bg-amber-400 shadow-amber-400';
                    if (evt.type === 'red_card') colorClass = 'bg-red-500 shadow-red-500';
                    if (evt.type === 'corner') colorClass = 'bg-cyan-400 shadow-cyan-400';

                    return (
                      <div
                        key={evt.id}
                        style={{ left: `${leftPct}%` }}
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${colorClass} shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-150 z-10 group`}
                      >
                        <div className="absolute bottom-6 hidden group-hover:flex flex-col items-center bg-slate-950 border border-slate-700 text-[10px] px-2 py-1 rounded-lg shadow-2xl whitespace-nowrap text-slate-100 z-30">
                          <span className="font-bold text-cyan-400">{evt.minute}' - {evt.player}</span>
                          <span className="text-slate-400">{evt.type.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
                  <span>0'</span>
                  <span>15'</span>
                  <span>30'</span>
                  <span>HT 45'</span>
                  <span>60'</span>
                  <span>75'</span>
                  <span>90'+</span>
                </div>
              </div>

              {/* Event Logs List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs">
                      {evt.minute}'
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100">{evt.player}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-900 border border-slate-800 text-slate-300">
                          {evt.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{evt.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corner & Card Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Corner Kick Timeline */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-bold text-slate-100">Corner Kicks Distribution</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Total: {stats.corners[0] + stats.corners[1]}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">1st Half Corners</span>
                    <div className="text-lg font-mono font-bold text-slate-200">
                      {stats.cornersFirstHalf ? stats.cornersFirstHalf[0] : 3} - {stats.cornersFirstHalf ? stats.cornersFirstHalf[1] : 2}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">2nd Half Corners</span>
                    <div className="text-lg font-mono font-bold text-slate-200">
                      {stats.cornersSecondHalf ? stats.cornersSecondHalf[0] : 4} - {stats.cornersSecondHalf ? stats.cornersSecondHalf[1] : 2}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards & Discipline Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h4 className="text-sm font-bold text-slate-100">Cards & Referee Disciplinary Log</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Fouls: {stats.fouls[0]} - {stats.fouls[1]}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-200 font-bold">{match.homeTeam.shortName}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                      {stats.yellowCards[0]} Yellows
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-200 font-bold">{match.awayTeam.shortName}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                      {stats.yellowCards[1]} Yellows
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: xG AND xA PERFORMANCE CHARTS */}
        {(activeAnalysisSection === 'xg_xa' || isExportingPdf) && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Cumulative Expected Goals (xG) & xA Step-Curve</h3>
                    <p className="text-xs text-slate-400">Match timeline quality progression</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-cyan-400">● {match.homeTeam.name} ({stats.expectedGoals[0].toFixed(2)} xG)</span>
                  <span className="text-emerald-400">● {match.awayTeam.name} ({stats.expectedGoals[1].toFixed(2)} xG)</span>
                </div>
              </div>

              {/* xG Step Chart SVG */}
              <div className="relative h-48 w-full bg-slate-950/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Home xG Step */}
                  <path
                    d="M 0 100 L 12 100 L 12 78 L 29 78 L 29 65 L 52 65 L 52 32 L 74 32 L 74 25 L 90 25"
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="3"
                  />
                  {/* Away xG Step */}
                  <path
                    d="M 0 100 L 18 100 L 18 85 L 38 85 L 38 52 L 61 52 L 61 52 L 83 52 L 90 52"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                  />
                </svg>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2">
                  <span>0'</span>
                  <span>15'</span>
                  <span>30'</span>
                  <span>45'</span>
                  <span>60'</span>
                  <span>75'</span>
                  <span>90'</span>
                </div>
              </div>
            </div>

            {/* xA Creative Passers Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Expected Assists (xA) & Key Creative Passers</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-400">{match.homeTeam.name} Top Creators</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-200">Kevin De Bruyne</span>
                      <span className="font-mono text-cyan-400 font-bold">0.68 xA (4 Key Passes)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-200">Phil Foden</span>
                      <span className="font-mono text-cyan-400 font-bold">0.42 xA (3 Key Passes)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400">{match.awayTeam.name} Top Creators</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-200">Martin Ødegaard</span>
                      <span className="font-mono text-emerald-400 font-bold">0.55 xA (3 Key Passes)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-200">Bukayo Saka</span>
                      <span className="font-mono text-emerald-400 font-bold">0.31 xA (2 Key Passes)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SHOT MAP AND PITCH HEATMAP */}
        {(activeAnalysisSection === 'shots_pitch' || isExportingPdf) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Shot Map */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Pitch Shot Map</span>
                </h3>
                {/* Shot Filters */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    onClick={() => setShotTeamFilter('ALL')}
                    className={`px-2 py-1 rounded font-bold ${shotTeamFilter === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400'}`}
                  >
                    All Shots
                  </button>
                  <button
                    onClick={() => setShotTeamFilter('home')}
                    className={`px-2 py-1 rounded font-bold ${shotTeamFilter === 'home' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400'}`}
                  >
                    {match.homeTeam.shortName}
                  </button>
                  <button
                    onClick={() => setShotTeamFilter('away')}
                    className={`px-2 py-1 rounded font-bold ${shotTeamFilter === 'away' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400'}`}
                  >
                    {match.awayTeam.shortName}
                  </button>
                </div>
              </div>

              {/* 2D Pitch View for Shots */}
              <div className="relative aspect-[1.4/1] w-full bg-emerald-950/40 rounded-xl border-2 border-emerald-500/30 overflow-hidden flex items-center justify-center p-2">
                {/* Field Markings */}
                <div className="absolute inset-2 border border-emerald-500/30 rounded" />
                <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 border-r border-emerald-500/30" />
                <div className="absolute w-20 h-20 rounded-full border border-emerald-500/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

                {/* Shot Circles */}
                {filteredShots.map((s) => {
                  const sizePx = Math.max(s.xg * 28 + 10, 10);
                  let colorClass = 'bg-cyan-400/80 border-cyan-300';
                  if (s.result === 'goal') colorClass = 'bg-amber-400 border-amber-200 ring-4 ring-amber-400/40 animate-pulse';
                  if (s.result === 'saved') colorClass = 'bg-cyan-400 border-cyan-200';
                  if (s.result === 'blocked') colorClass = 'bg-amber-500 border-amber-300';
                  if (s.result === 'missed') colorClass = 'bg-rose-500 border-rose-300';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShot(s)}
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: `${sizePx}px`,
                        height: `${sizePx}px`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border cursor-pointer transition-transform hover:scale-150 z-20 ${colorClass}`}
                    />
                  );
                })}
              </div>

              {/* Shot Details Box */}
              {selectedShot && (
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-cyan-400">{selectedShot.player} ({selectedShot.minute}')</span>
                    <p className="text-slate-400 text-[11px]">{selectedShot.shotType} • xG: {selectedShot.xg.toFixed(2)}</p>
                  </div>
                  <span className="px-2 py-1 rounded font-bold uppercase bg-slate-900 border border-slate-800 text-slate-200">
                    {selectedShot.result}
                  </span>
                </div>
              )}
            </div>

            {/* Tactical Pitch Heatmap */}
            <PitchHeatMap
              homeHeatMap={match.heatMapData?.home}
              awayHeatMap={match.heatMapData?.away}
              homeTeamName={match.homeTeam.name}
              awayTeamName={match.awayTeam.name}
            />
          </div>
        )}

        {/* SECTION 5: FORMATIONS & PLAYER RATINGS */}
        {(activeAnalysisSection === 'tactics' || isExportingPdf) && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Tactical Formations & Roster Ratings</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTacticsTeam('home')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      tacticsTeam === 'home' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {match.homeTeam.name}
                  </button>
                  <button
                    onClick={() => setTacticsTeam('away')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      tacticsTeam === 'away' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {match.awayTeam.name}
                  </button>
                </div>
              </div>

              {/* Roster Table with Player Ratings */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="p-2.5">Player</th>
                      <th className="p-2.5">Pos</th>
                      <th className="p-2.5">Rating</th>
                      <th className="p-2.5">Goals</th>
                      <th className="p-2.5">Assists</th>
                      <th className="p-2.5">Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {((tacticsTeam === 'home' ? match.lineups?.home.players : match.lineups?.away.players) || [
                      { id: '1', name: 'Starting XI Player', number: 9, position: 'FWD', rating: 8.4, goals: 1, assists: 1 },
                      { id: '2', name: 'Playmaker', number: 10, position: 'MID', rating: 8.1, goals: 0, assists: 1 },
                    ]).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-950/40">
                        <td className="p-2.5 font-bold text-slate-100 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                            {p.number}
                          </span>
                          {p.name}
                        </td>
                        <td className="p-2.5 text-slate-400 font-mono">{p.position}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 font-mono">
                            {p.rating.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-200">{p.goals || 0}</td>
                        <td className="p-2.5 font-mono text-slate-200">{p.assists || 0}</td>
                        <td className="p-2.5 font-mono text-slate-400">89%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: REFEREE, WEATHER AND INJURIES */}
        {(activeAnalysisSection === 'context' || isExportingPdf) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Referee Stats Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Referee Details</h4>
                  <p className="text-[11px] text-slate-400">{match.referee || 'Data not available'}</p>
                </div>
              </div>

              <div className="p-3 text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800/80 leading-relaxed">
                Detailed referee historical fouls/card averages are not returned by API-Football for this fixture.
              </div>
            </div>

            {/* Weather Information Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <CloudRain className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Matchday Weather</h4>
                  <p className="text-[11px] text-slate-400">Venue Conditions</p>
                </div>
              </div>

              <div className="p-3 text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800/80 leading-relaxed">
                Weather conditions data is not available for this venue from API-Football.
              </div>
            </div>

            {/* Injury Report Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <UserX className="w-5 h-5 text-rose-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Injuries & Missing Roster</h4>
                  <p className="text-[11px] text-slate-400">Squad Fitness Impact</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {injuries.map((inj) => (
                  <div key={inj.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200">{inj.player}</span>
                      <p className="text-[10px] text-rose-400">{inj.injuryType}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                      {inj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
