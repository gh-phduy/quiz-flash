import React, { useState, useRef } from 'react';
import { GripHorizontal, Trash2, Image as ImageIcon, Search, Upload, X, Loader2, ClipboardPaste } from 'lucide-react';
import { CardItem, FormErrors } from '@/shared/types/set';
import { fetchWordData } from '@/lib/dictionary';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface FlashcardItemProps {
  card: CardItem;
  index: number;
  error?: { term?: string, definition?: string, image?: string };
  canDelete: boolean;
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof CardItem, value: any) => void;
  onImageUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect?: (id: string, file: File) => void;
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
  onFileSelect,
  onRemoveImage,
  onExternalImageSelect
}: FlashcardItemProps) {

  const [showImageSuggestions, setShowImageSuggestions] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  // Xử lý dán ảnh qua nút "Dán ảnh" sử dụng Clipboard API
  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast.info(`Vui lòng chọn thẻ và nhấn Ctrl + V để dán ảnh vào thẻ #${index + 1}!`);
        return;
      }
      const clipboardItems = await navigator.clipboard.read();
      let foundImage = false;
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const ext = type.split('/')[1] || 'png';
            const file = new File([blob], `pasted-image-${Date.now()}.${ext}`, { type });
            if (onFileSelect) {
              onFileSelect(card.id, file);
              toast.success(`Đã dán ảnh từ bộ nhớ tạm vào thẻ #${index + 1}!`);
            }
            foundImage = true;
            return;
          }
        }
      }
      if (!foundImage) {
        toast.error('Không tìm thấy hình ảnh trong Clipboard. Vui lòng copy/chụp ảnh trước!');
      }
    } catch (err: any) {
      console.error(err);
      toast.info(`Trình duyệt yêu cầu bấm phím Ctrl + V để dán ảnh vào thẻ #${index + 1}!`);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Check clipboard files first
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          if (onFileSelect) {
            onFileSelect(card.id, file);
            toast.success(`Đã dán ảnh thành công cho thẻ #${index + 1}!`);
          }
          return;
        }
      }
    }

    // Check clipboard items for direct screenshot/image data
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            if (onFileSelect) {
              onFileSelect(card.id, file);
              toast.success(`Đã dán ảnh thành công cho thẻ #${index + 1}!`);
            }
            return;
          }
        }
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        if (onFileSelect) {
          onFileSelect(card.id, file);
          toast.success(`Đã nhận ảnh kéo thả cho thẻ #${index + 1}!`);
        }
      } else {
        toast.error('Vui lòng chỉ kéo thả tệp hình ảnh (PNG, JPG, WEBP,...)');
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const executeImageSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setIsLoadingImages(true);
    try {
      const res = await fetch(`/api/images?q=${encodeURIComponent(queryToSearch.trim())}`);
      const data = await res.json();
      setSuggestedImages(data.images || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleSearchImages = () => {
    setShowImageSuggestions(true);
    const query = searchQuery || card.term || '';
    setSearchQuery(query);
    if (query.trim()) {
      executeImageSearch(query);
    }
  };

  const handleTermBlur = async () => {
    if (!card.term) return;
    // Auto fetch if phonetic or part_of_speech is empty
    if (!card.phonetic || !card.part_of_speech) {
      const data = await fetchWordData(card.term);
      if (data) {
        if (data.phonetic && !card.phonetic) onChange(card.id, 'phonetic', data.phonetic);
        if (data.partOfSpeech && !card.part_of_speech) onChange(card.id, 'part_of_speech', data.partOfSpeech);
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
    <div 
      ref={setNodeRef} 
      style={style} 
      onPaste={handlePaste}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`bg-card rounded-xl flex flex-col group relative shadow-sm transition-all duration-200 ${isDraggingOver ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
    >
      {/* Visual Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-blue-600/15 backdrop-blur-[2px] border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center z-30 pointer-events-none animate-in fade-in duration-150">
          <div className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2.5">
            <Upload className="w-5 h-5 animate-bounce" />
            <span>Thả ảnh vào đây để tải lên thẻ #{index + 1}</span>
          </div>
        </div>
      )}

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
            
            {/* Part of Speech Input */}
            <div className="relative w-1/2 ml-4">
              <input 
                type="text" 
                placeholder="POS / Từ loại (optional)" 
                value={card.part_of_speech || ''}
                onChange={(e) => onChange(card.id, 'part_of_speech', e.target.value)}
                className="w-full bg-background/50 border-b border-transparent focus:border-[#4255ff] px-2 py-1 text-muted-foreground text-[13px] outline-none transition-colors"
              />
            </div>
          </div>
        </div>
        
        {/* Image Area: Có 3 ô/nút chọn chuyên biệt: Dán ảnh, Tải ảnh, Tìm online */}
        <div className="w-[110px] flex flex-col gap-1 flex-shrink-0 mt-0 relative">
          <div className={`w-[110px] h-[98px] flex-shrink-0 rounded-xl overflow-hidden relative ${card.image_url ? 'border border-border' : 'border border-[#939bb4]/30 bg-background/40 p-1'} ${error?.image ? 'border-2 border-red-500' : ''}`}>
            <input 
              type="file" 
              id={`file-input-${card.id}`}
              accept="image/*"
              onChange={(e) => onImageUpload(card.id, e)}
              className="hidden"
            />

            {card.image_url ? (
              // Trạng thái đã có ảnh
              <div className="relative w-full h-full rounded-lg overflow-hidden group/image border border-border bg-background">
                <img 
                  src={card.image_url} 
                  alt="Uploaded preview" 
                  className="w-full h-full object-cover"
                />
                <button 
                  type="button"
                  onClick={() => onRemoveImage(card.id)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <div className="bg-card p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-lg">
                    <Trash2 className="h-4 w-4 text-foreground" />
                  </div>
                </button>
              </div>
            ) : (
              // Trạng thái chưa có ảnh: 3 nút chuyên biệt Dán - Tải - Tìm
              <div className="w-full h-full flex flex-col justify-between gap-1 p-0.5">
                {/* Nút 1: Ô Dán ảnh từ Clipboard */}
                <button 
                  type="button"
                  onClick={handlePasteFromClipboard}
                  title="Bấm để dán ảnh đã copy từ Clipboard (hoặc bấm Ctrl+V)"
                  className="flex-1 w-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-md flex items-center justify-center gap-1.5 transition-all text-[11px] font-semibold cursor-pointer"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  <span>Dán ảnh</span>
                </button>

                {/* Nút 2: Tải ảnh từ máy tính */}
                <button 
                  type="button"
                  onClick={() => document.getElementById(`file-input-${card.id}`)?.click()}
                  title="Tải ảnh từ máy tính"
                  className="flex-1 w-full bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-md flex items-center justify-center gap-1.5 transition-all text-[11px] font-semibold cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Tải ảnh</span>
                </button>

                {/* Nút 3: Tìm ảnh online */}
                <button 
                  type="button"
                  onClick={handleSearchImages}
                  title="Tìm kiếm ảnh online"
                  className="flex-1 w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-md flex items-center justify-center gap-1.5 transition-all text-[11px] font-semibold cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Tìm online</span>
                </button>
              </div>
            )}
          </div>

          {!card.image_url && (
            <span className="text-[9px] text-muted-foreground/70 text-center font-medium leading-tight">
              Hoặc kéo thả vào đây
            </span>
          )}

          {error?.image && <span className="text-red-500 text-[10px] font-bold text-center leading-tight">Required</span>}
        </div>

      </div>

      {/* Image Suggestions Panel */}
      {showImageSuggestions && !card.image_url && (
        <div className="bg-card/95 backdrop-blur-md p-4 border-t border-border flex flex-col gap-3 rounded-b-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">Tìm ảnh online:</span>
              <div className="relative flex-1 max-w-sm flex items-center">
                <input
                  type="text"
                  placeholder="Nhập từ khóa cần tìm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      executeImageSearch(searchQuery);
                    }
                  }}
                  className="w-full bg-background border border-border/80 focus:border-blue-500 rounded-lg px-3 py-1 text-xs text-foreground outline-none pr-14"
                />
                <button
                  type="button"
                  onClick={() => executeImageSearch(searchQuery)}
                  className="absolute right-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-0.5 rounded transition-colors"
                >
                  Tìm
                </button>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowImageSuggestions(false)}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex w-full gap-3 items-center h-24 overflow-hidden">
            {isLoadingImages ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm flex-1">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Searching high quality images...
              </div>
            ) : suggestedImages.length > 0 ? (
              <div className="flex gap-2.5 items-center overflow-x-auto flex-1 h-full py-0.5 no-scrollbar">
                {suggestedImages.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onExternalImageSelect?.(card.id, imgUrl);
                      setShowImageSuggestions(false);
                    }}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 hover:scale-105 transition-all shadow-md relative group bg-black/30 cursor-pointer"
                  >
                    <img src={imgUrl} alt="suggestion" className="absolute inset-0 w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground flex-1">
                {searchQuery ? `Khôn tìm thấy ảnh phù hợp với "${searchQuery}".` : 'Nhập từ khóa và bấm Tìm.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
