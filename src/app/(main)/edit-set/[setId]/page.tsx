'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Globe, Lock, Trash2, Keyboard, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { setSchema, FormErrors, CardItem } from '@/shared/types/set';
import { FlashcardItem } from '@/app/(main)/create-set/_components/FlashcardItem';

export default function EditSetPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchSet = async () => {
      try {
        const supabase = createClient();
        
        // Fetch set details
        const { data: set, error: setError } = await supabase
          .from('sets')
          .select('*')
          .eq('id', setId)
          .single();
          
        if (setError) throw setError;
        
        setTitle(set.title);
        setDescription(set.description || '');
        
        // Fetch cards
        const { data: fetchedCards, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .eq('set_id', setId)
          .order('order_index', { ascending: true });
          
        if (cardsError) throw cardsError;
        
        if (fetchedCards && fetchedCards.length > 0) {
          const mappedCards: CardItem[] = fetchedCards.map(c => ({
            id: c.id, // Using DB UUID as the temporary ID
            term: c.term,
            definition: c.definition,
            image_url: c.image_url,
            image_file: null
          }));
          setCards(mappedCards);
        } else {
          setCards([
            { id: 'card-1', term: '', definition: '', image_url: null, image_file: null },
            { id: 'card-2', term: '', definition: '', image_url: null, image_file: null },
          ]);
        }
      } catch (error: any) {
        toast.error("Lỗi tải dữ liệu", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (setId) fetchSet();
  }, [setId]);

  const handleAddCard = () => {
    const newId = `card-${Math.random().toString(36).substring(2, 9)}`;
    setCards([...cards, { id: newId, term: '', definition: '', image_url: null, image_file: null }]);
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 2) return;
    const cardToDelete = cards.find(c => c.id === id);
    if (cardToDelete?.image_url?.startsWith('blob:')) {
      URL.revokeObjectURL(cardToDelete.image_url);
    }
    setCards(cards.filter(card => card.id !== id));
  };

  const handleCardChange = (id: string, field: 'term' | 'definition', value: string) => {
    setCards(cards.map(card => card.id === id ? { ...card, [field]: value } : card));
    if (errors.cards?.[id]?.[field]) {
      setErrors(prev => ({
        ...prev,
        cards: {
          ...prev.cards,
          [id]: {
            ...prev.cards?.[id],
            [field]: undefined
          }
        }
      }));
    }
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setCards(cards.map(card => {
      if (card.id === id) {
        if (card.image_url && card.image_url.startsWith('blob:')) {
          URL.revokeObjectURL(card.image_url);
        }
        return { ...card, image_url: previewUrl, image_file: file };
      }
      return card;
    }));

    if (errors.cards?.[id]?.image) {
      setErrors(prev => ({
        ...prev,
        cards: {
          ...prev.cards,
          [id]: {
            ...prev.cards?.[id],
            image: undefined
          }
        }
      }));
    }

    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setCards(cards.map(card => {
      if (card.id === id) {
        if (card.image_url && card.image_url.startsWith('blob:')) {
          URL.revokeObjectURL(card.image_url);
        }
        return { ...card, image_url: null, image_file: null };
      }
      return card;
    }));
  };

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
        .eq('id', setId)
        .eq('user_id', user.id); // Bảo mật: Chỉ sửa được nếu mình là owner

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
          order_index: i
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

  if (isLoading) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center pb-24">
        <Loader2 className="h-10 w-10 animate-spin text-foreground" />
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
            <button className="flex items-center px-4 py-2 rounded-full bg-card text-foreground text-sm font-bold hover:bg-[#3a466a] transition-colors">
              <Plus className="mr-2 h-4 w-4" /> Import
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCards([{ id: 'card-1', term: '', definition: '', image_url: null, image_file: null }])}
              className="h-10 w-10 rounded-full bg-[#ff4242]/20 flex items-center justify-center hover:bg-[#ff4242]/30 transition-colors"
            >
              <Trash2 className="h-5 w-5 text-[#ff4242]" />
            </button>
          </div>
        </div>

        {/* Flashcard List */}
        <div className="flex flex-col gap-5 mb-10">
          {cards.map((card, index) => (
            <FlashcardItem
              key={card.id}
              card={card}
              index={index}
              errors={errors.cards || {}}
              cardsLength={cards.length}
              onDelete={handleDeleteCard}
              onChange={handleCardChange}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
            />
          ))}
        </div>

        {/* Add Card Button */}
        <div className="flex justify-center mb-16">
          <button 
            onClick={handleAddCard}
            className="px-8 py-4 bg-card rounded-full text-foreground font-bold text-[15px] hover:bg-[#3a466a] transition-colors border-b-4 border-[#1a1d28] active:border-b-0 active:translate-y-1 shadow-sm cursor-pointer"
          >
            Add a card
          </button>
        </div>

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
