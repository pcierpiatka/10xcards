import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

/**
 * CharacterCounter component
 * Displays character count with color-coded validation feedback
 *
 * Color logic:
 * - Green: 0-80% of max (safe zone)
 * - Yellow: 80-95% of max (warning zone)
 * - Red: 95-100% of max (danger zone)
 * - Red bold: Over max (error)
 *
 * Example usage:
 * ```tsx
 * <CharacterCounter current={front.length} max={300} />
 * ```
 */
export function CharacterCounter({
  current,
  max,
  className,
}: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isOverLimit = current > max;

  // Determine color based on percentage
  const colorClass = isOverLimit
    ? "text-destructive font-semibold" // Over limit - red and bold
    : percentage >= 95
      ? "text-destructive" // 95-100% - red
      : percentage >= 80
        ? "text-yellow-600 dark:text-yellow-500" // 80-95% - yellow
        : "text-muted-foreground"; // 0-80% - default gray

  return (
    <span className={cn("text-xs tabular-nums", colorClass, className)}>
      {current}/{max}
    </span>
  );
}
