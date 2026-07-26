/**
 * Application State Services (Favorites, Push Notification Alerts, Offline Cache, Multi-language)
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt';

export const LANGUAGE_LABELS: Record<SupportedLanguage, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Português', flag: '🇵🇹' },
};

export const DICTIONARIES: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    matches: "Today's Matches",
    analytics: 'Premium Analytics',
    transfers: 'Transfer Market',
    pro_hub: 'Pro Football Hub',
    search: 'Search Platform',
    alerts: 'Live Alerts & Push',
    teams: 'Team Statistics',
    standings: 'League Standings',
    h2h: 'Team Comparison',
    ai: 'StatEdge AI',
    favorites: 'Favorites',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    data_not_available: 'Data not available',
  },
  es: {
    dashboard: 'Panel Principal',
    matches: 'Partidos de Hoy',
    analytics: 'Análisis Premium',
    transfers: 'Mercado de Fichajes',
    pro_hub: 'Centro Profesional',
    search: 'Buscar Plataforma',
    alerts: 'Alertas en Vivo',
    teams: 'Estadísticas de Equipos',
    standings: 'Clasificación',
    h2h: 'Comparativa H2H',
    ai: 'StatEdge IA',
    favorites: 'Favoritos',
    dark_mode: 'Modo Oscuro',
    light_mode: 'Modo Claro',
    data_not_available: 'Datos no disponibles',
  },
  fr: {
    dashboard: 'Tableau de bord',
    matches: "Matchs du jour",
    analytics: 'Analytique Premium',
    transfers: 'Marché des transferts',
    pro_hub: 'Centre Pro Football',
    search: 'Rechercher',
    alerts: 'Alertes en direct',
    teams: 'Statistiques des équipes',
    standings: 'Classement',
    h2h: 'Comparaison directe',
    ai: 'StatEdge IA',
    favorites: 'Favoris',
    dark_mode: 'Mode Sombre',
    light_mode: 'Mode Clair',
    data_not_available: 'Données indisponibles',
  },
  de: {
    dashboard: 'Dashboard',
    matches: 'Heutige Spiele',
    analytics: 'Premium-Analysen',
    transfers: 'Transfermarkt',
    pro_hub: 'Pro-Fußball-Zentrum',
    search: 'Suchen',
    alerts: 'Live-Benachrichtigungen',
    teams: 'Team-Statistiken',
    standings: 'Tabelle',
    h2h: 'Direktvergleich',
    ai: 'StatEdge KI',
    favorites: 'Favoriten',
    dark_mode: 'Dunkelmodus',
    light_mode: 'Hellmodus',
    data_not_available: 'Daten nicht verfügbar',
  },
  it: {
    dashboard: 'Dashboard',
    matches: 'Partite di Oggi',
    analytics: 'Analisi Premium',
    transfers: 'Calciomercato',
    pro_hub: 'Hub Calcio Pro',
    search: 'Cerca',
    alerts: 'Avvisi in tempo reale',
    teams: 'Statistiche Squadre',
    standings: 'Classifica',
    h2h: 'Confronto Diretto',
    ai: 'StatEdge IA',
    favorites: 'Preferiti',
    dark_mode: 'Modalità Scura',
    light_mode: 'Modalità Chiara',
    data_not_available: 'Dati non disponibili',
  },
  pt: {
    dashboard: 'Painel',
    matches: 'Jogos de Hoje',
    analytics: 'Análise Premium',
    transfers: 'Mercado de Transferências',
    pro_hub: 'Hub Futebol Pro',
    search: 'Pesquisar',
    alerts: 'Alertas em Direto',
    teams: 'Estatísticas da Equipe',
    standings: 'Classificação',
    h2h: 'Comparativo H2H',
    ai: 'StatEdge IA',
    favorites: 'Favoritos',
    dark_mode: 'Modo Escuro',
    light_mode: 'Modo Claro',
    data_not_available: 'Dados não disponíveis',
  },
};

// Favorites Persistence
const FAVORITES_KEY = 'statedge_favorites_v1';

export interface FavoriteItem {
  id: string;
  type: 'player' | 'team' | 'league' | 'match';
  name: string;
  subText?: string;
  logo?: string;
}

export function getFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(item: FavoriteItem): FavoriteItem[] {
  const current = getFavorites();
  const exists = current.some((f) => f.id === item.id && f.type === item.type);
  let updated: FavoriteItem[];
  if (exists) {
    updated = current.filter((f) => !(f.id === item.id && f.type === item.type));
  } else {
    updated = [item, ...current];
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  return updated;
}

// Push Notifications & Alerts Persistence
export interface AlertPreferences {
  goalAlerts: boolean;
  cardAlerts: boolean;
  lineupAlerts: boolean;
  transferAlerts: boolean;
  pushEnabled: boolean;
}

const ALERTS_KEY = 'statedge_alerts_config_v1';

export function getAlertPreferences(): AlertPreferences {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          goalAlerts: true,
          cardAlerts: true,
          lineupAlerts: true,
          transferAlerts: true,
          pushEnabled: false,
        };
  } catch {
    return {
      goalAlerts: true,
      cardAlerts: true,
      lineupAlerts: true,
      transferAlerts: true,
      pushEnabled: false,
    };
  }
}

export function saveAlertPreferences(prefs: AlertPreferences): void {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Alert settings save error:', e);
  }
}

export function saveOfflineCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`statedge_cache_${key}`, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    console.warn('Offline cache save error:', e);
  }
}

export function getOfflineCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`statedge_cache_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch {
    return null;
  }
}
