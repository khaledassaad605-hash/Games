import React, { useState, useEffect, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Flag, RefreshCw, Trophy, Bomb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MinesweeperProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

const ROWS = 9;
const COLS = 9;
const MINES_COUNT = 10;

export const MinesweeperGame: React.FC<MinesweeperProps> = ({ onScoreUpdate, onGameOver }) => {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [flagsRemaining, setFlagsRemaining] = useState(MINES_COUNT);
  const [flagMode, setFlagMode] = useState(false);
  const [timer, setTimer] = useState(0);

  const initBoard = useCallback(() => {
    const newBoard: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      newBoard[r] = [];
      for (let c = 0; c < COLS; c++) {
        newBoard[r][c] = {
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        };
      }
    }

    // Place mines randomly
    let placed = 0;
    while (placed < MINES_COUNT) {
      const rr = Math.floor(Math.random() * ROWS);
      const cc = Math.floor(Math.random() * COLS);
      if (!newBoard[rr][cc].isMine) {
        newBoard[rr][cc].isMine = true;
        placed++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newBoard[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
              count++;
            }
          }
        }
        newBoard[r][c].neighborMines = count;
      }
    }

    setBoard(newBoard);
    setFlagsRemaining(MINES_COUNT);
    setGameState('playing');
    setTimer(0);
  }, []);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const revealCell = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    const cell = board[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

    if (cell.isMine) {
      soundFX.playGameOver();
      // Reveal all mines
      newBoard.forEach((row) =>
        row.forEach((c) => {
          if (c.isMine) c.isRevealed = true;
        })
      );
      setBoard(newBoard);
      setGameState('lost');
      onGameOver?.(0);
      return;
    }

    soundFX.playClick();

    // Flood fill revealing
    const queue: [number, number][] = [[r, c]];
    newBoard[r][c].isRevealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      if (newBoard[currR][currC].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const neighbor = newBoard[nr][nc];
              if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                neighbor.isRevealed = true;
                if (neighbor.neighborMines === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    // Check Victory
    let unrevealedSafe = 0;
    newBoard.forEach((row) =>
      row.forEach((c) => {
        if (!c.isMine && !c.isRevealed) unrevealedSafe++;
      })
    );

    if (unrevealedSafe === 0) {
      soundFX.playPowerup();
      confetti({ particleCount: 90, spread: 80 });
      setGameState('won');
      const winScore = Math.max(100, 1000 - timer * 10);
      onScoreUpdate?.(winScore);
      onGameOver?.(winScore);
    }

    setBoard(newBoard);
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    const cell = board[r][c];
    if (cell.isRevealed) return;

    soundFX.playClick();
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const target = newBoard[r][c];

    if (target.isFlagged) {
      target.isFlagged = false;
      setFlagsRemaining((f) => f + 1);
    } else if (flagsRemaining > 0) {
      target.isFlagged = true;
      setFlagsRemaining((f) => f - 1);
    }

    setBoard(newBoard);
  };

  const handleCellClick = (e: React.MouseEvent, r: number, c: number) => {
    if (flagMode) {
      toggleFlag(e, r, c);
    } else {
      revealCell(r, c);
    }
  };

  const getNumberColor = (count: number) => {
    const colors = [
      '',
      'text-cyan-400',
      'text-emerald-400',
      'text-rose-400',
      'text-purple-400',
      'text-amber-400',
      'text-teal-400',
      'text-pink-400',
      'text-red-500',
    ];
    return colors[count] || 'text-white';
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <Bomb className="w-4 h-4" />
            <span>{flagsRemaining}</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Time: <span className="text-white font-bold">{timer}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
              flagMode
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> Flag Mode
          </button>
          <button
            onClick={initBoard}
            className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
            title="Reset Board"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="w-full p-4 flex justify-center items-center">
        <div className="grid grid-cols-9 gap-1.5 bg-[#0d121f] p-3 rounded-2xl border border-slate-800">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={(e) => handleCellClick(e, r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-black text-sm flex items-center justify-center transition ${
                  cell.isRevealed
                    ? cell.isMine
                      ? 'bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : 'bg-slate-800/80 border border-slate-700/50'
                    : 'bg-slate-700 hover:bg-slate-600 active:scale-95 border border-slate-600/70 shadow-sm'
                }`}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    <Bomb className="w-4 h-4" />
                  ) : cell.neighborMines > 0 ? (
                    <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                  ) : (
                    ''
                  )
                ) : cell.isFlagged ? (
                  <Flag className="w-4 h-4 text-rose-400 fill-rose-400" />
                ) : (
                  ''
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="w-full py-2.5 bg-slate-900 text-center text-xs text-slate-400 border-t border-slate-800">
        {gameState === 'won' ? (
          <span className="text-emerald-400 font-bold">ALL MINES CLEARED! You Win!</span>
        ) : gameState === 'lost' ? (
          <span className="text-rose-400 font-bold">MINE DETONATED! Click reset to retry.</span>
        ) : (
          <span>Left Click to reveal sector • Right Click or Flag button to mark mines</span>
        )}
      </div>
    </div>
  );
};
