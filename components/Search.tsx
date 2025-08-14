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
  isOpen: boolean
  onClose: () => void
  onNavigate: (date: string, id?: string) => void
  className?: string
}

export function Search({ isOpen, onClose, onNavigate, className }: SearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const searchTasks = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.results || [])
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchTasks, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
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
    onNavigate(result.date, result.type === 'task' ? result.id : undefined)
    onClose()
    setQuery('')
    setResults([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className={cn(
        "bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4",
        className
      )}>
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks and notes..."
              className="pl-10 text-base"
            />
          </div>
        </div>

        {(results.length > 0 || isLoading) && (
          <div
            ref={resultsRef}
            className="max-h-96 overflow-auto custom-scrollbar"
          >
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : (
              results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "w-full p-4 text-left border-b border-border/50 last:border-b-0 hover:bg-accent/50 transition-colors",
                    index === selectedIndex && "bg-accent/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {result.type === 'task' ? (
                        <div className="h-4 w-4 rounded border border-muted-foreground/30" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(result.date + 'T00:00:00.000Z'), 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.type === 'task' ? 'Task' : 'Note'}
                        </span>
                      </div>
                      
                      <div className="text-sm font-medium line-clamp-1 mb-1">
                        {result.content}
                      </div>
                      
                      {result.snippet && result.snippet !== result.content && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {query && !isLoading && results.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            No results found for &quot;{query}&quot;
          </div>
        )}

        <div className="p-2 border-t border-border/50 text-xs text-muted-foreground text-center">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  )
}