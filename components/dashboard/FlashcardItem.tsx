"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteFlashcardButton } from "./DeleteFlashcardButton";
import { DeleteFlashcardModal } from "./DeleteFlashcardModal";
import { FlashcardReadView } from "./FlashcardReadView";
import { FlashcardEditView } from "./FlashcardEditView";
import {
  deleteFlashcard,
  updateFlashcard,
  ApiError,
} from "@/lib/services/flashcard-service.client";
import { toast } from "sonner";
import type { FlashcardViewModel } from "@/lib/types/viewModels";
import type { FlashcardId, UpdateFlashcardCommand } from "@/lib/dto/types";
import { FeatureFlag } from "@/lib/features";

interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  onUpdate?: (
    id: FlashcardId,
    data: Partial<Pick<FlashcardViewModel, "front" | "back" | "source_type">>
  ) => void;
  onDelete?: (id: FlashcardId) => void;
  onOptimisticDelete?: (id: FlashcardId) => void;
  onDeleteError?: (id: FlashcardId, error: unknown) => void;
}

/**
 * FlashcardItem - Single flashcard card in list
 * Supports inline editing and delete with optimistic UI
 * - Edit: Click edit button → inline form → save/cancel
 * - Delete: Click delete button → confirmation modal → delete
 */
export function FlashcardItem({
  flashcard,
  onUpdate,
  onDelete,
  onOptimisticDelete,
  onDeleteError,
}: FlashcardItemProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for display - prevents showing empty card during React state update
  const [displayData, setDisplayData] = useState({
    front: flashcard.front,
    back: flashcard.back,
    source_type: flashcard.source_type,
  });

  // Sync local display state with props
  useEffect(() => {
    setDisplayData({
      front: flashcard.front,
      back: flashcard.back,
      source_type: flashcard.source_type,
    });
  }, [flashcard.front, flashcard.back, flashcard.source_type]);
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
        return { label: "AI (edytowana)", variant: "default" as const };
      default:
        return { label: sourceType, variant: "outline" as const };
    }
  };

  const badge = getSourceTypeBadge(displayData.source_type);

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

  // Handler for opening edit mode
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Handler for canceling edit
  const handleEditCancel = () => {
    setIsEditing(false);
  };

  // Handler for saving edits
  const handleEditSave = async (front: string, back: string) => {
    setIsSaving(true);

    // Prepare API request data
    const updateData: UpdateFlashcardCommand = { front, back };

    try {
      // Call API
      const result = await updateFlashcard(flashcard.id, updateData);

      // Update local display state IMMEDIATELY (before parent state update)
      setDisplayData({
        front: result.front,
        back: result.back,
        source_type: result.source_type,
      });

      // Update parent state (may be batched by React)
      onUpdate?.(flashcard.id, {
        front: result.front,
        back: result.back,
        source_type: result.source_type, // Important: update source_type from server (ai → ai-edited)
      });

      // Exit edit mode - now safe because displayData has new values
      setIsEditing(false);
      toast.success("Fiszka została zaktualizowana");
    } catch (error) {
      // Show error message based on error type
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            toast.error("Fiszka nie istnieje lub została już usunięta");
            break;
          case 401:
            toast.error("Sesja wygasła. Zaloguj się ponownie");
            break;
          case 400:
            toast.error("Nieprawidłowe dane. Sprawdź długość pól");
            break;
          default:
            toast.error("Nie udało się zaktualizować fiszki. Spróbuj ponownie");
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }

      console.error("[FlashcardItem] Update failed", {
        flashcardId: flashcard.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
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
          {/* Edit button - protected by flashcards.edit feature flag */}
          <FeatureFlag name="flashcards.edit">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              disabled={isEditing || isDeleting}
              aria-label="Edytuj fiszkę"
            >
              ✏️
            </Button>
          </FeatureFlag>
          {/* Delete button - protected by flashcards.delete feature flag */}
          <FeatureFlag name="flashcards.delete">
            <DeleteFlashcardButton
              flashcardId={flashcard.id}
              onDeleteClick={handleDeleteClick}
              disabled={isDeleting || isEditing}
            />
          </FeatureFlag>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <FlashcardEditView
            initialFront={displayData.front}
            initialBack={displayData.back}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            isSaving={isSaving}
          />
        ) : (
          <FlashcardReadView
            front={displayData.front}
            back={displayData.back}
          />
        )}
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
