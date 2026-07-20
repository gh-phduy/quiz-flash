'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { updateDisplayName } from '@/actions/profile';
import { toast } from 'sonner';

interface EditDisplayNameProps {
  currentName: string;
}

export default function EditDisplayName({ currentName }: EditDisplayNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === currentName) {
      setIsEditing(false);
      return;
    }
    
    setIsLoading(true);
    const result = await updateDisplayName(name.trim());
    if (result.success) {
      toast.success('Cập nhật tên hiển thị thành công!');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Có lỗi xảy ra khi cập nhật tên hiển thị');
    }
    setIsLoading(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#4255ff] text-xl font-bold max-w-[250px]"
          autoFocus
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-1.5 bg-[#4255ff] text-white font-semibold text-sm rounded-lg hover:bg-[#4255ff]/80 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setName(currentName);
            setIsEditing(false);
          }}
          disabled={isLoading}
          className="px-4 py-1.5 bg-white/10 text-white font-semibold text-sm rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3 group">
      {currentName}
      <button
          onClick={() => setIsEditing(true)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white cursor-pointer"
          title="Edit Display Name"
        >
        <Pencil className="w-5 h-5" />
      </button>
    </h1>
  );
}
