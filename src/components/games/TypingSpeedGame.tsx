import React, { useState, useEffect, useRef } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TypingProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

const WORD_BANK = [
  'cyber', 'neon', 'matrix', 'laser', 'drone', 'quantum', 'arcade', 'plasma',
  'system', 'binary', 'glitch', 'circuit', 'signal', 'vector', 'pixel', 'crypto',
  'turbo', 'speed', 'reactor', 'shield', 'firewall', 'terminal', 'protocol', 'neural',
  'engine', 'space', 'galaxy', 'hyper', 'sonic', 'nexus', 'vertex', 'arcade'
];

interface FallingWord {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
}

export const TypingSpeedGame: React.FC<TypingProps> = ({ onScoreUpdate, onGameOver }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [words, setWords] = useState<FallingWord[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [score, setScore] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_typing') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const wordsTypedRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const nextIdRef = useRef(1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const startGame = () => {
    setWords([]);
    setInputVal('');
    setScore(0);
    setLives(3);
    setWpm(0);
    wordsTypedRef.current = 0;
    startTimeRef.current = Date.now();
    setGameState('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Spawn word loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setWords((prev) => {
        if (prev.length >= 6) return prev;
        const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
        const xPos = Math.floor(Math.random() * 60) + 15; // 15% to 75%
        return [
          ...prev,
          {
            id: nextIdRef.current++,
            word: randomWord,
            x: xPos,
            y: 0,
            speed: Math.random() * 0.4 + 0.35,
          },
        ];
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [gameState]);

  // Movement loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setWords((prev) => {
        const nextWords: FallingWord[] = [];
        let lostLife = false;

        prev.forEach((item) => {
          const nextY = item.y + item.speed;
          if (nextY >= 90) {
            lostLife = true;
          } else {
            nextWords.push({ ...item, y: nextY });
          }
        });

        if (lostLife) {
          soundFX.playGameOver();
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setGameState('gameover');
            }
            return nextL;
          });
        }

        return nextWords;
      });

      // Update WPM
      const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
      if (elapsedMin > 0.05) {
        setWpm(Math.round(wordsTypedRef.current / elapsedMin));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState]);

  // Handle typing submit
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    const matchIndex = words.findIndex((w) => w.word.toLowerCase() === val.trim().toLowerCase());
    if (matchIndex !== -1) {
      soundFX.playScore();
      wordsTypedRef.current += 1;
      setWords((prev) => prev.filter((_, idx) => idx !== matchIndex));
      setInputVal('');

      const pts = 100 + val.length * 10;
      setScore((s) => {
        const nextScore = s + pts;
        onScoreUpdate?.(nextScore);
        return nextScore;
      });
    }
  };

  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('gd_highscore_typing', String(score));
      confetti({ particleCount: 70, spread: 80 });
    }
    if (gameState === 'gameover') onGameOver?.(score);
  }, [gameState, score, highScore, onGameOver]);

  return (
    <div className="relative w-full max-w-[520px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400 font-bold">
            <Flame className="w-4 h-4" />
            <span>{wpm} WPM</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < lives ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Falling Matrix Stage */}
      <div className="relative w-full h-[360px] bg-[#070a12] overflow-hidden">
        {words.map((w) => (
          <div
            key={w.id}
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
            className="absolute -translate-x-1/2 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-mono font-bold text-sm tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            {w.word}
          </div>
        ))}

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h2 className="text-2xl font-black text-cyan-400 mb-2">CYBER TYPIST SPEED TRIAL</h2>
            <p className="text-slate-300 text-xs max-w-xs mb-6">
              Type the descending firewall words before they breach the defense perimeter line!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5 fill-current" /> Begin Typing
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-black text-rose-500 mb-2">FIREWALL BREACHED</h3>
            <p className="text-slate-400 text-xs mb-4">
              Score: {score.toLocaleString()} • Speed: {wpm} WPM
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Retry Trial
            </button>
          </div>
        )}
      </div>

      {/* Terminal Input Box */}
      <div className="w-full bg-slate-900 p-3 border-t border-slate-800 flex items-center gap-3">
        <span className="text-cyan-400 font-mono font-bold">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          placeholder={gameState === 'playing' ? 'Type falling word here...' : 'Click start above'}
          disabled={gameState !== 'playing'}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
        />
      </div>
    </div>
  );
};
