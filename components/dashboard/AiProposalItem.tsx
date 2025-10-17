import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import type { AiProposalDto } from "@/lib/dto/types";

interface AiProposalItemProps {
  proposal: AiProposalDto;
  isSelected: boolean;
  onToggle: () => void;
}

/**
 * AiProposalItem - Single AI-generated flashcard proposal
 * Displays front/back with checkbox for selection
 */
export function AiProposalItem({
  proposal,
  isSelected,
  onToggle,
}: AiProposalItemProps) {
  return (
    <Card
      className={
        isSelected
          ? "border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20"
          : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggle}
              aria-label="Zaznacz propozycję"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                PRZÓD
              </div>
              <p className="text-sm">{proposal.front}</p>
            </div>
            <div className="border-t pt-2">
              <div className="text-xs font-medium text-muted-foreground">
                TYŁ
              </div>
              <p className="text-sm">{proposal.back}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
