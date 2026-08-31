import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SnakeProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;

export const SnakeGame: React.FC<SnakeProps> = ({ onScoreUpdate, onGameOver }) => {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [specialFood, setSpecialFood] = useState<(Position & { timer: number }) | null>(null);
  const [direction, setDirection] = useState<Direction>('UP');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(110);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_snake') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const directionRef = useRef<Direction>('UP');
  directionRef.current = direction;

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const collision = currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
      if (!collision) break;
    }
    return newFood;
  }, []);

  const startGame = () => {
    const initialSnake: Position[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDirection('UP');
    directionRef.current = 'UP';
    setFood(generateFood(initialSnake));
    setSpecialFood(null);
    setScore(0);
    setSpeed(110);
    setGameState('playing');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
        return;
      }

      if (gameState !== 'playing') return;

      const current = directionRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && current !== 'DOWN') {
        setDirection('UP');
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && current !== 'UP') {
        setDirection('DOWN');
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && current !== 'RIGHT') {
        setDirection('LEFT');
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && current !== 'LEFT') {
        setDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main Snake Move Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;

        if (currentDir === 'UP') head.y -= 1;
        if (currentDir === 'DOWN') head.y += 1;
        if (currentDir === 'LEFT') head.x -= 1;
        if (currentDir === 'RIGHT') head.x += 1;

        // Boundary collision check
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          soundFX.playGameOver();
          setGameState('gameover');
          return prevSnake;
        }

        // Self-collision check
        for (let i = 0; i < prevSnake.length; i++) {
          if (prevSnake[i].x === head.x && prevSnake[i].y === head.y) {
            soundFX.playGameOver();
            setGameState('gameover');
            return prevSnake;
          }
        }

        const newSnake = [head, ...prevSnake];

        // Normal Food eaten check
        if (head.x === food.x && head.y === food.y) {
          soundFX.playScore();
          const nextScore = score + 10;
          setScore(nextScore);
          onScoreUpdate?.(nextScore);
          setFood(generateFood(newSnake));
          setSpeed((s) => Math.max(65, s - 1.5));

          // Spawn special bonus fruit randomly
          if (Math.random() < 0.35 && !specialFood) {
            setSpecialFood({ ...generateFood(newSnake), timer: 45 });
          }
        } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
          soundFX.playPowerup();
          const nextScore = score + 50;
          setScore(nextScore);
          onScoreUpdate?.(nextScore);
          setSpecialFood(null);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });

      // Special food countdown timer
      setSpecialFood((prev) => {
        if (!prev) return null;
        if (prev.timer <= 1) return null;
        return { ...prev, timer: prev.timer - 1 };
      });
    }, speed);

    return () => clearInterval(interval);
  }, [gameState, food, specialFood, score, speed, generateFood, onScoreUpdate]);

  // Handle Game Over High Scores
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('gd_highscore_snake', String(score));
        confetti({ particleCount: 80, spread: 90 });
      }
      onGameOver?.(score);
    }
  }, [gameState, score, highScore, onGameOver]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.enabled = next;
  };

  return (
    <div className="relative w-full max-w-[540px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>{score}</span>
          </div>
          <div className="text-xs text-slate-400">
            High Score: <span className="text-amber-400 font-semibold">{highScore}</span>
          </div>
        </div>
        <button
          onClick={toggleSound}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Grid Canvas Stage */}
      <div className="relative w-full aspect-square max-w-[480px] p-4 flex items-center justify-center">
        <div
          className="w-full h-full bg-[#0d121f] rounded-xl border border-slate-800 grid grid-cols-20 grid-rows-20 relative overflow-hidden shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {/* Snake Segments */}
          {snake.map((segment, index) => {
            const isHead = index === 0;
            return (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                style={{
                  gridColumnStart: segment.x + 1,
                  gridRowStart: segment.y + 1,
                }}
                className={`rounded-sm transition-all duration-75 ${
                  isHead
                    ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] z-10'
                    : 'bg-emerald-600/90'
                }`}
              />
            );
          })}

          {/* Normal Food */}
          <div
            style={{
              gridColumnStart: food.x + 1,
              gridRowStart: food.y + 1,
            }}
            className="rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse"
          />

          {/* Special Bonus Food */}
          {specialFood && (
            <div
              style={{
                gridColumnStart: specialFood.x + 1,
                gridRowStart: specialFood.y + 1,
              }}
              className="rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)] flex items-center justify-center text-[10px] font-bold text-slate-950 animate-bounce"
            >
              ★
            </div>
          )}
        </div>

        {/* Start Overlay */}
        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 m-4 rounded-xl">
            <h2 className="text-3xl font-black text-emerald-400 tracking-wide mb-2">NEON SNAKE X</h2>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              Slither across the cyber arena, swallow neon orbs and star fruits, and grow your score!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5 fill-current" /> Start Crawl
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 m-4 rounded-xl">
            <h3 className="text-3xl font-black text-rose-500 mb-1">GAME OVER</h3>
            <p className="text-slate-400 text-sm mb-4">You crashed into a boundary wall or your tail!</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full max-w-xs mb-6 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Score:</span>
                <span className="text-white font-bold">{score}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Best:</span>
                <span className="text-emerald-400 font-bold">{highScore}</span>
              </div>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Play Again
            </button>
          </div>
        )}
      </div>

      {/* D-Pad Controls for Mobile & Quick Play */}
      <div className="w-full bg-slate-900/80 p-3 border-t border-slate-800 flex justify-center items-center">
        <div className="grid grid-cols-3 gap-1.5 w-40">
          <div />
          <button
            onClick={() => {
              if (directionRef.current !== 'DOWN') setDirection('UP');
            }}
            className="w-12 h-10 bg-slate-800 active:bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center transition"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => {
              if (directionRef.current !== 'RIGHT') setDirection('LEFT');
            }}
            className="w-12 h-10 bg-slate-800 active:bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center transition"
          >
            ◀
          </button>
          <button
            onClick={() => {
              if (directionRef.current !== 'UP') setDirection('DOWN');
            }}
            className="w-12 h-10 bg-slate-800 active:bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center transition"
          >
            ▼
          </button>
          <button
            onClick={() => {
              if (directionRef.current !== 'LEFT') setDirection('RIGHT');
            }}
            className="w-12 h-10 bg-slate-800 active:bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center transition"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
