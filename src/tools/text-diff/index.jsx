/**
 * Text Diff Tool - Compare text files and strings
 */

import { useState, useRef } from 'react'
import { config, diffModes, viewOptions as defaultViewOptions, themes } from './config'

export default function TextDiff() {
  const [leftText, setLeftText] = useState('')
  const [rightText, setRightText] = useState('')
  const [leftFileName, setLeftFileName] = useState('Text 1')
  const [rightFileName, setRightFileName] = useState('Text 2')
  const [diffMode, setDiffMode] = useState('side-by-side')
  const [theme, setTheme] = useState('light')
  const [viewOptions, setViewOptions] = useState(defaultViewOptions)
  const [error, setError] = useState('')
  const [diffResult, setDiffResult] = useState(null)
  
  const leftFileRef = useRef(null)
  const rightFileRef = useRef(null)

  // Handle file upload
  const handleFileUpload = async (e, side) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > config.maxFileSize) {
      setError(`File size exceeds ${config.maxFileSize / 1024 / 1024}MB limit.`)
      return
    }

    setError('')

    try {
      const text = await file.text()
      if (side === 'left') {
        setLeftText(text)
        setLeftFileName(file.name)
      } else {
        setRightText(text)
        setRightFileName(file.name)
      }
    } catch (err) {
      setError(`Failed to read file: ${err.message}`)
    }
  }

  // Calculate diff
  const calculateDiff = () => {
    if (!leftText && !rightText) {
      setError('Please enter or upload text to compare')
      return
    }

    const leftLines = preprocessText(leftText).split('\n')
    const rightLines = preprocessText(rightText).split('\n')

    const diff = computeDiff(leftLines, rightLines)
    setDiffResult(diff)
  }

  // Preprocess text based on options
  const preprocessText = (text) => {
    let processed = text
    
    if (viewOptions.ignoreWhitespace) {
      processed = processed.replace(/\s+/g, ' ')
    }
    
    if (viewOptions.ignoreCase) {
      processed = processed.toLowerCase()
    }
    
    return processed
  }

  // Simple diff algorithm (Myers)
  const computeDiff = (left, right) => {
    const result = []
    let i = 0, j = 0

    while (i < left.length || j < right.length) {
      if (i < left.length && j < right.length && left[i] === right[j]) {
        result.push({ type: 'equal', left: left[i], right: right[j], leftLine: i + 1, rightLine: j + 1 })
        i++
        j++
      } else if (i < left.length && (j >= right.length || !right.includes(left[i]))) {
        result.push({ type: 'delete', left: left[i], right: null, leftLine: i + 1, rightLine: null })
        i++
      } else if (j < right.length) {
        result.push({ type: 'insert', left: null, right: right[j], leftLine: null, rightLine: j + 1 })
        j++
      }
    }

    return result
  }

  // Get diff statistics
  const getDiffStats = () => {
    if (!diffResult) return null

    const additions = diffResult.filter(d => d.type === 'insert').length
    const deletions = diffResult.filter(d => d.type === 'delete').length
    const unchanged = diffResult.filter(d => d.type === 'equal').length

    return { additions, deletions, unchanged, total: diffResult.length }
  }

  // Render side-by-side diff
  const renderSideBySide = () => {
    if (!diffResult) return null

    return (
      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
        {/* Left Side */}
        <div className="border-r border-gray-300 dark:border-gray-600">
          <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 font-semibold border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            {leftFileName}
          </div>
          <div className="overflow-auto max-h-[600px]">
            {diffResult.map((line, idx) => (
              <div
                key={`left-${idx}`}
                className={`px-3 py-1 border-b border-gray-200 dark:border-gray-700 ${
                  line.type === 'delete' ? 'bg-red-100 dark:bg-red-900/30' :
                  line.type === 'equal' ? 'bg-white dark:bg-gray-800' :
                  'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                {viewOptions.showLineNumbers && (
                  <span className="text-gray-400 dark:text-gray-500 mr-4 select-none">{line.leftLine || ' '}</span>
                )}
                <span className={line.type === 'delete' ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-200'}>
                  {line.type === 'delete' && '- '}
                  {line.left || ' '}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div>
          <div className="bg-green-100 dark:bg-green-900/30 px-3 py-2 font-semibold border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            {rightFileName}
          </div>
          <div className="overflow-auto max-h-[600px]">
            {diffResult.map((line, idx) => (
              <div
                key={`right-${idx}`}
                className={`px-3 py-1 border-b border-gray-200 dark:border-gray-700 ${
                  line.type === 'insert' ? 'bg-green-100 dark:bg-green-900/30' :
                  line.type === 'equal' ? 'bg-white dark:bg-gray-800' :
                  'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                {viewOptions.showLineNumbers && (
                  <span className="text-gray-400 dark:text-gray-500 mr-4 select-none">{line.rightLine || ' '}</span>
                )}
                <span className={line.type === 'insert' ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'}>
                  {line.type === 'insert' && '+ '}
                  {line.right || ' '}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render unified diff
  const renderUnified = () => {
    if (!diffResult) return null

    return (
      <div className="font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-semibold border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          {leftFileName} ↔ {rightFileName}
        </div>
        <div className="overflow-auto max-h-[600px]">
          {diffResult.map((line, idx) => (
            <div
              key={idx}
              className={`px-3 py-1 border-b border-gray-200 dark:border-gray-700 ${
                line.type === 'delete' ? 'bg-red-100 dark:bg-red-900/30' :
                line.type === 'insert' ? 'bg-green-100 dark:bg-green-900/30' :
                'bg-white dark:bg-gray-800'
              }`}
            >
              {viewOptions.showLineNumbers && (
                <span className="text-gray-400 dark:text-gray-500 mr-4 select-none">
                  {line.leftLine || line.rightLine || ' '}
                </span>
              )}
              <span className={
                line.type === 'delete' ? 'text-red-700 dark:text-red-300' :
                line.type === 'insert' ? 'text-green-700 dark:text-green-300' :
                'text-gray-800 dark:text-gray-200'
              }>
                {line.type === 'delete' && '- '}
                {line.type === 'insert' && '+ '}
                {line.type === 'equal' && '  '}
                {line.left || line.right}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render inline diff
  const renderInline = () => {
    if (!diffResult) return null

    return (
      <div className="font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-semibold border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          Inline Diff
        </div>
        <div className="overflow-auto max-h-[600px]">
          {diffResult.map((line, idx) => (
            <div key={idx}>
              {line.type === 'delete' && (
                <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 border-b border-gray-200 dark:border-gray-700">
                  {viewOptions.showLineNumbers && (
                    <span className="text-gray-400 dark:text-gray-500 mr-4 select-none">{line.leftLine}</span>
                  )}
                  <span className="text-red-700 dark:text-red-300">- {line.left}</span>
                </div>
              )}
              {line.type === 'insert' && (
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 border-b border-gray-200 dark:border-gray-700">
                  {viewOptions.showLineNumbers && (
                    <span className="text-gray-400 dark:text-gray-500 mr-4 select-none">{line.rightLine}</span>
                  )}
                  <span className="text-green-700 dark:text-green-300">+ {line.right}</span>
                </div>
              )}
              {line.type === 'equal' && (
                <div className="px-3 py-1 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {viewOptions.showLineNumbers && (
                    <span className="text-gray-400 dark:text-gray-500 mr-4 select-none">{line.leftLine}</span>
                  )}
                  <span className="text-gray-800 dark:text-gray-200">  {line.left}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = getDiffStats()

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Text Diff Tool</h1>
        <p className="text-gray-600 dark:text-gray-400">Compare text files and strings to find differences</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 transition-colors">
          {error}
        </div>
      )}

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Original Text</h2>
            <input
              ref={leftFileRef}
              type="file"
              accept=".txt,.csv,.json,.xml,.html,.css,.js,.md"
              onChange={(e) => handleFileUpload(e, 'left')}
              className="hidden"
            />
            <button
              onClick={() => leftFileRef.current?.click()}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Upload File
            </button>
          </div>
          
          <input
            type="text"
            value={leftFileName}
            onChange={(e) => setLeftFileName(e.target.value)}
            className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            placeholder="File name"
          />
          
          <textarea
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder="Paste or type text here..."
            className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          ></textarea>
        </div>

        {/* Right Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Modified Text</h2>
            <input
              ref={rightFileRef}
              type="file"
              accept=".txt,.csv,.json,.xml,.html,.css,.js,.md"
              onChange={(e) => handleFileUpload(e, 'right')}
              className="hidden"
            />
            <button
              onClick={() => rightFileRef.current?.click()}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Upload File
            </button>
          </div>
          
          <input
            type="text"
            value={rightFileName}
            onChange={(e) => setRightFileName(e.target.value)}
            className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            placeholder="File name"
          />
          
          <textarea
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder="Paste or type text here..."
            className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          ></textarea>
        </div>
      </div>

      {/* Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
        <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Diff Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              View Mode
            </label>
            <select
              value={diffMode}
              onChange={(e) => setDiffMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            >
              {diffModes.map(mode => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={viewOptions.showLineNumbers}
                onChange={(e) => setViewOptions({ ...viewOptions, showLineNumbers: e.target.checked })}
                className="rounded"
              />
              Show Line Numbers
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={viewOptions.ignoreWhitespace}
                onChange={(e) => setViewOptions({ ...viewOptions, ignoreWhitespace: e.target.checked })}
                className="rounded"
              />
              Ignore Whitespace
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={viewOptions.ignoreCase}
                onChange={(e) => setViewOptions({ ...viewOptions, ignoreCase: e.target.checked })}
                className="rounded"
              />
              Ignore Case
            </label>
          </div>

          {/* Compare Button */}
          <div className="flex items-end">
            <button
              onClick={calculateDiff}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Statistics</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.additions}</div>
              <div className="text-sm text-green-600 dark:text-green-500">Additions</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.deletions}</div>
              <div className="text-sm text-red-600 dark:text-red-500">Deletions</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.unchanged}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unchanged</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</div>
              <div className="text-sm text-blue-600 dark:text-blue-500">Total Lines</div>
            </div>
          </div>
        </div>
      )}

      {/* Diff Result */}
      {diffResult && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Diff Result</h2>
          
          {diffMode === 'side-by-side' && renderSideBySide()}
          {diffMode === 'unified' && renderUnified()}
          {diffMode === 'inline' && renderInline()}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 transition-colors">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">ℹ️ How to Use</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Paste text or upload files in both panels</li>
          <li>• Choose view mode: Side by Side, Unified, or Inline</li>
          <li>• Toggle options like ignore whitespace or case</li>
          <li>• Click "Compare" to see differences</li>
          <li>• Green = additions, Red = deletions, White = unchanged</li>
          <li>• Perfect for comparing code, configs, documents, and data files</li>
        </ul>
      </div>
    </div>
  )
}
