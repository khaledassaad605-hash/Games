import React, { useState, useEffect, useRef } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RacerProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

interface ObstacleCar {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  color: string;
}

interface Coin {
  x: number;
  y: number;
  radius: number;
}

export const DriftRacerGame: React.FC<RacerProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [nitro, setNitro] = useState(100);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_racer') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playerRef = useRef({
    x: 200,
    y: 440,
    width: 38,
    height: 64,
    speed: 5.5,
    isNitro: false,
  });

  const obstaclesRef = useRef<ObstacleCar[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const roadOffsetRef = useRef(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number | null>(null);

  const startGame = () => {
    playerRef.current = {
      x: 200,
      y: 440,
      width: 38,
      height: 64,
      speed: 5.5,
      isNitro: false,
    };
    obstaclesRef.current = [];
    coinsRef.current = [];
    roadOffsetRef.current = 0;
    setScore(0);
    setDistance(0);
    setNitro(100);
    setGameState('playing');
  };

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const carColors = ['#f43f5e', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];

    const loop = () => {
      // 1. Handle Speed & Nitro
      const isBoosting = (keysPressed.current['arrowup'] || keysPressed.current['w'] || keysPressed.current[' ']) && nitro > 0;
      player.isNitro = isBoosting;
      const currentRoadSpeed = isBoosting ? 9.5 : 5.5;

      if (isBoosting) {
        setNitro((n) => Math.max(0, n - 0.35));
      } else {
        setNitro((n) => Math.min(100, n + 0.12));
      }

      // Handle Horizontal Steering
      if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
        player.x -= player.speed;
      }
      if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
        player.x += player.speed;
      }

      // Road bounds (left road edge ~60, right road edge ~340)
      player.x = Math.max(70, Math.min(canvas.width - 70 - player.width, player.x));

      // Update distance & road animation
      roadOffsetRef.current = (roadOffsetRef.current + currentRoadSpeed) % 40;
      setDistance((d) => {
        const nextDist = d + (isBoosting ? 2 : 1);
        return nextDist;
      });

      // 2. Draw Highway
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road Asphalt
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(60, 0, canvas.width - 120, canvas.height);

      // Road Edge Neon Lines
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, canvas.height);
      ctx.moveTo(canvas.width - 60, 0);
      ctx.lineTo(canvas.width - 60, canvas.height);
      ctx.stroke();

      // Dashed lane dividers
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffsetRef.current;

      ctx.beginPath();
      ctx.moveTo(canvas.width / 3 + 20, 0);
      ctx.lineTo(canvas.width / 3 + 20, canvas.height);
      ctx.moveTo((canvas.width / 3) * 2 - 20, 0);
      ctx.lineTo((canvas.width / 3) * 2 - 20, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Spawn Obstacle Cars & Coins
      if (Math.random() < 0.035 && obstaclesRef.current.length < 5) {
        const laneX = [85, 185, 275][Math.floor(Math.random() * 3)];
        obstaclesRef.current.push({
          x: laneX,
          y: -80,
          speed: Math.random() * 2 + 2,
          width: 36,
          height: 60,
          color: carColors[Math.floor(Math.random() * carColors.length)],
        });
      }

      if (Math.random() < 0.025 && coinsRef.current.length < 4) {
        const coinX = [100, 200, 290][Math.floor(Math.random() * 3)];
        coinsRef.current.push({ x: coinX, y: -40, radius: 10 });
      }

      // 4. Update & Draw Coins
      for (let i = coinsRef.current.length - 1; i >= 0; i--) {
        const c = coinsRef.current[i];
        c.y += currentRoadSpeed;

        // Draw Gold Coin
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Collect Coin
        if (Math.hypot(c.x - (player.x + player.width / 2), c.y - (player.y + player.height / 2)) < 30) {
          soundFX.playScore();
          setScore((s) => {
            const next = s + 50;
            onScoreUpdate?.(next);
            return next;
          });
          coinsRef.current.splice(i, 1);
          continue;
        }

        if (c.y > canvas.height + 40) {
          coinsRef.current.splice(i, 1);
        }
      }

      // 5. Update & Draw Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.y += currentRoadSpeed - obs.speed;

        // Draw Traffic Car
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(obs.x + 4, obs.y + 12, obs.width - 8, 14);

        // Tail lights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x + 4, obs.y + obs.height - 6, 8, 4);
        ctx.fillRect(obs.x + obs.width - 12, obs.y + obs.height - 6, 8, 4);

        // Crash Collision Check
        if (
          player.x < obs.x + obs.width &&
          player.x + player.width > obs.x &&
          player.y < obs.y + obs.height &&
          player.y + player.height > obs.y
        ) {
          soundFX.playExplosion();
          soundFX.playGameOver();
          setGameState('gameover');
          return;
        }

        if (obs.y > canvas.height + 80) {
          obstaclesRef.current.splice(i, 1);
          setScore((s) => s + 10);
        }
      }

      // 6. Draw Player Supercar
      ctx.save();
      ctx.translate(player.x, player.y);

      // Nitro exhaust flame
      if (player.isNitro) {
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(8, player.height);
        ctx.lineTo(player.width - 8, player.height);
        ctx.lineTo(player.width / 2, player.height + Math.random() * 20 + 15);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Supercar Chassis
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = player.isNitro ? 16 : 6;
      ctx.beginPath();
      ctx.roundRect(0, 0, player.width, player.height, 10);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Dark Tint Windshield
      ctx.fillStyle = '#082f49';
      ctx.fillRect(5, 14, player.width - 10, 18);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 2, 8, 5);
      ctx.fillRect(player.width - 12, 2, 8, 5);

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, nitro, onScoreUpdate]);

  useEffect(() => {
    if (gameState === 'gameover') {
      const finalTotal = score + Math.floor(distance / 5);
      if (finalTotal > highScore) {
        setHighScore(finalTotal);
        localStorage.setItem('gd_highscore_racer', String(finalTotal));
        confetti({ particleCount: 80, spread: 80 });
      }
      onGameOver?.(finalTotal);
    }
  }, [gameState, score, distance, highScore, onGameOver]);

  return (
    <div className="relative w-full max-w-[440px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>{(score + Math.floor(distance / 5)).toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-400">
            Dist: <span className="text-white font-medium">{Math.floor(distance / 10)}m</span>
          </div>
        </div>

        {/* Nitro Meter */}
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <div className="w-20 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div className="bg-cyan-400 h-full transition-all duration-75" style={{ width: `${nitro}%` }} />
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full flex justify-center bg-black">
        <canvas ref={canvasRef} width={400} height={520} className="w-full h-auto max-h-[520px] object-contain block" />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h2 className="text-3xl font-black text-cyan-400 mb-2">TURBO DRIFT SPRINT</h2>
            <p className="text-slate-300 text-xs max-w-xs mb-6">
              Dodge highway traffic, collect golden credits, and fire nitro thrusters to hit maximum speed!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5 fill-current" /> Start Engine
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-black text-rose-500 mb-2">CRASHED!</h3>
            <p className="text-slate-400 text-xs mb-4">Total Score: {(score + Math.floor(distance / 5)).toLocaleString()}</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Drive Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="w-full bg-slate-900/90 p-3 border-t border-slate-800 flex justify-between items-center sm:hidden">
        <div className="flex gap-2">
          <button
            onTouchStart={() => { keysPressed.current['arrowleft'] = true; }}
            onTouchEnd={() => { keysPressed.current['arrowleft'] = false; }}
            className="w-14 h-12 bg-slate-800 active:bg-cyan-600 rounded-xl text-white font-bold"
          >
            ←
          </button>
          <button
            onTouchStart={() => { keysPressed.current['arrowright'] = true; }}
            onTouchEnd={() => { keysPressed.current['arrowright'] = false; }}
            className="w-14 h-12 bg-slate-800 active:bg-cyan-600 rounded-xl text-white font-bold"
          >
            →
          </button>
        </div>
        <button
          onTouchStart={() => { keysPressed.current['arrowup'] = true; }}
          onTouchEnd={() => { keysPressed.current['arrowup'] = false; }}
          className="px-6 h-12 bg-cyan-500 active:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-1"
        >
          <Zap className="w-4 h-4" /> NITRO
        </button>
      </div>
    </div>
  );
};
