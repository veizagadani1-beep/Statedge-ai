import React, { useState, useEffect } from 'react';
import { NavTab, LeagueId, Match, TeamStats, PlayerStats } from './types';
import { fetchTodayMatches, fetchTeams, fetchTopPlayers } from './services/footballApi';
import { SupportedLanguage } from './services/appStateService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SidebarNav } from './components/SidebarNav';
import { HomeView } from './components/HomeView';
import { MatchesView } from './components/MatchesView';
import { TeamsView } from './components/TeamsView';
import { StandingsView } from './components/StandingsView';
import { TeamComparisonView } from './components/TeamComparisonView';
import { AiAssistantView } from './components/AiAssistantView';
import { ProfileView } from './components/ProfileView';
import { MatchDetailModal } from './components/MatchDetailModal';
import { PlayersView } from './components/PlayersView';
import { MatchAnalysisScreen } from './components/MatchAnalysisScreen';

const PremiumAnalyticsModule = React.lazy(() => import('./components/PremiumAnalyticsModule'));
const TransfersModule = React.lazy(() => import('./components/TransfersModule'));
const ProFootballHub = React.lazy(() => import('./components/ProFootballHub'));
const SearchModule = React.lazy(() => import('./components/SearchModule'));
const AlertsModule = React.lazy(() => import('./components/AlertsModule'));

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedLeague, setSelectedLeague] = useState<LeagueId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [oddsFormat, setOddsFormat] = useState<'decimal' | 'fractional' | 'american'>('decimal');

  // Theme & Language
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');

  // Live Matches State from API-Football
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [todayDateMadrid, setTodayDateMadrid] = useState<string>('');

  // Teams & Players State from API-Football
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [players, setPlayers] = useState<PlayerStats[]>([]);

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string | undefined>(undefined);
  const [compareTeamAId, setCompareTeamAId] = useState<string | undefined>(undefined);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  // Fetch today's fixtures from API-Football (Europe/Madrid date)
  const loadMatches = async () => {
    setLoadingMatches(true);
    setFetchError(null);
    const result = await fetchTodayMatches(selectedLeague);
    setTodayDateMadrid(result.todayDate);

    if (result.success) {
      setMatches(result.matches);
      setFetchError(null);
    } else {
      setMatches([]);
      setFetchError(result.error || 'Failed to connect to API-Football backend');
    }
    setLoadingMatches(false);
  };

  useEffect(() => {
    loadMatches();
    fetchTeams(selectedLeague).then(setTeams);
    fetchTopPlayers(selectedLeague).then(setPlayers);
  }, [selectedLeague]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAiWithPrompt = (promptText: string) => {
    setAiPrompt(promptText);
    setActiveTab('ai');
  };

  const handleOpenCompareWithTeam = (teamId: string) => {
    setCompareTeamAId(teamId);
    setActiveTab('compare');
  };

  // Render main tab view
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            matches={matches}
            loadingMatches={loadingMatches}
            fetchError={fetchError}
            todayDateMadrid={todayDateMadrid}
            onRetryMatches={loadMatches}
            teams={teams}
            players={players}
            selectedLeague={selectedLeague}
            setSelectedLeague={setSelectedLeague}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onSelectTeam={(teamId) => {
              setSelectedLeague('all');
              setActiveTab('teams');
            }}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
            onNavigate={(tab) => setActiveTab(tab)}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        );

      case 'matches':
        return (
          <MatchesView
            matches={matches}
            selectedLeague={selectedLeague}
            setSelectedLeague={setSelectedLeague}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectMatch={(m) => {
              setSelectedMatch(m);
              setActiveTab('analysis');
            }}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        );

      case 'analysis':
        return (
          <MatchAnalysisScreen
            initialMatch={selectedMatch}
            onOpenAiChat={handleOpenAiWithPrompt}
          />
        );

      case 'analytics':
        return (
          <React.Suspense
            fallback={
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-white">Loading Premium Analytics...</p>
              </div>
            }
          >
            <PremiumAnalyticsModule
              initialMatch={selectedMatch}
              teams={teams}
              players={players}
              onOpenAiChat={handleOpenAiWithPrompt}
            />
          </React.Suspense>
        );

      case 'transfers':
        return (
          <React.Suspense
            fallback={
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-white">Loading Transfer Market...</p>
              </div>
            }
          >
            <TransfersModule />
          </React.Suspense>
        );

      case 'hub':
        return (
          <React.Suspense
            fallback={
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-white">Loading Pro Football Hub...</p>
              </div>
            }
          >
            <ProFootballHub />
          </React.Suspense>
        );

      case 'search':
        return (
          <React.Suspense
            fallback={
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-white">Loading Search Engine...</p>
              </div>
            }
          >
            <SearchModule />
          </React.Suspense>
        );

      case 'alerts':
        return (
          <React.Suspense
            fallback={
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-white">Loading Live Alerts...</p>
              </div>
            }
          >
            <AlertsModule />
          </React.Suspense>
        );

      case 'teams':
        return (
          <TeamsView
            teams={teams}
            players={players}
            selectedLeague={selectedLeague}
            setSelectedLeague={setSelectedLeague}
            onSelectTeamDetail={(team) => {}}
            onSelectPlayerDetail={(p) => setSelectedPlayer(p)}
            onOpenCompare={handleOpenCompareWithTeam}
          />
        );

      case 'standings':
        return (
          <StandingsView
            selectedLeague={selectedLeague === 'all' ? 'epl' : selectedLeague}
            setSelectedLeague={(l) => setSelectedLeague(l)}
            onSelectTeam={(teamId) => setActiveTab('teams')}
          />
        );

      case 'compare':
        return (
          <TeamComparisonView
            teams={teams}
            defaultTeamAId={compareTeamAId}
            onOpenAiChat={handleOpenAiWithPrompt}
          />
        );

      case 'ai':
        return (
          <AiAssistantView
            initialPrompt={aiPrompt}
            onClearInitialPrompt={() => setAiPrompt(undefined)}
          />
        );

      case 'profile':
        return (
          <ProfileView
            favorites={favorites}
            matches={matches}
            teams={teams}
            players={players}
            onSelectMatch={(m) => setSelectedMatch(m)}
            onSelectTeam={(teamId) => setActiveTab('teams')}
            oddsFormat={oddsFormat}
            setOddsFormat={setOddsFormat}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-100 text-slate-900'} font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors`}>
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        onOpenAi={() => setActiveTab('ai')}
        currentLang={currentLang}
        onChangeLang={setCurrentLang}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container Layout */}
      {isMobileFrame ? (
        /* Flutter Smartphone Frame Preview Wrapper */
        <div className="py-8 px-2 flex justify-center items-center min-h-[calc(100vh-4rem)] bg-slate-950">
          <div className="relative w-full max-w-[400px] h-[780px] bg-[#0B0F17] rounded-[48px] border-[10px] border-slate-800 shadow-2xl flex flex-col overflow-hidden ring-1 ring-cyan-500/20">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-900 rounded-full" />
            </div>

            {/* Scrollable Phone Screen Body */}
            <div className="flex-1 overflow-y-auto p-4 pt-8 scrollbar-none">
              {renderTabContent()}
            </div>

            {/* Flutter Bottom Nav inside frame */}
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      ) : (
        /* Responsive Web App Layout */
        <div className="max-w-7xl mx-auto flex min-h-[calc(100vh-4rem)]">
          {/* Desktop Left Sidebar Navigation */}
          <SidebarNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedLeague={selectedLeague}
            setSelectedLeague={setSelectedLeague}
            favoritesCount={favorites.length}
          />

          {/* Main Workspace Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
            {renderTabContent()}
          </main>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Shown on small screens or web mode) */}
      {!isMobileFrame && (
        <div className="lg:hidden">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      )}

      {/* Modals */}
      <MatchDetailModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onOpenAiChat={handleOpenAiWithPrompt}
      />

      <PlayersView
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onOpenAiChat={handleOpenAiWithPrompt}
      />
    </div>
  );
}
