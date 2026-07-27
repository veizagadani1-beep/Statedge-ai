import {
  Match,
  TeamStats,
  PlayerStats,
  StandingRow,
  InjuryReport,
  MatchEvent,
  MatchStats,
  LeagueId,
} from '../types';
import { saveOfflineCache, getOfflineCache } from './appStateService';

// Map internal league IDs to API-Football League IDs
export const LEAGUE_TO_API_ID: Record<LeagueId, number> = {
  epl: 39,
  laliga: 140,
  ucl: 2,
  seriea: 135,
  bundesliga: 78,
  mls: 253,
};

export const API_ID_TO_LEAGUE: Record<number, LeagueId> = {
  39: 'epl',
  140: 'laliga',
  2: 'ucl',
  135: 'seriea',
  78: 'bundesliga',
  253: 'mls',
};

export interface ApiStatusResponse {
  connected: boolean;
  message: string;
  account?: any;
}

export interface FetchFixturesResult {
  success: boolean;
  matches: Match[];
  error?: string;
  todayDate: string;
}

export function getTodayMadridDate(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
}

/**
 * Check if API-Football key is configured and active
 */
export async function fetchApiStatus(): Promise<ApiStatusResponse> {
  try {
    const res = await fetch('/api/football/status');
    if (!res.ok) return { connected: false, message: 'Server proxy endpoint unavailable' };
    const data = await res.json();
    return data;
  } catch (err) {
    return { connected: false, message: 'Failed to connect to backend proxy' };
  }
}

/**
 * Transform API-Football fixture object into our app's Match object
 */
export function normalizeApiMatch(item: any): Match {
  const f = item.fixture || {};
  const h = item.teams?.home || {};
  const a = item.teams?.away || {};
  const g = item.goals || {};
  const league = item.league || {};

  const statusShort = f.status?.short || 'NS';
  let matchStatus: 'LIVE' | 'FINISHED' | 'UPCOMING' = 'UPCOMING';
  if (['1H', '2H', 'ET', 'P', 'LIVE', 'INT', 'HT'].includes(statusShort)) matchStatus = 'LIVE';
  else if (['FT', 'AET', 'PEN'].includes(statusShort)) matchStatus = 'FINISHED';

  const mappedLeagueId = API_ID_TO_LEAGUE[league.id] || 'epl';

  let matchTime = '20:00';
  if (f.date) {
    try {
      matchTime = new Date(f.date).toLocaleTimeString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      matchTime = '20:00';
    }
  }

  return {
    id: String(f.id || Math.random()),
    leagueId: mappedLeagueId,
    startTime: matchStatus === 'LIVE' ? `LIVE ${f.status?.elapsed || 0}'` : `${matchTime} (CET)`,
    status: matchStatus,
    minute: f.status?.elapsed ? Number(f.status.elapsed) : undefined,
    odds: { homeWin: 0, draw: 0, awayWin: 0 },
    homeTeam: {
      id: String(h.id || 'home'),
      name: h.name || 'Home Team',
      shortName: (h.name || 'HOME').substring(0, 3).toUpperCase(),
      logo: h.logo || '',
      score: g.home ?? 0,
      form: [],
    },
    awayTeam: {
      id: String(a.id || 'away'),
      name: a.name || 'Away Team',
      shortName: (a.name || 'AWAY').substring(0, 3).toUpperCase(),
      logo: a.logo || '',
      score: g.away ?? 0,
      form: [],
    },
    venue: f.venue?.name
  ? `${f.venue.name}${f.venue.city ? `, ${f.venue.city}` : ''}`
  : league.name
    ? `${league.name}${league.country ? ` · ${league.country}` : ''}`
    : 'Estadio no informado',
    referee: f.referee || 'Not reported',
  };
}

/**
 * Fetch Today's Fixtures explicitly with strict error checking (Europe/Madrid date)
 */
export async function fetchTodayMatches(leagueId?: LeagueId | 'all'): Promise<FetchFixturesResult> {
  const todayDate = getTodayMadridDate();
  const cacheKey = `today_matches_${leagueId || 'all'}_${todayDate}`;

  try {
    const params = new URLSearchParams();
    params.append('date', todayDate);
    if (leagueId && leagueId !== 'all' && LEAGUE_TO_API_ID[leagueId]) {
      params.append('league', String(LEAGUE_TO_API_ID[leagueId]));
   params.append('season', '2026');
    }

    const res = await fetch(`/api/football/fixtures?${params.toString()}`);
    if (!res.ok) {
      const cached = getOfflineCache<Match[]>(cacheKey);
      if (cached) return { success: true, matches: cached, todayDate };
      return {
        success: false,
        matches: [],
        error: `HTTP ${res.status}: Failed to reach API-Football backend server`,
        todayDate,
      };
    }

    const json = await res.json();

    if (json.apiConnected === false) {
      const cached = getOfflineCache<Match[]>(cacheKey);
      if (cached) return { success: true, matches: cached, todayDate };
      return {
        success: false,
        matches: [],
        error: json.error || 'API_FOOTBALL_KEY missing or invalid on server',
        todayDate,
      };
    }

    if (json.response && Array.isArray(json.response)) {
      const matches = json.response.map(normalizeApiMatch);
      saveOfflineCache(cacheKey, matches);
      return {
        success: true,
        matches,
        todayDate,
      };
    }

    return {
      success: true,
      matches: [],
      todayDate,
    };
  } catch (err: any) {
    const cached = getOfflineCache<Match[]>(cacheKey);
    if (cached) return { success: true, matches: cached, todayDate };
    return {
      success: false,
      matches: [],
      error: err.message || 'Network error querying API-Football endpoint',
      todayDate,
    };
  }
}

export async function fetchLiveMatches(leagueId?: LeagueId): Promise<Match[]> {
  const res = await fetchTodayMatches(leagueId);
  return res.matches;
}

/**
 * Fetch Teams for a league from API-Football
 */
export async function fetchTeams(leagueId: LeagueId | 'all'): Promise<TeamStats[]> {
  try {
    const targetLeagues: LeagueId[] = leagueId === 'all' ? ['epl', 'laliga'] : [leagueId];
    const allTeams: TeamStats[] = [];

    for (const lId of targetLeagues) {
      const apiLeagueId = LEAGUE_TO_API_ID[lId] || 39;
      const res = await fetch(`/api/football/teams?league=${apiLeagueId}&season=2024`);
      if (!res.ok) continue;
      const json = await res.json();

      if (json.response && Array.isArray(json.response)) {
        for (const item of json.response) {
          const t = item.team || {};
          const v = item.venue || {};
          allTeams.push({
            id: String(t.id),
            leagueId: lId,
            name: t.name || 'Club',
            shortName: t.code || (t.name || 'CLUB').substring(0, 3).toUpperCase(),
            logo: t.logo || '',
            marketValue: 'Data not available',
            stats: {
              matchesPlayed: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsScored: 0,
              goalsConceded: 0,
              cleanSheets: 0,
              xGAverage: 0,
              xGAConcededAverage: 0,
              expectedAssistsAverage: 0,
              avgPossession: 0,
              ppda: 0,
              cornersPerGame: 0,
              cardsPerGame: { yellow: 0, red: 0 },
              homeRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
              awayRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
            },
            stadium: v.name ? `${v.name}${v.city ? `, ${v.city}` : ''}` : 'Data not available',
            manager: 'Data not available',
            form: [],
            goalDistribution: { '0-15': 0, '16-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76-90+': 0 },
          });
        }
      }
    }

    // Try joining with standings to populate win/loss/goals stats
    try {
      const standingsLId = leagueId === 'all' ? 'epl' : leagueId;
      const standings = await fetchStandings(standingsLId);
      if (standings.length > 0) {
        allTeams.forEach((team) => {
          const stRow = standings.find((s) => s.teamId === team.id || s.teamName.toLowerCase().includes(team.name.toLowerCase()));
          if (stRow) {
            team.stats.matchesPlayed = stRow.played;
            team.stats.wins = stRow.won;
            team.stats.draws = stRow.drawn;
            team.stats.losses = stRow.lost;
            team.stats.goalsScored = stRow.gf;
            team.stats.goalsConceded = stRow.ga;
          }
        });
      }
    } catch {
      // Standings enrichment optional
    }

    return allTeams;
  } catch (err) {
    console.warn('API-Football teams fetch failed:', err);
    return [];
  }
}

/**
 * Fetch Standings for a given league
 */
export async function fetchStandings(leagueId: LeagueId): Promise<StandingRow[]> {
  try {
    const apiLeagueId = LEAGUE_TO_API_ID[leagueId] || 39;
    const res = await fetch(`/api/football/standings?league=${apiLeagueId}&season=2024`);
    if (!res.ok) throw new Error('Standings proxy error');
    const json = await res.json();

    if (json.response && json.response[0]?.league?.standings?.[0]) {
      const apiRows = json.response[0].league.standings[0];
      return apiRows.map((row: any) => {
        const pos = row.rank;
        let zone: StandingRow['zone'] = undefined;
        if (pos <= 4) zone = 'ucl';
        else if (pos === 5 || pos === 6) zone = 'uel';
        else if (pos >= 18) zone = 'relegation';

        return {
          position: pos,
          teamId: String(row.team.id),
          teamName: row.team.name,
          teamLogo: row.team.logo,
          played: row.all.played,
          won: row.all.win,
          drawn: row.all.draw,
          lost: row.all.lose,
          gf: row.all.goals.for,
          ga: row.all.goals.against,
          gd: row.goalsDiff,
          points: row.points,
          form: row.form ? row.form.split('').slice(0, 5) : [],
          zone,
        };
      });
    }
  } catch (err) {
    console.warn('API-Football standings fetch failed:', err);
  }

  return [];
}

/**
 * Fetch Top Players for a given league from API-Football
 */
export async function fetchTopPlayers(leagueId: LeagueId | 'all'): Promise<PlayerStats[]> {
  try {
    const lId = leagueId === 'all' ? 'epl' : leagueId;
    const apiLeagueId = LEAGUE_TO_API_ID[lId] || 39;
    const res = await fetch(`/api/football/players?league=${apiLeagueId}&season=2024&topscorers=true`);
    if (!res.ok) throw new Error('Players proxy error');
    const json = await res.json();

    if (json.response && Array.isArray(json.response) && json.response.length > 0) {
      return json.response.map((item: any, idx: number) => {
        const p = item.player || {};
        const st = item.statistics?.[0] || {};
        const posRaw = (st.games?.position || '').toLowerCase();
        let pos: PlayerStats['position'] = 'Forward';
        if (posRaw.includes('goalkeeper') || posRaw.includes('keeper')) pos = 'Goalkeeper';
        else if (posRaw.includes('defender') || posRaw.includes('back')) pos = 'Defender';
        else if (posRaw.includes('midfield')) pos = 'Midfielder';

        return {
          id: String(p.id || idx),
          name: p.name || 'Player',
          teamId: String(st.team?.id || ''),
          teamName: st.team?.name || 'Club',
          teamLogo: st.team?.logo || '',
          photo: p.photo || '',
          position: pos,
          number: p.number || idx + 1,
          nationality: p.nationality || 'International',
          age: p.age || 0,
          rating: st.games?.rating ? parseFloat(st.games.rating) : 0,
          matchesPlayed: st.games?.appearences || 0,
          goals: st.goals?.total || 0,
          assists: st.goals?.assists || 0,
          expectedGoals: undefined,
          expectedAssists: undefined,
          minutesPlayed: st.games?.minutes || 0,
          shotsOnTarget: st.shots?.on || 0,
          passAccuracyPct: st.passes?.accuracy || 0,
          marketValue: 'Data not available',
        };
      });
    }
  } catch (err) {
    console.warn('API-Football top players fetch failed:', err);
  }

  return [];
}

/**
 * Fetch Head-to-Head matches from API-Football
 */
export async function fetchHeadToHead(team1Id: string, team2Id: string): Promise<Match[]> {
  try {
    const res = await fetch(`/api/football/fixtures?h2h=${team1Id}-${team2Id}&last=10`);
    if (!res.ok) return [];
    const json = await res.json();
    if (json.response && Array.isArray(json.response)) {
      return json.response.map(normalizeApiMatch);
    }
  } catch (err) {
    console.warn('API-Football H2H fetch failed:', err);
  }
  return [];
}

/**
 * Fetch detailed match statistics for a specific fixture
 */
export async function fetchMatchStatistics(fixtureId: string): Promise<MatchStats | null> {
  try {
    const res = await fetch(`/api/football/statistics?fixture=${fixtureId}`);
    if (!res.ok) throw new Error('Stats proxy error');
    const json = await res.json();

    if (json.response && json.response.length >= 2) {
      const homeStatsArr = json.response[0]?.statistics || [];
      const awayStatsArr = json.response[1]?.statistics || [];

      const getVal = (arr: any[], type: string): number | null => {
        const item = arr.find((i) => i.type === type);
        if (!item || item.value === null) return null;
        if (typeof item.value === 'string') return parseInt(item.value, 10) || 0;
        return item.value;
      };

      const hPoss = getVal(homeStatsArr, 'Ball Possession');
      const aPoss = getVal(awayStatsArr, 'Ball Possession');

      const hXg = getVal(homeStatsArr, 'expected_goals');
      const aXg = getVal(awayStatsArr, 'expected_goals');

      return {
        possession: [hPoss ?? 50, aPoss ?? 50],
        expectedGoals: [
          hXg !== null ? parseFloat(hXg.toString()) : 0,
          aXg !== null ? parseFloat(aXg.toString()) : 0,
        ],
        expectedAssists: [0, 0],
        shotsTotal: [getVal(homeStatsArr, 'Total Shots') ?? 0, getVal(awayStatsArr, 'Total Shots') ?? 0],
        shotsOnTarget: [getVal(homeStatsArr, 'Shots on Goal') ?? 0, getVal(awayStatsArr, 'Shots on Goal') ?? 0],
        passAccuracy: [
          getVal(homeStatsArr, 'Passes %') ?? 0,
          getVal(awayStatsArr, 'Passes %') ?? 0,
        ],
        fouls: [getVal(homeStatsArr, 'Fouls') ?? 0, getVal(awayStatsArr, 'Fouls') ?? 0],
        yellowCards: [getVal(homeStatsArr, 'Yellow Cards') ?? 0, getVal(awayStatsArr, 'Yellow Cards') ?? 0],
        redCards: [getVal(homeStatsArr, 'Red Cards') ?? 0, getVal(awayStatsArr, 'Red Cards') ?? 0],
        corners: [getVal(homeStatsArr, 'Corner Kicks') ?? 0, getVal(awayStatsArr, 'Corner Kicks') ?? 0],
        offsides: [getVal(homeStatsArr, 'Offsides') ?? 0, getVal(awayStatsArr, 'Offsides') ?? 0],
      };
    }
  } catch (err) {
    console.warn('API-Football match statistics fetch failed:', err);
  }

  return null;
}

/**
 * Fetch match events (goals, cards, VAR, substitutes)
 */
export async function fetchMatchEvents(fixtureId: string): Promise<MatchEvent[]> {
  try {
    const res = await fetch(`/api/football/events?fixture=${fixtureId}`);
    if (!res.ok) throw new Error('Events proxy error');
    const json = await res.json();

    if (json.response && Array.isArray(json.response)) {
      return json.response.map((evt: any, idx: number) => {
        let type: MatchEvent['type'] = 'goal';
        if (evt.type === 'Goal') type = 'goal';
        else if (evt.type === 'Card' && evt.detail === 'Yellow Card') type = 'yellow_card';
        else if (evt.type === 'Card' && evt.detail === 'Red Card') type = 'red_card';
        else if (evt.type === 'subst') type = 'sub';
        else if (evt.type === 'Var') type = 'var';

        return {
          id: String(idx + 1),
          minute: evt.time?.elapsed || 0,
          type,
          teamId: String(evt.team?.id || ''),
          player: evt.player?.name || 'Player',
          detail: `${evt.detail || ''} ${evt.assist?.name ? `(Assist: ${evt.assist.name})` : ''}`.trim(),
        };
      });
    }
  } catch (err) {
    console.warn('API-Football events fetch failed:', err);
  }

  return [];
}

/**
 * Fetch injury reports from API-Football
 */
export async function fetchInjuries(leagueId?: LeagueId, fixtureId?: string): Promise<InjuryReport[]> {
  try {
    const params = new URLSearchParams();
    if (fixtureId) {
      params.append('fixture', fixtureId);
    } else {
      const apiLeagueId = LEAGUE_TO_API_ID[leagueId || 'epl'] || 39;
      params.append('league', String(apiLeagueId));
      params.append('season', '2024');
    }

    const res = await fetch(`/api/football/injuries?${params.toString()}`);
    if (!res.ok) throw new Error('Injuries proxy error');
    const json = await res.json();

    if (json.response && Array.isArray(json.response) && json.response.length > 0) {
      return json.response.slice(0, 12).map((inj: any, idx: number) => ({
        id: `api-inj-${idx}`,
        player: inj.player?.name || 'Missing Player',
        teamId: String(inj.team?.id || ''),
        position: inj.player?.type || 'Squad Player',
        injuryType: inj.player?.reason || 'Injury / Fitness',
        status: 'Missing',
        expectedReturn: 'Data not available',
        importanceRating: 'Squad Player',
      }));
    }
  } catch (err) {
    console.warn('API-Football injuries fetch failed:', err);
  }

  return [];
}

/**
 * Fetch match lineups from API-Football
 */
export async function fetchMatchLineups(fixtureId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/football/lineups?fixture=${fixtureId}`);
    if (!res.ok) throw new Error('Lineups proxy error');
    const json = await res.json();
    if (json.response && Array.isArray(json.response)) {
      return json.response;
    }
  } catch (err) {
    console.warn('API-Football lineups fetch failed:', err);
  }
  return [];
}

/**
 * Fetch Transfers from API-Football
 */
export async function fetchTransfers(teamId?: string, playerId?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (teamId) params.append('team', teamId);
    if (playerId) params.append('player', playerId);

    if ([...params.keys()].length === 0) {
      params.append('team', '33'); // Default Manchester United transfers if none specified
    }

    const res = await fetch(`/api/football/transfers?${params.toString()}`);
    if (!res.ok) throw new Error('Transfers proxy error');
    const json = await res.json();
    if (json.response && Array.isArray(json.response)) {
      return json.response;
    }
  } catch (err) {
    console.warn('API-Football transfers fetch failed:', err);
  }
  return [];
}

/**
 * Fetch Trophies from API-Football
 */
export async function fetchTrophies(playerId?: string, coachId?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (playerId) params.append('player', playerId);
    if (coachId) params.append('coach', coachId);

    const res = await fetch(`/api/football/trophies?${params.toString()}`);
    if (!res.ok) throw new Error('Trophies proxy error');
    const json = await res.json();
    if (json.response && Array.isArray(json.response)) {
      return json.response;
    }
  } catch (err) {
    console.warn('API-Football trophies fetch failed:', err);
  }
  return [];
}

/**
 * Fetch Coaches / Managers from API-Football
 */
export async function fetchCoaches(teamId?: string, coachId?: string, search?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (teamId) params.append('team', teamId);
    if (coachId) params.append('id', coachId);
    if (search) params.append('search', search);

    const res = await fetch(`/api/football/coaches?${params.toString()}`);
    if (!res.ok) throw new Error('Coaches proxy error');
    const json = await res.json();
    if (json.response && Array.isArray(json.response)) {
      return json.response;
    }
  } catch (err) {
    console.warn('API-Football coaches fetch failed:', err);
  }
  return [];
}

/**
 * Fetch Venues / Stadiums from API-Football
 */
export async function fetchVenues(venueId?: string, search?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (venueId) params.append('id', venueId);
    if (search) params.append('search', search);

    const res = await fetch(`/api/football/venues?${params.toString()}`);
    if (!res.ok) throw new Error('Venues proxy error');
    const json = await res.json();
    if (json.response && Array.isArray(json.response)) {
      return json.response;
    }
  } catch (err) {
    console.warn('API-Football venues fetch failed:', err);
  }
  return [];
}

/**
 * Fetch Leagues from API-Football
 */
export async function fetchLeagues(search?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const res = await fetch(`/api/football/leagues?${params.toString()}`);
    if (!res.ok) throw new Error('Leagues proxy error');
    const json = await res.json();
    if (json.response && Array.isArray(json.response)) {
      return json.response;
    }
  } catch (err) {
    console.warn('API-Football leagues fetch failed:', err);
  }
  return [];
}



