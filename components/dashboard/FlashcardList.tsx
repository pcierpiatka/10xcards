import { FlashcardItem } from "./FlashcardItem";
import { Button } from "@/components/ui/button";
import type { FlashcardViewModel } from "@/lib/types/viewModels";
import type { FlashcardId, UpdateFlashcardCommand } from "@/lib/dto/types";

interface FlashcardListProps {
  flashcards: FlashcardViewModel[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onUpdate: (id: FlashcardId, data: UpdateFlashcardCommand) => void;
  onDelete: (id: FlashcardId) => void;
  onOptimisticDelete: (id: FlashcardId) => void;
  onDeleteError: (id: FlashcardId, error: unknown) => void;
}

/**
 * FlashcardList - Displays flashcards in 3-column grid with pagination
 * Maps flashcards to FlashcardItem components and shows "Load More" button
 */
export function FlashcardList({
  flashcards,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onUpdate,
  onDelete,
  onOptimisticDelete,
  onDeleteError,
}: FlashcardListProps) {
  return (
    <div className="space-y-6">
      {/* Flashcard items grid - 3 columns on desktop */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flashcards.map((flashcard) => (
          <FlashcardItem
            key={flashcard.id}
            flashcard={flashcard}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onOptimisticDelete={onOptimisticDelete}
            onDeleteError={onDeleteError}
          />
        ))}
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
          >
            {isLoadingMore ? "Ładowanie..." : "Załaduj więcej"}
          </Button>
        </div>
      )}
    </div>
  );
}
