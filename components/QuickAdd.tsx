'use client'

import { useState } from 'react'
import { Plus, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface QuickAddProps {
  onAdd: (title: string, tags?: string[]) => void
  placeholder?: string
  className?: string
}

export function QuickAdd({ onAdd, placeholder = "Add task...", className }: QuickAddProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { data: session } = useSession()

  // Function to extract tags from input text
  const extractTags = (text: string): { title: string; tags: string[] } => {
    const tagRegex = /#(\w+)/g
    const tags: string[] = []
    let match
    
    // Extract all tags
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1])
    }
    
    // Remove tags from title and clean up
    const title = text.replace(tagRegex, '').trim()
    
    return { title, tags }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      // Redirect to sign in if not authenticated
      window.location.href = `${window.location.origin}/auth/signin`
      return
    }
    
    if (value.trim()) {
      const { title, tags } = extractTags(value.trim())
      if (title) {
        onAdd(title, tags.length > 0 ? tags : undefined)
        setValue('')
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFocus = () => {
    if (!session) {
      // Redirect to sign in if not authenticated
      window.location.href = `${window.location.origin}/auth/signin`
      return
    }
    setIsFocused(true)
  }

  if (!session) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <Input
            placeholder="Sign in to add tasks..."
            className="pr-10 border-dashed bg-muted/50 cursor-pointer"
            readOnly
            onClick={() => window.location.href = `${window.location.origin}/auth/signin`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1">
          Click to sign in
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder + " (use #tag for tags)"}
          className={cn(
            "pr-10 border-dashed transition-all",
            isFocused && "border-solid border-ring"
          )}
        />
        {(value || isFocused) && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            disabled={!value.trim()}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
              <div className="text-xs text-muted-foreground text-center mt-1">
          Type #tag to add tags (e.g., &quot;Buy groceries #personal #urgent&quot;)
        </div>
    </form>
  )
}