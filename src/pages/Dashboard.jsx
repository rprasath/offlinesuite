import { Link } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, Github, LayoutGrid, List, Mail, Search } from 'lucide-react'
import { tools, toolCategories } from '../tools/registry'
import { resetToHomeSEO, addFAQStructuredData } from '../utils/seo'

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  
  // Reset SEO to home page when Dashboard loads
  useEffect(() => {
    resetToHomeSEO()
    addFAQStructuredData()
  }, [])

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase()
    return tools.filter(tool => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
      if (!lowerQuery) return matchesCategory

      const category = toolCategories[tool.category]
      const haystack = [
        tool.name,
        tool.description,
        category?.name,
        category?.description,
        ...(tool.keywords || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = haystack.includes(lowerQuery)
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  // Count tools by category
  const categoryCounts = useMemo(() => {
    const counts = { all: tools.length }
    tools.forEach(tool => {
      const cat = tool.category || 'other'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="min-h-screen pb-8">
      {/* Mobile-optimized Header */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-6 pb-4 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Offline Tools
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
            Free, privacy-first tools for your browser
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters Section - Sticky on mobile */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 py-4 sm:py-0 sm:relative shadow-sm sm:shadow-none border-b sm:border-0 mb-4 sm:mb-6 sm:mt-6 transition-colors">
          <div className="max-w-7xl mx-auto sm:bg-white/70 dark:sm:bg-gray-800/70 sm:backdrop-blur-md sm:rounded-2xl sm:p-6 sm:shadow-lg sm:border sm:border-purple-200/50 dark:sm:border-gray-700/50 transition-colors">
            {/* Search Bar */}
            <div className="mb-3 sm:mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search tools"
                  className="w-full px-4 py-3 sm:px-5 sm:py-4 pr-11 sm:pr-12 rounded-xl border-2 border-purple-200 dark:border-gray-600 focus:border-purple-400 dark:focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 transition-all text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base bg-white dark:bg-gray-700"
                />
                <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {/* Category Filters - Horizontal scroll on mobile */}
            <div className="mb-3 sm:mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  All ({categoryCounts.all})
                </button>
                {Object.entries(toolCategories).map(([categoryId, category]) => {
                  const CategoryIcon = category.icon
                  return (
                    <button
                      key={categoryId}
                      onClick={() => setSelectedCategory(categoryId)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 ${
                        selectedCategory === categoryId
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <span className="sm:hidden inline-flex items-center justify-center gap-1">
                        <CategoryIcon className="w-4 h-4" />
                        ({categoryCounts[categoryId] || 0})
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4" />
                        {category.name} ({categoryCounts[categoryId] || 0})
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* View Mode Toggle & Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400" aria-live="polite" aria-atomic="true">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredTools.length}</span> 
                {filteredTools.length === 1 ? ' tool' : ' tools'}
              </p>
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 ${
                    viewMode === 'grid'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
                  }`}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
                  }`}
                  title="List view"
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Display */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No tools found</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Try adjusting your search or filter</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {filteredTools.map((tool) => (
              <ToolCardGrid key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTools.map((tool) => (
              <ToolCardList key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 sm:p-8 border border-purple-200/50 dark:border-gray-600/50 transition-colors">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 text-center">Have a Suggestion?</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 text-center">
            Help us improve by suggesting new tools or reporting bugs
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
            <a 
              href="mailto:contact@prasath.me" 
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              Contact Us
            </a>
            <a 
              href="https://github.com/rprasath/offlinesuite/issues" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all border border-gray-300 dark:border-gray-600 text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden xs:inline">Report Issue / Request Feature</span>
              <span className="xs:hidden">Report / Request</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Grid View Card Component
function ToolCardGrid({ tool }) {
  const isComingSoon = tool.status === 'coming-soon'
  const category = toolCategories[tool.category]
  const ToolIcon = tool.icon
  const CategoryIcon = category?.icon

  if (isComingSoon) {
    return (
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-md opacity-75 transition-colors">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <ToolIcon className="w-7 h-7 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400" />
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 text-[10px] sm:text-xs font-medium rounded-full">
            Soon
          </span>
        </div>
        <h3 className="text-xs sm:text-base font-semibold text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">{tool.name}</h3>
        <p className="text-gray-500 dark:text-gray-500 text-[10px] sm:text-xs mb-1.5 sm:mb-2 line-clamp-2">{tool.description}</p>
        {category && CategoryIcon && (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
            <CategoryIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{category.name}</span>
          </span>
        )}
      </div>
    )
  }

  return (
    <Link 
      to={`/tool/${tool.id}`}
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-3 sm:p-5 border border-purple-200/50 dark:border-gray-700/50 shadow-md hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 group transition-all active:scale-95 sm:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <ToolIcon className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
        <div className="flex flex-col items-end gap-1">
          {tool.isNew && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-[10px] sm:text-xs font-medium rounded-full">
              New
            </span>
          )}
        </div>
      </div>
      <h3 className="text-xs sm:text-base font-semibold text-gray-800 dark:text-gray-200 mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-0">
        {tool.name}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs mb-2 sm:mb-3 line-clamp-2">{tool.description}</p>
      {category && CategoryIcon && (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">
          <CategoryIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{category.name}</span>
        </span>
      )}
      <div className="flex items-center text-purple-600 dark:text-purple-400 text-[10px] sm:text-xs font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
        <span className="hidden sm:inline">Open Tool</span>
        <span className="sm:hidden">Open</span>
        <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}

// List View Card Component
function ToolCardList({ tool }) {
  const isComingSoon = tool.status === 'coming-soon'
  const category = toolCategories[tool.category]
  const ToolIcon = tool.icon
  const CategoryIcon = category?.icon

  if (isComingSoon) {
    return (
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-md opacity-75 transition-colors">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <ToolIcon className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 text-gray-600 dark:text-gray-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400">{tool.name}</h3>
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full whitespace-nowrap">
                Coming Soon
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm line-clamp-2">{tool.description}</p>
            {category && CategoryIcon && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                <CategoryIcon className="w-3.5 h-3.5" />
                {category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link 
      to={`/tool/${tool.id}`}
      className="block bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-purple-200/50 dark:border-gray-700/50 shadow-md hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 group transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
    >
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <ToolIcon className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
              {tool.name}
            </h3>
            {tool.isNew && (
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-full whitespace-nowrap">
                New
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1.5 line-clamp-2">{tool.description}</p>
          {category && CategoryIcon && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <CategoryIcon className="w-3.5 h-3.5" />
              {category.name}
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors flex-shrink-0 ml-2">
          <span className="hidden md:inline">Open</span>
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
