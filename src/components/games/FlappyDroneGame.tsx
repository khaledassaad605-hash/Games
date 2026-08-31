import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlappyProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

export const FlappyDroneGame: React.FC<FlappyProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_flappy') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const droneRef = useRef({
    x: 90,
    y: 200,
    vy: 0,
    gravity: 0.38,
    jumpForce: -6.5,
    radius: 14,
    rotation: 0,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const jump = useCallback(() => {
    if (gameState === 'start') {
      setGameState('playing');
    }
    if (gameState === 'playing' || gameState === 'start') {
      soundFX.playJump();
      droneRef.current.vy = droneRef.current.jumpForce;
    }
  }, [gameState]);

  const startGame = () => {
    droneRef.current = {
      x: 90,
      y: 200,
      vy: 0,
      gravity: 0.38,
      jumpForce: -6.5,
      radius: 14,
      rotation: 0,
    };
    pipesRef.current = [];
    frameCountRef.current = 0;
    setScore(0);
    setGameState('playing');
  };

  // Keyboard & Click controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Main Physics & Render Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drone = droneRef.current;
    const gap = 135;
    const pipeWidth = 52;
    const pipeSpeed = 2.4;

    const loop = () => {
      frameCountRef.current++;

      // 1. Draw Background City Grid
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon Horizon Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Spawn Laser Pipes
      if (frameCountRef.current % 105 === 0) {
        const topHeight = Math.floor(Math.random() * (canvas.height - gap - 120)) + 50;
        const bottomHeight = canvas.height - topHeight - gap;
        pipesRef.current.push({
          x: canvas.width,
          topHeight,
          bottomHeight,
          passed: false,
        });
      }

      // 3. Update & Draw Drone Physics
      drone.vy += drone.gravity;
      drone.y += drone.vy;
      drone.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, drone.vy * 0.08));

      // Floor / Ceiling Collision
      if (drone.y + drone.radius > canvas.height || drone.y - drone.radius < 0) {
        soundFX.playGameOver();
        setGameState('gameover');
        return;
      }

      // 4. Update & Draw Pipes
      for (let i = pipesRef.current.length - 1; i >= 0; i--) {
        const p = pipesRef.current[i];
        p.x -= pipeSpeed;

        // Draw Top Pipe Barrier
        const gradientTop = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        gradientTop.addColorStop(0, '#0284c7');
        gradientTop.addColorStop(1, '#38bdf8');
        ctx.fillStyle = gradientTop;
        ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
        // Neon edge cap
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(p.x - 3, p.topHeight - 12, pipeWidth + 6, 12);

        // Draw Bottom Pipe Barrier
        const gradientBottom = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        gradientBottom.addColorStop(0, '#0284c7');
        gradientBottom.addColorStop(1, '#38bdf8');
        ctx.fillStyle = gradientBottom;
        ctx.fillRect(p.x, canvas.height - p.bottomHeight, pipeWidth, p.bottomHeight);
        // Neon edge cap
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(p.x - 3, canvas.height - p.bottomHeight, pipeWidth + 6, 12);

        // Collision Check with Pipe Box
        if (
          drone.x + drone.radius > p.x &&
          drone.x - drone.radius < p.x + pipeWidth &&
          (drone.y - drone.radius < p.topHeight || drone.y + drone.radius > canvas.height - p.bottomHeight)
        ) {
          soundFX.playGameOver();
          setGameState('gameover');
          return;
        }

        // Score increment when passing pipe
        if (!p.passed && p.x + pipeWidth < drone.x) {
          p.passed = true;
          soundFX.playScore();
          setScore((s) => {
            const next = s + 1;
            onScoreUpdate?.(next);
            return next;
          });
        }

        // Remove offscreen pipes
        if (p.x + pipeWidth < -20) {
          pipesRef.current.splice(i, 1);
        }
      }

      // Draw Drone Model
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.rotation);

      // Drone Neon Thruster
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, drone.radius, 0, Math.PI * 2);
      ctx.fill();

      // Drone Rotor blades
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-drone.radius - 4, -4);
      ctx.lineTo(drone.radius + 4, -4);
      ctx.stroke();

      // Drone Eye Lens
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(4, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, onScoreUpdate]);

  // Handle Game Over
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('gd_highscore_flappy', String(score));
        confetti({ particleCount: 70, spread: 80 });
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
    <div className="relative w-full max-w-[440px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>Score: {score}</span>
          </div>
          <div className="text-xs text-slate-400">
            Best: <span className="text-amber-400 font-semibold">{highScore}</span>
          </div>
        </div>
        <button
          onClick={toggleSound}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Canvas Viewport */}
      <div
        className="relative w-full cursor-pointer flex justify-center bg-black"
        onClick={jump}
      >
        <canvas ref={canvasRef} width={400} height={520} className="w-full h-auto max-h-[520px] object-contain block" />

        {/* Start Overlay */}
        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h2 className="text-3xl font-black text-cyan-400 tracking-wide mb-2">FLAPPY CYBER DRONE</h2>
            <p className="text-slate-300 text-xs max-w-xs mb-6">
              Tap or press Space to hover through high-voltage cyber laser gates!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5 fill-current" /> Tap To Hover
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-black text-rose-500 mb-2">DRONE CRASHED</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full max-w-xs mb-6 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Pipes Cleared:</span>
                <span className="text-cyan-400 font-bold">{score}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">High Score:</span>
                <span className="text-amber-400 font-bold">{highScore}</span>
              </div>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Try Again
            </button>
          </div>
        )}
      </div>

      <div className="w-full py-2.5 bg-slate-900/90 text-center text-xs text-slate-400 border-t border-slate-800">
        Click / Tap or Press Space to Jump
      </div>
    </div>
  );
};
