"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8 flex items-center justify-center">
      <div className="relative max-w-2xl w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-8 text-white border border-white/10">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 text-transparent bg-clip-text drop-shadow-lg">
              Oops!
            </h1>
            <h2 className="text-2xl font-semibold text-blue-100/90">
              Something went wrong
            </h2>
          </div>

          <p className="text-blue-100/80 text-lg">
            We encountered an unexpected error. Don&apos;t worry, it&apos;s not
            your fault.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-left">
              <p className="text-sm font-mono text-red-200">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-red-300/70 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Try again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
