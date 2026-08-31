import React, { useState, useEffect, useRef } from 'react';
import { GameCategory, GameItem, UserProfile } from '../types';
import {
  Gamepad2,
  Search,
  Dices,
  Heart,
  User,
  Sparkles,
  PlusCircle,
  X,
  Flame,
  Trophy,
  SlidersHorizontal,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: GameCategory;
  onSelectCategory: (cat: GameCategory) => void;
  onSurpriseMe: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onOpenSubmitGame: () => void;
  onSelectGame: (game: GameItem) => void;
  games: GameItem[];
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onSurpriseMe,
  favoritesCount,
  onOpenFavorites,
  userProfile,
  onOpenProfile,
  onOpenSubmitGame,
  onSelectGame,
  games,
}) => {
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = searchQuery.trim()
    ? games
        .filter(
          (g) =>
            g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F0C29]/85 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <div
            onClick={() => {
              onSelectCategory('All');
              onSearchChange('');
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition">
              <span className="text-xl sm:text-2xl font-black text-indigo-950">G</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white uppercase font-display">
                  Game<span className="text-yellow-400">Distribution</span>
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-lg bg-yellow-400 text-indigo-950 text-[10px] font-black tracking-wider uppercase">
                  HUB
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium hidden sm:block">Instant HTML5 Games Portal</p>
            </div>
          </div>

          {/* Search Bar with Instant Autocomplete */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-300 absolute left-4 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search games, tags... (Press '/' to search)"
                className="w-full bg-indigo-950/60 border border-white/15 rounded-full pl-11 pr-10 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition shadow-inner"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-3.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="absolute right-3.5 hidden lg:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-300 bg-white/10 rounded-md border border-white/10">
                  /
                </kbd>
              )}
            </div>

            {/* Search Dropdown Popup */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0F0C29]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/10">
                {searchResults.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => {
                      onSelectGame(game);
                      setShowSearchDropdown(false);
                    }}
                    className="p-3 hover:bg-white/10 flex items-center gap-3 cursor-pointer transition"
                  >
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{game.title}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="text-cyan-400 font-bold uppercase text-[10px]">{game.category}</span>
                        <span>•</span>
                        <span className="text-yellow-400 font-bold">★ {game.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Surprise Me / Random Game */}
            <button
              onClick={onSurpriseMe}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 border border-white/20 hover:border-yellow-400 text-white text-xs sm:text-sm font-black uppercase tracking-wider transition shadow-lg shadow-purple-900/30 hover:scale-105 active:scale-95"
              title="Pick a Random Game"
            >
              <Dices className="w-4 h-4 text-yellow-300" />
              <span className="hidden sm:inline">Surprise Me</span>
            </button>

            {/* Submit Game Modal */}
            <button
              onClick={onOpenSubmitGame}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md transition"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Submit Game</span>
            </button>

            {/* Favorites Quick Button */}
            <button
              onClick={onOpenFavorites}
              className="relative p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-rose-400 text-slate-200 hover:text-rose-400 backdrop-blur-md transition"
              title="Your Favorites"
            >
              <div className="flex items-center gap-1.5">
                <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-rose-400 fill-rose-400' : ''}`} />
                <span className="hidden sm:inline text-xs font-bold">Favorites</span>
                {favoritesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {favoritesCount}
                  </span>
                )}
              </div>
            </button>

            {/* User Profile Badge */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-yellow-400 backdrop-blur-md transition group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 border-2 border-white/20 p-0.5 cursor-pointer shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-sm font-black text-white">
                  {userProfile.avatar || '🎮'}
                </div>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <div className="text-xs font-black text-white group-hover:text-yellow-400 transition leading-tight">
                  {userProfile.username}
                </div>
                <div className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                  <span className="text-yellow-400">Lv.{userProfile.level}</span>
                  <span className="text-white/40">•</span>
                  <span>{userProfile.xp} XP</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-300 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games, tags..."
              className="w-full bg-indigo-950/60 border border-white/15 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-yellow-400 transition"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
