import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Lấy 1 thẻ đang due để test update
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: reviews, error: fetchErr } = await supabase
      .from('card_reviews')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review_date', todayStr)
      .limit(1);

    if (fetchErr || !reviews || reviews.length === 0) {
      return NextResponse.json({ 
        message: 'Không tìm thấy thẻ nào đang due để test!',
        fetchErr
      });
    }

    const review = reviews[0];

    // Thử update next_review_date sang ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const updatePayload = {
      next_review_date: tomorrowStr
    };

    const { data: updated, error: updateErr } = await supabase
      .from('card_reviews')
      .update(updatePayload)
      .eq('user_id', user.id)
      .eq('card_id', review.card_id)
      .select('id, next_review_date');

    return NextResponse.json({ 
      success: true, 
      originalReview: review,
      updateAttempt: {
        payload: updatePayload,
        updatedData: updated,
        updateError: updateErr
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
