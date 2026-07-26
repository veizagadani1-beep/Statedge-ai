import React, { useState, useEffect } from 'react';
import { fetchTransfers, fetchTeams } from '../services/footballApi';
import { ArrowRightLeft, DollarSign, Calendar, Shield, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { TeamStats } from '../types';

export const TransfersModule: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('33'); // Default Manchester United
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTeams('epl').then(setTeams);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTransfers(selectedTeamId).then((res) => {
      setTransfers(res);
      setLoading(false);
    });
  }, [selectedTeamId]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-emerald-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Transfer Market & Squad Finances
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 uppercase tracking-wider">
              API-Football Live
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time transfer records, club movements, player deals, and squad market estimations.
          </p>
        </div>

        {/* Club Selector */}
        <div className="w-full md:w-auto">
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 border border-slate-700 text-xs font-bold rounded-2xl px-4 py-2.5 appearance-none cursor-pointer hover:border-emerald-500 transition-colors"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} Transfers
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Club Finances & Squad Value Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Estimated Squad Market Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold font-mono text-white">Data not available</p>
          <p className="text-[10px] text-slate-500">API-Football does not expose financial valuations</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Transfer Balance (Net Spent)</span>
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-extrabold font-mono text-white">Data not available</p>
          <p className="text-[10px] text-slate-500">Financial net spend details not returned</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Wage Bill Allocation</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold font-mono text-white">Data not available</p>
          <p className="text-[10px] text-slate-500">Club payroll budgets not returned</p>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            Official Transfer Activity Log
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">API-Football /transfers</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading transfer history from API-Football...</span>
          </div>
        ) : transfers.length > 0 ? (
          <div className="space-y-3">
            {transfers.slice(0, 10).map((tItem, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="font-extrabold text-white text-sm">
                    {tItem.player?.name || 'Player'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated: {tItem.transfers?.[0]?.date || 'Recent'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {tItem.transfers?.slice(0, 3).map((tr: any, trIdx: number) => (
                    <div key={trIdx} className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 truncate">{tr.teams?.out?.name || 'Previous Club'}</span>
                        <span className="text-emerald-400">➔</span>
                        <span className="text-white font-bold truncate">{tr.teams?.in?.name || 'New Club'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 text-[10px]">
                        {tr.type || 'Transfer'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1" />
            <p className="font-bold text-white">Data not available</p>
            <p className="text-[11px] text-slate-500">No recorded transfer transactions found for this club ID in API-Football.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default TransfersModule;
