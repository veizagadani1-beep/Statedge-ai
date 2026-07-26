import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Activity, Bookmark, Search, Smartphone, Monitor, Database, CheckCircle2, AlertCircle, Sun, Moon, Globe } from 'lucide-react';
import { NavTab } from '../types';
import { fetchApiStatus, ApiStatusResponse } from '../services/footballApi';
import { SupportedLanguage, LANGUAGE_LABELS } from '../services/appStateService';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  favoritesCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  onOpenAi: () => void;
  currentLang?: SupportedLanguage;
  onChangeLang?: (lang: SupportedLanguage) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
  searchQuery,
  setSearchQuery,
  isMobileFrame,
  setIsMobileFrame,
  onOpenAi,
  currentLang = 'en',
  onChangeLang,
  isDarkMode = true,
  onToggleTheme,
}) => {
  const [apiStatus, setApiStatus] = useState<ApiStatusResponse | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    fetchApiStatus().then(setApiStatus);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 text-white transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div 
          onClick={() => setActiveTab('home')} 
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                StatEdge
              </span>
              <span className="text-xs font-black tracking-widest px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Football Intelligence Platform
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search players, teams, leagues or stadiums..."
              value={searchQuery}
              onFocus={() => setActiveTab('search')}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'search') setActiveTab('search');
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Multi-Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-all"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline uppercase">{currentLang}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1">
                {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((langKey) => (
                  <button
                    key={langKey}
                    onClick={() => {
                      if (onChangeLang) onChangeLang(langKey);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      currentLang === langKey
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{LANGUAGE_LABELS[langKey].name}</span>
                    <span>{LANGUAGE_LABELS[langKey].flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 transition-all"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>

          {/* API-Football Status Badge */}
          <button
            onClick={() => setShowApiModal(!showApiModal)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              apiStatus?.connected
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
            }`}
            title="API-Football Connection Status"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">
              {apiStatus?.connected ? 'API-Football Live' : 'API-Football Mode'}
            </span>
            <span className={`w-2 h-2 rounded-full ${apiStatus?.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          </button>

          {/* Favorites Badge Button */}
          <button
            onClick={() => setActiveTab('profile')}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
            title="Saved Favorites"
          >
            <Bookmark className="w-4 h-4" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center animate-bounce">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* AI Assistant Quick Launch Button */}
          <button
            onClick={onOpenAi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 hover:opacity-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">StatEdge AI</span>
          </button>
        </div>
      </div>

      {/* API-Football Information Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowApiModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${apiStatus?.connected ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'}`}>
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">API-Football Integration</h3>
                <p className="text-xs text-slate-400">Live Football Data Proxy</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection Status:</span>
                <span className={`font-bold flex items-center gap-1 ${apiStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {apiStatus?.connected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" /> Fallback Mode
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">Environment Variable:</span>
                <span className="font-mono font-bold text-cyan-400">API_FOOTBALL_KEY</span>
              </div>

              {apiStatus?.account && (
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-slate-300">
                  <span>API Plan:</span>
                  <span className="font-mono font-bold text-emerald-400">{apiStatus.account.firstname || 'Active Subscriber'}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              All live matches, standings, statistics, lineups, injuries, events, and odds are queried via HTTPS requests passing the <code className="text-cyan-400 bg-slate-950 px-1 py-0.5 rounded">x-apisports-key</code> header.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setShowApiModal(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all"
              >
                Close Connection Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
