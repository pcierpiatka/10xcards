export default function Loading() {
  return (
    <div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8 flex items-center justify-center">
      <div className="relative max-w-2xl w-full backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-8 text-white border border-white/10">
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-100/90">
              Loading...
            </h2>

            {/* Animated spinner */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-300/30 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-300 rounded-full animate-spin"></div>
              </div>
            </div>

            <p className="text-blue-100/60">Please wait a moment...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
