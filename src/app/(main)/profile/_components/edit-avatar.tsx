'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Check, X, RefreshCw, Upload, Trash2, Link as LinkIcon } from 'lucide-react';
import { updateAvatarUrl } from '@/actions/profile';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/user-avatar';
import { createClient } from '@/utils/supabase/client';

interface EditAvatarProps {
  currentUrl: string;
  userId: string;
}

export default function EditAvatar({ currentUrl, userId }: EditAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [isResetToDefault, setIsResetToDefault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setPreviewUrl(currentUrl || null);
    setSelectedFile(null);
    setCustomUrl('');
    setIsResetToDefault(false);
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh tối đa là 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsResetToDefault(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomUrl(val);
    setSelectedFile(null);
    setIsResetToDefault(false);
    setPreviewUrl(val.trim() || null);
  };

  const handleResetDefault = () => {
    setSelectedFile(null);
    setCustomUrl('');
    setIsResetToDefault(true);
    setPreviewUrl(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let finalAvatarUrl = currentUrl;

      if (isResetToDefault) {
        finalAvatarUrl = '';
      } else if (selectedFile) {
        const supabase = createClient();
        const fileExt = selectedFile.name.split('.').pop() || 'png';
        const fileName = `avatars/${userId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('flashcard-images')
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) {
          throw new Error('Lỗi tải ảnh lên Supabase: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('flashcard-images')
          .getPublicUrl(fileName);

        finalAvatarUrl = publicUrl;
      } else if (customUrl.trim()) {
        finalAvatarUrl = customUrl.trim();
      }

      const result = await updateAvatarUrl(finalAvatarUrl);

      if (result.success) {
        toast.success('Cập nhật avatar thành công!');
        setIsOpen(false);
      } else {
        toast.error(result.error || 'Cập nhật avatar thất bại');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="absolute bottom-0 right-0 p-2 sm:p-2.5 rounded-full bg-[#4255ff] hover:bg-[#5b6aff] text-white shadow-lg transition-transform hover:scale-105 cursor-pointer z-10"
        title="Đổi ảnh đại diện"
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
            
            <h2 className="text-xl font-bold text-white mb-6 text-center">Đổi ảnh đại diện</h2>
            
            <div className="flex justify-center mb-6">
              <div className="w-28 h-28 rounded-full border-4 border-[#b892ff] bg-slate-800 overflow-hidden relative shadow-[0_0_25px_rgba(184,146,255,0.4)] mx-auto flex items-center justify-center">
                <UserAvatar 
                  src={previewUrl} 
                  alt="Preview Avatar" 
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Actions: Upload or URL or Reset */}
            <div className="space-y-3 mb-6">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#b892ff]" />
                Tải ảnh từ máy tính
              </button>

              <div className="relative">
                <input
                  type="url"
                  placeholder="Hoặc dán URL hình ảnh..."
                  value={customUrl}
                  onChange={handleUrlChange}
                  disabled={isLoading}
                  className="w-full py-2 px-3 pl-9 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#b892ff]"
                />
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {previewUrl && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  disabled={isLoading}
                  className="w-full py-2 px-3 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Sử dụng ảnh mặc định
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#4255ff] to-[#6b7bff] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Lưu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

