import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Lấy 5 thẻ ngẫu nhiên đã học của user
    const { data: reviews } = await supabase
      .from('card_reviews')
      .select('id')
      .eq('user_id', user.id)
      .limit(5);

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ 
        message: 'Bạn chưa học thẻ nào cả! Hãy vào chế độ Learn hoặc Flashcards học thử vài thẻ trước, sau đó f5 lại link này nhé.' 
      });
    }

    const reviewIds = reviews.map(r => r.id);

    // Cập nhật next_review_date về ngày hôm qua để ép nó tới hạn (due)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const { error } = await supabase
      .from('card_reviews')
      .update({ next_review_date: dateStr })
      .in('id', reviewIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã ép ${reviewIds.length} thẻ thành tới hạn (due today). Hãy quay lại trang chủ (Home) để xem banner!`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
