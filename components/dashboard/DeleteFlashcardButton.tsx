import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { FlashcardId } from "@/lib/dto/types";

interface DeleteFlashcardButtonProps {
  flashcardId: FlashcardId;
  onDeleteClick: () => void;
  disabled?: boolean;
}

/**
 * DeleteFlashcardButton - Icon button that triggers flashcard deletion
 *
 * Features:
 * - Ghost variant with trash icon
 * - Hover effect (changes to destructive color)
 * - Accessible with aria-label
 * - Keyboard support (Enter, Space)
 *
 * Usage:
 * <DeleteFlashcardButton
 *   flashcardId={flashcard.id}
 *   onDeleteClick={() => setModalOpen(true)}
 *   disabled={isDeleting}
 * />
 */
export function DeleteFlashcardButton({
  onDeleteClick,
  disabled = false,
}: DeleteFlashcardButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDeleteClick}
      disabled={disabled}
      aria-label="Usuń fiszkę"
      className="text-muted-foreground hover:text-destructive transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
