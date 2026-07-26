import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  MapPin,
  Award,
  AlertCircle,
  Activity,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  fetchTopPlayers,
  fetchTeams,
  fetchCoaches,
  fetchVenues,
  fetchTrophies,
  fetchInjuries,
} from '../services/footballApi';

export const ProFootballHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'players' | 'managers' | 'stadiums' | 'referees' | 'trophies' | 'injuries'
  >('players');

  // Sub tab states
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  const [coaches, setCoaches] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [trophies, setTrophies] = useState<any[]>([]);
  const [injuries, setInjuries] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  // Load initial data
  useEffect(() => {
    setLoading(true);
    if (activeSubTab === 'players') {
      fetchTopPlayers('epl').then((res) => {
        setPlayers(res);
        if (res.length > 0) setSelectedPlayer(res[0]);
        setLoading(false);
      });
    } else if (activeSubTab === 'managers') {
      fetchCoaches('33').then((res) => {
        setCoaches(res);
        setLoading(false);
      });
    } else if (activeSubTab === 'stadiums') {
      fetchVenues(undefined, 'Manchester').then((res) => {
        setVenues(res);
        setLoading(false);
      });
    } else if (activeSubTab === 'trophies') {
      fetchTrophies('276').then((res) => {
        // Player 276 (Neymar) or general
        setTrophies(res);
        setLoading(false);
      });
    } else if (activeSubTab === 'injuries') {
      fetchInjuries('epl').then((res) => {
        setInjuries(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Pro Football Hub</h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 uppercase tracking-wider">
              API-Football Database
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Player career statistics, manager profiles, stadium details, referee stats, team trophies & injuries.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        {[
          { id: 'players', label: 'Player Career Stats', icon: User },
          { id: 'managers', label: 'Manager Profiles', icon: Shield },
          { id: 'stadiums', label: 'Stadium Profiles', icon: MapPin },
          { id: 'referees', label: 'Referee Statistics', icon: Activity },
          { id: 'trophies', label: 'Team Trophies', icon: Award },
          { id: 'injuries', label: 'Injuries & Suspensions', icon: AlertCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 text-cyan-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB CONTENTS */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Fetching data from API-Football...</span>
        </div>
      ) : (
        <>
          {/* 1. PLAYER CAREER STATISTICS */}
          {activeSubTab === 'players' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Player Selector List */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Featured Players</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedPlayer?.id === p.id
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.teamName || 'Squad'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Player Detail Card */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                {selectedPlayer ? (
                  <>
                    <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                        {selectedPlayer.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-white">{selectedPlayer.name}</h2>
                        <p className="text-xs text-slate-400">
                          Team: <span className="text-cyan-400 font-bold">{selectedPlayer.teamName || 'Professional Club'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Career Stat Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Goals</span>
                        <p className="text-xl font-black font-mono text-cyan-400">{selectedPlayer.goals ?? 0}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Assists</span>
                        <p className="text-xl font-black font-mono text-emerald-400">{selectedPlayer.assists ?? 0}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pass Accuracy</span>
                        <p className="text-xl font-black font-mono text-amber-400">{selectedPlayer.passAccuracy ?? 0}%</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Shots on Target</span>
                        <p className="text-xl font-black font-mono text-slate-200">{selectedPlayer.shotsOnTarget ?? 0}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-white">Full Career Multi-Season Breakdown</p>
                      <p className="text-[11px] text-slate-400">
                        Historical multi-decade season archives available via API-Football `/players?id=&season=` endpoints.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">Select a player to view details</div>
                )}
              </div>
            </div>
          )}

          {/* 2. MANAGER PROFILES */}
          {activeSubTab === 'managers' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Manager Profiles & Coaching Career
              </h2>

              {coaches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coaches.map((c, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="font-extrabold text-white text-sm">{c.name || 'Coach'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Age: {c.age || 'N/A'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Nationality: <span className="text-slate-200 font-bold">{c.nationality || 'Data not available'}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Current Team: <span className="text-cyan-400 font-bold">{c.team?.name || 'Club Manager'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800">
                  Data not available (No specific coach profile retrieved for this query).
                </div>
              )}
            </div>
          )}

          {/* 3. STADIUM PROFILES */}
          {activeSubTab === 'stadiums' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Stadium Profiles & Venue Technical Details
              </h2>

              {venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venues.map((v, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <p className="font-extrabold text-white text-sm">{v.name || 'Stadium'}</p>
                      <p className="text-[11px] text-slate-400">
                        City: <span className="text-slate-200">{v.city || 'Data not available'}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Capacity: <span className="text-cyan-400 font-mono font-bold">{v.capacity ? v.capacity.toLocaleString() : 'Data not available'}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Surface Pitch Type: <span className="text-emerald-400 font-bold">{v.surface || 'Grass'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800">
                  Data not available (No stadium record retrieved).
                </div>
              )}
            </div>
          )}

          {/* 4. REFEREE STATISTICS */}
          {activeSubTab === 'referees' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Match Official & Referee Directory
              </h2>

              <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="font-bold text-white">Data not available</p>
                <p className="text-[11px] text-slate-500">
                  API-Football v3 provides referee name attributes inside individual `/fixtures` payloads, but does not provide a standalone aggregated `/referees` statistical endpoint.
                </p>
              </div>
            </div>
          )}

          {/* 5. TEAM TROPHIES HISTORY */}
          {activeSubTab === 'trophies' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Trophies & Competition Titles History
              </h2>

              {trophies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {trophies.map((t, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                      <p className="font-extrabold text-amber-400">{t.league || 'Title'}</p>
                      <p className="text-[11px] text-slate-300 font-bold">{t.country || 'International'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Season: {t.season || 'N/A'}</p>
                      <p className="text-[10px] text-cyan-400 font-bold">Place: {t.place || 'Winner'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800">
                  Data not available (No trophy honors returned for this ID).
                </div>
              )}
            </div>
          )}

          {/* 6. INJURY HISTORY & SUSPENSIONS */}
          {activeSubTab === 'injuries' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Official Injury & Suspension Reports
              </h2>

              {injuries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {injuries.map((inj) => (
                    <div key={inj.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white">{inj.player}</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                          {inj.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Reason: <span className="text-amber-300">{inj.injuryType}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">Return: {inj.expectedReturn}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/80 rounded-xl border border-slate-800">
                  No active injury or suspension reports found in API-Football for this fixture.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default ProFootballHub;
