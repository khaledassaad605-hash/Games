import React from 'react';
import { GameItem } from '../types';
import { Play, Star, Heart, Flame, Sparkles } from 'lucide-react';

interface GameCardProps {
  game: GameItem;
  onPlay: (game: GameItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onPlay,
  isFavorite,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onPlay(game)}
      className="group relative bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-yellow-400/50 rounded-3xl overflow-hidden cursor-pointer flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-950/50"
    >
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-950/80">
        <img
          src={game.thumbnail}
          alt={game.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Hover Overlay with Big Play Icon */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 text-indigo-950 flex items-center justify-center shadow-lg shadow-orange-500/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-indigo-950 ml-0.5" />
          </div>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {game.trending && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase shadow-md">
              <Flame className="w-3 h-3 fill-current" /> Hot
            </span>
          )}
          {game.isNew && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase shadow-md">
              NEW
            </span>
          )}
          {game.featured && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-yellow-400 text-indigo-950 text-[10px] font-black uppercase shadow-md">
              <Sparkles className="w-2.5 h-2.5" /> TOP
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e, game.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition z-10 ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
              : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900/90'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Category Pill at bottom of thumbnail */}
        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-white/10 text-[10px] font-black uppercase tracking-wider text-cyan-300">
          {game.category}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between bg-white/[0.02]">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-yellow-400 transition truncate leading-snug">
            {game.title}
          </h3>
          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5 font-medium">
            {game.tags.slice(0, 3).join(' • ')}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1 text-yellow-400 font-black">
            <Star className="w-3.5 h-3.5 fill-yellow-400" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
          <div className="text-[11px] text-slate-300 font-semibold">
            {game.plays >= 1000000
              ? `${(game.plays / 1000000).toFixed(1)}M`
              : `${(game.plays / 1000).toFixed(0)}K`}{' '}
            plays
          </div>
        </div>
      </div>
    </div>
  );
};
