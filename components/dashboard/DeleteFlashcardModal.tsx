"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { FlashcardId } from "@/lib/dto/types";

interface DeleteFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcardId: FlashcardId;
  onConfirm: (flashcardId: FlashcardId) => Promise<void>;
  isDeleting?: boolean;
}

/**
 * DeleteFlashcardModal - Confirmation dialog for flashcard deletion
 *
 * Features:
 * - Clear warning about irreversible action
 * - Async confirmation handler
 * - Loading state with spinner
 * - Keyboard support (Escape to cancel, Enter to confirm)
 * - Focus management (auto-focus on Cancel button)
 *
 * Usage:
 * <DeleteFlashcardModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   flashcardId={flashcard.id}
 *   onConfirm={handleDelete}
 *   isDeleting={isDeleting}
 * />
 */
export function DeleteFlashcardModal({
  open,
  onOpenChange,
  flashcardId,
  onConfirm,
  isDeleting = false,
}: DeleteFlashcardModalProps) {
  const handleConfirm = async () => {
    await onConfirm(flashcardId);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Czy na pewno chcesz usunąć tę fiszkę?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja jest nieodwracalna. Fiszka zostanie trwale usunięta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
