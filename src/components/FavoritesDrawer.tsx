import React from 'react';
import { GameItem } from '../types';
import { X, Heart, Play, Trash2 } from 'lucide-react';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: string[];
  games: GameItem[];
  onPlayGame: (game: GameItem) => void;
  onRemoveFavorite: (e: React.MouseEvent, gameId: string) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  games,
  onPlayGame,
  onRemoveFavorite,
}) => {
  if (!isOpen) return null;

  const favoriteGames = games.filter((g) => favorites.includes(g.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0F0C29]/95 backdrop-blur-2xl border-l border-white/15 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-md shadow-rose-500/20">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase font-display tracking-tight">Favorite Games</h3>
              <p className="text-xs text-slate-300 font-medium">{favoriteGames.length} saved games</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {favoriteGames.length > 0 ? (
            favoriteGames.map((game) => (
              <div
                key={game.id}
                onClick={() => {
                  onPlayGame(game);
                  onClose();
                }}
                className="group p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-yellow-400/50 flex items-center gap-3.5 cursor-pointer transition hover:bg-white/10"
              >
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white group-hover:text-yellow-400 truncate">
                    {game.title}
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 font-bold">★ {game.rating.toFixed(1)}</span>
                    <span>•</span>
                    <span className="text-cyan-300 uppercase text-[10px] font-bold">{game.category}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => onRemoveFavorite(e, game.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-16 space-y-2">
              <Heart className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">No Favorites Saved</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click the heart icon on any game card to save your favorite games here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
