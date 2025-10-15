/**
 * OpenRouter API client (MOCK implementation for MVP)
 *
 * This is a mock implementation that generates random flashcard proposals
 * without calling the real OpenRouter API.
 *
 * TODO: Replace with real OpenRouter integration when ready to use actual AI
 */

import type { AiProposalDto } from "@/lib/dto/types";

interface GenerateFlashcardsOptions {
  inputText: string;
}

/**
 * Mock OpenRouter client that generates random flashcard proposals
 * Returns 4-7 flashcards with randomized content
 */
export class OpenRouterClient {
  /**
   * Generates flashcard proposals from input text
   * MOCK: Returns random flashcards (4-7) instead of calling OpenRouter
   *
   * @returns Promise with array of flashcard proposals
   */
  async generateFlashcards(): Promise<AiProposalDto[]> {
    // Simulate API delay (200-500ms)
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300)
    );

    // Generate random number of flashcards (4-7)
    const count = 4 + Math.floor(Math.random() * 4);

    const topics = [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "CSS",
      "HTML",
      "API",
      "Database",
      "Git",
    ];

    const frontTemplates = [
      "Co to jest {topic}?",
      "Jak działa {topic}?",
      "Jakie są główne cechy {topic}?",
      "Do czego służy {topic}?",
      "Czym różni się {topic} od innych technologii?",
    ];

    const backTemplates = [
      "{topic} to technologia służąca do tworzenia nowoczesnych aplikacji webowych. Oferuje wydajność i łatwość użycia.",
      "{topic} umożliwia programistom szybkie budowanie skalowalnych rozwiązań z wykorzystaniem najnowszych standardów.",
      "{topic} jest szeroko stosowany w branży IT ze względu na swoją elastyczność i bogatą społeczność.",
      "{topic} zapewnia narzędzia i abstrakcje ułatwiające rozwój aplikacji przy zachowaniu wysokiej jakości kodu.",
      "{topic} to popularne rozwiązanie wspierające efektywny rozwój projektów dzięki intuicyjnemu API.",
    ];

    const proposals: AiProposalDto[] = [];

    for (let i = 0; i < count; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const frontTemplate =
        frontTemplates[Math.floor(Math.random() * frontTemplates.length)];
      const backTemplate =
        backTemplates[Math.floor(Math.random() * backTemplates.length)];

      proposals.push({
        front: frontTemplate.replace("{topic}", topic),
        back: backTemplate.replace("{topic}", topic),
      });
    }

    return proposals;
  }
}
