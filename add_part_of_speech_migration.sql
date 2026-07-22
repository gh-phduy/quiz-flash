-- Migration: Add part_of_speech column to cards table
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS part_of_speech TEXT;
