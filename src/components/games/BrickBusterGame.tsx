import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BrickBusterProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  color: string;
  points: number;
}

export const BrickBusterGame: React.FC<BrickBusterProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'victory'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_brick_buster') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const paddleRef = useRef({ x: 250, y: 520, w: 90, h: 14, speed: 8 });
  const ballRef = useRef({ x: 300, y: 500, vx: 4, vy: -4, radius: 7, inPlay: false });
  const bricksRef = useRef<Brick[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number | null>(null);

  const buildBricks = useCallback(() => {
    const bricks: Brick[] = [];
    const rows = 5;
    const cols = 8;
    const brickW = 62;
    const brickH = 20;
    const padding = 8;
    const offsetX = 30;
    const offsetY = 50;

    const colors = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetX + c * (brickW + padding),
          y: offsetY + r * (brickH + padding),
          w: brickW,
          h: brickH,
          hp: r === 0 ? 2 : 1,
          color: colors[r % colors.length],
          points: (rows - r) * 20,
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const startGame = () => {
    paddleRef.current = { x: 250, y: 520, w: 90, h: 14, speed: 8 };
    ballRef.current = { x: 300, y: 500, vx: 4.2 * (Math.random() > 0.5 ? 1 : -1), vy: -4.2, radius: 7, inPlay: true };
    buildBricks();
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
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

  // Mouse / Touch Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.w, mouseX - paddleRef.current.w / 2));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(0, Math.min(canvas.width - paddleRef.current.w, touchX - paddleRef.current.w / 2));
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paddle = paddleRef.current;
    const ball = ballRef.current;

    const loop = () => {
      // Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Handle Keys
      if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
        paddle.x = Math.max(0, paddle.x - paddle.speed);
      }
      if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
        paddle.x = Math.min(canvas.width - paddle.w, paddle.x + paddle.speed);
      }

      // Update Ball
      if (ball.inPlay) {
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Walls
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
          ball.vx = -ball.vx;
          soundFX.playLaser();
        }
        if (ball.y - ball.radius < 0) {
          ball.vy = -ball.vy;
          soundFX.playLaser();
        }

        // Bottom edge (life lost)
        if (ball.y + ball.radius > canvas.height) {
          soundFX.playGameOver();
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) {
              setGameState('gameover');
            } else {
              ball.x = paddle.x + paddle.w / 2;
              ball.y = paddle.y - 20;
              ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1);
              ball.vy = -4.5;
            }
            return nextLives;
          });
        }

        // Paddle Collision
        if (
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.h &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.w
        ) {
          soundFX.playLaser();
          // Angle bounce based on where it hits paddle
          const hitPoint = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          ball.vx = hitPoint * 6;
          ball.vy = -Math.abs(ball.vy);
        }

        // Brick Collisions
        for (let i = bricksRef.current.length - 1; i >= 0; i--) {
          const b = bricksRef.current[i];
          if (
            ball.x + ball.radius > b.x &&
            ball.x - ball.radius < b.x + b.w &&
            ball.y + ball.radius > b.y &&
            ball.y - ball.radius < b.y + b.h
          ) {
            soundFX.playScore();
            ball.vy = -ball.vy;
            b.hp -= 1;

            if (b.hp <= 0) {
              const pts = b.points;
              setScore((s) => {
                const nextScore = s + pts;
                onScoreUpdate?.(nextScore);
                return nextScore;
              });
              bricksRef.current.splice(i, 1);
            }

            // Check Victory
            if (bricksRef.current.length === 0) {
              soundFX.playPowerup();
              confetti({ particleCount: 100, spread: 80 });
              setGameState('victory');
              return;
            }
            break;
          }
        }
      }

      // Draw Bricks
      bricksRef.current.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
      });

      // Draw Paddle
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Ball
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, onScoreUpdate]);

  useEffect(() => {
    if ((gameState === 'gameover' || gameState === 'victory') && score > highScore) {
      setHighScore(score);
      localStorage.setItem('gd_highscore_brick_buster', String(score));
    }
    if (gameState === 'gameover') onGameOver?.(score);
  }, [gameState, score, highScore, onGameOver]);

  return (
    <div className="relative w-full max-w-[620px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>{score.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-400">
            High Score: <span className="text-cyan-400 font-semibold">{highScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-rose-500">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`w-4 h-4 ${i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'}`} />
            ))}
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full flex justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={600}
          height={560}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="w-full h-auto max-h-[560px] object-contain block cursor-ew-resize"
        />

        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h2 className="text-3xl font-black text-amber-400 mb-2">NEON BRICK BUSTER</h2>
            <p className="text-slate-300 text-xs max-w-xs mb-6">
              Deflect the plasma ball, shatter glowing crystal bricks, and prevent the ball from dropping!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5 fill-current" /> Launch Ball
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-black text-rose-500 mb-2">ALL LIVES LOST</h3>
            <p className="text-slate-400 text-xs mb-4">Final Score: {score.toLocaleString()}</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Retry
            </button>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-black text-emerald-400 mb-2">STAGE CLEARED!</h3>
            <p className="text-slate-300 text-xs mb-4">You destroyed every neon brick in the arena!</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Next Level
            </button>
          </div>
        )}
      </div>

      <div className="w-full py-2 bg-slate-900 text-center text-xs text-slate-400 border-t border-slate-800">
        Move Mouse or Use ← / → Arrow Keys to Steer Paddle
      </div>
    </div>
  );
};
