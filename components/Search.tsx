'use client'

import { useState, useEffect, useRef } from 'react'
import { Search as SearchIcon, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'task' | 'note'
  date: string
  content: string
  snippet: string
}

interface SearchProps {
  query: string
  onQueryChange: (query: string) => void
  onTaskHighlight: (taskId: string | undefined) => void
  className?: string
}

export function Search({ query, onQueryChange, onTaskHighlight, className }: SearchProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchTasks = async () => {
      if (!query.trim()) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.results || [])
        setSelectedIndex(0)
        setShowResults(true)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
        setShowResults(false)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchTasks, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false)
      onQueryChange('')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex])
      }
    }
  }

  const handleResultClick = (result: SearchResult) => {
    onTaskHighlight(result.type === 'task' ? result.id : undefined)
    setShowResults(false)
    onQueryChange('')
    setResults([])
    
    // Clear highlight after 3 seconds
    setTimeout(() => onTaskHighlight(undefined), 3000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value)
  }

  const handleInputFocus = () => {
    if (query.trim() && results.length > 0) {
      setShowResults(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowResults(false), 200)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search tasks and notes..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
        >
          {results.map((result, index) => (
            <div
              key={result.id}
              className={cn(
                "px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
                index === selectedIndex && "bg-blue-50 border-blue-200"
              )}
              onClick={() => handleResultClick(result)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {result.type === 'task' ? (
                    <Calendar className="h-4 w-4 text-blue-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {result.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(result.date), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {result.snippet}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Searching...
        </div>
      )}
    </div>
  )
}