export interface ReviewCard {
  id: string; // card_review.id
  card_id: string;
  easiness_factor: number;
  repetitions: number;
  interval_days: number;
  next_review_date: string;
  card: {
    id: string;
    set_id: string;
    term: string;
    definition: string;
    phonetic?: string;
    part_of_speech?: string;
  };
}

export interface ReviewGameProps {
  cards: ReviewCard[];
}
