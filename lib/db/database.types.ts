/**
 * Database type definitions generated from SQL schema
 * Source: docker/volumes/db/migrations/20241122131530_create_ai_flashcards_schema.sql
 *
 * This file defines TypeScript types for all tables in the public schema.
 * Use with Supabase client for type-safe database operations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Source type for flashcard provenance (manual vs AI-generated)
export type FlashcardSourceType = "manual" | "ai" | "ai-edited";

export interface Database {
  public: {
    Tables: {
      ai_generations: {
        Row: {
          id: string; // uuid
          user_id: string; // uuid
          input_text: string;
          model_name: string;
          generated_proposals: Json; // jsonb array
          generated_count: number;
          duration_ms: number;
          created_at: string; // timestamptz
        };
        Insert: {
          id?: string;
          user_id: string;
          input_text: string;
          model_name: string;
          generated_proposals?: Json;
          generated_count?: number;
          duration_ms?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          input_text?: string;
          model_name?: string;
          generated_proposals?: Json;
          generated_count?: number;
          duration_ms?: number;
          created_at?: string;
        };
      };
      ai_generations_acceptance: {
        Row: {
          ai_generation_id: string; // uuid, primary key
          user_id: string; // uuid
          accepted_count: number;
          created_at: string; // timestamptz
        };
        Insert: {
          ai_generation_id: string;
          user_id: string;
          accepted_count?: number;
          created_at?: string;
        };
        Update: {
          ai_generation_id?: string;
          user_id?: string;
          accepted_count?: number;
          created_at?: string;
        };
      };
      flashcard_sources: {
        Row: {
          flashcard_source_id: string; // uuid
          user_id: string; // uuid
          source_type: FlashcardSourceType;
          source_id: string | null; // uuid, null for manual
          created_at: string; // timestamptz
        };
        Insert: {
          flashcard_source_id?: string;
          user_id: string;
          source_type: FlashcardSourceType;
          source_id?: string | null;
          created_at?: string;
        };
        Update: {
          flashcard_source_id?: string;
          user_id?: string;
          source_type?: FlashcardSourceType;
          source_id?: string | null;
          created_at?: string;
        };
      };
      flashcards: {
        Row: {
          flashcard_id: string; // uuid
          user_id: string; // uuid
          flashcard_source_id: string; // uuid
          front: string;
          back: string;
          created_at: string; // timestamptz
        };
        Insert: {
          flashcard_id?: string;
          user_id: string;
          flashcard_source_id: string;
          front: string;
          back: string;
          created_at?: string;
        };
        Update: {
          flashcard_id?: string;
          user_id?: string;
          flashcard_source_id?: string;
          front?: string;
          back?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
  };
}

// Helper types for easier access
export type AiGeneration =
  Database["public"]["Tables"]["ai_generations"]["Row"];
export type AiGenerationInsert =
  Database["public"]["Tables"]["ai_generations"]["Insert"];
export type AiGenerationUpdate =
  Database["public"]["Tables"]["ai_generations"]["Update"];

export type AiGenerationAcceptance =
  Database["public"]["Tables"]["ai_generations_acceptance"]["Row"];
export type AiGenerationAcceptanceInsert =
  Database["public"]["Tables"]["ai_generations_acceptance"]["Insert"];
export type AiGenerationAcceptanceUpdate =
  Database["public"]["Tables"]["ai_generations_acceptance"]["Update"];

export type FlashcardSource =
  Database["public"]["Tables"]["flashcard_sources"]["Row"];
export type FlashcardSourceInsert =
  Database["public"]["Tables"]["flashcard_sources"]["Insert"];
export type FlashcardSourceUpdate =
  Database["public"]["Tables"]["flashcard_sources"]["Update"];

export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardInsert =
  Database["public"]["Tables"]["flashcards"]["Insert"];
export type FlashcardUpdate =
  Database["public"]["Tables"]["flashcards"]["Update"];

// Type for AI generated proposal structure (stored in generated_proposals JSONB)
export interface AiFlashcardProposal {
  front: string;
  back: string;
}
