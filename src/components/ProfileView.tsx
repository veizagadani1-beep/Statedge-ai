import React, { useState } from 'react';
import { Match, TeamStats, PlayerStats } from '../types';
import { User, Bookmark, Settings, Code, Shield, Check, Copy, Key, ChevronRight, Activity } from 'lucide-react';

interface ProfileViewProps {
  favorites: string[];
  matches: Match[];
  teams: TeamStats[];
  players: PlayerStats[];
  onSelectMatch: (match: Match) => void;
  onSelectTeam: (teamId: string) => void;
  oddsFormat: 'decimal' | 'fractional' | 'american';
  setOddsFormat: (fmt: 'decimal' | 'fractional' | 'american') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  favorites,
  matches,
  teams,
  players,
  onSelectMatch,
  onSelectTeam,
  oddsFormat,
  setOddsFormat,
}) => {
  const [showFlutterModal, setShowFlutterModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const favMatches = matches.filter((m) => favorites.includes(m.id));

  const flutterCodeSnippet = `// StatEdge AI - Clean Architecture Flutter / Dart Code
// lib/features/matches/domain/entities/match_entity.dart

class MatchEntity {
  final String id;
  final String homeTeamName;
  final String awayTeamName;
  final int homeScore;
  final int awayScore;
  final double expectedGoalsHome;
  final double expectedGoalsAway;
  final String status;

  MatchEntity({
    required this.id,
    required this.homeTeamName,
    required this.awayTeamName,
    required this.homeScore,
    required this.awayScore,
    required this.expectedGoalsHome,
    required this.expectedGoalsAway,
    required this.status,
  });

  factory MatchEntity.fromJson(Map<String, dynamic> json) {
    return MatchEntity(
      id: json['id'],
      homeTeamName: json['homeTeam']['name'],
      awayTeamName: json['awayTeam']['name'],
      homeScore: json['homeTeam']['score'],
      awayScore: json['awayTeam']['score'],
      expectedGoalsHome: (json['stats']['expectedGoals'][0] as num).toDouble(),
      expectedGoalsAway: (json['stats']['expectedGoals'][1] as num).toDouble(),
      status: json['status'],
    );
  }
}`;

  const copyFlutterCode = () => {
    navigator.clipboard.writeText(flutterCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-cyan-400" />
          <span>User Profile & Saved Favorites</span>
        </h1>
        <p className="text-xs text-slate-400">Manage bookmarks, odds formats & Flutter mobile app exporter</p>
      </div>

      {/* User Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#101827] to-slate-950 border border-cyan-500/30 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
            SA
          </div>
          <div>
            <h2 className="text-lg font-black text-white">StatEdge Analyst</h2>
            <p className="text-xs text-cyan-400 font-semibold">Pro Sports Analytics Pass</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Connected to Gemini 3.6 Flash Server</p>
          </div>
        </div>

        <button
          onClick={() => setShowFlutterModal(true)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Code className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Export Flutter Dart</span>
        </button>
      </div>

      {/* Favorites List */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-cyan-400" />
            <span>Saved Bookmarked Matches ({favMatches.length})</span>
          </h3>
        </div>

        {favMatches.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">No bookmarked matches yet.</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Click the bookmark icon on any match card to save it here for fast access.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <span>{m.homeTeam.name}</span>
                  <span className="text-cyan-400 font-mono">{m.homeTeam.score} - {m.awayTeam.score}</span>
                  <span>{m.awayTeam.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences & Odds Settings */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>Odds Format & Display Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            { id: 'decimal', label: 'Decimal Odds', example: '1.95' },
            { id: 'fractional', label: 'Fractional Odds', example: '19/20' },
            { id: 'american', label: 'American Odds', example: '-105' },
          ].map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setOddsFormat(fmt.id as any)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                oddsFormat === fmt.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold">{fmt.label}</div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">e.g. {fmt.example}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flutter Export Modal */}
      {showFlutterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-[#0E1524] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>StatEdge Flutter / Dart Code Architecture</span>
              </h3>
              <button
                onClick={() => setShowFlutterModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Clean architecture Flutter entity model ready to plug into your Dart / Flutter football analytics mobile app:
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-60">
              {flutterCodeSnippet}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={copyFlutterCode}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-90"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Dart Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
