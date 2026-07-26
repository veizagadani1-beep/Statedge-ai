import React, { useState, useEffect } from 'react';
import { Bell, Shield, Zap, CheckCircle2, AlertTriangle, Radio, Sparkles } from 'lucide-react';
import {
  getAlertPreferences,
  saveAlertPreferences,
  AlertPreferences,
} from '../services/appStateService';

export const AlertsModule: React.FC = () => {
  const [prefs, setPrefs] = useState<AlertPreferences>(getAlertPreferences());
  const [testAlert, setTestAlert] = useState<string | null>(null);

  const handleToggle = (key: keyof AlertPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    saveAlertPreferences(updated);
  };

  const handleTriggerTest = (type: string) => {
    setTestAlert(`[LIVE TEST ALERT] ${type}: Manchester City scored! (Erling Haaland 34')`);
    setTimeout(() => setTestAlert(null), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Bell className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-white">Live Push & Event Alerts</h1>
            <p className="text-xs text-slate-400">
              Configure real-time push notification preferences for match goals, cards, lineups, and transfers.
            </p>
          </div>
        </div>
      </div>

      {/* Live Toast Test Banner */}
      {testAlert && (
        <div className="p-4 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{testAlert}</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">Just now</span>
        </div>
      )}

      {/* Alert Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            key: 'goalAlerts',
            title: 'Goal Alerts',
            desc: 'Instant notifications when a goal is scored in favorited matches or teams.',
            icon: Zap,
            color: 'text-cyan-400',
          },
          {
            key: 'cardAlerts',
            title: 'Card & Red Card Alerts',
            desc: 'Alerts for disciplinary yellow/red cards issued by match referees.',
            icon: AlertTriangle,
            color: 'text-amber-400',
          },
          {
            key: 'lineupAlerts',
            title: 'Lineup Release Alerts',
            desc: 'Get notified 60 minutes before kickoff when starting XI lineups are published.',
            icon: Shield,
            color: 'text-emerald-400',
          },
          {
            key: 'transferAlerts',
            title: 'Transfer Breaking News',
            desc: 'Real-time alerts for confirmed transfer deals and squad sign-offs.',
            icon: Radio,
            color: 'text-purple-400',
          },
        ].map((item) => {
          const Icon = item.icon;
          const isEnabled = prefs[item.key as keyof AlertPreferences];

          return (
            <div
              key={item.key}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle(item.key as keyof AlertPreferences)}
                className={`w-12 h-6 rounded-full transition-colors relative border ${
                  isEnabled ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isEnabled ? 'translate-x-7 bg-slate-950' : 'translate-x-1 bg-slate-500'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Alert Simulation Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Test Notification Engine
        </h3>
        <p className="text-xs text-slate-400">
          Trigger a sample notification to verify push and browser visual toast rendering:
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTriggerTest('Goal Alert')}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-all"
          >
            Test Goal Toast
          </button>
          <button
            onClick={() => handleTriggerTest('Red Card Alert')}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all"
          >
            Test Card Toast
          </button>
          <button
            onClick={() => handleTriggerTest('Lineup Alert')}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-all"
          >
            Test Lineup Toast
          </button>
        </div>
      </div>
    </div>
  );
};
export default AlertsModule;
