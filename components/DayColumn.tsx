'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { formatDisplayDate, formatDayName, formatDate, isDateToday, isDateWeekend } from '@/lib/dates'
import { TaskItem, Task } from './TaskItem'
import { QuickAdd } from './QuickAdd'
import { NotesPanel } from './NotesPanel'
import { cn } from '@/lib/utils'

interface DayColumnProps {
  date: Date
  tasks: Task[]
  notes?: string
  onCreateTask: (title: string, date: Date, tags?: string[]) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onToggleTask: (taskId: string, completed: boolean) => void
  onSaveNotes: (date: Date, content: string) => void
  highlightedTaskId?: string
  showCompleted?: boolean
  expandedNotes: boolean
  onToggleNotes: () => void
  className?: string
}

export function DayColumn({
  date,
  tasks,
  notes = '',
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
  onSaveNotes,
  highlightedTaskId,
  showCompleted = true,
  expandedNotes,
  onToggleNotes,
  className
}: DayColumnProps) {
  const today = isDateToday(date)
  const weekend = isDateWeekend(date)
  
  const { setNodeRef } = useDroppable({
    id: `day-${date.toISOString()}`,
    data: {
      type: 'day',
      date,
    },
  })

  const handleCreateTask = (title: string, tags?: string[]) => {
    onCreateTask(title, date, tags)
  }

  const handleSaveNotes = (content: string) => {
    onSaveNotes(date, content)
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
  
  // Debug: Log tasks for this date
  const dateKey = formatDate(date)
  console.log(`=== DAY COLUMN DEBUG: ${dateKey} ===`)
  console.log('Date object:', date)
  console.log('Date key:', dateKey)
  console.log('Tasks array:', tasks)
  console.log('Tasks length:', tasks.length)
  console.log('Sorted tasks:', sortedTasks)
  console.log('Sorted tasks length:', sortedTasks.length)

  return (
    <div className={cn(
      "flex gap-2",
      today && expandedNotes && "ring-2 ring-blue-200 rounded-lg p-1"
    )}>
      {/* Main Task Column */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col bg-card border rounded-lg overflow-hidden min-h-[600px] w-[300px] flex-shrink-0",
          today ? "border-blue-500 ring-2 ring-blue-200" : "border-border",
          weekend && "opacity-75",
          className
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-3 border-b border-border/50",
          today ? "bg-blue-50 border-blue-200" : "bg-muted/30",
          weekend && "bg-muted/50"
        )}>
          <div className="text-sm font-medium text-center">
            {formatDayName(date)}
          </div>
          <div className={cn(
            "text-lg font-semibold text-center",
            today && "text-blue-700"
          )}>
            {formatDisplayDate(date)}
          </div>
        </div>

        {/* Tasks */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          {/* Notebook background pattern */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Horizontal lines */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-gray-200 opacity-30"
                style={{ top: `${(i + 1) * 30}px` }}
              />
            ))}
          </div>
          <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                isHighlighted={task.id === highlightedTaskId}
                showCompleted={showCompleted}
              />
            ))}
          </SortableContext>
          
          {sortedTasks.length === 0 && (
            <div className="relative p-4 text-center text-muted-foreground text-sm min-h-[200px] flex items-center justify-center">
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
                    <div className="text-xs opacity-75">Sign in below to add your first task</div>
                  </div>
                ) : (
                  "No tasks scheduled"
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add */}
        <div className="p-3 border-t border-border/50">
          <QuickAdd 
            onAdd={handleCreateTask}
            placeholder={today ? "Add task for today..." : "Add task..."}
          />
        </div>
      </div>

      {/* Notes Column */}
      <NotesPanel
        date={date}
        initialContent={notes}
        isExpanded={expandedNotes}
        onToggle={onToggleNotes}
        onSave={handleSaveNotes}
      />
    </div>
  )
}