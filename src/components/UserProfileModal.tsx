import React, { useState } from 'react';
import { UserProfile, Achievement } from '../types';
import { ACHIEVEMENTS_LIST } from '../data/gamesData';
import { X, Trophy, Award, Sparkles, Heart, Flame, Shield, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const AVATARS = ['🎮', '🚀', '⚡', '🤖', '👾', '🔥', '🛡️', '👑', '🐉', '🎯'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'scores'>('profile');
  const [editUsername, setEditUsername] = useState(userProfile.username);

  if (!isOpen) return null;

  const nextLevelXP = userProfile.level * 250;
  const progressPercent = Math.min(100, Math.round((userProfile.xp / nextLevelXP) * 100));

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUsername.trim()) {
      onUpdateProfile({ username: editUsername.trim() });
      confetti({ particleCount: 30, spread: 50 });
    }
  };

  const handleSelectAvatar = (avatar: string) => {
    onUpdateProfile({ avatar });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#0F0C29]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-white uppercase font-display tracking-tight">Gamer Profile & Badges</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition ${
              activeTab === 'profile'
                ? 'bg-white/10 text-yellow-400 border-t border-x border-white/10 font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Profile & Avatar
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'achievements'
                ? 'bg-white/10 text-yellow-400 border-t border-x border-white/10 font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Achievements ({userProfile.unlockedAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-xl transition flex items-center gap-1.5 ${
              activeTab === 'scores'
                ? 'bg-white/10 text-yellow-400 border-t border-x border-white/10 font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> High Scores
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Level & XP Card */}
              <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-white/15 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-yellow-400/60 flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-yellow-400/20">
                  {userProfile.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white uppercase">{userProfile.username}</div>
                      <div className="text-xs text-yellow-400 font-bold">Rank: Level {userProfile.level} Champion</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {userProfile.xp} / {nextLevelXP} XP
                    </span>
                  </div>

                  {/* XP Bar */}
                  <div className="w-full bg-black/40 h-2.5 rounded-full mt-2.5 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Edit Username */}
              <form onSubmit={handleSaveUsername} className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Gamer Tag:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="flex-1 bg-indigo-950/50 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black uppercase tracking-wider rounded-xl text-xs transition shadow-md"
                  >
                    Save
                  </button>
                </div>
              </form>

              {/* Pick Avatar */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Choose Avatar:</label>
                <div className="grid grid-cols-5 gap-2.5">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      onClick={() => handleSelectAvatar(av)}
                      className={`p-3 rounded-2xl border text-2xl flex items-center justify-center transition active:scale-95 ${
                        userProfile.avatar === av
                          ? 'bg-yellow-400/20 border-yellow-400 shadow-md shadow-yellow-400/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-3">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const isUnlocked = userProfile.unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isUnlocked
                        ? 'bg-emerald-950/40 border-emerald-400/50'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isUnlocked
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{ach.title}</span>
                          {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-xs text-slate-300">{ach.description}</div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-yellow-400 font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 shrink-0">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'scores' && (
            <div className="space-y-3">
              {Object.keys(userProfile.highScores).length > 0 ? (
                <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
                  {Object.entries(userProfile.highScores).map(([gameId, score]) => (
                    <div key={gameId} className="p-3.5 bg-white/5 flex items-center justify-between">
                      <span className="text-sm font-bold text-white capitalize">
                        {gameId.replace(/-/g, ' ')}
                      </span>
                      <span className="text-sm font-black text-yellow-400 font-mono">
                        {score.toLocaleString()} PTS
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-300 text-xs">
                  Play interactive games to record your high scores!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
