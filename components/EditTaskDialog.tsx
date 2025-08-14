'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
}



export function EditTaskDialog({ task, open, onOpenChange, onUpdate, onDelete }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState(task.priority || '')
  const [dueDate, setDueDate] = useState(
    task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : ''
  )
  const [tags, setTags] = useState(
    task.tags.map(t => t.tag.name).join(', ')
  )

  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority || 'none')
      setDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '')
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
      const parsedDate = new Date(dueDate + 'T00:00:00.000Z')
      console.log('Parsing due date:', { dueDate, parsedDate, isValid: !isNaN(parsedDate.getTime()) })
      if (!isNaN(parsedDate.getTime())) {
        dueDateValue = parsedDate
      } else {
        alert('Please enter a valid due date')
        return
      }
    }

    const updates: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || null,
      priority: priority === 'none' ? null : priority,
      dueDate: dueDateValue,
    }

    console.log('Sending updates:', updates)
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