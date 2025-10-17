import { Button } from "@/components/ui/button";

/**
 * EmptyState component - displayed when user has no flashcards
 * Encourages first interaction with AI generation (core value proposition)
 */
export function EmptyState() {
  const handleScrollToGenerator = () => {
    // Scroll to AI generator form at top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 text-6xl opacity-20">📚</div>
      <h3 className="mb-2 text-lg font-semibold">
        Nie masz jeszcze żadnych fiszek
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Zacznij od wygenerowania pierwszych fiszek przy użyciu AI
      </p>
      <Button onClick={handleScrollToGenerator}>Wygeneruj fiszki z AI</Button>
    </div>
  );
}
