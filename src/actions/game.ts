'use server';

import { createClient } from '@/utils/supabase/server';

export async function generateGameSession(setId: string, totalCardsToLearn: number) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Tỉ lệ: 45% mức 5, 25% mức 4, 15% mức 3, 10% mức 2, 5% mức 1
    let q5 = Math.round(totalCardsToLearn * 0.45);
    let q4 = Math.round(totalCardsToLearn * 0.25);
    let q3 = Math.round(totalCardsToLearn * 0.15);
    let q2 = Math.round(totalCardsToLearn * 0.10);
    let q1 = totalCardsToLearn - (q5 + q4 + q3 + q2);

    const quotas = [
      { level: 5, quota: q5 },
      { level: 4, quota: q4 },
      { level: 3, quota: q3 },
      { level: 2, quota: q2 },
      { level: 1, quota: q1 },
    ];

    let selectedCards: any[] = [];
    let rolloverQuota = 0;

    for (let i = 0; i < quotas.length; i++) {
      const currentQuota = quotas[i].quota + rolloverQuota;
      
      if (currentQuota <= 0) continue;

      const { data: cards, error } = await supabase.rpc('get_random_cards_by_weakness', {
        p_set_id: setId,
        p_user_id: user.id,
        p_weakness_level: quotas[i].level,
        p_limit: currentQuota
      });

      if (error) {
        console.error('Error fetching cards for level ' + quotas[i].level, error);
        continue;
      }

      if (cards && cards.length > 0) {
        // Filter out cards that are already selected (just in case)
        const uniqueCards = cards.filter((c: any) => !selectedCards.some(sc => sc.id === c.id));
        selectedCards = [...selectedCards, ...uniqueCards];
        
        // Calculate if we got enough cards
        const deficit = currentQuota - uniqueCards.length;
        if (deficit > 0) {
          rolloverQuota = deficit;
        } else {
          rolloverQuota = 0;
        }
      } else {
        rolloverQuota = currentQuota;
      }
    }

    // Nếu lặp hết thác nước từ 5->1 mà vẫn còn thiếu (do bộ thẻ quá ít), ta có thể lặp ngược lại từ 1->5
    // Nhưng vì ta chỉ lấy tối đa totalCardsToLearn, và logic này đã gom gần như hết các thẻ có thể,
    // ta cứ trả về số lượng hiện tại (vì số lượng tối đa không vượt qua tổng số thẻ).
    
    // Xáo trộn lần cuối để không bị tình trạng mức 5 luôn xuất hiện đầu tiên
    const shuffled = selectedCards.sort(() => 0.5 - Math.random());

    return { success: true, cards: shuffled };

  } catch (error: any) {
    console.error('Failed to generate game session:', error);
    return { success: false, error: error.message };
  }
}
