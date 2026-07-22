import { z } from 'zod';

export const cardSchema = z.object({
  id: z.string(),
  term: z.string().min(1, 'Term is required'),
  definition: z.string().min(1, 'Definition is required'),
  image_url: z.string().nullable().refine((val) => val !== null, 'Image is required'),
  phonetic: z.string().nullable().optional(),
  part_of_speech: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
});

export const setSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  cards: z.array(cardSchema).min(2, 'You need two cards to create a set.'),
});

export type FormErrors = {
  title?: string;
  cards?: Record<string, { term?: string; definition?: string; image?: string }>;
  general?: string;
};

export interface CardItem {
  id: string;
  term: string;
  definition: string;
  image_url: string | null;
  image_file?: File | null; // Lưu trữ file thực tế để upload sau khi ấn Create
  phonetic?: string | null;
  part_of_speech?: string | null;
  audio_url?: string | null;
}

