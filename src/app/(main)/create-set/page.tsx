'use client';

import React, { useState, useCallback } from 'react';
import { 
  Search,
  Plus, 
  Globe, 
  Lock, 
  Trash2, 
  Settings, 
  Keyboard,
  Loader2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { setSchema, FormErrors, CardItem } from '@/shared/types/set';
import { FlashcardItem } from './_components/FlashcardItem';
import { fetchWordData } from '@/lib/dictionary';
import { Wand2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export default function CreateSetPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<CardItem[]>([
    { id: 'card-1', term: '', definition: '', image_url: null, image_file: null, phonetic: null, audio_url: null },
    { id: 'card-2', term: '', definition: '', image_url: null, image_file: null, phonetic: null, audio_url: null },
  ]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = cards.filter(card => 
    card.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
    card.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCards((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Thêm thẻ mới
  const handleAddCard = () => {
    const newId = `card-${Math.random().toString(36).substring(2, 9)}`;
    setCards([{ id: newId, term: '', definition: '', image_url: null, image_file: null, phonetic: null, audio_url: null }, ...cards]);
  };

  // Xóa thẻ
  const handleDeleteCard = useCallback((id: string) => {
    setCards(prev => {
      if (prev.length <= 2) return prev;
      const cardToDelete = prev.find(c => c.id === id);
      if (cardToDelete?.image_url?.startsWith('blob:')) {
        URL.revokeObjectURL(cardToDelete.image_url);
      }
      return prev.filter(card => card.id !== id);
    });
  }, []);

  // Cập nhật giá trị input
  const handleCardChange = useCallback((id: string, field: keyof CardItem, value: any) => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, [field]: value } : card));
    
    const errorKey = field === 'image_url' ? 'image' : (field === 'term' || field === 'definition' ? field : null);
    if (errorKey) {
      setErrors(prev => {
        if (!prev.cards?.[id]?.[errorKey]) return prev;
        return {
          ...prev,
          cards: {
            ...prev.cards,
            [id]: {
              ...prev.cards?.[id],
              [errorKey]: undefined
            }
          }
        };
      });
    }
  }, []);

  const handleBulkAutoFill = async () => {
    const cardsToUpdate = cards.filter(c => c.term && (!c.phonetic || !c.part_of_speech));
    if (cardsToUpdate.length === 0) {
      toast.info("Không có thẻ nào cần điền phiên âm hoặc từ loại.");
      return;
    }

    toast.loading(`Đang điền dữ liệu cho ${cardsToUpdate.length} thẻ...`, { id: 'bulk-phonetic' });
    let successCount = 0;

    const newCards = [...cards];
    
    // Process in small batches or one by one to not overwhelm the API
    for (let i = 0; i < cardsToUpdate.length; i++) {
      const card = cardsToUpdate[i];
      const data = await fetchWordData(card.term);
      
      if (data && (data.phonetic || data.partOfSpeech || data.audioUrl)) {
        const index = newCards.findIndex(c => c.id === card.id);
        if (index !== -1) {
          newCards[index] = {
            ...newCards[index],
            phonetic: data.phonetic || newCards[index].phonetic,
            part_of_speech: data.partOfSpeech || newCards[index].part_of_speech,
            audio_url: data.audioUrl || newCards[index].audio_url
          };
          successCount++;
        }
      }
    }

    setCards(newCards);
    toast.dismiss('bulk-phonetic');
    toast.success(`Đã tự động điền dữ liệu cho ${successCount}/${cardsToUpdate.length} thẻ!`);
  };

  // Xử lý tệp hình ảnh được chọn, dán hoặc kéo thả vào thẻ
  const handleFileSelect = useCallback((id: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    // Khởi tạo URL xem trước tạm thời ngay trên trình duyệt (local)
    const previewUrl = URL.createObjectURL(file);

    setCards(prev => prev.map(card => {
      if (card.id === id) {
        // Dọn dẹp URL cũ nếu trước đó đã chọn ảnh khác
        if (card.image_url && card.image_url.startsWith('blob:')) {
          URL.revokeObjectURL(card.image_url);
        }
        return { ...card, image_url: previewUrl, image_file: file };
      }
      return card;
    }));

    setErrors(prev => {
      if (!prev.cards?.[id]?.image) return prev;
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [id]: {
            ...prev.cards?.[id],
            image: undefined
          }
        }
      };
    });
  }, []);

  // Tải ảnh lên qua file input
  const handleImageUpload = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(id, file);
    }
    // Reset input value để có thể chọn lại chính file đó nếu vừa xóa
    e.target.value = '';
  }, [handleFileSelect]);

  // Xóa ảnh đã chọn
  const handleRemoveImage = useCallback((id: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === id) {
        if (card.image_url && card.image_url.startsWith('blob:')) {
          URL.revokeObjectURL(card.image_url);
        }
        return { ...card, image_url: null, image_file: null };
      }
      return card;
    }));
  }, []);

  // Chọn ảnh từ gợi ý bên ngoài (Pexels)
  const handleExternalImageSelect = useCallback((id: string, imageUrl: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === id) {
        if (card.image_url && card.image_url.startsWith('blob:')) {
          URL.revokeObjectURL(card.image_url);
        }
        return { ...card, image_url: imageUrl, image_file: null };
      }
      return card;
    }));

    setErrors(prev => {
      if (!prev.cards?.[id]?.image) return prev;
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [id]: {
            ...prev.cards?.[id],
            image: undefined
          }
        }
      };
    });
  }, []);

  // Hàm xử lý lưu toàn bộ (Sẽ chạy upload sau)
  const handleCreateSet = async () => {
    const result = setSchema.safeParse({ title, description, cards });
    
    if (!result.success) {
      const formattedErrors: FormErrors = { cards: {} };
      
      result.error.issues.forEach(issue => {
        if (issue.path[0] === 'title') {
          formattedErrors.title = issue.message;
        } else if (issue.path[0] === 'cards' && typeof issue.path[1] === 'number') {
          const cardIndex = issue.path[1];
          const cardId = cards[cardIndex].id;
          const field = issue.path[2] as 'term' | 'definition' | 'image_url';
          
          if (!formattedErrors.cards) formattedErrors.cards = {};
          if (!formattedErrors.cards[cardId]) formattedErrors.cards[cardId] = {};
          
          if (field === 'term') formattedErrors.cards[cardId].term = issue.message;
          if (field === 'definition') formattedErrors.cards[cardId].definition = issue.message;
          if (field === 'image_url') formattedErrors.cards[cardId].image = issue.message;
        } else if (issue.path[0] === 'cards' && issue.message) {
          formattedErrors.general = issue.message;
        }
      });
      
      setErrors(formattedErrors);
      return;
    }

    setErrors({}); // Xóa lỗi nếu pass
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // 1. Kiểm tra User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập để tạo bộ từ vựng.");

      // 2. Insert vào bảng sets
      const { data: setRow, error: setError } = await supabase
        .from('sets')
        .insert({
          title,
          description,
          is_public: true,
          user_id: user.id
        })
        .select()
        .single();

      if (setError) throw setError;
      const setId = setRow.id;

      // 3. Upload ảnh (nếu có) và chuẩn bị dữ liệu cards
      const cardsToInsert = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        let finalImageUrl = card.image_url;

        // Bỏ qua các URL blob vì nó là local preview
        if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
            finalImageUrl = null;
        }

        if (card.image_file) {
          const fileExt = card.image_file.name.split('.').pop();
          const fileName = `${setId}/${card.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('flashcard-images') // Bucket name
            .upload(fileName, card.image_file);
            
          if (uploadError) throw new Error("Lỗi tải ảnh: " + uploadError.message);
          
          const { data: { publicUrl } } = supabase.storage.from('flashcard-images').getPublicUrl(fileName);
          finalImageUrl = publicUrl;
        }

        cardsToInsert.push({
          set_id: setId,
          term: card.term,
          definition: card.definition,
          image_url: finalImageUrl,
          order_index: i,
          phonetic: card.phonetic,
          part_of_speech: card.part_of_speech,
          audio_url: card.audio_url
        });
      }

      // 4. Insert toàn bộ cards
      let { error: cardsError } = await supabase
        .from('cards')
        .insert(cardsToInsert);

      // Nếu cơ sở dữ liệu Supabase chưa tạo cột part_of_speech, tự động fallback lưu không có part_of_speech
      if (cardsError && (cardsError.message?.includes('part_of_speech') || (cardsError as any).details?.includes('part_of_speech'))) {
        const fallbackCards = cardsToInsert.map(({ part_of_speech, ...rest }) => rest);
        const { error: retryError } = await supabase
          .from('cards')
          .insert(fallbackCards);
        cardsError = retryError;
      }

      if (cardsError) throw cardsError;

      toast.success("Thành công!", {
        description: "Bộ từ vựng đã được lưu an toàn trên Supabase.",
      });

      // Tùy chọn: Reset form hoặc chuyển hướng sau khi lưu thành công
    } catch (error: any) {
      console.error("Create set error:", error?.message || error);
      toast.error("Thất bại!", {
        description: error?.message || "Đã xảy ra lỗi không xác định.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground font-sans selection:bg-[#4255ff] selection:text-foreground pb-24">
      {/* Main Content */}
      <main className="mx-auto max-w-[1000px] px-4 py-8 lg:px-8">
        
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-[28px] font-bold text-foreground">Create a new flashcard set</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCreateSet}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full bg-card text-foreground text-sm font-bold hover:bg-[#3a466a] transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </button>
            <button 
              onClick={handleCreateSet}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full bg-[#4255ff] text-foreground text-sm font-bold hover:bg-[#5b6aff] transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create and practice
            </button>
          </div>
        </div>

        {/* Visibility Setting */}
        <div className="mb-8">
          <button className="flex items-center px-4 py-1.5 rounded-full bg-card text-foreground text-sm font-bold hover:bg-[#3a466a] transition-colors">
            <Globe className="mr-2 h-4 w-4" /> Public
          </button>
        </div>

        {/* Title & Description Inputs */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="relative group flex flex-col gap-1">
            <input 
              type="text" 
              placeholder="Title" 
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              className={`w-full bg-card border-b-[3px] ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-white'} rounded-lg px-4 py-4 text-foreground placeholder-[#939bb4] outline-none font-semibold text-lg transition-colors focus:bg-[#3a466a]`} 
            />
            {errors.title && <span className="text-red-500 text-[13px] font-bold ml-1">{errors.title}</span>}
          </div>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Add a description..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-card border-b-[3px] border-transparent focus:border-white rounded-lg px-4 py-4 text-foreground placeholder-[#939bb4] outline-none text-base transition-colors focus:bg-[#3a466a]" 
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAddCard}
              className="flex items-center px-4 py-2 rounded-full bg-[#4255ff] text-white text-sm font-bold hover:bg-[#5b6aff] transition-colors cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" /> Add card
            </button>
            <button 
              onClick={handleBulkAutoFill}
              className="flex items-center px-4 py-2 rounded-full bg-card text-[#4255ff] text-sm font-bold hover:bg-[#3a466a] transition-colors cursor-pointer"
            >
              <Wand2 className="mr-2 h-4 w-4" /> Auto-fill Phonetics
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {isSearching ? (
              <div className="flex items-center bg-card rounded-full h-10 px-4 w-64 border-[1px] border-[#3a466a] focus-within:border-white transition-colors">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-foreground w-full"
                  autoFocus
                />
                <button 
                  onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                  className="text-muted-foreground hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearching(true)}
                className="h-10 w-10 rounded-full bg-card flex items-center justify-center hover:bg-[#3a466a] transition-colors cursor-pointer"
              >
                <Search className="h-5 w-5 text-foreground" />
              </button>
            )}
            <button 
              onClick={() => setCards([{ id: 'card-1', term: '', definition: '', image_url: null, image_file: null, phonetic: null, audio_url: null }])}
              className="h-10 w-10 rounded-full bg-[#ff4242]/20 flex items-center justify-center hover:bg-[#ff4242]/30 transition-colors cursor-pointer"
            >
              <Trash2 className="h-5 w-5 text-[#ff4242]" />
            </button>
          </div>
        </div>

        {/* Flashcard List */}
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={filteredCards.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-5 mb-10">
              {filteredCards.map((card) => (
                <FlashcardItem
                  key={card.id}
                  card={card}
                  index={cards.indexOf(card)}
                  error={errors.cards?.[card.id]}
                  canDelete={cards.length > 2}
                  onDelete={handleDeleteCard}
                  onChange={handleCardChange}
                  onImageUpload={handleImageUpload}
                  onFileSelect={handleFileSelect}
                  onRemoveImage={handleRemoveImage}
                  onExternalImageSelect={handleExternalImageSelect}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>



      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-6 right-8 flex items-center gap-3 z-30">
        <button 
          onClick={handleCreateSet}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-full bg-card text-foreground text-sm font-bold shadow-lg hover:bg-[#3a466a] transition-colors disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create
        </button>
        <button 
          onClick={handleCreateSet}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-full bg-[#4255ff] text-foreground text-sm font-bold hover:bg-[#5b6aff] shadow-lg transition-colors disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create and practice
        </button>
      </div>
    </div>
  );
}
