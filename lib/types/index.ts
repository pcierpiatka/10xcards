// Core application types

/**
 * Flashcard entity
 */
export interface Flashcard {
  id: string;
  userId: string;
  front: string; // Max 300 characters
  back: string; // Max 600 characters
  createdAt: Date;
  updatedAt: Date;
  source: "ai" | "manual";
}

/**
 * User entity (basic structure)
 */
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI generation request
 */
export interface GenerateFlashcardsRequest {
  text: string; // 1000-10000 characters
  maxCards?: number; // Default: 10
}

/**
 * AI generation response
 */
export interface GenerateFlashcardsResponse {
  flashcards: {
    front: string;
    back: string;
  }[];
  generatedCount: number;
}

/**
 * Learning session
 */
export interface LearningSession {
  id: string;
  userId: string;
  flashcardIds: string[];
  currentIndex: number;
  completedAt?: Date;
  createdAt: Date;
}
