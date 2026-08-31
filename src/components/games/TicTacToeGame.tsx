import React, { useState, useEffect, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Users, Bot, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TicTacToeProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

type Player = 'X' | 'O';
type CellValue = Player | null;

export const TicTacToeGame: React.FC<TicTacToeProps> = ({ onScoreUpdate, onGameOver }) => {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [vsAI, setVsAI] = useState(true);
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);

  const checkWinner = (currentBoard: CellValue[]): Player | 'Draw' | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }

    if (currentBoard.every((cell) => cell !== null)) {
      return 'Draw';
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;
    if (vsAI && !isXNext) return; // Wait for AI move

    soundFX.playClick();
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      handleWin(winResult);
    } else {
      setIsXNext(!isXNext);
    }
  };

  // AI Move (Minimax / Strategic)
  const makeAIMove = useCallback(
    (currentBoard: CellValue[]) => {
      const emptyIndices = currentBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((idx) => idx !== null) as number[];

      if (emptyIndices.length === 0) return;

      // 1. Check if AI can win on this turn
      for (const idx of emptyIndices) {
        const testBoard = [...currentBoard];
        testBoard[idx] = 'O';
        if (checkWinner(testBoard) === 'O') {
          testBoard[idx] = 'O';
          setBoard(testBoard);
          handleWin('O');
          return;
        }
      }

      // 2. Check if player X can win and block them
      for (const idx of emptyIndices) {
        const testBoard = [...currentBoard];
        testBoard[idx] = 'X';
        if (checkWinner(testBoard) === 'X') {
          const moveBoard = [...currentBoard];
          moveBoard[idx] = 'O';
          setBoard(moveBoard);
          const winResult = checkWinner(moveBoard);
          if (winResult) handleWin(winResult);
          else setIsXNext(true);
          return;
        }
      }

      // 3. Take center if open
      if (currentBoard[4] === null) {
        const moveBoard = [...currentBoard];
        moveBoard[4] = 'O';
        setBoard(moveBoard);
        const winResult = checkWinner(moveBoard);
        if (winResult) handleWin(winResult);
        else setIsXNext(true);
        return;
      }

      // 4. Otherwise pick random empty cell
      const randomChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const moveBoard = [...currentBoard];
      moveBoard[randomChoice] = 'O';
      setBoard(moveBoard);
      const winResult = checkWinner(moveBoard);
      if (winResult) handleWin(winResult);
      else setIsXNext(true);
    },
    []
  );

  useEffect(() => {
    if (vsAI && !isXNext && !winner) {
      const timer = setTimeout(() => {
        makeAIMove(board);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [vsAI, isXNext, board, winner, makeAIMove]);

  const handleWin = (res: Player | 'Draw') => {
    setWinner(res);
    if (res === 'X') {
      soundFX.playPowerup();
      confetti({ particleCount: 70, spread: 80 });
      setScoreX((s) => s + 1);
      onScoreUpdate?.(100);
      onGameOver?.(100);
    } else if (res === 'O') {
      soundFX.playGameOver();
      setScoreO((s) => s + 1);
    } else {
      soundFX.playLaser();
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top Header */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span>Player (X): {scoreX}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span>{vsAI ? 'AI' : 'P2'} (O): {scoreO}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setVsAI(!vsAI);
              resetGame();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold flex items-center gap-1"
          >
            {vsAI ? <Bot className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span>{vsAI ? 'vs AI' : '2-Player'}</span>
          </button>
          <button
            onClick={resetGame}
            className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="w-full p-4 flex justify-center items-center">
        <div className="grid grid-cols-3 gap-3 bg-[#0d121f] p-4 rounded-2xl border border-slate-800 w-full max-w-[320px] aspect-square">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`w-full h-full rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all ${
                cell === 'X'
                  ? 'text-cyan-400 bg-cyan-950/40 border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : cell === 'O'
                  ? 'text-rose-400 bg-rose-950/40 border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80'
              }`}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="w-full py-3 bg-slate-900 text-center text-xs font-semibold text-slate-400 border-t border-slate-800">
        {winner ? (
          winner === 'Draw' ? (
            <span className="text-amber-400 font-bold">Stalemate Draw!</span>
          ) : (
            <span className="text-emerald-400 font-bold">Winner: {winner === 'X' ? 'Player (X)' : vsAI ? 'Quantum AI' : 'Player 2'}!</span>
          )
        ) : (
          <span>Turn: {isXNext ? 'Player (X)' : vsAI ? 'Quantum AI Thinking...' : 'Player 2 (O)'}</span>
        )}
      </div>
    </div>
  );
};
