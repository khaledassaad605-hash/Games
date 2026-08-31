import React, { useState, useRef, useEffect } from 'react';
import { GameItem, UserProfile, GameComment } from '../types';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  RotateCcw,
  Sparkles,
  Gamepad2,
  Tv,
  Star,
  Send,
  MessageSquare,
  Keyboard,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

// Interactive mini games
import { SpaceDefenderGame } from './games/SpaceDefenderGame';
import { SnakeGame } from './games/SnakeGame';
import { Game2048 } from './games/Game2048';
import { FlappyDroneGame } from './games/FlappyDroneGame';
import { TetrisGame } from './games/TetrisGame';
import { BrickBusterGame } from './games/BrickBusterGame';
import { DriftRacerGame } from './games/DriftRacerGame';
import { MinesweeperGame } from './games/MinesweeperGame';
import { MemoryMatchGame } from './games/MemoryMatchGame';
import { TypingSpeedGame } from './games/TypingSpeedGame';
import { TicTacToeGame } from './games/TicTacToeGame';
import { WhackMoleGame } from './games/WhackMoleGame';

interface GamePlayerProps {
  game: GameItem;
  onBack: () => void;
  onSelectGame: (game: GameItem) => void;
  allGames: GameItem[];
  userProfile: UserProfile;
  onScoreEarned: (score: number, gameId: string) => void;
  onToggleFavorite: (e: React.MouseEvent, gameId: string) => void;
  isFavorite: boolean;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  onBack,
  onSelectGame,
  allGames,
  userProfile,
  onScoreEarned,
  onToggleFavorite,
  isFavorite,
}) => {
  const [theaterMode, setTheaterMode] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(game.votes || 1240);
  const [activeTab, setActiveTab] = useState<'about' | 'controls' | 'comments'>('about');
  const [userRating, setUserRating] = useState(0);
  const [userCommentText, setUserCommentText] = useState('');
  const [comments, setComments] = useState<GameComment[]>([
    {
      id: 'c1',
      gameId: game.id,
      username: 'CyberGamer99',
      avatar: '🚀',
      text: 'Super smooth mechanics! The controls are super responsive.',
      timestamp: '2 hours ago',
      rating: 5,
      likes: 18,
    },
    {
      id: 'c2',
      gameId: game.id,
      username: 'NeonKnight',
      avatar: '⚡',
      text: 'Awesome graphics and sound! Love playing this in full screen.',
      timestamp: '5 hours ago',
      rating: 5,
      likes: 9,
    },
  ]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Toggle true HTML5 Fullscreen API
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
      if (disliked) setDisliked(false);
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      if (liked) {
        setLiked(false);
        setLikesCount((c) => c - 1);
      }
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCommentText.trim()) return;

    const newComment: GameComment = {
      id: String(Date.now()),
      gameId: game.id,
      username: userProfile.username,
      avatar: userProfile.avatar,
      text: userCommentText.trim(),
      timestamp: 'Just now',
      rating: userRating || 5,
      likes: 0,
    };

    setComments([newComment, ...comments]);
    setUserCommentText('');
    confetti({ particleCount: 30, spread: 50 });
  };

  // Related games filter
  const relatedGames = allGames
    .filter((g) => g.id !== game.id && (g.category === game.category || g.tags.some((t) => game.tags.includes(t))))
    .slice(0, 6);

  return (
    <div className="w-full min-h-screen text-slate-100 pb-16">
      {/* Top Game Navigation Bar */}
      <div className="bg-[#0F0C29]/80 border-b border-white/10 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider border border-white/10 transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-yellow-400" /> Back to Portal
          </button>

          <div className="flex items-center gap-2 truncate px-2">
            <span className="text-xs sm:text-sm font-black text-white truncate uppercase font-display">{game.title}</span>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase">
              {game.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className={`p-2 rounded-xl border text-xs font-bold uppercase tracking-wider hidden md:flex items-center gap-1.5 transition ${
                theaterMode
                  ? 'bg-yellow-400 text-indigo-950 border-yellow-400 shadow-md shadow-yellow-400/20'
                  : 'bg-white/10 border-white/10 text-slate-200 hover:text-white'
              }`}
              title="Theater Mode"
            >
              <Tv className="w-4 h-4" />
              <span>Theater</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white transition"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Stage Container */}
      <div
        className={`w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 transition-all duration-300 ${
          theaterMode ? 'max-w-full' : 'max-w-6xl'
        }`}
      >
        <div
          ref={containerRef}
          className="relative w-full rounded-[2.5rem] bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-3 sm:p-6 min-h-[500px] lg:min-h-[580px]"
        >
          {/* RENDER GAME ENGINE / IFRAME */}
          <div key={reloadKey} className="w-full flex items-center justify-center">
            {game.internalGameType === 'space_defender' ? (
              <SpaceDefenderGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'snake' ? (
              <SnakeGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === '2048' ? (
              <Game2048
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'flappy' ? (
              <FlappyDroneGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'tetris' ? (
              <TetrisGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'brick_breaker' ? (
              <BrickBusterGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'drift_racer' ? (
              <DriftRacerGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'minesweeper' ? (
              <MinesweeperGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'memory_match' ? (
              <MemoryMatchGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'typing_speed' ? (
              <TypingSpeedGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'tictactoe' ? (
              <TicTacToeGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.internalGameType === 'whack_mole' ? (
              <WhackMoleGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            ) : game.embedUrl ? (
              <div className="w-full aspect-[16/9] max-h-[640px] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                <iframe
                  src={game.embedUrl}
                  title={game.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              <SpaceDefenderGame
                onScoreUpdate={(s) => onScoreEarned(s, game.id)}
                onGameOver={(s) => onScoreEarned(s, game.id)}
              />
            )}
          </div>
        </div>

        {/* Game Actions Bar */}
        <div className="mt-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-13 h-13 rounded-2xl object-cover border border-white/10 shrink-0"
            />
            <div>
              <h2 className="text-lg font-black text-white font-display leading-tight uppercase">{game.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 font-medium">
                <span className="text-yellow-400 font-bold">★ {game.rating.toFixed(1)}</span>
                <span>•</span>
                <span>{(game.plays / 1000).toFixed(0)}K Plays</span>
                <span>•</span>
                <span>Dev: {game.developer || 'GameDistribution'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                liked
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-white/10 border-white/10 text-slate-200 hover:text-white'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{likesCount.toLocaleString()}</span>
            </button>

            {/* Dislike */}
            <button
              onClick={handleDislike}
              className={`p-2.5 rounded-xl border transition ${
                disliked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                  : 'bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
            </button>

            {/* Favorite */}
            <button
              onClick={(e) => onToggleFavorite(e, game.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition ${
                isFavorite
                  ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30'
                  : 'bg-white/10 border-white/10 text-slate-200 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Saved' : 'Favorite'}</span>
            </button>

            {/* Reload Game */}
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white transition"
              title="Restart Game"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider transition"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Game Details & Tabs Section */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Tabs Content */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3.5 mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition ${
                  activeTab === 'about'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md shadow-yellow-400/20 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Info className="w-4 h-4" /> Overview & Guide
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition ${
                  activeTab === 'controls'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md shadow-yellow-400/20 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Keyboard className="w-4 h-4" /> Controls
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition ${
                  activeTab === 'comments'
                    ? 'bg-yellow-400 text-indigo-950 shadow-md shadow-yellow-400/20 font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Reviews ({comments.length})
              </button>
            </div>

            {/* Tab 1: About & How to Play */}
            {activeTab === 'about' && (
              <div className="space-y-5 text-sm text-slate-200">
                <div>
                  <h4 className="text-white font-black mb-1.5 text-base font-display uppercase">About {game.title}</h4>
                  <p className="leading-relaxed text-slate-300">{game.description}</p>
                </div>

                <div>
                  <h4 className="text-white font-black mb-1.5 text-base font-display uppercase">How to Play</h4>
                  <p className="leading-relaxed text-slate-300">{game.instructions}</p>
                </div>

                <div>
                  <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider text-slate-400">Tags & Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-cyan-300 text-xs font-bold uppercase"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Controls Table */}
            {activeTab === 'controls' && (
              <div className="space-y-3">
                <h4 className="text-white font-black text-base font-display mb-2 uppercase">Key Mappings</h4>
                <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
                  {game.controls.map((ctrl, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-white/[0.02] text-xs sm:text-sm">
                      <span className="font-mono text-cyan-300 font-bold px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/10">
                        {ctrl.key}
                      </span>
                      <span className="text-slate-200 font-semibold">{ctrl.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Comments & Reviews */}
            {activeTab === 'comments' && (
              <div className="space-y-5">
                {/* Submit Form */}
                <form onSubmit={handleAddComment} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Leave a Review & Rating:</span>
                    <div className="flex gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="hover:scale-110 transition"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= (userRating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userCommentText}
                      onChange={(e) => setUserCommentText(e.target.value)}
                      placeholder="Share your high score or thoughts..."
                      className="flex-1 bg-indigo-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black uppercase tracking-wider rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                    >
                      <Send className="w-3.5 h-3.5" /> Post
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.avatar}</span>
                          <span className="font-bold text-white">{c.username}</span>
                          <span className="text-[10px] text-slate-400">• {c.timestamp}</span>
                        </div>
                        <div className="flex text-yellow-400 text-[10px]">
                          {Array.from({ length: c.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Game Meta & Security info */}
          <div className="space-y-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">Game Specifications</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-slate-400 font-medium">Developer:</span>
                  <span className="text-white font-bold">{game.developer || 'GameDistribution Studio'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-slate-400 font-medium">Platform:</span>
                  <span className="text-cyan-300 font-bold uppercase">HTML5 / WebGL</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-slate-400 font-medium">Release Date:</span>
                  <span className="text-white font-bold">{game.releaseDate || '2025'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-slate-400 font-medium">Rating:</span>
                  <span className="text-yellow-400 font-black">★ {game.rating.toFixed(1)} / 5.0</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Plays:</span>
                  <span className="text-white font-bold">{game.plays.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 rounded-3xl p-5 flex items-start gap-3.5">
              <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-black text-white uppercase tracking-wide mb-1">GameDistribution Verified</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Certified safe HTML5 web game. Fully compatible with Desktop, Tablets, and Mobile browsers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Games Carousel */}
        {relatedGames.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg sm:text-xl font-black text-white font-display uppercase tracking-tight mb-4 flex items-center gap-2">
              <span className="w-2 h-5 bg-yellow-400 rounded-full inline-block"></span>
              More Games You Might Like
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {relatedGames.map((g) => (
                <div
                  key={g.id}
                  onClick={() => onSelectGame(g)}
                  className="group bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-yellow-400/50 rounded-2xl overflow-hidden cursor-pointer transition hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={g.thumbnail}
                      alt={g.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-2.5">
                    <div className="font-bold text-xs text-white group-hover:text-yellow-400 truncate">
                      {g.title}
                    </div>
                    <div className="text-[10px] text-yellow-400 font-bold">★ {g.rating.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
