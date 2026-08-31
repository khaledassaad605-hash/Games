import React, { useState, useEffect, useCallback, useRef } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Undo2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Game2048Props {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

type Board = number[][];

const BOARD_SIZE = 4;

export const Game2048: React.FC<Game2048Props> = ({ onScoreUpdate, onGameOver }) => {
  const [board, setBoard] = useState<Board>([]);
  const [previousBoard, setPreviousBoard] = useState<Board | null>(null);
  const [score, setScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_2048') || 0);
  });
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize empty board
  const getEmptyBoard = (): Board => {
    return Array(BOARD_SIZE)
      .fill(0)
      .map(() => Array(BOARD_SIZE).fill(0));
  };

  // Add random tile (2 or 4) to empty spot
  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  // Start new game
  const initGame = useCallback(() => {
    let newBoard = getEmptyBoard();
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setPreviousBoard(null);
    setScore(0);
    setWon(false);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check if moves are available
  const checkGameOver = (currentBoard: Board): boolean => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
        if (r < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Move Logic
  const move = useCallback(
    (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      if (gameOver) return;

      let moved = false;
      let addedScore = 0;
      const newBoard = board.map((row) => [...row]);

      const slideRow = (row: number[]): number[] => {
        let arr = row.filter((val) => val !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            addedScore += arr[i];
            if (arr[i] === 2048 && !won) {
              setWon(true);
              confetti({ particleCount: 100, spread: 80 });
            }
            arr.splice(i + 1, 1);
          }
        }
        while (arr.length < BOARD_SIZE) {
          arr.push(0);
        }
        return arr;
      };

      if (direction === 'LEFT') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const original = [...newBoard[r]];
          newBoard[r] = slideRow(newBoard[r]);
          if (original.some((val, idx) => val !== newBoard[r][idx])) moved = true;
        }
      } else if (direction === 'RIGHT') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const original = [...newBoard[r]];
          const reversed = [...newBoard[r]].reverse();
          newBoard[r] = slideRow(reversed).reverse();
          if (original.some((val, idx) => val !== newBoard[r][idx])) moved = true;
        }
      } else if (direction === 'UP') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const slided = slideRow(col);
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (newBoard[r][c] !== slided[r]) moved = true;
            newBoard[r][c] = slided[r];
          }
        }
      } else if (direction === 'DOWN') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const slided = slideRow(col);
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (newBoard[3 - r][c] !== slided[r]) moved = true;
            newBoard[3 - r][c] = slided[r];
          }
        }
      }

      if (moved) {
        soundFX.playScore();
        setPreviousBoard(board);
        setPreviousScore(score);

        const updatedBoard = addRandomTile(newBoard);
        setBoard(updatedBoard);

        const nextScore = score + addedScore;
        setScore(nextScore);
        onScoreUpdate?.(nextScore);

        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem('gd_highscore_2048', String(nextScore));
        }

        if (checkGameOver(updatedBoard)) {
          soundFX.playGameOver();
          setGameOver(true);
          onGameOver?.(nextScore);
        }
      }
    },
    [board, score, highScore, gameOver, won, onScoreUpdate, onGameOver]
  );

  // Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('LEFT');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('RIGHT');
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('UP');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('DOWN');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch / Swipe handler
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        if (dx > 0) move('RIGHT');
        else move('LEFT');
      } else {
        if (dy > 0) move('DOWN');
        else move('UP');
      }
    }
    touchStartRef.current = null;
  };

  const handleUndo = () => {
    if (previousBoard) {
      setBoard(previousBoard);
      setScore(previousScore);
      setPreviousBoard(null);
      setGameOver(false);
    }
  };

  const getTileStyles = (val: number) => {
    switch (val) {
      case 2:
        return 'bg-slate-800 text-slate-100 border-slate-700';
      case 4:
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 8:
        return 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]';
      case 16:
        return 'bg-teal-900 text-teal-200 border-teal-600 shadow-[0_0_12px_rgba(20,184,166,0.4)]';
      case 32:
        return 'bg-emerald-900 text-emerald-200 border-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.5)]';
      case 64:
        return 'bg-amber-900 text-amber-200 border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.6)]';
      case 128:
        return 'bg-orange-800 text-white border-orange-400 font-extrabold shadow-[0_0_18px_rgba(249,115,22,0.7)]';
      case 256:
        return 'bg-rose-800 text-white border-rose-400 font-extrabold shadow-[0_0_20px_rgba(244,63,94,0.8)]';
      case 512:
        return 'bg-purple-800 text-white border-purple-400 font-extrabold shadow-[0_0_22px_rgba(168,85,247,0.8)]';
      case 1024:
        return 'bg-indigo-700 text-white border-indigo-300 font-black shadow-[0_0_24px_rgba(99,102,241,0.9)]';
      case 2048:
        return 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 border-yellow-200 font-black shadow-[0_0_30px_rgba(251,191,36,1)] animate-pulse';
      default:
        return 'bg-slate-900/50 border-slate-800/60';
    }
  };

  return (
    <div className="relative w-full max-w-[460px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score</div>
            <div className="text-base font-extrabold text-cyan-400">{score.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Best</div>
            <div className="text-base font-extrabold text-amber-400">{highScore.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex gap-2">
          {previousBoard && (
            <button
              onClick={handleUndo}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Undo Move"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={initGame}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
            title="New Game"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2048 Grid */}
      <div
        className="w-full p-4 flex justify-center items-center select-none touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full aspect-square bg-[#0d121f] p-3 rounded-2xl border border-slate-800 grid grid-cols-4 gap-2.5 relative">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-full h-full rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold border transition-all duration-150 ${getTileStyles(
                  cell
                )}`}
              >
                {cell > 0 ? cell : ''}
              </div>
            ))
          )}

          {/* 2048 Reached Banner */}
          {won && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
              <Award className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
              <h3 className="text-2xl font-black text-white mb-2">2048 ACHIEVED!</h3>
              <p className="text-slate-300 text-xs mb-4">You solved the Cyber Matrix core!</p>
              <button
                onClick={() => setWon(false)}
                className="px-6 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-sm"
              >
                Keep Playing
              </button>
            </div>
          )}

          {/* Game Over Banner */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
              <h3 className="text-2xl font-black text-rose-500 mb-1">NO MORE MOVES</h3>
              <p className="text-slate-400 text-xs mb-4">Final Score: {score.toLocaleString()}</p>
              <button
                onClick={initGame}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pb-3 text-xs text-slate-400 text-center">
        Use Arrow keys or Swipe on screen to merge matching numbers
      </div>
    </div>
  );
};
