import React, { useState, useEffect } from 'react';
import { GameItem } from '../types';
import { Play, Flame, Star, Trophy, Users, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  featuredGames: GameItem[];
  onPlayGame: (game: GameItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ featuredGames, onPlayGame }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredGames.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredGames.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredGames.length]);

  if (featuredGames.length === 0) return null;
  const game = featuredGames[currentIndex] || featuredGames[0];

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/15 shadow-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-[#0F0C29] aspect-[16/9] sm:aspect-[21/9] max-h-[460px] group">
        {/* Backdrop Image with gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105 group-hover:scale-100 opacity-60"
          style={{ backgroundImage: `url(${game.backdrop || game.thumbnail})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0C29] via-[#0F0C29]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0C29] via-[#0F0C29]/80 to-transparent" />

        {/* Content Container */}
        <div className="absolute inset-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-end z-10">
          <div className="max-w-xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3">
              <div className="bg-yellow-400 text-indigo-950 px-3 py-1 rounded-lg text-xs font-black uppercase inline-flex items-center gap-1.5 shadow-md shadow-yellow-400/20">
                <Sparkles className="w-3.5 h-3.5" /> Featured Spotlight
              </div>
              <span className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                {game.category}
              </span>
              {game.trending && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> Trending
                </span>
              )}
            </div>

            {/* Game Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white tracking-tight font-display mb-3 leading-tight drop-shadow-md uppercase">
              {game.title.includes(':') ? (
                <>
                  {game.title.split(':')[0]}: <br />
                  <span className="text-cyan-400">{game.title.split(':')[1]}</span>
                </>
              ) : (
                <span>{game.title}</span>
              )}
            </h1>

            {/* Description */}
            <p className="text-slate-200 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mb-6 max-w-lg leading-relaxed">
              {game.description}
            </p>

            {/* Metrics & Action button */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <button
                onClick={() => onPlayGame(game)}
                className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-sm sm:text-base shadow-xl shadow-orange-500/30 flex items-center gap-2.5 transform active:scale-95 hover:scale-105 transition uppercase tracking-wider"
              >
                <Play className="w-5 h-5 fill-white" /> Play Now
              </button>

              <button
                onClick={() => onPlayGame(game)}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm backdrop-blur-md border border-white/10 transition uppercase tracking-wider"
              >
                Details
              </button>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-1 text-yellow-400 font-black">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span>{game.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{(game.plays / 1000000).toFixed(1)}M Players</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next indicators */}
        {featuredGames.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev - 1 + featuredGames.length) % featuredGames.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white border border-white/15 backdrop-blur z-20 transition opacity-75 hover:opacity-100 hidden sm:block"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev + 1) % featuredGames.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/60 hover:bg-slate-900 text-white border border-white/15 backdrop-blur z-20 transition opacity-75 hover:opacity-100 hidden sm:block"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicators Dots */}
            <div className="absolute bottom-6 right-8 flex gap-2 z-20">
              {featuredGames.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-yellow-400 shadow-md shadow-yellow-400/50' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
