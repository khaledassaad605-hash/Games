import React, { useState, useEffect, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Sparkles, Gamepad2, Shield, Zap, Flame, Rocket, Cpu, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MemoryProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

const ICONS = [
  { id: 'gamepad', icon: Gamepad2, color: 'text-cyan-400' },
  { id: 'shield', icon: Shield, color: 'text-blue-400' },
  { id: 'zap', icon: Zap, color: 'text-amber-400' },
  { id: 'flame', icon: Flame, color: 'text-rose-400' },
  { id: 'rocket', icon: Rocket, color: 'text-purple-400' },
  { id: 'cpu', icon: Cpu, color: 'text-emerald-400' },
  { id: 'eye', icon: Eye, color: 'text-teal-400' },
  { id: 'sparkles', icon: Sparkles, color: 'text-pink-400' },
];

interface Card {
  id: number;
  iconIndex: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMatchGame: React.FC<MemoryProps> = ({ onScoreUpdate, onGameOver }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initGame = useCallback(() => {
    const cardPairs = [...ICONS, ...ICONS].map((item, idx) => ({
      id: idx,
      iconIndex: ICONS.findIndex((i) => i.id === item.id),
      isFlipped: false,
      isMatched: false,
    }));

    // Shuffle cards
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setScore(0);
    setIsWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    soundFX.playClick();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const first = cards[newFlipped[0]];
      const second = cards[newFlipped[1]];

      if (first.iconIndex === second.iconIndex) {
        soundFX.playScore();
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[newFlipped[0]].isMatched = true;
            updated[newFlipped[1]].isMatched = true;
            return updated;
          });
          setFlippedCards([]);
          setMatches((m) => {
            const nextMatches = m + 1;
            const pts = 150;
            setScore((s) => {
              const nextScore = s + pts;
              onScoreUpdate?.(nextScore);
              return nextScore;
            });
            if (nextMatches === ICONS.length) {
              soundFX.playPowerup();
              confetti({ particleCount: 90, spread: 80 });
              setIsWon(true);
              onGameOver?.(score + pts);
            }
            return nextMatches;
          });
        }, 300);
      } else {
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[newFlipped[0]].isFlipped = false;
            updated[newFlipped[1]].isFlipped = false;
            return updated;
          });
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>Score: {score}</span>
          </div>
          <div className="text-xs text-slate-400">
            Moves: <span className="text-white font-medium">{moves}</span>
          </div>
        </div>

        <button
          onClick={initGame}
          className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="w-full p-4 flex justify-center items-center">
        <div className="grid grid-cols-4 gap-2.5 bg-[#0d121f] p-3 rounded-2xl border border-slate-800 w-full max-w-[360px] aspect-square">
          {cards.map((card, idx) => {
            const IconComponent = ICONS[card.iconIndex]?.icon || Sparkles;
            const colorClass = ICONS[card.iconIndex]?.color || 'text-white';

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-200 transform active:scale-95 ${
                  card.isFlipped || card.isMatched
                    ? 'bg-slate-800 border-2 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <IconComponent className={`w-7 h-7 ${colorClass}`} />
                ) : (
                  <span className="text-xs text-slate-400 font-mono">GD</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isWon && (
        <div className="w-full bg-emerald-950/60 border-t border-emerald-800/80 p-3 text-center text-sm font-bold text-emerald-300">
          🎉 Matrix Complete! You matched all pairs in {moves} moves!
        </div>
      )}
    </div>
  );
};
