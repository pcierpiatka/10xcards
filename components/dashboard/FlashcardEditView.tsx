"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "./CharacterCounter";

interface FlashcardEditViewProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const FRONT_MAX = 300;
const BACK_MAX = 600;

/**
 * FlashcardEditView component
 * Inline editing interface for flashcard content
 *
 * Features:
 * - Real-time character validation with color-coded counters
 * - Keyboard shortcuts: Escape to cancel, Ctrl/Cmd+Enter to save
 * - Auto-focus on front field when entering edit mode
 * - Disabled save button when validation fails or no changes made
 *
 * Validation rules:
 * - Front: 1-300 characters (required)
 * - Back: 1-600 characters (required)
 *
 * Example usage:
 * ```tsx
 * <FlashcardEditView
 *   initialFront={flashcard.front}
 *   initialBack={flashcard.back}
 *   onSave={(front, back) => handleUpdate(id, { front, back })}
 *   onCancel={() => setIsEditing(false)}
 *   isSaving={isLoading}
 * />
 * ```
 */
export function FlashcardEditView({
  initialFront,
  initialBack,
  onSave,
  onCancel,
  isSaving = false,
}: FlashcardEditViewProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    frontTextareaRef.current?.focus();
  }, []);

  // Validation state
  const isFrontValid = front.length >= 1 && front.length <= FRONT_MAX;
  const isBackValid = back.length >= 1 && back.length <= BACK_MAX;
  const isValid = isFrontValid && isBackValid;
  const hasChanges = front !== initialFront || back !== initialBack;
  const canSave = isValid && hasChanges && !isSaving;

  // Handlers
  const handleSave = () => {
    if (canSave) {
      onSave(front, back);
    }
  };

  const handleCancel = () => {
    // Reset to initial values
    setFront(initialFront);
    setBack(initialBack);
    onCancel();
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }

    // Ctrl/Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSave) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      {/* Front field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="edit-front"
            className="text-xs font-medium text-muted-foreground"
          >
            PRZÓD
          </label>
          <CharacterCounter current={front.length} max={FRONT_MAX} />
        </div>
        <Textarea
          ref={frontTextareaRef}
          id="edit-front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          disabled={isSaving}
          placeholder="Pytanie lub termin (1-300 znaków)"
          className="min-h-[60px] resize-y"
          aria-invalid={!isFrontValid}
        />
        {!isFrontValid && front.length > 0 && (
          <p className="text-xs text-destructive">
            {front.length === 0
              ? "Przód fiszki nie może być pusty"
              : "Przód fiszki może mieć maksymalnie 300 znaków"}
          </p>
        )}
      </div>

      {/* Back field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="edit-back"
            className="text-xs font-medium text-muted-foreground"
          >
            TYŁ
          </label>
          <CharacterCounter current={back.length} max={BACK_MAX} />
        </div>
        <Textarea
          id="edit-back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          disabled={isSaving}
          placeholder="Odpowiedź lub definicja (1-600 znaków)"
          className="min-h-[80px] resize-y"
          aria-invalid={!isBackValid}
        />
        {!isBackValid && back.length > 0 && (
          <p className="text-xs text-destructive">
            {back.length === 0
              ? "Tył fiszki nie może być pusty"
              : "Tył fiszki może mieć maksymalnie 600 znaków"}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          type="button"
        >
          Anuluj
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
          type="button"
        >
          {isSaving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd> aby
        anulować,{" "}
        <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+Enter</kbd>{" "}
        aby zapisać
      </p>
    </div>
  );
}
