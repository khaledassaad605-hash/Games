import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX, ArrowDown, RotateCw, ArrowLeft, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TetrisProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

const COLS = 10;
const ROWS = 20;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: '#06b6d4' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' },
  O: { shape: [[1, 1], [1, 1]], color: '#eab308' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' },
};

type TetrominoKey = keyof typeof TETROMINOES;

export const TetrisGame: React.FC<TetrisProps> = ({ onScoreUpdate, onGameOver }) => {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(''))
  );
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_tetris') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentPiece = useRef<{
    shape: number[][];
    color: string;
    x: number;
    y: number;
  }>({
    shape: TETROMINOES.T.shape,
    color: TETROMINOES.T.color,
    x: 3,
    y: 0,
  });

  const nextPieceKey = useRef<TetrominoKey>('I');

  const getRandomPiece = (): { shape: number[][]; color: string; key: TetrominoKey } => {
    const keys = Object.keys(TETROMINOES) as TetrominoKey[];
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { shape: TETROMINOES[key].shape, color: TETROMINOES[key].color, key };
  };

  const spawnPiece = useCallback(() => {
    const next = TETROMINOES[nextPieceKey.current];
    const generated = getRandomPiece();
    nextPieceKey.current = generated.key;

    currentPiece.current = {
      shape: next.shape,
      color: next.color,
      x: Math.floor((COLS - next.shape[0].length) / 2),
      y: 0,
    };
  }, []);

  const checkCollision = (shape: number[][], x: number, y: number, currentGrid: string[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && currentGrid[newY][newX]) return true;
        }
      }
    }
    return false;
  };

  const rotate = (matrix: number[][]) => {
    return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
  };

  const lockPiece = useCallback(() => {
    const { shape, color, x, y } = currentPiece.current;
    const newGrid = grid.map((row) => [...row]);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] && y + r >= 0) {
          newGrid[y + r][x + c] = color;
        }
      }
    }

    // Check line clears
    let clearedLines = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newGrid[r].every((cell) => cell !== '')) {
        newGrid.splice(r, 1);
        newGrid.unshift(Array(COLS).fill(''));
        clearedLines++;
        r++; // check same row index again after unshift
      }
    }

    if (clearedLines > 0) {
      soundFX.playScore();
      if (clearedLines >= 4) {
        confetti({ particleCount: 40, spread: 60 });
      }
      const points = [0, 100, 300, 600, 1000][clearedLines] * level;
      const nextScore = score + points;
      setScore(nextScore);
      onScoreUpdate?.(nextScore);

      const nextLines = lines + clearedLines;
      setLines(nextLines);
      setLevel(Math.floor(nextLines / 10) + 1);
    } else {
      soundFX.playClick();
    }

    setGrid(newGrid);

    // Check if new piece will collide immediately -> Game Over
    spawnPiece();
    if (checkCollision(currentPiece.current.shape, currentPiece.current.x, currentPiece.current.y, newGrid)) {
      soundFX.playGameOver();
      setGameState('gameover');
      onGameOver?.(score);
    }
  }, [grid, score, lines, level, spawnPiece, onScoreUpdate, onGameOver]);

  const moveDown = useCallback(() => {
    if (gameState !== 'playing') return;
    if (!checkCollision(currentPiece.current.shape, currentPiece.current.x, currentPiece.current.y + 1, grid)) {
      currentPiece.current.y += 1;
      setGrid((g) => [...g]); // trigger re-render
    } else {
      lockPiece();
    }
  }, [gameState, grid, lockPiece]);

  const moveSide = (dir: -1 | 1) => {
    if (gameState !== 'playing') return;
    if (!checkCollision(currentPiece.current.shape, currentPiece.current.x + dir, currentPiece.current.y, grid)) {
      currentPiece.current.x += dir;
      setGrid((g) => [...g]);
    }
  };

  const handleRotate = () => {
    if (gameState !== 'playing') return;
    const rotated = rotate(currentPiece.current.shape);
    if (!checkCollision(rotated, currentPiece.current.x, currentPiece.current.y, grid)) {
      currentPiece.current.shape = rotated;
      setGrid((g) => [...g]);
    }
  };

  const hardDrop = () => {
    if (gameState !== 'playing') return;
    while (!checkCollision(currentPiece.current.shape, currentPiece.current.x, currentPiece.current.y + 1, grid)) {
      currentPiece.current.y += 1;
    }
    lockPiece();
  };

  const startGame = () => {
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    setScore(0);
    setLines(0);
    setLevel(1);
    nextPieceKey.current = getRandomPiece().key;
    spawnPiece();
    setGameState('playing');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
        return;
      }
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveSide(-1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveSide(1);
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') handleRotate();
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moveDown();
      if (e.key === ' ') hardDrop();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, moveDown]);

  // Tick interval for dropping piece
  useEffect(() => {
    if (gameState !== 'playing') return;
    const speed = Math.max(120, 800 - (level - 1) * 70);
    const timer = setInterval(() => {
      moveDown();
    }, speed);
    return () => clearInterval(timer);
  }, [gameState, level, moveDown]);

  // Update High Score on game over
  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('gd_highscore_tetris', String(score));
    }
  }, [gameState, score, highScore]);

  // Create visual render grid combining background and active piece
  const displayGrid = grid.map((row) => [...row]);
  if (gameState === 'playing' || gameState === 'paused') {
    const { shape, color, x, y } = currentPiece.current;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] && y + r >= 0 && y + r < ROWS && x + c >= 0 && x + c < COLS) {
          displayGrid[y + r][x + c] = color;
        }
      }
    }
  }

  return (
    <div className="relative w-full max-w-[480px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top Bar */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>{score.toLocaleString()}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 text-xs font-semibold">
            Lv.{level}
          </div>
          <div className="text-xs text-slate-400">
            Lines: <span className="text-white font-medium">{lines}</span>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Grid Viewport */}
      <div className="relative w-full p-4 flex justify-center items-center">
        <div className="w-full max-w-[280px] aspect-[10/20] bg-[#0c101d] border-2 border-slate-800 rounded-xl grid grid-cols-10 grid-rows-20 gap-[1px] p-1 shadow-inner relative overflow-hidden">
          {displayGrid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className="w-full h-full rounded-[2px] transition-colors"
                style={{
                  backgroundColor: cell || '#121829',
                  boxShadow: cell ? `0 0 6px ${cell}` : 'none',
                }}
              />
            ))
          )}

          {/* Start Screen */}
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
              <h2 className="text-2xl font-black text-cyan-400 mb-2">CYBER BLOCK DROP</h2>
              <p className="text-slate-400 text-xs mb-4">Rotate and fit tetromino blocks to clear lines!</p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-current" /> Start Game
              </button>
            </div>
          )}

          {/* Game Over Screen */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
              <h3 className="text-2xl font-black text-rose-500 mb-1">GRID FULL</h3>
              <p className="text-slate-400 text-xs mb-4">Final Score: {score.toLocaleString()}</p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Onscreen controls for mobile & desktop clicks */}
      <div className="w-full bg-slate-900/90 p-3 border-t border-slate-800 flex justify-center gap-2 sm:gap-4">
        <button
          onClick={() => moveSide(-1)}
          className="p-3 bg-slate-800 active:bg-cyan-600 rounded-xl text-white font-bold transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleRotate}
          className="p-3 bg-slate-800 active:bg-cyan-600 rounded-xl text-white font-bold transition"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={moveDown}
          className="p-3 bg-slate-800 active:bg-cyan-600 rounded-xl text-white font-bold transition"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => moveSide(1)}
          className="p-3 bg-slate-800 active:bg-cyan-600 rounded-xl text-white font-bold transition"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={hardDrop}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold rounded-xl text-xs transition flex items-center"
        >
          DROP
        </button>
      </div>
    </div>
  );
};
