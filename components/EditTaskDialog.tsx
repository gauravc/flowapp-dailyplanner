'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Task } from './TaskItem'

interface EditTaskDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (taskId: string, updates: any) => void
  onDelete: (taskId: string) => void
}



export function EditTaskDialog({ task, open, onOpenChange, onUpdate, onDelete }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState(task.priority || '')
  
  // Handle scheduledFor - convert to Date if it's a string
  const initialScheduledFor = task.scheduledFor instanceof Date 
    ? task.scheduledFor 
    : new Date(task.scheduledFor)
  const [scheduledFor, setScheduledFor] = useState(
    format(initialScheduledFor, 'yyyy-MM-dd')
  )
  
  // Handle dueDate - convert to Date if it's a string
  const initialDueDate = task.dueDate instanceof Date 
    ? task.dueDate 
    : (task.dueDate ? new Date(task.dueDate) : null)
  const [dueDate, setDueDate] = useState(
    initialDueDate ? format(initialDueDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  )
  
  const [tags, setTags] = useState(
    task.tags.map(t => t.tag.name).join(', ')
  )

  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority || 'none')
      
      // Handle scheduledFor - convert to Date if it's a string
      const scheduledForDate = task.scheduledFor instanceof Date 
        ? task.scheduledFor 
        : new Date(task.scheduledFor)
      setScheduledFor(format(scheduledForDate, 'yyyy-MM-dd'))
      
      // Handle dueDate - convert to Date if it's a string
      const dueDateValue = task.dueDate instanceof Date 
        ? task.dueDate 
        : (task.dueDate ? new Date(task.dueDate) : null)
      setDueDate(dueDateValue ? format(dueDateValue, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
      
      setTags(task.tags.map(t => t.tag.name).join(', '))
    }
  }, [task, open])

  const handleSave = () => {
    // Validate title
    if (!title.trim()) {
      alert('Please enter a task title')
      return
    }

    let dueDateValue: Date | null = null
    
    if (dueDate && dueDate.trim()) {
      // Parse the date string and create a local date without timezone conversion
      const [year, month, day] = dueDate.split('-').map(Number)
      const parsedDate = new Date(year, month - 1, day)
      console.log('Parsing due date:', { dueDate, parsedDate, isValid: !isNaN(parsedDate.getTime()) })
      if (!isNaN(parsedDate.getTime())) {
        dueDateValue = parsedDate
      } else {
        alert('Please enter a valid due date')
        return
      }
    }

    // Parse scheduledFor date
    let scheduledForValue: Date | null = null
    if (scheduledFor && scheduledFor.trim()) {
      // Parse the date string and create a local date without timezone conversion
      const [year, month, day] = scheduledFor.split('-').map(Number)
      const parsedScheduledDate = new Date(year, month - 1, day)
      if (!isNaN(parsedScheduledDate.getTime())) {
        scheduledForValue = parsedScheduledDate
      } else {
        alert('Please enter a valid scheduled date')
        return
      }
    }
    
    const updates: any = {
      title: title.trim(),
      description: description.trim() || null,
      priority: priority === 'none' ? null : priority,
      dueDate: dueDateValue,
    }
    
    // Only include scheduledFor if it's actually different
    if (scheduledForValue) {
      // Convert task.scheduledFor to a Date if it's a string, then compare
      const currentScheduledFor = task.scheduledFor instanceof Date 
        ? task.scheduledFor 
        : new Date(task.scheduledFor)
      
      if (scheduledForValue.getTime() !== currentScheduledFor.getTime()) {
        updates.scheduledFor = scheduledForValue
      }
    }

    console.log('Sending updates:', updates)
    console.log('=== EDIT TASK DEBUG ===')
    console.log('Original task scheduledFor:', task.scheduledFor)
    console.log('New scheduledFor value:', scheduledForValue)
    console.log('Updates object:', updates)
    onUpdate(task.id, updates)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id)
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="A">A (High)</SelectItem>
                  <SelectItem value="B">B (Medium)</SelectItem>
                  <SelectItem value="C">C (Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scheduledFor">Scheduled For</Label>
            <Input
              id="scheduledFor"
              type="date"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, personal, urgent"
            />
            <div className="text-xs text-muted-foreground">
              Separate tags with commas
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}