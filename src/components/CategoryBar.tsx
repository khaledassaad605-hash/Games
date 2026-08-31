import React from 'react';
import { GameCategory } from '../types';
import {
  Flame,
  Swords,
  Gamepad2,
  Car,
  Puzzle,
  Target,
  Trophy,
  Brain,
  Coffee,
  History,
  Users,
  Sparkles,
} from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: GameCategory;
  onSelectCategory: (cat: GameCategory) => void;
  gameCounts: Record<GameCategory, number>;
}

interface CategoryItem {
  id: GameCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'All', name: 'All Games', icon: Sparkles },
  { id: 'Action', name: 'Action', icon: Swords },
  { id: 'Arcade', name: 'Arcade', icon: Gamepad2 },
  { id: 'Racing', name: 'Racing', icon: Car },
  { id: 'Puzzle', name: 'Puzzle', icon: Puzzle },
  { id: 'Shooting', name: 'Shooting', icon: Target },
  { id: 'Sports', name: 'Sports', icon: Trophy },
  { id: 'Strategy', name: 'Strategy', icon: Brain },
  { id: 'Casual', name: 'Casual', icon: Coffee },
  { id: 'Retro', name: 'Retro Classics', icon: History },
  { id: '2 Player', name: '2 Player', icon: Users },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  gameCounts,
}) => {
  return (
    <div className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 py-3.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = gameCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-yellow-400 text-indigo-950 shadow-lg shadow-yellow-400/30'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/15 border border-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-950' : 'text-slate-400'}`} />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                    isSelected ? 'bg-indigo-950/20 text-indigo-950' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
