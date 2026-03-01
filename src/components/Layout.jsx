import { Outlet, Link, useLocation } from 'react-router-dom'
import { Github, Home, ShieldCheck, Sun, Moon } from 'lucide-react'
import { tools } from '../tools/registry'
import { useTheme } from '../hooks/useTheme'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-purple-200/50 dark:border-gray-700/50 shadow-sm transition-colors">
          <div className="w-full px-3 sm:px-4 lg:px-4">
            <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2">
            <img src="/icon-1024.png" alt="OfflineSuite" className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:via-pink-700 group-hover:to-blue-700 transition-all">
            OfflineSuite
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block transition-colors">Privacy First, Always Free</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-4">
            {!isHome && (
              <Link 
            to="/"
            className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 text-sm font-medium flex items-center gap-2 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
              >
            <Home className="w-4 h-4" />
            All Tools
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </nav>

            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-t border-purple-200/50 dark:border-gray-700/50 py-8 mt-auto transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            {/* Privacy Notice */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-center gap-2 transition-colors">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>All processing happens locally on your device. Your data never leaves your computer.</span>
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-lg p-4 transition-colors">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center transition-colors">
                <strong>Disclaimer:</strong> These tools are provided as-is for personal use. While we strive for accuracy and reliability, 
                please verify important outputs and use at your own discretion. For professional or critical tasks, 
                consider using specialized software.
              </p>
            </div>

            {/* Footer Bottom */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-purple-200/30 dark:border-gray-700/30">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm transition-colors">{tools.length} tools available</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1 transition-colors">
                Made with <span className="text-red-500 animate-pulse">❤️</span> by{' '}
                <a 
                  href="https://github.com/rprasath" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                >
                  Prasath
                </a>
              </p>
              <div className="flex items-center gap-4">
                <Link
                  to="/faq"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm font-medium transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                >
                  FAQ
                </Link>
                <a 
                  href="mailto:contact@prasath.me" 
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                >
                  Suggest a Tool
                </a>
                <a 
                  href="https://github.com/rprasath/offlinesuite/issues" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm font-medium transition-colors flex items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
