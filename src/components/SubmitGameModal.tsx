import React, { useState } from 'react';
import { GameCategory, GameItem } from '../types';
import { X, Code2, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmitGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitGame: (newGame: GameItem) => void;
}

export const SubmitGameModal: React.FC<SubmitGameModalProps> = ({
  isOpen,
  onClose,
  onSubmitGame,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GameCategory>('Arcade');
  const [description, setDescription] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [developer, setDeveloper] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGame: GameItem = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      slug: title.trim().toLowerCase().replace(/\s+/g, '-'),
      category,
      description: description.trim() || 'Exciting HTML5 custom game uploaded by creator.',
      instructions: 'Use keyboard and mouse to play this game.',
      thumbnail:
        thumbnail.trim() ||
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      embedUrl: embedUrl.trim() || undefined,
      rating: 4.8,
      votes: 1,
      plays: 10,
      trending: true,
      isNew: true,
      tags: ['Custom', 'HTML5', category],
      controls: [
        { key: 'Mouse', action: 'Interact / Aim' },
        { key: 'Keys', action: 'Move / Action' },
      ],
      developer: developer.trim() || 'Independent Studio',
      releaseDate: '2025',
    };

    onSubmitGame(newGame);
    setSuccess(true);
    confetti({ particleCount: 50, spread: 60 });
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0F0C29]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-white uppercase font-display tracking-tight">Developer Game Submission</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-black text-white uppercase font-display">Game Successfully Added!</h4>
              <p className="text-xs text-slate-300">Your game is now available in the portal catalog.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Game Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyber Rush 3D"
                  className="w-full bg-indigo-950/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GameCategory)}
                    className="w-full bg-indigo-950/50 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="Action" className="bg-[#0F0C29]">Action</option>
                    <option value="Arcade" className="bg-[#0F0C29]">Arcade</option>
                    <option value="Racing" className="bg-[#0F0C29]">Racing</option>
                    <option value="Puzzle" className="bg-[#0F0C29]">Puzzle</option>
                    <option value="Shooting" className="bg-[#0F0C29]">Shooting</option>
                    <option value="Sports" className="bg-[#0F0C29]">Sports</option>
                    <option value="Strategy" className="bg-[#0F0C29]">Strategy</option>
                    <option value="Casual" className="bg-[#0F0C29]">Casual</option>
                    <option value="Retro" className="bg-[#0F0C29]">Retro</option>
                    <option value="2 Player" className="bg-[#0F0C29]">2 Player</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Studio / Dev Name</label>
                  <input
                    type="text"
                    value={developer}
                    onChange={(e) => setDeveloper(e.target.value)}
                    placeholder="e.g. IndieGames Lab"
                    className="w-full bg-indigo-950/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  HTML5 Game Embed / iFrame URL
                </label>
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="https://example.com/my-html5-game/index.html"
                  className="w-full bg-indigo-950/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Poster Image URL (Optional)</label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-indigo-950/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your gameplay, features, and story..."
                  className="w-full bg-indigo-950/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold uppercase tracking-wider rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black uppercase tracking-wider rounded-xl text-xs shadow-lg shadow-yellow-400/30 flex items-center gap-1.5 transition"
                >
                  <PlusCircle className="w-4 h-4" /> Publish to Portal
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
