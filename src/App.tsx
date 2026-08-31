import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameItem, GameCategory, UserProfile } from './types';
import { GAMES_DATA, INITIAL_USER_PROFILE, ACHIEVEMENTS_LIST } from './data/gamesData';
import { Header } from './components/Header';
import { CategoryBar, CATEGORIES } from './components/CategoryBar';
import { HeroBanner } from './components/HeroBanner';
import { GameGrid } from './components/GameGrid';
import { GamePlayer } from './components/GamePlayer';
import { UserProfileModal } from './components/UserProfileModal';
import { SubmitGameModal } from './components/SubmitGameModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { soundFX } from './utils/soundEffects';
import confetti from 'canvas-confetti';
import { Gamepad2, Heart, Sparkles, Trophy, ShieldCheck, Flame, Globe2, Code } from 'lucide-react';

export default function App() {
  // 1. Core State
  const [games, setGames] = useState<GameItem[]>(() => {
    const savedCustom = localStorage.getItem('gd_custom_games');
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        return [...parsed, ...GAMES_DATA];
      } catch (e) {
        return GAMES_DATA;
      }
    }
    return GAMES_DATA;
  });

  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Favorites persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('gd_favorites');
    return saved ? JSON.parse(saved) : ['g1', 'g2', 'g5'];
  });

  // 3. Gamer Profile persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('gd_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
  });

  // 4. Modals State
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem('gd_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Sync profile
  useEffect(() => {
    localStorage.setItem('gd_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Featured games for carousel
  const featuredGames = useMemo(() => {
    return games.filter((g) => g.featured || g.rating >= 4.8);
  }, [games]);

  // Game counts by category
  const gameCounts = useMemo(() => {
    const counts: Record<GameCategory, number> = {
      All: games.length,
      Action: 0,
      Arcade: 0,
      Racing: 0,
      Puzzle: 0,
      Shooting: 0,
      Sports: 0,
      Strategy: 0,
      Casual: 0,
      Retro: 0,
      '2 Player': 0,
    };
    games.forEach((g) => {
      if (counts[g.category] !== undefined) {
        counts[g.category] += 1;
      }
    });
    return counts;
  }, [games]);

  // Handle Game Selection
  const handleSelectGame = useCallback((game: GameItem) => {
    soundFX.playClick();
    setSelectedGame(game);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Increment local plays
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, plays: g.plays + 1 } : g))
    );

    // Unlock 'first_play' achievement
    setUserProfile((prev) => {
      if (!prev.unlockedAchievements.includes('first_play')) {
        confetti({ particleCount: 60, spread: 70 });
        return {
          ...prev,
          xp: prev.xp + 50,
          unlockedAchievements: [...prev.unlockedAchievements, 'first_play'],
        };
      }
      return prev;
    });
  }, []);

  // Handle Score & XP Earned
  const handleScoreEarned = useCallback((score: number, gameId: string) => {
    setUserProfile((prev) => {
      const currentBest = prev.highScores[gameId] || 0;
      const newBest = Math.max(currentBest, score);
      const earnedXP = Math.floor(score / 5);
      const newXP = prev.xp + earnedXP;

      // Check level up
      let newLevel = prev.level;
      while (newXP >= newLevel * 250) {
        newLevel += 1;
      }

      // Check achievements
      const newAchievements = [...prev.unlockedAchievements];
      if (score >= 1000 && !newAchievements.includes('high_scorer')) {
        newAchievements.push('high_scorer');
        confetti({ particleCount: 100, spread: 90 });
      }
      if (newLevel >= 5 && !newAchievements.includes('master_gamer')) {
        newAchievements.push('master_gamer');
        confetti({ particleCount: 120, spread: 100 });
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        highScores: {
          ...prev.highScores,
          [gameId]: newBest,
        },
        unlockedAchievements: newAchievements,
      };
    });
  }, []);

  // Toggle Favorite
  const handleToggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    soundFX.playClick();
    setFavorites((prev) => {
      const exists = prev.includes(gameId);
      const updated = exists ? prev.filter((id) => id !== gameId) : [...prev, gameId];

      // Check favorite collector achievement
      if (updated.length >= 5 && !userProfile.unlockedAchievements.includes('fav_collector')) {
        setUserProfile((p) => ({
          ...p,
          xp: p.xp + 150,
          unlockedAchievements: [...p.unlockedAchievements, 'fav_collector'],
        }));
        confetti({ particleCount: 70, spread: 70 });
      }

      return updated;
    });
  };

  // Surprise Me / Random Picker
  const handleSurpriseMe = () => {
    soundFX.playPowerup();
    const randomIndex = Math.floor(Math.random() * games.length);
    const randomGame = games[randomIndex];
    handleSelectGame(randomGame);
    confetti({ particleCount: 50, spread: 60 });
  };

  // Submit Game
  const handleSubmitGame = (newGame: GameItem) => {
    setGames((prev) => [newGame, ...prev]);
    const savedCustom = localStorage.getItem('gd_custom_games');
    const list = savedCustom ? JSON.parse(savedCustom) : [];
    localStorage.setItem('gd_custom_games', JSON.stringify([newGame, ...list]));
    handleSelectGame(newGame);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0C29] via-[#302B63] to-[#24243E] text-slate-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-indigo-950">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedGame(null);
        }}
        onSurpriseMe={handleSurpriseMe}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        userProfile={userProfile}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSubmitGame={() => setIsSubmitModalOpen(true)}
        onSelectGame={handleSelectGame}
        games={games}
      />

      {/* Main App Content */}
      <main className="flex-1">
        {selectedGame ? (
          /* Single Game Playing View */
          <GamePlayer
            game={selectedGame}
            onBack={() => setSelectedGame(null)}
            onSelectGame={handleSelectGame}
            allGames={games}
            userProfile={userProfile}
            onScoreEarned={handleScoreEarned}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={favorites.includes(selectedGame.id)}
          />
        ) : (
          /* Main Portal View */
          <>
            {/* Category Navigation Bar */}
            <CategoryBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              gameCounts={gameCounts}
            />

            {/* Featured Hero Banner (Shown when no search query and on 'All' or main view) */}
            {!searchQuery && selectedCategory === 'All' && (
              <HeroBanner featuredGames={featuredGames} onPlayGame={handleSelectGame} />
            )}

            {/* Games Catalog Grid */}
            <GameGrid
              games={games}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onPlayGame={handleSelectGame}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0F0C29]/90 backdrop-blur-xl border-t border-white/10 pt-12 pb-8 text-xs text-slate-300 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
            {/* Col 1: Brand */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-orange-500 text-indigo-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="font-black text-lg text-white font-display uppercase tracking-tight">
                  Game<span className="text-yellow-400">Distribution</span>
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                The premier open-web HTML5 gaming network. Play thousands of high quality browser games
                instantly without downloading.
              </p>
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> 100% Safe Browser Games
              </div>
            </div>

            {/* Col 2: Categories */}
            <div>
              <h4 className="font-black text-white uppercase tracking-wider mb-3 text-xs">Popular Genres</h4>
              <div className="grid grid-cols-2 gap-2 font-medium">
                {CATEGORIES.slice(1, 9).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setSelectedGame(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-left text-slate-300 hover:text-yellow-400 transition truncate"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Col 3: Features */}
            <div>
              <h4 className="font-black text-white uppercase tracking-wider mb-3 text-xs">Portal Highlights</h4>
              <ul className="space-y-2 font-medium">
                <li className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> 12 Interactive Canvas Game Engines
                </li>
                <li className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-cyan-400" /> Gamer XP, Leveling & Badges
                </li>
                <li className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Favorites & Custom Game Library
                </li>
                <li className="flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-emerald-400" /> HTML5 Developer Publishing Hub
                </li>
              </ul>
            </div>

            {/* Col 4: Developer Community */}
            <div>
              <h4 className="font-black text-white uppercase tracking-wider mb-3 text-xs">For Game Developers</h4>
              <p className="text-slate-300 mb-3 leading-relaxed font-medium">
                Publish your HTML5, WebGL, or Canvas games to reach players globally on desktop and mobile.
              </p>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
              >
                <Code className="w-4 h-4 text-cyan-400" /> Submit HTML5 Game
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} GameDistribution Web Portal. Built for high performance HTML5 & Canvas
              gaming.
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Developers API</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(updated) => setUserProfile((p) => ({ ...p, ...updated }))}
      />

      <SubmitGameModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitGame={handleSubmitGame}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        games={games}
        onPlayGame={handleSelectGame}
        onRemoveFavorite={handleToggleFavorite}
      />
    </div>
  );
}
