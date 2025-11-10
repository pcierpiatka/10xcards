interface FlashcardReadViewProps {
  front: string;
  back: string;
}

/**
 * FlashcardReadView component
 * Displays flashcard content in read-only mode
 *
 * Used when flashcard is not being edited.
 * Extracted from FlashcardItem for separation of concerns.
 *
 * Example usage:
 * ```tsx
 * <FlashcardReadView front={flashcard.front} back={flashcard.back} />
 * ```
 */
export function FlashcardReadView({ front, back }: FlashcardReadViewProps) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-medium text-muted-foreground">PRZÓD</div>
        <p className="text-sm">{front}</p>
      </div>
      <div className="border-t pt-2">
        <div className="text-xs font-medium text-muted-foreground">TYŁ</div>
        <p className="text-sm">{back}</p>
      </div>
    </div>
  );
}
