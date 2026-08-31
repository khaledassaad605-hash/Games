import React, { useState, useMemo } from 'react';
import { GameItem, GameCategory } from '../types';
import { GameCard } from './GameCard';
import { Flame, Star, Clock, Trophy, Sparkles, Filter } from 'lucide-react';

interface GameGridProps {
  games: GameItem[];
  selectedCategory: GameCategory;
  searchQuery: string;
  onPlayGame: (game: GameItem) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, gameId: string) => void;
}

type SortOption = 'popular' | 'rating' | 'newest' | 'trending';

export const GameGrid: React.FC<GameGridProps> = ({
  games,
  selectedCategory,
  searchQuery,
  onPlayGame,
  favorites,
  onToggleFavorite,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract unique popular tags
  const popularTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    games.forEach((g) => {
      g.tags.forEach((t) => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    return Object.keys(tagCount)
      .sort((a, b) => tagCount[b] - tagCount[a])
      .slice(0, 10);
  }, [games]);

  // Filter & Sort
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter((g) => g.category === selectedCategory);
    }

    // Filter by Tag
    if (selectedTag) {
      result = result.filter((g) => g.tags.includes(selectedTag));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'popular') {
      result.sort((a, b) => b.plays - a.plays);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === 'trending') {
      result.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
    }

    return result;
  }, [games, selectedCategory, selectedTag, searchQuery, sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Grid Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-display uppercase tracking-tight flex items-center gap-2.5">
            <span className="w-2.5 h-6 bg-cyan-400 rounded-full inline-block"></span>
            <span>{selectedCategory === 'All' ? 'Discover All Games' : `${selectedCategory} Games`}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 font-mono font-bold">
              {filteredGames.length}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {searchQuery
              ? `Showing results matching "${searchQuery}"`
              : 'Instant playable browser games without installation or downloads'}
          </p>
        </div>

        {/* Sorting Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              sortBy === 'popular'
                ? 'bg-yellow-400 text-indigo-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Popular
          </button>

          <button
            onClick={() => setSortBy('trending')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              sortBy === 'trending'
                ? 'bg-yellow-400 text-indigo-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Trending
          </button>

          <button
            onClick={() => setSortBy('rating')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              sortBy === 'rating'
                ? 'bg-yellow-400 text-indigo-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Top Rated
          </button>

          <button
            onClick={() => setSortBy('newest')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              sortBy === 'newest'
                ? 'bg-yellow-400 text-indigo-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </div>

      {/* Quick Filter Tags Bar */}
      <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-none no-scrollbar">
        <span className="text-xs text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-cyan-400" /> Tags:
        </span>
        <button
          onClick={() => setSelectedTag(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition ${
            selectedTag === null
              ? 'bg-yellow-400 text-indigo-950 shadow-md shadow-yellow-400/20'
              : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          All Tags
        </button>
        {popularTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition ${
              selectedTag === tag
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-md shadow-cyan-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Games Cards Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPlay={onPlayGame}
              isFavorite={favorites.includes(game.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-yellow-400 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Games Found</h3>
          <p className="text-xs text-slate-300 max-w-sm mb-4">
            We couldn’t find any games matching your current search or category filter.
          </p>
          <button
            onClick={() => {
              setSelectedTag(null);
            }}
            className="px-5 py-2.5 bg-yellow-400 text-indigo-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-yellow-400/30"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
