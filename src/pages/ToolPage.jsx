import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo, Suspense, lazy } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { getToolById } from '../tools/registry'
import { updateToolSEO } from '../utils/seo'

export default function ToolPage() {
  const { toolId } = useParams()
  const tool = getToolById(toolId)
  
  // Update SEO when tool changes
  useEffect(() => {
    if (tool) {
      updateToolSEO(tool)
    }
  }, [tool])

  if (!tool) {
    return (
      <div className="py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
          <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tool Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The tool you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>
        </div>
      </div>
    )
  }

  if (tool.status === 'coming-soon') {
    const ToolIcon = tool.icon
    return (
      <div className="py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
          <ToolIcon className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{tool.name}</h1>
          <span className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-sm font-medium rounded-full mb-4">
            Coming Soon
          </span>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{tool.description}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tools
          </Link>
        </div>
      </div>
    )
  }

  // Lazily load the tool component to avoid pulling heavy deps on initial load
  const ToolComponent = useMemo(() => lazy(tool.loader), [tool])
  const ToolIcon = tool.icon

  return (
    <div className="w-full animate-fade-in">
      {/* Tool Header */}
      <div className="w-full px-3 sm:px-4 lg:px-4 py-2 border-b border-purple-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <ToolIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <div className="flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">{tool.name}</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            100% Offline
          </div>
        </div>
      </div>

      {/* Tool Content */}
      <div className="w-full px-2 sm:px-3">
        <Suspense fallback={<div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading tool…</div>}>
          <ToolComponent />
        </Suspense>
      </div>
    </div>
  )
}
