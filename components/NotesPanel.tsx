'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NotesPanelProps {
  date: Date
  initialContent?: string
  isExpanded: boolean
  onToggle: () => void
  onSave: (content: string) => void
  className?: string
  isMobile?: boolean
}

export function NotesPanel({
  date,
  initialContent = '',
  isExpanded,
  onToggle,
  onSave,
  className,
  isMobile = false
}: NotesPanelProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  useEffect(() => {
    // Auto-save after 1 second of no typing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (content !== initialContent) {
      setIsSaving(true)
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSave(content)
        } finally {
          setIsSaving(false)
        }
      }, 1000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, initialContent, onSave])

  const handleBlur = () => {
    // Save immediately on blur
    if (content !== initialContent) {
      onSave(content)
    }
  }

  return (
    <div className={cn(
      "flex flex-col",
      "lg:relative", // Desktop: relative positioning
      "fixed inset-0 z-50 bg-white lg:bg-transparent", // Mobile: full screen, Desktop: transparent
      className
    )}>
      {/* Notes Column */}
      {isExpanded && (
        <div className={cn(
          "bg-card border rounded-lg overflow-hidden flex-shrink-0",
          "w-full h-full lg:w-full lg:min-h-[600px]", // Mobile: full screen, Desktop: full width of container
          "lg:relative" // Desktop: relative positioning
        )}>
          <div className="p-3 border-b border-border/50 bg-muted/30">
            <div className="text-sm font-medium text-center">Notes for {date.toLocaleDateString()}</div>
          </div>
          
          <div className="p-3 flex-1">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              placeholder="Add notes for this day..."
              className={cn(
                "resize-none border-dashed focus:border-solid w-full",
                "min-h-[calc(100vh-120px)] lg:min-h-[500px]" // Mobile: full height, Desktop: fixed height
              )}
            />
            {isSaving && (
              <div className="text-xs text-muted-foreground text-center mt-2">Saving...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
  