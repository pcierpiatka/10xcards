/**
 * Modal wyświetlany podczas generowania fiszek przez AI
 *
 * Blokuje interakcję z interfejsem i informuje użytkownika o trwającym procesie.
 * Generowanie może trwać 5-30 sekund, więc jasny feedback jest kluczowy dla UX.
 */

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AiGenerationLoadingModalProps {
  /** Controls modal visibility (bound to isGeneratingAi state) */
  isOpen: boolean;
}

/**
 * Loading modal dla generowania fiszek AI
 *
 * Features:
 * - Spinner animowany (Loader2 icon)
 * - Komunikat główny + pomocniczy
 * - Blokada UI (backdrop)
 * - Nie można zamknąć ręcznie (auto-close po zakończeniu operacji)
 * - Dark mode support
 */
export function AiGenerationLoadingModal({
  isOpen,
}: AiGenerationLoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md"
        // Disable closing by ESC or clicking backdrop
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        // Hide close button (X)
        hideCloseButton
      >
        <div className="flex flex-col items-center gap-4 py-8">
          {/* Animated spinner */}
          <Loader2 className="h-12 w-12 animate-spin text-primary" />

          {/* Text content */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              Generuję fiszki za pomocą AI...
            </p>
            <p className="text-sm text-muted-foreground">
              To może potrwać kilka sekund
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
