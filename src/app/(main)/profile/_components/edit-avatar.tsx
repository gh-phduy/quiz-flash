'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Shuffle, Check, X, RefreshCw } from 'lucide-react';
import { updateAvatarUrl } from '@/actions/profile';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/user-avatar';

interface EditAvatarProps {
  currentUrl: string;
  userId: string;
}

export default function EditAvatar({ currentUrl, userId }: EditAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewSeed, setPreviewSeed] = useState(userId);
  const [previewStyle, setPreviewStyle] = useState('avataaars');

  const STYLES = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'notionists', 'pixel-art'];

  const getPreviewUrl = () => {
    return `https://api.dicebear.com/7.x/${previewStyle}/svg?seed=${previewSeed}`;
  };

  const handleShuffle = () => {
    // Random string for seed
    const randomSeed = Math.random().toString(36).substring(7);
    setPreviewSeed(randomSeed);
    
    // Random style
    const randomStyle = STYLES[Math.floor(Math.random() * STYLES.length)];
    setPreviewStyle(randomStyle);
  };

  const handleSave = async () => {
    setIsLoading(true);
    const newUrl = getPreviewUrl();
    const result = await updateAvatarUrl(newUrl);
    
    if (result.success) {
      toast.success('Avatar updated successfully!');
      setIsOpen(false);
    } else {
      toast.error(result.error || 'Failed to update avatar');
    }
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-0 right-0 p-2 sm:p-2.5 rounded-full bg-[#4255ff] hover:bg-[#5b6aff] text-white shadow-lg transition-transform hover:scale-105 cursor-pointer z-10"
        title="Change Avatar"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0c0d28] border border-[#b892ff]/30 p-6 rounded-3xl shadow-2xl w-full max-w-sm relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6 text-center">Customize Avatar</h2>
            
            <div className="flex justify-center mb-8 relative">
              <div className="w-32 h-32 rounded-full border-4 border-[#b892ff] bg-gray-900 overflow-hidden relative shadow-[0_0_25px_rgba(184,146,255,0.4)] mx-auto">
                <UserAvatar 
                  src={getPreviewUrl()} 
                  alt="Preview Avatar" 
                  fallbackSeed={previewSeed}
                  className="w-full h-full"
                />
              </div>
              <button
                onClick={handleShuffle}
                disabled={isLoading}
                className="absolute bottom-0 right-8 bg-amber-400 hover:bg-amber-500 text-amber-950 p-3 rounded-full shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                title="Randomize"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#4255ff] to-[#6b7bff] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
