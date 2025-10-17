"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AiGeneratorFormProps {
  isGenerating: boolean;
  onSubmit: (text: string) => void;
}

/**
 * AiGeneratorForm - Form for generating flashcards from text using AI
 * Validates input length (1000-10000 chars) and shows character counter
 */
export function AiGeneratorForm({
  isGenerating,
  onSubmit,
}: AiGeneratorFormProps) {
  const [inputText, setInputText] = useState("");

  const MIN_CHARS = 1000;
  const MAX_CHARS = 10000;

  const charCount = inputText.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;
  const isTooLong = charCount > MAX_CHARS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isGenerating) {
      onSubmit(inputText);
    }
  };

  // Character counter color logic
  const getCounterColor = () => {
    if (isTooLong) return "text-destructive";
    if (isTooShort) return "text-muted-foreground";
    if (isValid) return "text-green-600";
    return "text-muted-foreground";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ai-input" className="mb-2 block text-sm font-medium">
          Wklej tekst do wygenerowania fiszek
        </label>
        <Textarea
          id="ai-input"
          placeholder="Wklej tutaj tekst (min. 1000 znaków)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isGenerating}
          className="min-h-[200px] resize-y"
          aria-describedby="char-counter"
        />
        <div
          id="char-counter"
          className={`mt-2 text-right text-sm ${getCounterColor()}`}
          aria-live="polite"
        >
          {charCount} / {MIN_CHARS}-{MAX_CHARS} znaków
          {isTooShort && (
            <span className="ml-2 text-xs">
              (jeszcze {MIN_CHARS - charCount})
            </span>
          )}
          {isTooLong && (
            <span className="ml-2 text-xs">
              (za dużo: {charCount - MAX_CHARS})
            </span>
          )}
        </div>
      </div>

      <Button type="submit" disabled={!isValid || isGenerating} size="lg">
        {isGenerating ? "Generowanie..." : "Generuj fiszki"}
      </Button>
    </form>
  );
}
