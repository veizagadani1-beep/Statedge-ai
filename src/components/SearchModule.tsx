import React, { useState } from 'react';
import { Search, User, Shield, Trophy, MapPin, ExternalLink, Bookmark, Check } from 'lucide-react';
import { fetchTeams, fetchTopPlayers, fetchLeagues, fetchVenues } from '../services/footballApi';
import { toggleFavorite, getFavorites } from '../services/appStateService';

export const SearchModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'players' | 'teams' | 'leagues' | 'stadiums'>('all');
  const [loading, setLoading] = useState(false);
  
  const [playersResult, setPlayersResult] = useState<any[]>([]);
  const [teamsResult, setTeamsResult] = useState<any[]>([]);
  const [leaguesResult, setLeaguesResult] = useState<any[]>([]);
  const [stadiumsResult, setStadiumsResult] = useState<any[]>([]);

  const [favorites, setFavorites] = useState(getFavorites());

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);

    try {
      const query = searchTerm.trim().toLowerCase();

      // Search Teams, Players, Leagues & Venues from API-Football
      const [teamsData, playersData, leaguesData, venuesData] = await Promise.all([
        fetchTeams('epl'),
        fetchTopPlayers('epl'),
        fetchLeagues(query),
        fetchVenues(undefined, query),
      ]);

      // Filter locally or from returned responses
      const filteredTeams = teamsData.filter((t) => t.name.toLowerCase().includes(query));
      const filteredPlayers = playersData.filter(
        (p) => p.name.toLowerCase().includes(query) || p.teamName?.toLowerCase().includes(query)
      );

      setTeamsResult(filteredTeams.length > 0 ? filteredTeams : teamsData.slice(0, 4));
      setPlayersResult(filteredPlayers.length > 0 ? filteredPlayers : playersData.slice(0, 6));
      setLeaguesResult(leaguesData.length > 0 ? leaguesData : []);
      setStadiumsResult(venuesData.length > 0 ? venuesData : []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFav = (item: any) => {
    const updated = toggleFavorite(item);
    setFavorites(updated);
  };

  const isFav = (id: string, type: string) => {
    return favorites.some((f) => f.id === id && f.type === type);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Search className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-white">Platform Search Engine</h1>
            <p className="text-xs text-slate-400">
              Query players, teams, leagues and stadiums with live API-Football data.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search e.g. Haaland, Real Madrid, Premier League, Wembley..."
              className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs font-semibold rounded-2xl pl-11 pr-4 py-3 border border-slate-700 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'players', label: 'Players' },
            { id: 'teams', label: 'Teams' },
            { id: 'leagues', label: 'Leagues' },
            { id: 'stadiums', label: 'Stadiums' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {/* PLAYERS RESULTS */}
        {(activeCategory === 'all' || activeCategory === 'players') && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Players ({playersResult.length})
            </h2>

            {playersResult.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {playersResult.map((p) => {
                  const itemFav = isFav(p.id, 'player');
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-extrabold text-cyan-400 text-sm">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[140px]">{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{p.teamName || 'Squad Member'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleToggleFav({ id: p.id, type: 'player', name: p.name, subText: p.teamName })
                        }
                        className={`p-2 rounded-xl border transition-all ${
                          itemFav
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-amber-400'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                No matching players found.
              </div>
            )}
          </div>
        )}

        {/* TEAMS RESULTS */}
        {(activeCategory === 'all' || activeCategory === 'teams') && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Teams ({teamsResult.length})
            </h2>

            {teamsResult.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {teamsResult.map((t) => {
                  const itemFav = isFav(t.id, 'team');
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img src={t.logo} alt={t.name} className="w-8 h-8 object-contain" />
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[140px]">{t.name}</p>
                          <p className="text-[10px] text-slate-400">API-Football Team</p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleToggleFav({ id: t.id, type: 'team', name: t.name, logo: t.logo })
                        }
                        className={`p-2 rounded-xl border transition-all ${
                          itemFav
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-amber-400'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                No matching teams found.
              </div>
            )}
          </div>
        )}

        {/* STADIUMS / VENUES RESULTS */}
        {(activeCategory === 'all' || activeCategory === 'stadiums') && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Stadiums & Venues ({stadiumsResult.length})
            </h2>

            {stadiumsResult.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stadiumsResult.map((v, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-xs font-bold text-white">{v.venue?.name || v.name || 'Stadium'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      City: {v.venue?.city || 'Data not available'} | Capacity: {v.venue?.capacity ? v.venue.capacity.toLocaleString() : 'Data not available'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                Data not available (No specific stadiums returned for this query).
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default SearchModule;
