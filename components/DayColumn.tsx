'use client'

import { useState } from 'react'
import { formatDisplayDate, formatDayName, formatDate, isDateToday, isDateWeekend, isValidDate } from '@/lib/dates'
import { TaskItem, Task } from './TaskItem'
import { QuickAdd } from './QuickAdd'
import { NotesPanel } from './NotesPanel'
import { cn } from '@/lib/utils'

interface DayColumnProps {
  date: Date
  tasks: Task[]
  onCreateTask: (title: string, scheduledFor: Date, tags?: string[]) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onToggleTask: (taskId: string, completed: boolean) => void
  highlightedTaskId?: string
  showCompleted?: boolean
  className?: string
}

export function DayColumn({
  date,
  tasks = [],
  onCreateTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  showCompleted = false,
  highlightedTaskId,
  className
}: DayColumnProps) {
  const [expandedNotes, setExpandedNotes] = useState(false)

  // Validate date prop
  if (!date || isNaN(date.getTime())) {
    console.error('❌ DayColumn received invalid date:', date)
    return (
      <div className="flex items-center justify-center p-4 text-red-500 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-sm font-medium">Invalid Date</div>
          <div className="text-xs text-gray-500">Please refresh the page</div>
        </div>
      </div>
    )
  }

  const today = isDateToday(date)
  const weekend = isDateWeekend(date)

  const handleCreateTask = (title: string, tags?: string[]) => {
    console.log('🔍 Creating task with date:', date, 'isValid:', !isNaN(date.getTime()))
    console.log('🔍 Task title:', title, 'tags:', tags)
    
    if (isNaN(date.getTime())) {
      console.error('❌ Invalid date passed to handleCreateTask:', date)
      return
    }
    
    console.log('🔍 Calling onCreateTask with:', { title, date, tags })
    onCreateTask(title, date, tags)
  }

  const handleSaveNotes = async (content: string) => {
    try {
      await fetch(`/api/day-notes/${formatDate(date)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentText: content,
        }),
      })
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  // Sort tasks by position index and completion status
  const sortedTasks = [...tasks].sort((a, b) => {
    // Completed tasks go to bottom unless showing them
    if (showCompleted) {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
    }
    return a.positionIndex - b.positionIndex
  })

  const dateKey = formatDate(date)

  return (
    <div className={cn("flex", className)} data-day={formatDate(date)}>
      {/* Main Task Column */}
      <div className={cn(
        "flex flex-col bg-white border rounded-lg overflow-hidden min-h-[600px] w-full",
        today ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200",
        weekend && "opacity-75"
      )}>
        {/* Header */}
        <div className={cn(
          "p-3 border-b border-gray-200",
          today ? "bg-blue-50 border-blue-200" : "bg-gray-50",
          weekend && "bg-gray-100"
        )}>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">
              {formatDayName(date)}
            </div>
            <div className={cn(
              "text-lg font-semibold text-gray-900",
              today && "text-blue-700"
            )}>
              {formatDisplayDate(date)}
            </div>
          </div>
        </div>

        {/* Tasks Area - Flexible Height */}
        <div className={cn(
          "relative flex-1",
          sortedTasks.length === 0 ? "flex items-center justify-center" : ""
        )}>
          {/* Notebook background pattern */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Horizontal lines */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-gray-200 opacity-30"
                style={{ top: `${(i + 1) * 30}px` }}
              />
            ))}
          </div>
          
          <div className={cn(
            "relative z-10 p-3",
            sortedTasks.length === 0 ? "w-full" : ""
          )}>
            {sortedTasks.map((task, index) => (
              <TaskItem
                key={`${task.id}-${dateKey}-${index}`}
                task={task}
                index={index}
                onToggle={onToggleTask}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                isHighlighted={task.id === highlightedTaskId}
                showCompleted={showCompleted}
              />
            ))}
            
            {sortedTasks.length === 0 && (
              <div className="relative p-4 text-center text-gray-500 text-sm min-h-[200px] flex items-center justify-center">
                {/* Notebook lines for empty state */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                <div className="absolute top-1/4 left-0 right-0 h-px bg-gray-200 opacity-50"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 opacity-50"></div>
                <div className="absolute top-3/4 left-0 right-0 h-px bg-gray-200 opacity-50"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
                <div className="relative z-10">
                  {today ? (
                    <div>
                      <div className="font-medium mb-2">Ready to get organized?</div>
                      <div className="text-xs opacity-75">Add your first task below</div>
                    </div>
                  ) : (
                    "No tasks scheduled"
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Add - Always at Bottom */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <QuickAdd 
            onAdd={handleCreateTask}
            placeholder={today ? "Add task for today..." : "Add task..."}
          />
        </div>
      </div>

      {/* Notes Toggle Button - Outside Task Panel */}
      <button
        onClick={() => setExpandedNotes(!expandedNotes)}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
          expandedNotes 
            ? "bg-blue-100 text-blue-600" 
            : "bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200",
          "ml-2"
        )}
        title={expandedNotes ? "Hide notes" : "Show notes"}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Notes Panel - Attached to Task Column */}
      {expandedNotes && (
        <NotesPanel
          date={date}
          initialContent=""
          isExpanded={expandedNotes}
          onToggle={() => setExpandedNotes(false)}
          onSave={handleSaveNotes}
          className="flex-shrink-0 w-[400px] ml-2"
          isMobile={false}
        />
      )}
    </div>
  )
}