import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AiProposalDto } from "@/lib/dto/types";

interface AiProposalItemProps {
  proposal: AiProposalDto;
  isSelected: boolean;
  onToggle: () => void;
}

/**
 * AiProposalItem - Single AI-generated flashcard proposal
 * Card acts as button - click to toggle selection (UX improvement: larger touch target)
 */
export function AiProposalItem({
  proposal,
  isSelected,
  onToggle,
}: AiProposalItemProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer select-none transition-all hover:shadow-md",
        isSelected
          ? "border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20"
          : "hover:border-primary/50"
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Odznacz" : "Zaznacz"} propozycję: ${proposal.front}`}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              PRZÓD
            </div>
            <p className="text-sm">{proposal.front}</p>
          </div>
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-muted-foreground">TYŁ</div>
            <p className="text-sm">{proposal.back}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
