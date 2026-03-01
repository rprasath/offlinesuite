/**
 * Reusable container components for tools with dark mode support
 */

export function ToolSection({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 space-y-6 transition-colors ${className}`}>
      {children}
    </div>
  )
}

export function ToolCard({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors ${className}`}>
      {children}
    </div>
  )
}

export function ToolHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h2>
      {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
  )
}
