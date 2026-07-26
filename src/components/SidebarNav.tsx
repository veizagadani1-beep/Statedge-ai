import React from 'react';
import { Home, Calendar, Shield, Bot, User, BarChart2, GitCompare, Bookmark, Sparkles, Trophy, Activity, ArrowRightLeft, Search, Bell, Globe } from 'lucide-react';
import { NavTab, LeagueId } from '../types';
import { LEAGUES } from '../data/mockFootballData';

interface SidebarNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedLeague: LeagueId | 'all';
  setSelectedLeague: (league: LeagueId | 'all') => void;
  favoritesCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  selectedLeague,
  setSelectedLeague,
  favoritesCount,
}) => {
  const mainItems = [
    { id: 'home' as NavTab, label: 'Dashboard', icon: Home },
    { id: 'matches' as NavTab, label: "Today's Matches", icon: Calendar },
    { id: 'analytics' as NavTab, label: 'Premium Analytics', icon: Activity, highlight: true },
    { id: 'transfers' as NavTab, label: 'Transfer Market', icon: ArrowRightLeft },
    { id: 'hub' as NavTab, label: 'Pro Football Hub', icon: Globe },
    { id: 'search' as NavTab, label: 'Search Platform', icon: Search },
    { id: 'alerts' as NavTab, label: 'Live Push Alerts', icon: Bell },
    { id: 'analysis' as NavTab, label: 'Match Analysis', icon: BarChart2 },
    { id: 'teams' as NavTab, label: 'Team Statistics', icon: Shield },
    { id: 'standings' as NavTab, label: 'League Standings', icon: Trophy },
    { id: 'compare' as NavTab, label: 'Team Comparison', icon: GitCompare },
    { id: 'ai' as NavTab, label: 'StatEdge AI', icon: Bot },
    { id: 'profile' as NavTab, label: 'Saved & Settings', icon: User, badge: favoritesCount },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-[#0B0F17]/80 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto select-none">
      {/* Navigation Links */}
      <div className="space-y-1 mb-6">
        <p className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Navigation
        </p>
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-cyan-300 border border-cyan-500/30'
                  : item.highlight
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950">
                  {item.badge}
                </span>
              )}
              {item.highlight && <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />}
            </button>
          );
        })}
      </div>

      {/* Leagues Quick Filter */}
      <div className="space-y-1 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Top Competitions
          </p>
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
        </div>

        <button
          onClick={() => setSelectedLeague('all')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            selectedLeague === 'all'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>All Leagues</span>
        </button>

        {LEAGUES.map((league) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedLeague === league.id
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-xs">⚽</span>
              <span className="truncate">{league.name}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{league.country}</span>
          </button>
        ))}
      </div>

      {/* Footer Banner */}
      <div className="mt-auto pt-6">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border border-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <Bot className="w-4 h-4" />
            <span>StatEdge Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Powered by Gemini AI for real-time xG, tactics & match predictions.
          </p>
        </div>
      </div>
    </aside>
  );
};
