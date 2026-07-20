'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Globe, Lock, Trash2, Keyboard, Loader2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { FlashcardItem } from '@/app/(main)/create-set/_components/FlashcardItem';
import { fetchWordData } from '@/lib/dictionary';
import { Wand2 } from 'lucide-react';
import { setSchema, FormErrors, CardItem } from '@/shared/types/set';
import { checkCollaboratorStatus, requestEditAccess } from '@/actions/collaboration';
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

export default function EditSetForm({ initialSet, initialCards, initialCollabStatus }: { initialSet: any, initialCards: any[], initialCollabStatus: any }) {
  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;
  
  const [title, setTitle] = useState(initialSet.title);
  const [description, setDescription] = useState(initialSet.description || '');
  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [collabStatus, setCollabStatus] = useState<{ isOwner: boolean, isCollaborator: boolean, pendingRequest: boolean } | null>(initialCollabStatus);
  const [isRequesting, setIsRequesting] = useState(false);
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

  // Initial data is passed as props, no need to fetch here

  const handleAddCard = () => {
    const newId = `card-${Math.random().toString(36).substring(2, 9)}`;
    setCards([{ id: newId, term: '', definition: '', image_url: null, image_file: null, phonetic: null, audio_url: null }, ...cards]);
  };

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
    const cardsToUpdate = cards.filter(c => c.term && !c.phonetic);
    if (cardsToUpdate.length === 0) {
      toast.info("Không có thẻ nào cần điền phiên âm.");
      return;
    }

    toast.loading(`Đang điền phiên âm cho ${cardsToUpdate.length} thẻ...`, { id: 'bulk-phonetic' });
    let successCount = 0;

    const newCards = [...cards];
    
    // Process in small batches or one by one to not overwhelm the API
    for (let i = 0; i < cardsToUpdate.length; i++) {
      const card = cardsToUpdate[i];
      const data = await fetchWordData(card.term);
      
      if (data && (data.phonetic || data.audioUrl)) {
        const index = newCards.findIndex(c => c.id === card.id);
        if (index !== -1) {
          newCards[index] = {
            ...newCards[index],
            phonetic: data.phonetic || newCards[index].phonetic,
            audio_url: data.audioUrl || newCards[index].audio_url
          };
          successCount++;
        }
      }
    }

    setCards(newCards);
    toast.dismiss('bulk-phonetic');
    toast.success(`Đã điền phiên âm cho ${successCount}/${cardsToUpdate.length} thẻ!`);
  };

  const handleImageUpload = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setCards(prev => prev.map(card => {
      if (card.id === id) {
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

    e.target.value = '';
  }, []);

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

  const handleUpdateSet = async () => {
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

    setErrors({});
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // 1. Kiểm tra User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Bạn cần đăng nhập để chỉnh sửa bộ từ vựng.");

      // 2. Update bảng sets
      const { error: setError } = await supabase
        .from('sets')
        .update({
          title,
          description,
        })
        .eq('id', setId); // RLS handles the permission check (Owner or Collaborator)

      if (setError) throw setError;

      // 3. Xóa các card cũ trong DB để insert lại
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('set_id', setId);

      if (deleteError) throw deleteError;

      // 4. Upload ảnh mới (nếu có) và chuẩn bị dữ liệu cards
      const cardsToInsert = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        let finalImageUrl = card.image_url;

        // Bỏ qua các URL blob vì nó là local preview (nếu vì lý do nào đó upload lỗi)
        if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
            finalImageUrl = null; 
        }

        if (card.image_file) {
          const fileExt = card.image_file.name.split('.').pop();
          const fileName = `${setId}/${card.id}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('flashcard-images')
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
          audio_url: card.audio_url
        });
      }

      // 5. Insert lại toàn bộ cards
      const { error: cardsError } = await supabase
        .from('cards')
        .insert(cardsToInsert);

      if (cardsError) throw cardsError;

      toast.success("Thành công!", {
        description: "Bộ từ vựng đã được cập nhật.",
      });

      // Chuyển hướng về lại thư viện hoặc trang học
      router.push(`/user/${user.id}`);

    } catch (error: any) {
      console.error("Update set error:", error);
      toast.error("Thất bại!", {
        description: error.message || "Đã xảy ra lỗi không xác định.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (collabStatus && !collabStatus.isOwner && !collabStatus.isCollaborator) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-16 h-16 text-[#4255ff] mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Edit Access Required</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          You are not the owner or a collaborator of this public set. You must request edit access to modify it.
        </p>
        
        {collabStatus.pendingRequest ? (
          <button disabled className="px-6 py-3 bg-[#4255ff]/20 text-[#9fa6ff] font-bold rounded-xl cursor-not-allowed flex items-center">
            Request Pending...
          </button>
        ) : (
          <button 
            onClick={async () => {
              setIsRequesting(true);
              const res = await requestEditAccess(setId);
              if (res.error) {
                toast.error(res.error);
              } else {
                toast.success('Edit request sent to owner!');
                setCollabStatus(prev => prev ? { ...prev, pendingRequest: true } : prev);
              }
              setIsRequesting(false);
            }}
            disabled={isRequesting}
            className="px-6 py-3 bg-[#4255ff] hover:bg-[#5b6aff] text-white font-bold rounded-xl flex items-center transition-colors"
          >
            {isRequesting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Request Edit Access
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground font-sans selection:bg-[#4255ff] selection:text-foreground pb-24">
      {/* Main Content */}
      <main className="mx-auto max-w-[1000px] px-4 py-8 lg:px-8">
        
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-[28px] font-bold text-foreground">Edit flashcard set</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleUpdateSet}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full bg-[#4255ff] text-foreground text-sm font-bold hover:bg-[#5b6aff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save changes
            </button>
          </div>
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
          onClick={handleUpdateSet}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-full bg-[#4255ff] text-foreground text-sm font-bold hover:bg-[#5b6aff] shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save changes
        </button>
      </div>
    </div>
  );
}
