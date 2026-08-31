import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX, Bot, Bomb, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WhackProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

interface HoleState {
  type: 'bot' | 'gold_bot' | 'bomb' | null;
  id: number;
}

export const WhackMoleGame: React.FC<WhackProps> = ({ onScoreUpdate, onGameOver }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [holes, setHoles] = useState<HoleState[]>(() =>
    Array(9).fill(null).map(() => ({ type: null, id: 0 }))
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_whack') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setHoles(Array(9).fill(null).map(() => ({ type: null, id: 0 })));
    setScore(0);
    setTimeLeft(30);
    setCombo(1);
    setGameState('playing');
  };

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          soundFX.playGameOver();
          setGameState('gameover');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Spawning random targets in holes
  const spawnTarget = useCallback(() => {
    if (gameState !== 'playing') return;

    setHoles((prevHoles) => {
      const emptyHoles = prevHoles
        .map((h, idx) => (h.type === null ? idx : null))
        .filter((idx) => idx !== null) as number[];

      if (emptyHoles.length === 0) return prevHoles;

      const randomHole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
      const rand = Math.random();
      const type: 'bot' | 'gold_bot' | 'bomb' = rand < 0.2 ? 'bomb' : rand < 0.35 ? 'gold_bot' : 'bot';

      const next = [...prevHoles];
      next[randomHole] = { type, id: Date.now() + Math.random() };
      return next;
    });
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    moleTimerRef.current = setInterval(spawnTarget, 750);
    return () => {
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    };
  }, [gameState, spawnTarget]);

  // Automatically hide old targets
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setHoles((prev) => {
        return prev.map((h) => {
          if (h.type !== null && Math.random() > 0.55) {
            return { type: null, id: 0 };
          }
          return h;
        });
      });
    }, 900);
    return () => clearInterval(interval);
  }, [gameState]);

  const handleWhack = (index: number) => {
    if (gameState !== 'playing') return;
    const hole = holes[index];
    if (!hole || hole.type === null) return;

    if (hole.type === 'bomb') {
      soundFX.playExplosion();
      setCombo(1);
      setScore((s) => Math.max(0, s - 100));
    } else if (hole.type === 'gold_bot') {
      soundFX.playPowerup();
      const pts = 300 * combo;
      setScore((s) => {
        const next = s + pts;
        onScoreUpdate?.(next);
        return next;
      });
      setCombo((c) => Math.min(5, c + 1));
    } else {
      soundFX.playScore();
      const pts = 100 * combo;
      setScore((s) => {
        const next = s + pts;
        onScoreUpdate?.(next);
        return next;
      });
      setCombo((c) => Math.min(5, c + 1));
    }

    setHoles((prev) => {
      const next = [...prev];
      next[index] = { type: null, id: 0 };
      return next;
    });
  };

  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('gd_highscore_whack', String(score));
      confetti({ particleCount: 70, spread: 80 });
    }
    if (gameState === 'gameover') onGameOver?.(score);
  }, [gameState, score, highScore, onGameOver]);

  return (
    <div className="relative w-full max-w-[440px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>{score.toLocaleString()}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-bold">
            {combo}x Combo
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Time: <span className="text-white font-bold">{timeLeft}s</span>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* 3x3 Holes Stage */}
      <div className="relative w-full p-4 flex justify-center items-center">
        <div className="grid grid-cols-3 gap-3 bg-[#0d121f] p-4 rounded-2xl border border-slate-800 w-full max-w-[340px] aspect-square">
          {holes.map((hole, idx) => (
            <button
              key={idx}
              onClick={() => handleWhack(idx)}
              className="w-full h-full rounded-2xl bg-slate-900 border-2 border-slate-800/80 flex items-center justify-center relative overflow-hidden transition active:scale-95 shadow-inner"
            >
              {/* Hole Ring */}
              <div className="absolute inset-2 rounded-xl bg-slate-950/80 border border-slate-800 pointer-events-none" />

              {/* Emerging Target */}
              {hole.type === 'bot' && (
                <div className="relative z-10 w-12 h-12 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-bounce">
                  <Bot className="w-7 h-7" />
                </div>
              )}
              {hole.type === 'gold_bot' && (
                <div className="relative z-10 w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,1)] animate-bounce">
                  <Sparkles className="w-7 h-7" />
                </div>
              )}
              {hole.type === 'bomb' && (
                <div className="relative z-10 w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.9)] animate-pulse">
                  <Bomb className="w-7 h-7" />
                </div>
              )}
            </button>
          ))}
        </div>

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 m-4 rounded-2xl">
            <h2 className="text-2xl font-black text-cyan-400 mb-2">WHACK-A-CYBER-BOT</h2>
            <p className="text-slate-300 text-xs max-w-xs mb-6">
              Zap security bots and golden targets before they submerge. Beware of explosive mines!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5 fill-current" /> Start Zapping
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 m-4 rounded-2xl">
            <h3 className="text-3xl font-black text-amber-400 mb-2">TIME UP!</h3>
            <p className="text-slate-400 text-xs mb-4">Final Score: {score.toLocaleString()}</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Play Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full py-2.5 bg-slate-900 text-center text-xs text-slate-400 border-t border-slate-800">
        Click or Tap targets as fast as possible to build combos!
      </div>
    </div>
  );
};
