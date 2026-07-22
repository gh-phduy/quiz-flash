import React, { useState } from 'react';
import { GripHorizontal, Trash2, Image as ImageIcon, Search, Upload, X, Loader2 } from 'lucide-react';
import { CardItem, FormErrors } from '@/shared/types/set';
import { fetchWordData } from '@/lib/dictionary';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FlashcardItemProps {
  card: CardItem;
  index: number;
  error?: { term?: string, definition?: string, image?: string };
  canDelete: boolean;
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof CardItem, value: any) => void;
  onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  onExternalImageSelect?: (id: string, url: string) => void;
}

export const FlashcardItem = React.memo(function FlashcardItem({
  card,
  index,
  error,
  canDelete,
  onDelete,
  onChange,
  onImageUpload,
  onRemoveImage,
  onExternalImageSelect
}: FlashcardItemProps) {

  const [showImageSuggestions, setShowImageSuggestions] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  const handleSearchImages = async () => {
    if (!card.term) {
      document.getElementById(`file-input-${card.id}`)?.click();
      return;
    }
    
    setShowImageSuggestions(true);
    setIsLoadingImages(true);
    try {
      const res = await fetch(`/api/images?q=${encodeURIComponent(card.term)}`);
      const data = await res.json();
      setSuggestedImages(data.images || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleTermBlur = async () => {
    if (!card.term) return;
    // Auto fetch if phonetic is empty
    if (!card.phonetic) {
      const data = await fetchWordData(card.term);
      if (data) {
        if (data.phonetic) onChange(card.id, 'phonetic', data.phonetic);
        if (data.audioUrl) onChange(card.id, 'audio_url', data.audioUrl);
      }
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-xl flex flex-col group relative shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#0a092d]/40">
        <span className="font-bold text-foreground">{index + 1}</span>
        <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
          <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground transition-colors cursor-grab touch-none">
            <GripHorizontal className="h-[18px] w-[18px]" />
          </button>
          <button 
            onClick={() => onDelete(card.id)}
            disabled={!canDelete}
            className={`text-muted-foreground transition-colors ${canDelete ? 'hover:text-[#ff4242] cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="flex flex-col md:flex-row gap-6 items-start p-6">
        
        {/* Term Input */}
        <div className="flex-1 flex flex-col w-full">
          <div className="relative flex flex-col gap-1">
            <input 
              type="text" 
              placeholder="Enter term" 
              value={card.term}
              onChange={(e) => onChange(card.id, 'term', e.target.value)}
              onBlur={handleTermBlur}
              className={`w-full bg-background border-b-2 ${error?.term ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-yellow-400'} rounded-t-lg rounded-b-none px-4 py-3 text-foreground placeholder-[#939bb4] outline-none text-[15px] transition-colors`}
            />
            {error?.term && <span className="text-red-500 text-[12px] font-bold px-1">{error?.term}</span>}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground">TERM</span>
            
            {/* Phonetic Input */}
            <div className="relative w-1/2 ml-4">
              <input 
                type="text" 
                placeholder="Phonetic (optional)" 
                value={card.phonetic || ''}
                onChange={(e) => onChange(card.id, 'phonetic', e.target.value)}
                className="w-full bg-background/50 border-b border-transparent focus:border-[#4255ff] px-2 py-1 text-muted-foreground text-[13px] outline-none transition-colors"
              />
            </div>
          </div>
        </div>
        
        {/* Definition Input */}
        <div className="flex-1 flex flex-col w-full">
          <div className="relative flex flex-col gap-1">
            <input 
              type="text" 
              placeholder="Enter definition" 
              value={card.definition}
              onChange={(e) => onChange(card.id, 'definition', e.target.value)}
              className={`w-full bg-background border-b-2 ${error?.definition ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-yellow-400'} rounded-t-lg rounded-b-none px-4 py-3 text-foreground placeholder-[#939bb4] outline-none text-[15px] transition-colors`}
            />
            {error?.definition && <span className="text-red-500 text-[12px] font-bold px-1">{error?.definition}</span>}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground">DEFINITION</span>
          </div>
        </div>
        
        {/* Image Upload Box */}
        <div className="w-[84px] flex flex-col gap-1 flex-shrink-0 mt-0 relative">
          <div className={`w-full aspect-square rounded-lg ${error?.image ? 'border-2 border-red-500' : ''}`}>
            <input 
              type="file" 
              id={`file-input-${card.id}`}
              accept="image/*"
              onChange={(e) => onImageUpload(card.id, e)}
              className="hidden"
            />

            {card.image_url ? (
              // Trạng thái đã tải ảnh lên
              <div className="relative w-full h-full rounded-lg overflow-hidden group/image border border-border bg-background">
                <img 
                  src={card.image_url} 
                  alt="Uploaded preview" 
                  className="w-full h-full object-cover"
                />
                <button 
                  type="button"
                  onClick={() => onRemoveImage(card.id)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <div className="bg-card p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-lg">
                    <Trash2 className="h-3.5 w-3.5 text-foreground" />
                  </div>
                </button>
              </div>
            ) : (
              // Trạng thái trống (Chưa có ảnh)
              <button 
                type="button"
                onClick={handleSearchImages}
                className="w-full h-full border-[2px] border-dashed border-[#939bb4]/60 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-white transition-all bg-background/50 hover:bg-background cursor-pointer"
              >
                <ImageIcon className="h-5 w-5 mb-1" />
                <span className="text-[11px] font-bold">Image</span>
              </button>
            )}
          </div>
          {error?.image && <span className="text-red-500 text-[10px] font-bold text-center leading-tight">Required</span>}
        </div>

      </div>

      {/* Image Suggestions Panel */}
      {showImageSuggestions && !card.image_url && (
        <div className="bg-[#1f2937]/50 p-4 border-t border-[#0a092d]/40 flex flex-col gap-3 rounded-b-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-400" /> Image suggestions for "{card.term}"
            </span>
            <button 
              onClick={() => setShowImageSuggestions(false)}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex w-full gap-3 items-center h-24 overflow-hidden">
            {isLoadingImages ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm flex-1">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching high quality images...
              </div>
            ) : suggestedImages.length > 0 ? (
              <div className="flex gap-2.5 items-center overflow-x-auto flex-1 h-full py-0.5 no-scrollbar">
                {suggestedImages.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onExternalImageSelect?.(card.id, imgUrl);
                      setShowImageSuggestions(false);
                    }}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 hover:scale-105 transition-all shadow-md relative group bg-black/30"
                  >
                    <img src={imgUrl} alt="suggestion" className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground flex-1">No images found.</div>
            )}
            
            <button
              onClick={() => {
                document.getElementById(`file-input-${card.id}`)?.click();
                setShowImageSuggestions(false);
              }}
              className="flex-shrink-0 w-24 h-20 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-white transition-all bg-background/50 hover:bg-background cursor-pointer rounded-lg border-[2px] border-dashed border-[#939bb4]/60 shadow-sm"
            >
              <Upload className="h-5 w-5 mb-1" />
              <span className="text-[11px] font-bold">Upload</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
