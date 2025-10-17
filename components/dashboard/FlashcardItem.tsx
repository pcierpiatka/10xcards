import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FlashcardViewModel } from "@/lib/types/viewModels";
import type { FlashcardId, UpdateFlashcardCommand } from "@/lib/dto/types";

interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  onUpdate?: (id: FlashcardId, data: UpdateFlashcardCommand) => void;
  onDelete?: (id: FlashcardId) => void;
}

/**
 * FlashcardItem - Single flashcard card in list
 * Read-only for now (edit/delete will be added in step 11-12)
 */
export function FlashcardItem({ flashcard }: FlashcardItemProps) {
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

  return (
    <Card>
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
          {/* TODO: Step 12 - Enable delete */}
          <Button variant="ghost" size="sm" disabled>
            🗑️
          </Button>
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
    </Card>
  );
}
