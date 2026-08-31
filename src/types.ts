export type GameCategory =
  | 'All'
  | 'Action'
  | 'Arcade'
  | 'Racing'
  | 'Puzzle'
  | 'Shooting'
  | 'Sports'
  | 'Strategy'
  | 'Casual'
  | 'Retro'
  | '2 Player';

export interface GameControl {
  key: string;
  action: string;
}

export interface GameItem {
  id: string;
  title: string;
  slug: string;
  category: Exclude<GameCategory, 'All'>;
  tags: string[];
  thumbnail: string;
  backdrop?: string;
  rating: number;
  votes: number;
  plays: number;
  featured?: boolean;
  trending?: boolean;
  isNew?: boolean;
  description: string;
  instructions: string;
  controls: GameControl[];
  embedUrl?: string;
  internalGameType?:
    | 'space_defender'
    | 'snake'
    | '2048'
    | 'flappy'
    | 'tetris'
    | 'brick_breaker'
    | 'drift_racer'
    | 'minesweeper'
    | 'memory_match'
    | 'typing_speed'
    | 'tictactoe'
    | 'whack_mole';
  developer?: string;
  releaseDate?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
}

export interface UserProfile {
  username: string;
  avatar: string;
  xp: number;
  level: number;
  favorites: string[];
  recentlyPlayed: string[];
  highScores: Record<string, number>;
  unlockedAchievements: string[];
  likedGames: string[];
  dislikedGames: string[];
}

export interface GameComment {
  id: string;
  gameId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  rating: number;
  likes: number;
}
