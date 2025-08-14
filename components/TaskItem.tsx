'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast } from 'date-fns'
import { Calendar, Edit, GripVertical } from 'lucide-react'
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
          "group flex items-center gap-2 p-2 border-b border-gray-200 hover:bg-gray-50 transition-colors relative",
          isDragging && "opacity-50",
          isHighlighted && "highlight-match",
          isCompleted && "opacity-60"
        )}
      >
        {/* Notebook line styling */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
        
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggle(task.id, !!checked)}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "text-sm font-medium flex-1",
                isCompleted && "line-through",
                isOverdue && "text-destructive"
              )}
            >
              {task.title}
            </div>
            
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Calendar className="h-3 w-3" />
                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                  {format(task.dueDate, 'MMM d')}
                </span>
              </div>
            )}
            
            {task.tags.length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {task.tags.map((taskTag) => (
                  <span 
                    key={taskTag.tag.name} 
                    className="inline-block text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-sm font-medium"
                  >
                    #{taskTag.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
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