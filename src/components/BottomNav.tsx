import React from 'react';
import { Home, Calendar, Shield, Bot, User, BarChart2, GitCompare, Trophy, Activity, ArrowRightLeft, Globe, Search, Bell } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'matches' as NavTab, label: 'Matches', icon: Calendar },
    { id: 'transfers' as NavTab, label: 'Transfers', icon: ArrowRightLeft },
    { id: 'hub' as NavTab, label: 'Pro Hub', icon: Globe },
    { id: 'search' as NavTab, label: 'Search', icon: Search },
    { id: 'ai' as NavTab, label: 'AI', icon: Bot, isSpecial: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 text-slate-400 select-none shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative -top-3 flex flex-col items-center group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                    isActive
                      ? 'bg-gradient-to-tr from-cyan-400 to-emerald-400 text-slate-950 ring-4 ring-cyan-500/20 scale-105 shadow-cyan-500/30'
                      : 'bg-gradient-to-tr from-cyan-600/90 to-emerald-600/90 text-white hover:scale-105 shadow-cyan-500/20'
                  }`}
                >
                  <Icon className="w-6 h-6 animate-pulse" />
                </div>
                <span className={`text-[10px] font-bold mt-1 tracking-tight ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all relative ${
                isActive ? 'text-cyan-400 font-bold' : 'hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-cyan-500/15 border border-cyan-500/30 scale-105' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
