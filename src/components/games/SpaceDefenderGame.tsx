import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundFX } from '../../utils/soundEffects';
import { Trophy, RefreshCw, Play, Volume2, VolumeX, Shield, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpaceDefenderProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  power?: boolean;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: 'scout' | 'bomber' | 'boss';
  radius: number;
  color: string;
  shootCooldown: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'shield' | 'spread' | 'rapid';
}

export const SpaceDefenderGame: React.FC<SpaceDefenderProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('gd_highscore_space_defender') || 0);
  });
  const [activePowerup, setActivePowerup] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const playerRef = useRef({
    x: 300,
    y: 500,
    vx: 0,
    speed: 6,
    width: 44,
    height: 38,
    shield: false,
    shieldTimer: 0,
    spreadTimer: 0,
    rapidTimer: 0,
    shootCooldown: 0,
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const starsRef = useRef<{ x: number; y: number; size: number; speed: number }[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize stars backdrop
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 600,
        y: Math.random() * 600,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.5,
      });
    }
    starsRef.current = stars;
  }, []);

  const spawnWave = useCallback((currentWave: number) => {
    const enemies: Enemy[] = [];
    const count = 6 + currentWave * 3;
    const isBossWave = currentWave % 5 === 0;

    if (isBossWave) {
      enemies.push({
        x: 300,
        y: 80,
        vx: 2.2,
        vy: 0,
        hp: 30 + currentWave * 10,
        maxHp: 30 + currentWave * 10,
        type: 'boss',
        radius: 40,
        color: '#ec4899',
        shootCooldown: 40,
      });
    }

    for (let i = 0; i < count; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const isBomber = i % 3 === 0;
      enemies.push({
        x: 60 + col * 65,
        y: 40 + row * 50,
        vx: (1 + currentWave * 0.15) * (row % 2 === 0 ? 1 : -1),
        vy: 0.15,
        hp: isBomber ? 2 : 1,
        maxHp: isBomber ? 2 : 1,
        type: isBomber ? 'bomber' : 'scout',
        radius: isBomber ? 16 : 12,
        color: isBomber ? '#f59e0b' : '#06b6d4',
        shootCooldown: Math.floor(Math.random() * 120) + 60,
      });
    }
    enemiesRef.current = enemies;
  }, []);

  const createExplosion = (x: number, y: number, color: string, count = 18) => {
    soundFX.playExplosion();
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = Math.random() * 4 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: Math.random() * 20 + 20,
        color,
        size: Math.random() * 3 + 1.5,
      });
    }
  };

  const startGame = () => {
    playerRef.current = {
      x: 300,
      y: 520,
      vx: 0,
      speed: 6,
      width: 44,
      height: 38,
      shield: false,
      shieldTimer: 0,
      spreadTimer: 0,
      rapidTimer: 0,
      shootCooldown: 0,
    };
    bulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    setScore(0);
    setWave(1);
    setLives(3);
    spawnWave(1);
    setGameState('playing');
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      }
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

    const loop = () => {
      // 1. Clear & draw background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield movement
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Handle Player Movement
      if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
        player.x -= player.speed;
      }
      if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
        player.x += player.speed;
      }
      player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));

      // Player Firing
      const isRapid = player.rapidTimer > 0;
      const cooldownLimit = isRapid ? 6 : 14;
      player.shootCooldown = Math.max(0, player.shootCooldown - 1);

      if ((keysPressed.current[' '] || keysPressed.current['arrowup'] || keysPressed.current['w']) && player.shootCooldown === 0) {
        soundFX.playLaser();
        player.shootCooldown = cooldownLimit;
        if (player.spreadTimer > 0) {
          bulletsRef.current.push(
            { x: player.x, y: player.y - 15, vx: 0, vy: -9, isPlayer: true, power: true },
            { x: player.x - 12, y: player.y - 10, vx: -2.5, vy: -8.5, isPlayer: true, power: true },
            { x: player.x + 12, y: player.y - 10, vx: 2.5, vy: -8.5, isPlayer: true, power: true }
          );
        } else {
          bulletsRef.current.push(
            { x: player.x - 10, y: player.y - 15, vx: 0, vy: -9, isPlayer: true },
            { x: player.x + 10, y: player.y - 15, vx: 0, vy: -9, isPlayer: true }
          );
        }
      }

      // Update Powerup Timers
      if (player.shieldTimer > 0) player.shieldTimer--;
      if (player.spreadTimer > 0) player.spreadTimer--;
      if (player.rapidTimer > 0) player.rapidTimer--;
      player.shield = player.shieldTimer > 0;

      let currentBuff = null;
      if (player.shield) currentBuff = 'Energy Shield';
      else if (player.spreadTimer > 0) currentBuff = 'Triple Plasma';
      else if (player.rapidTimer > 0) currentBuff = 'Hyper Rate';
      setActivePowerup(currentBuff);

      // Draw Player Ship
      ctx.save();
      ctx.translate(player.x, player.y);

      // Engine Thruster Flame
      ctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-8, player.height / 2);
      ctx.lineTo(8, player.height / 2);
      ctx.lineTo(0, player.height / 2 + Math.random() * 12 + 8);
      ctx.closePath();
      ctx.fill();

      // Ship Body (Futuristic Interceptor)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -player.height / 2);
      ctx.lineTo(player.width / 2, player.height / 2);
      ctx.lineTo(player.width / 4, player.height / 3);
      ctx.lineTo(0, player.height / 4);
      ctx.lineTo(-player.width / 4, player.height / 3);
      ctx.lineTo(-player.width / 2, player.height / 2);
      ctx.closePath();
      ctx.fill();

      // Cockpit Glow
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.ellipse(0, -4, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shield Aura
      if (player.shield) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Update & Draw Bullets
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.x += b.vx;
        b.y += b.vy;

        if (b.y < -20 || b.y > canvas.height + 20 || b.x < -20 || b.x > canvas.width + 20) {
          bulletsRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = b.isPlayer ? (b.power ? '#38bdf8' : '#34d399') : '#f43f5e';
        ctx.shadowColor = b.isPlayer ? '#38bdf8' : '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        ctx.shadowBlur = 0;
      }

      // 4. Update & Draw PowerUps
      for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
        const p = powerUpsRef.current[i];
        p.y += p.vy;

        if (p.y > canvas.height + 30) {
          powerUpsRef.current.splice(i, 1);
          continue;
        }

        // Draw Powerup Capsule
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.type === 'shield' ? '#38bdf8' : p.type === 'spread' ? '#a855f7' : '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type === 'shield' ? 'S' : p.type === 'spread' ? '3X' : '⚡', 0, 0);
        ctx.restore();

        // Check collision with player
        const dist = Math.hypot(p.x - player.x, p.y - player.y);
        if (dist < 32) {
          soundFX.playPowerup();
          if (p.type === 'shield') player.shieldTimer = 400;
          if (p.type === 'spread') player.spreadTimer = 500;
          if (p.type === 'rapid') player.rapidTimer = 500;
          powerUpsRef.current.splice(i, 1);
        }
      }

      // 5. Update & Draw Enemies
      let changeDir = false;
      enemiesRef.current.forEach((enemy) => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (enemy.x > canvas.width - enemy.radius || enemy.x < enemy.radius) {
          changeDir = true;
        }

        // Enemy shooting
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = Math.floor(Math.random() * 140) + 80;
          if (enemy.type === 'boss') {
            bulletsRef.current.push(
              { x: enemy.x - 20, y: enemy.y + 20, vx: -1.5, vy: 4.5, isPlayer: false },
              { x: enemy.x, y: enemy.y + 25, vx: 0, vy: 5, isPlayer: false },
              { x: enemy.x + 20, y: enemy.y + 20, vx: 1.5, vy: 4.5, isPlayer: false }
            );
          } else {
            bulletsRef.current.push({ x: enemy.x, y: enemy.y + 12, vx: 0, vy: 4.5, isPlayer: false });
          }
        }

        // Draw Enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = enemy.color;

        if (enemy.type === 'boss') {
          // Boss Mothership
          ctx.beginPath();
          ctx.ellipse(0, 0, 42, 26, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          // Health Bar
          const hpRatio = enemy.hp / enemy.maxHp;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(-30, -38, 60, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-30, -38, 60 * hpRatio, 6);
        } else if (enemy.type === 'bomber') {
          // Hex Bomber
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const angle = (Math.PI / 3) * s;
            const px = Math.cos(angle) * enemy.radius;
            const py = Math.sin(angle) * enemy.radius;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Scout Triangle
          ctx.beginPath();
          ctx.moveTo(0, enemy.radius);
          ctx.lineTo(enemy.radius, -enemy.radius);
          ctx.lineTo(-enemy.radius, -enemy.radius);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      if (changeDir) {
        enemiesRef.current.forEach((enemy) => {
          enemy.vx = -enemy.vx;
          enemy.y += 12;
        });
      }

      // 6. Bullet Collision with Enemies & Player
      for (let bi = bulletsRef.current.length - 1; bi >= 0; bi--) {
        const b = bulletsRef.current[bi];

        if (b.isPlayer) {
          // Player hit enemy
          for (let ei = enemiesRef.current.length - 1; ei >= 0; ei--) {
            const e = enemiesRef.current[ei];
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < e.radius + 4) {
              e.hp -= b.power ? 2 : 1;
              createExplosion(b.x, b.y, e.color, 6);
              bulletsRef.current.splice(bi, 1);

              if (e.hp <= 0) {
                createExplosion(e.x, e.y, e.color, e.type === 'boss' ? 40 : 16);
                soundFX.playScore();
                const points = e.type === 'boss' ? 500 : e.type === 'bomber' ? 150 : 80;
                setScore((prev) => {
                  const next = prev + points;
                  onScoreUpdate?.(next);
                  return next;
                });

                // Drop powerup randomly
                if (Math.random() < 0.22) {
                  const types: ('shield' | 'spread' | 'rapid')[] = ['shield', 'spread', 'rapid'];
                  powerUpsRef.current.push({
                    x: e.x,
                    y: e.y,
                    vy: 2,
                    type: types[Math.floor(Math.random() * types.length)],
                  });
                }

                enemiesRef.current.splice(ei, 1);
              }
              break;
            }
          }
        } else {
          // Enemy hit player
          const distToPlayer = Math.hypot(b.x - player.x, b.y - player.y);
          if (distToPlayer < 24) {
            bulletsRef.current.splice(bi, 1);
            if (player.shield) {
              player.shield = false;
              player.shieldTimer = 0;
              createExplosion(player.x, player.y, '#38bdf8', 12);
            } else {
              createExplosion(player.x, player.y, '#ef4444', 24);
              setLives((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                  setGameState('gameover');
                  soundFX.playGameOver();
                }
                return next;
              });
            }
          }
        }
      }

      // Check if all enemies cleared -> Next Wave
      if (enemiesRef.current.length === 0) {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
        setWave((prev) => {
          const nextWave = prev + 1;
          spawnWave(nextWave);
          return nextWave;
        });
      }

      // Check if enemies hit bottom -> Game Over
      for (const enemy of enemiesRef.current) {
        if (enemy.y > canvas.height - 40) {
          setGameState('gameover');
          soundFX.playGameOver();
          break;
        }
      }

      // 7. Update & Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, spawnWave, onScoreUpdate]);

  // Handle Game Over High Scores
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('gd_highscore_space_defender', String(score));
        confetti({ particleCount: 80, spread: 100 });
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
    <div className="relative w-full max-w-[620px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-slate-800 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>{score.toLocaleString()}</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800/80 text-blue-300 text-xs font-semibold">
            Wave {wave}
          </div>
          {activePowerup && (
            <div className="flex items-center gap-1 text-xs text-amber-300 font-medium animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>{activePowerup}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Health / Lives Hearts */}
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
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Game Stage */}
      <div className="relative w-full flex justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={600}
          height={560}
          className="w-full h-auto max-h-[560px] object-contain block select-none"
        />

        {/* Start Overlay */}
        {gameState === 'start' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">SPACE DEFENDER 3000</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Defend Earth against hyper-space alien invaders. Collect powerups and destroy enemy motherships!
            </p>
            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transform active:scale-95 transition"
              >
                <Play className="w-5 h-5 fill-current" /> Play Mission
              </button>
            </div>
            <div className="mt-6 text-xs text-slate-400 flex gap-4">
              <span>← / → or A/D to Steer</span>
              <span>•</span>
              <span>Space / Click to Fire</span>
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <h3 className="text-2xl font-bold text-white mb-4">GAME PAUSED</h3>
            <button
              onClick={() => setGameState('playing')}
              className="px-6 py-2.5 bg-cyan-500 text-white font-semibold rounded-xl hover:bg-cyan-400 transition"
            >
              Resume Game
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            <h3 className="text-3xl font-black text-red-500 mb-2">MISSION FAILED</h3>
            <p className="text-slate-400 text-sm mb-4">Your starfighter was destroyed in action</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 w-full max-w-xs mb-6">
              <div className="flex justify-between text-sm py-1 border-b border-slate-800">
                <span className="text-slate-400">Final Score:</span>
                <span className="text-white font-bold">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-slate-800">
                <span className="text-slate-400">Wave Reached:</span>
                <span className="text-cyan-400 font-bold">{wave}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Personal Best:</span>
                <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="w-5 h-5" /> Play Again
            </button>
          </div>
        )}
      </div>

      {/* Touch / Mobile Virtual Controls */}
      <div className="w-full bg-slate-900/80 px-4 py-3 border-t border-slate-800 flex justify-between items-center sm:hidden">
        <div className="flex gap-2">
          <button
            onTouchStart={() => { keysPressed.current['arrowleft'] = true; }}
            onTouchEnd={() => { keysPressed.current['arrowleft'] = false; }}
            className="w-14 h-12 bg-slate-800 active:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center"
          >
            ←
          </button>
          <button
            onTouchStart={() => { keysPressed.current['arrowright'] = true; }}
            onTouchEnd={() => { keysPressed.current['arrowright'] = false; }}
            className="w-14 h-12 bg-slate-800 active:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center"
          >
            →
          </button>
        </div>
        <button
          onTouchStart={() => { keysPressed.current[' '] = true; }}
          onTouchEnd={() => { keysPressed.current[' '] = false; }}
          className="px-6 h-12 bg-red-600 active:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center"
        >
          FIRE
        </button>
      </div>
    </div>
  );
};
