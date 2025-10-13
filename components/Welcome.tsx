export default function Welcome() {
  return (
    <div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 sm:p-8">
      <div className="relative max-w-4xl mx-auto backdrop-blur-xl bg-gradient-to-b from-white/10 to-white/5 rounded-2xl shadow-2xl p-8 text-white border border-white/10">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 text-transparent bg-clip-text drop-shadow-lg">
              Welcome to 10xCards!
            </h1>
            <p className="text-xl text-blue-100/90 drop-shadow-md">
              Built with modern web technologies:
            </p>
          </div>

          <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                Core
              </h2>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    Next.js v15
                  </span>
                  <span className="text-blue-100/90">
                    - React framework with App Router
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    React v19
                  </span>
                  <span className="text-blue-100/90">
                    - UI library for interactive components
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    TypeScript v5
                  </span>
                  <span className="text-blue-100/90">- Static typing</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                Styling
              </h2>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    Tailwind CSS v4
                  </span>
                  <span className="text-blue-100/90">
                    - Utility-first CSS framework
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    shadcn/ui
                  </span>
                  <span className="text-blue-100/90">- Component library</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                Code Quality
              </h2>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    ESLint v9
                  </span>
                  <span className="text-blue-100/90">- Code linting</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    Prettier
                  </span>
                  <span className="text-blue-100/90">- Code formatting</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="font-mono bg-blue-900/50 px-3 py-1.5 rounded-lg text-blue-200 shadow-sm">
                    Husky + Lint-staged
                  </span>
                  <span className="text-blue-100/90">- Pre-commit hooks</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-lg text-center text-blue-100/90 mt-8 leading-relaxed">
            AI-powered flashcard generator built with{" "}
            <br className="hidden sm:block" />
            <span className="font-semibold bg-gradient-to-r from-blue-200 to-purple-200 text-transparent bg-clip-text">
              modern web technologies!
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
