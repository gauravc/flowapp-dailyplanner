'use client'

import { useState } from 'react'
import { format, isPast } from 'date-fns'
import { isDateToday } from '@/lib/dates'
import { Calendar, Edit, Clock } from 'lucide-react'
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
  index: number
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
  index,
  onToggle, 
  onUpdate, 
  onDelete, 
  isHighlighted = false,
  showCompleted = true 
}: TaskItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const isCompleted = task.status === 'done'
  const isOverdue = task.dueDate && isPast(task.dueDate) && !isCompleted
  
  // Safety check for required properties
  if (!task.scheduledFor) {
    console.warn('Task missing scheduledFor property:', task)
    return null
  }

  const style = {
    opacity: isCompleted ? 0.6 : 1,
  }

  const handleToggle = () => {
    onToggle(task.id, !isCompleted)
  }

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id)
    }
  }

  const handleUpdate = (updates: Partial<Task>) => {
    onUpdate(task.id, updates)
    setIsEditOpen(false)
  }

  // Don't render completed tasks if they should be hidden
  if (!showCompleted && isCompleted) {
    return null
  }

  return (
    <>
      <div
        className={cn(
          "group relative bg-white border border-gray-200 rounded-lg p-3 mb-3 transition-all duration-200 hover:shadow-md",
          isHighlighted && "ring-2 ring-blue-400 shadow-lg",
          isCompleted && "bg-gray-50",
          isOverdue && "border-red-300 bg-red-50"
        )}
        style={style}
      >
        {/* Main Task Content */}
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 mt-1">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggle}
              className="h-4 w-4"
            />
          </div>

          {/* Task Details */}
          <div className="flex-1 min-w-0">
            {/* Task Title */}
            <div className={cn(
              "text-sm font-medium text-gray-900 mb-2",
              isCompleted && "line-through text-gray-500"
            )}>
              {task.title}
            </div>

            {/* Due Date - Only show if explicitly set and different from scheduled date */}
            {task.dueDate && (
              <div className="flex items-center space-x-1 text-xs text-gray-600 mb-2">
                <Clock className="h-3 w-3" />
                <span>Due: {format(task.dueDate, 'MMM d')}</span>
                {isOverdue && (
                  <span className="text-red-600 font-medium">(Overdue)</span>
                )}
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {task.tags.map((tagObj, tagIndex) => (
                  <Badge
                    key={tagIndex}
                    variant="secondary"
                    className={cn(
                      "text-xs px-1 py-0.5",
                      getTagColor(tagObj.tag.name)
                    )}
                  >
                    {tagObj.tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Rollover Count */}
            {task.rolloverCount > 0 && (
              <div className="text-xs text-orange-600 font-medium">
                Rolled over {task.rolloverCount} time{task.rolloverCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={(taskId, updates) => handleUpdate(updates)}
        onDelete={handleDelete}
      />
    </>
  )
}