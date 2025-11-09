"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteFlashcardButton } from "./DeleteFlashcardButton";
import { DeleteFlashcardModal } from "./DeleteFlashcardModal";
import {
  deleteFlashcard,
  ApiError,
} from "@/lib/services/flashcard-service.client";
import { toast } from "sonner";
import type { FlashcardViewModel } from "@/lib/types/viewModels";
import type { FlashcardId, UpdateFlashcardCommand } from "@/lib/dto/types";

interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  onUpdate?: (id: FlashcardId, data: UpdateFlashcardCommand) => void;
  onDelete?: (id: FlashcardId) => void;
  onOptimisticDelete?: (id: FlashcardId) => void;
  onDeleteError?: (id: FlashcardId, error: unknown) => void;
}

/**
 * FlashcardItem - Single flashcard card in list
 * Supports delete with optimistic UI and confirmation modal
 */
export function FlashcardItem({
  flashcard,
  onDelete,
  onOptimisticDelete,
  onDeleteError,
}: FlashcardItemProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Format created_at for display
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Dzisiaj";
    if (diffDays === 1) return "Wczoraj";
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tyg. temu`;
    return date.toLocaleDateString("pl-PL");
  };

  // Source type badge variant
  const getSourceTypeBadge = (sourceType: string) => {
    switch (sourceType) {
      case "manual":
        return { label: "Ręczna", variant: "secondary" as const };
      case "ai":
        return { label: "AI", variant: "default" as const };
      case "ai-edited":
        return { label: "AI (edytowana)", variant: "outline" as const };
      default:
        return { label: sourceType, variant: "outline" as const };
    }
  };

  const badge = getSourceTypeBadge(flashcard.source_type);

  // Handler for opening delete modal
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  // Handler for confirming deletion (with optimistic UI)
  const handleDeleteConfirm = async (flashcardId: FlashcardId) => {
    setIsDeleting(true);

    // Optimistic delete - remove from UI immediately
    onOptimisticDelete?.(flashcardId);

    try {
      // Call API
      await deleteFlashcard(flashcardId);

      // Success - call onDelete callback
      onDelete?.(flashcardId);
      toast.success("Fiszka została usunięta");
    } catch (error) {
      // Error - rollback optimistic delete
      onDeleteError?.(flashcardId, error);

      // Show error message based on error type
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            toast.error("Fiszka nie istnieje lub została już usunięta");
            break;
          case 401:
            toast.error("Sesja wygasła. Zaloguj się ponownie");
            break;
          default:
            toast.error("Nie udało się usunąć fiszki. Spróbuj ponownie");
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }

      console.error("[FlashcardItem] Delete failed", {
        flashcardId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <Card data-testid="flashcard-item">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(flashcard.created_at)}
          </span>
        </div>
        <div className="flex gap-2">
          {/* TODO: Step 11 - Enable edit */}
          <Button variant="ghost" size="sm" disabled>
            ✏️
          </Button>
          {/* Delete button with modal confirmation */}
          <DeleteFlashcardButton
            flashcardId={flashcard.id}
            onDeleteClick={handleDeleteClick}
            disabled={isDeleting}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              PRZÓD
            </div>
            <p className="text-sm">{flashcard.front}</p>
          </div>
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-muted-foreground">TYŁ</div>
            <p className="text-sm">{flashcard.back}</p>
          </div>
        </div>
      </CardContent>

      {/* Delete confirmation modal */}
      <DeleteFlashcardModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        flashcardId={flashcard.id}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </Card>
  );
}
