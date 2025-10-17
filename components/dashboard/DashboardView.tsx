"use client";

import { useDashboardManager } from "@/hooks/useDashboardManager";
import { EmptyState } from "./EmptyState";
import { FlashcardList } from "./FlashcardList";
import { AiGeneratorForm } from "./AiGeneratorForm";
import { AiProposalsList } from "./AiProposalsList";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/**
 * DashboardView - Main dashboard page component
 * Orchestrates all dashboard UI based on state from useDashboardManager hook
 */
export function DashboardView() {
  const {
    flashcards,
    aiProposals,
    viewState,
    error,
    formResetKey,
    hasMore,
    generateAiProposals,
    acceptAiProposals,
    rejectAiProposals,
    updateFlashcard,
    deleteFlashcard,
    loadMoreFlashcards,
  } = useDashboardManager();

  const isInitialLoading =
    viewState === "loadingList" && flashcards.length === 0;
  const isLoadingMore = viewState === "loadingList" && flashcards.length > 0;
  const isGeneratingAi = viewState === "generatingAi";
  const hasFlashcards = flashcards.length > 0;

  // Initial loading state
  if (isInitialLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="mb-8 h-10 w-64" /> {/* Title */}
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (viewState === "error" && !hasFlashcards) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <p className="mb-4 text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {/* AI Generator Form */}
      <div className="mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Wygeneruj fiszki za pomocą AI
        </h2>
        <AiGeneratorForm
          key={formResetKey}
          isGenerating={isGeneratingAi}
          onSubmit={generateAiProposals}
        />
      </div>

      {/* AI Proposals List (conditional) */}
      {aiProposals && (
        <div className="mb-8 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Zaakceptuj propozycje fiszek
          </h2>
          <AiProposalsList
            proposals={aiProposals.proposals}
            onAccept={acceptAiProposals}
            onReject={rejectAiProposals}
          />
        </div>
      )}

      {/* TODO: Step 9 - ManualFlashcardForm (conditional) */}

      {/* Flashcard List or Empty State */}
      {hasFlashcards ? (
        <FlashcardList
          flashcards={flashcards}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMoreFlashcards}
          onUpdate={updateFlashcard}
          onDelete={deleteFlashcard}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
