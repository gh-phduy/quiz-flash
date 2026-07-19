import React from 'react';
import { GripHorizontal, Trash2, Image as ImageIcon } from 'lucide-react';
import { CardItem, FormErrors } from '@/shared/types/set';

interface FlashcardItemProps {
  card: CardItem;
  index: number;
  errors: FormErrors['cards'];
  cardsLength: number;
  onDelete: (id: string) => void;
  onChange: (id: string, field: 'term' | 'definition', value: string) => void;
  onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function FlashcardItem({
  card,
  index,
  errors,
  cardsLength,
  onDelete,
  onChange,
  onImageUpload,
  onRemoveImage
}: FlashcardItemProps) {
  const cardErrors = errors?.[card.id];

  return (
    <div className="bg-card rounded-xl flex flex-col group relative shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#0a092d]/40">
        <span className="font-bold text-foreground">{index + 1}</span>
        <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
          <button className="text-muted-foreground hover:text-foreground transition-colors cursor-grab">
            <GripHorizontal className="h-[18px] w-[18px]" />
          </button>
          <button 
            onClick={() => onDelete(card.id)}
            disabled={cardsLength <= 2}
            className={`text-muted-foreground transition-colors ${cardsLength > 2 ? 'hover:text-[#ff4242] cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
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
              className={`w-full bg-background border-b-2 ${cardErrors?.term ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-yellow-400'} rounded-t-lg rounded-b-none px-4 py-3 text-foreground placeholder-[#939bb4] outline-none text-[15px] transition-colors`}
            />
            {cardErrors?.term && <span className="text-red-500 text-[12px] font-bold px-1">{cardErrors?.term}</span>}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground">TERM</span>
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
              className={`w-full bg-background border-b-2 ${cardErrors?.definition ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-yellow-400'} rounded-t-lg rounded-b-none px-4 py-3 text-foreground placeholder-[#939bb4] outline-none text-[15px] transition-colors`}
            />
            {cardErrors?.definition && <span className="text-red-500 text-[12px] font-bold px-1">{cardErrors?.definition}</span>}
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground">DEFINITION</span>
          </div>
        </div>
        
        {/* Image Upload Box */}
        <div className="w-[84px] flex flex-col gap-1 flex-shrink-0 mt-0 relative">
          <div className={`w-full h-[64px] rounded-lg ${cardErrors?.image ? 'border-2 border-red-500' : ''}`}>
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
                onClick={() => document.getElementById(`file-input-${card.id}`)?.click()}
                className="w-full h-full border-[2px] border-dashed border-[#939bb4]/60 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-white transition-all bg-background/50 hover:bg-background cursor-pointer"
              >
                <ImageIcon className="h-5 w-5 mb-1" />
                <span className="text-[11px] font-bold">Image</span>
              </button>
            )}
          </div>
          {cardErrors?.image && <span className="text-red-500 text-[10px] font-bold text-center leading-tight">Required</span>}
        </div>

      </div>
    </div>
  );
}
