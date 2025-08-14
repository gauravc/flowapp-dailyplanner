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
}

export function NotesPanel({
  date,
  initialContent = '',
  isExpanded,
  onToggle,
  onSave,
  className
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
    <div className={cn("flex flex-col", className)}>
      {/* Notes Toggle Button */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className={cn(
          "w-12 h-12 p-0 justify-center rounded-full hover:bg-accent/50 transition-all duration-200",
          isExpanded && "bg-accent text-accent-foreground"
        )}
        title="Toggle Notes"
      >
        <FileText className="h-5 w-5" />
      </Button>
      
      {/* Notes Column */}
      {isExpanded && (
        <div className="bg-card border rounded-lg overflow-hidden w-[560px] min-h-[400px] flex-shrink-0">
          <div className="p-3 border-b border-border/50 bg-muted/30">
            <div className="text-sm font-medium text-center">Notes</div>
          </div>
          
          <div className="p-3 flex-1">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              placeholder="Add notes for this day..."
              className="min-h-[320px] resize-none border-dashed focus:border-solid w-full"
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
  