import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8 flex items-center justify-center">
      <div className="relative max-w-2xl w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-8 text-white border border-white/10">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text drop-shadow-lg">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-blue-100/90">
              Page Not Found
            </h2>
          </div>

          <p className="text-blue-100/80 text-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button asChild>
              <Link href="/">Go back home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
