'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast } from 'date-fns'
import { Calendar, Edit, GripVertical, Clock } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditTaskDialog } from './EditTaskDialog'
import { cn } from '@/lib/utils'

export interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  priority?: string | null
  scheduledFor: Date
  dueDate?: Date | null
  rolloverCount: number
  positionIndex: number
  tags: Array<{ tag: { name: string } }>
  createdAt: Date
  updatedAt: Date
}

interface TaskItemProps {
  task: Task
  onToggle: (taskId: string, completed: boolean) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  isHighlighted?: boolean
  showCompleted?: boolean
}

// Function to generate consistent colors for tags
function getTagColor(tagName: string): string {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-red-100 text-red-800 border-red-300',
    'bg-yellow-100 text-yellow-800 border-yellow-300',
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-cyan-100 text-cyan-800 border-cyan-300',
  ]
  
  // Use the tag name to consistently assign colors
  const hash = tagName.split('').reduce((a, b) => {
    a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff
    return a
  }, 0)
  
  return colors[Math.abs(hash) % colors.length]
}

export function TaskItem({ 
  task, 
  onToggle, 
  onUpdate, 
  onDelete, 
  isHighlighted = false,
  showCompleted = true 
}: TaskItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const isCompleted = task.status === 'done'
  const isOverdue = task.dueDate && isPast(task.dueDate) && !isCompleted
  
  // Call hooks before any conditional returns
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

  // Safety check for required properties
  if (!task.scheduledFor) {
    console.warn('Task missing scheduledFor property:', task)
    return null
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isCompleted && !showCompleted) {
    return null
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-start gap-2 p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors relative min-h-[80px]",
          isDragging && "opacity-50",
          isHighlighted && "highlight-match",
          isCompleted && "opacity-60"
        )}
      >
        {/* Notebook line styling */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
        {/* Additional notebook lines for better spacing */}
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-200 opacity-50"></div>
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-200 opacity-50"></div>
        
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggle(task.id, !!checked)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          {/* Task title and dates row */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "text-sm font-medium flex-1",
                isCompleted && "line-through",
                isOverdue && "text-destructive"
              )}
            >
              {task.title}
            </div>
            
            {/* Scheduled Date (always visible) */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Clock className="h-3 w-3" />
              <span>
                {format(task.scheduledFor, 'MMM d')}
              </span>
            </div>
            
            {/* Due Date (if set) */}
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Calendar className="h-3 w-3" />
                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                  {format(task.dueDate, 'MMM d')}
                </span>
              </div>
            )}
          </div>
          
          {/* Tags row - below the task text */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((taskTag) => {
                const tagName = taskTag?.tag?.name || 'unknown'
                const tagColor = getTagColor(tagName)
                return (
                  <span 
                    key={tagName} 
                    className={cn(
                      "inline-block text-xs px-2 py-1 border rounded-md font-medium",
                      tagColor
                    )}
                  >
                    #{tagName}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 mt-1"
          onClick={() => setIsEditOpen(true)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>

      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  )
}