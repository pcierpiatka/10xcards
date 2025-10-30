"use client";

import { useState } from "react";
import { AiProposalItem } from "./AiProposalItem";
import { Button } from "@/components/ui/button";
import type { AiProposalDto } from "@/lib/dto/types";

interface AiProposalsListProps {
  proposals: AiProposalDto[];
  onAccept: (selectedProposals: AiProposalDto[]) => void;
  onReject: () => void;
}

/**
 * AiProposalsList - List of AI-generated flashcard proposals
 * Allows user to select proposals and accept/reject them
 */
export function AiProposalsList({
  proposals,
  onAccept,
  onReject,
}: AiProposalsListProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAccept = () => {
    const selectedProposals = proposals.filter((_, index) =>
      selectedIndices.has(index)
    );
    onAccept(selectedProposals);
  };

  const hasSelection = selectedIndices.size > 0;

  return (
    <div className="space-y-6">
      {/* Header with title and count */}
      <div>
        <h3 className="text-lg font-semibold">Propozycje AI</h3>
        <p className="text-sm text-muted-foreground">
          AI wygenerował {proposals.length} propozycji fiszek
          {hasSelection && (
            <span className="ml-2 font-medium text-foreground">
              (zaznaczono: {selectedIndices.size})
            </span>
          )}
        </p>
      </div>

      {/* Action buttons at top for better visibility */}
      <div className="flex gap-3">
        <Button
          onClick={onReject}
          variant="destructive"
          size="lg"
          className="flex-1"
        >
          Odrzuć wszystko
        </Button>
        <Button
          onClick={handleAccept}
          disabled={!hasSelection}
          size="lg"
          className="flex-1"
        >
          Akceptuj zaznaczone ({selectedIndices.size})
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-sm text-muted-foreground text-center">
        Kliknij aby zaznaczyć
      </p>

      {/* Proposals grid - 3 columns on desktop */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {proposals.map((proposal, index) => (
          <AiProposalItem
            key={index}
            proposal={proposal}
            isSelected={selectedIndices.has(index)}
            onToggle={() => toggleSelection(index)}
          />
        ))}
      </div>
    </div>
  );
}
