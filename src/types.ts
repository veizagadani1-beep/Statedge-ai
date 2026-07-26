export type NavTab =
  | 'home'
  | 'matches'
  | 'analysis'
  | 'analytics'
  | 'transfers'
  | 'hub'
  | 'search'
  | 'alerts'
  | 'teams'
  | 'ai'
  | 'profile'
  | 'standings'
  | 'compare';

export type LeagueId = 'epl' | 'laliga' | 'ucl' | 'seriea' | 'bundesliga' | 'mls';

export interface League {
  id: LeagueId;
  name: string;
  country: string;
  logo: string;
  season: string;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'var' | 'corner';
  teamId: string;
  player: string;
  detail?: string;
}

export interface HeatMapPoint {
  x: number; // 0-100 percentage across width
  y: number; // 0-100 percentage across height
  intensity: number; // 0.1 to 1.0 heat density
}

export interface PlayerPosition {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  x: number; // percentage on pitch 0-100
  y: number; // percentage on pitch 0-100
  rating: number;
  goals?: number;
  assists?: number;
  expectedAssists?: number;
  heatMapPoints?: HeatMapPoint[];
}

export interface Lineup {
  formation: string;
  players: PlayerPosition[];
}

export interface PossessionMomentumPoint {
  minute: number;
  homePossession: number;
  awayPossession: number;
  homeMomentum: number; // -100 to 100 domain rating
  awayMomentum: number;
}

export interface XGTimelinePoint {
  minute: number;
  homeXg: number;
  awayXg: number;
}

export interface CardDetail {
  minute: number;
  player: string;
  teamId: string;
  type: 'yellow' | 'red';
  reason?: string;
}

export interface ShotPoint {
  id: string;
  minute: number;
  teamId: string;
  player: string;
  xg: number;
  x: number; // 0-100 percentage across pitch width
  y: number; // 0-100 percentage across pitch height
  result: 'goal' | 'saved' | 'blocked' | 'missed';
  shotType: 'Left Foot' | 'Right Foot' | 'Header' | 'Penalty';
  assistedBy?: string;
}

export interface RefereeStats {
  name: string;
  nationality: string;
  matchesOfficiated: number;
  foulsPerGame: number;
  yellowCardsPerGame: number;
  redCardsPerGame: number;
  penaltiesPerGame: number;
  varInterventionsThisSeason: number;
  strictnessRating: number; // 1 to 10 scale
}

export interface WeatherInfo {
  temperatureC: number;
  condition: 'Clear' | 'Sunny' | 'Clear Night' | 'Light Rain' | 'Heavy Rain' | 'Cloudy' | 'Snow';
  humidityPct: number;
  windSpeedKmh: number;
  pitchCondition: 'Dry Fast Pitch' | 'Wet Slick Pitch' | 'Standard Grass' | 'Heavy Wet Pitch';
  tacticalImpactNote: string;
}

export interface InjuryReport {
  id: string;
  player: string;
  teamId: string;
  position: string;
  injuryType: string;
  status: 'Missing' | 'Doubtful' | 'Subbed Off Injured';
  expectedReturn?: string;
  importanceRating: 'Key Starter' | 'Rotation' | 'Squad Player';
}

export interface MatchStats {
  possession: [number, number]; // [home, away]
  expectedGoals: [number, number];
  expectedAssists: [number, number];
  shotsTotal: [number, number];
  shotsOnTarget: [number, number];
  passAccuracy: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  corners: [number, number];
  cornersFirstHalf?: [number, number];
  cornersSecondHalf?: [number, number];
  offsides: [number, number];
  possessionTimeline?: PossessionMomentumPoint[];
  xgTimeline?: XGTimelinePoint[];
  cardDetails?: CardDetail[];
  shotsMap?: ShotPoint[];
  refereeDetails?: RefereeStats;
  weather?: WeatherInfo;
  injuries?: InjuryReport[];
}

export interface Match {
  id: string;
  leagueId: LeagueId;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    score: number;
    form: ('W' | 'D' | 'L')[]; // 10 match form
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    score: number;
    form: ('W' | 'D' | 'L')[]; // 10 match form
  };
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  minute?: number;
  startTime: string;
  venue: string;
  referee: string;
  odds: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  stats?: MatchStats;
  events?: MatchEvent[];
  lineups?: {
    home: Lineup;
    away: Lineup;
  };
  heatMapData?: {
    home: HeatMapPoint[];
    away: HeatMapPoint[];
  };
  aiInsight?: {
    winProbabilityHome: number;
    winProbabilityDraw: number;
    winProbabilityAway: number;
    summary: string;
    predictedScore: string;
  };
}

export interface PlayerStats {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  photo: string;
  position: 'Forward' | 'Midfielder' | 'Defender' | 'Goalkeeper';
  number: number;
  nationality: string;
  age: number;
  marketValue: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedAssistsPer90: number;
  minutesPlayed: number;
  rating: number;
  recentRatings?: number[]; // last 5 match ratings
  keyPassesPer90: number;
  dribblesCompletedPer90: number;
  tacklesPer90: number;
  heatMapPoints?: HeatMapPoint[];
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
}

export interface MatchHistoryItem {
  opponent: string;
  opponentLogo?: string;
  score: string;
  result: 'W' | 'D' | 'L';
  date: string;
  isHome: boolean;
  xgFor: number;
  xgAgainst: number;
}

export interface TeamStats {
  id: string;
  name: string;
  shortName: string;
  leagueId: LeagueId;
  logo: string;
  stadium: string;
  manager: string;
  marketValue: string;
  form: ('W' | 'D' | 'L')[]; // 10 match form
  last10Matches?: MatchHistoryItem[];
  heatMapPoints?: HeatMapPoint[];
  stats: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
    cleanSheets: number;
    xGAverage: number;
    xGAConcededAverage: number;
    expectedAssistsAverage: number;
    avgPossession: number;
    ppda: number; // Passes per defensive action (pressing intensity)
    cornersPerGame: number;
    cardsPerGame: {
      yellow: number;
      red: number;
    };
    homeRecord: { w: number; d: number; l: number; gf: number; ga: number };
    awayRecord: { w: number; d: number; l: number; gf: number; ga: number };
  };
  goalDistribution: {
    '0-15': number;
    '16-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76-90+': number;
  };
}

export interface StandingRow {
  position: number;
  teamId: string;
  teamName: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: ('W' | 'D' | 'L')[]; // 10 match form
  zone?: 'ucl' | 'uel' | 'relegation';
}

export interface HeadToHeadRecord {
  teamAId: string;
  teamBId: string;
  totalMatches: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  lastMatches: {
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    competition: string;
  }[];
}

export interface AiPredictionReport {
  predictedScore: string;
  winProbabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  expectedGoals: {
    homeXG: string;
    awayXG: string;
  };
  keyMatchup: string;
  tacticalInsight: string;
  recommendedBet: string;
  keyPlayersToWatch: string[];
  riskFactor: string;
}

