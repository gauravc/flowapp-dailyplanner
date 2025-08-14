'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Search as SearchIcon, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { getWeekDays, getTodayString, formatDate, parseDate } from '@/lib/dates'
import { DayColumn } from '@/components/DayColumn'
import { Search } from '@/components/Search'
import { Task } from '@/components/TaskItem'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Mock user ID for demo purposes
const MOCK_USER_ID = 'user_1'

interface DayNotes {
  [dateKey: string]: string
}

interface ExpandedNotes {
  [dateKey: string]: boolean
}

export default function HomePage() {
  const [currentWeek, setCurrentWeek] = useState(getWeekDays())
  const [tasks, setTasks] = useState<{ [dateKey: string]: Task[] }>({})
  const [notes, setNotes] = useState<DayNotes>({})
  const [expandedNotes, setExpandedNotes] = useState<ExpandedNotes>({})
  const [showCompleted, setShowCompleted] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [highlightedTask, setHighlightedTask] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Load initial data
  useEffect(() => {
    loadWeekData()
  }, [currentWeek])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts (when not typing in input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case '/':
          e.preventDefault()
          setIsSearchOpen(true)
          break
        case 'n':
          e.preventDefault()
          toggleTodayNotes()
          break
        case 'c':
          e.preventDefault()
          setShowCompleted(prev => !prev)
          break
        case '[':
          e.preventDefault()
          navigateWeek(-1)
          break
        case ']':
          e.preventDefault()
          navigateWeek(1)
          break
        case 'Escape':
          setIsSearchOpen(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadWeekData = async () => {
    setIsLoading(true)
    try {
      const startDate = formatDate(currentWeek[0])
      const endDate = formatDate(currentWeek[currentWeek.length - 1])
      
      const response = await fetch(`/api/days?start=${startDate}&end=${endDate}`)
      const data = await response.json()
      
      const tasksByDate: { [dateKey: string]: Task[] } = {}
      const notesByDate: DayNotes = {}
      
      data.days.forEach((day: any) => {
        const dateKey = formatDate(parseDate(day.date))
        tasksByDate[dateKey] = day.tasks || []
        if (day.note?.contentText) {
          notesByDate[dateKey] = day.note.contentText
        }
      })
      
      setTasks(tasksByDate)
      setNotes(notesByDate)
    } catch (error) {
      console.error('Failed to load week data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateWeek = (direction: number) => {
    const newWeek = getWeekDays(new Date(currentWeek[3].getTime() + (direction * 7 * 24 * 60 * 60 * 1000)))
    setCurrentWeek(newWeek)
  }

  const navigateToDate = (dateString: string, taskId?: string) => {
    const targetDate = parseDate(dateString)
    const newWeek = getWeekDays(targetDate)
    setCurrentWeek(newWeek)
    
    if (taskId) {
      setHighlightedTask(taskId)
      setTimeout(() => setHighlightedTask(undefined), 3000)
    }
  }

  const toggleTodayNotes = () => {
    const todayKey = getTodayString()
    setExpandedNotes(prev => ({
      ...prev,
      [todayKey]: !prev[todayKey]
    }))
  }

  const createTask = async (title: string, date: Date) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scheduledFor: formatDate(date),
          userId: MOCK_USER_ID,
        }),
      })
      
      const newTask = await response.json()
      const dateKey = formatDate(date)
      
      setTasks(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newTask]
      }))
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      const updatedTask = await response.json()
      
      // Update task in current tasks state
      setTasks(prev => {
        const newTasks = { ...prev }
        Object.keys(newTasks).forEach(dateKey => {
          const taskIndex = newTasks[dateKey].findIndex(t => t.id === taskId)
          if (taskIndex >= 0) {
            newTasks[dateKey][taskIndex] = updatedTask
          }
        })
        return newTasks
      })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      
      // Remove task from state
      setTasks(prev => {
        const newTasks = { ...prev }
        Object.keys(newTasks).forEach(dateKey => {
          newTasks[dateKey] = newTasks[dateKey].filter(t => t.id !== taskId)
        })
        return newTasks
      })
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? 'done' : 'open' })
  }

  const saveNotes = async (date: Date, content: string) => {
    try {
      await fetch(`/api/day-notes/${formatDate(date)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentText: content,
          userId: MOCK_USER_ID,
        }),
      })
      
      const dateKey = formatDate(date)
      setNotes(prev => ({
        ...prev,
        [dateKey]: content
      }))
    } catch (error) {
      console.error('Failed to save notes:', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    // Could add drag start logic here if needed
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed for visual feedback
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeTask = active.data.current?.task as Task
    if (!activeTask) return

    const overId = over.id.toString()
    
    // Check if dragging to a different day
    if (overId.startsWith('day-')) {
      const targetDate = new Date(overId.replace('day-', ''))
      const targetDateKey = formatDate(targetDate)
      const sourceDateKey = formatDate(activeTask.scheduledFor)
      
      if (targetDateKey !== sourceDateKey) {
        // Move task to different day
        updateTask(activeTask.id, { scheduledFor: targetDate })
        return
      }
    }
    
    // Handle reordering within the same day
    const activeId = active.id.toString()
    const overId_clean = overId
    
    if (activeId !== overId_clean) {
      const sourceDateKey = formatDate(activeTask.scheduledFor)
      const dayTasks = tasks[sourceDateKey] || []
      
      const oldIndex = dayTasks.findIndex(task => task.id === activeId)
      const newIndex = dayTasks.findIndex(task => task.id === overId_clean)
      
      if (oldIndex >= 0 && newIndex >= 0) {
        const reorderedTasks = arrayMove(dayTasks, oldIndex, newIndex)
        
        setTasks(prev => ({
          ...prev,
          [sourceDateKey]: reorderedTasks
        }))
        
        // Update position indices on server
        reorderedTasks.forEach((task, index) => {
          if (task.positionIndex !== index) {
            updateTask(task.id, { positionIndex: index })
          }
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">FlowApp Daily Planner</h1>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(getWeekDays())}
                >
                  Today
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showCompleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showCompleted ? "Hide" : "Show"} Completed
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {currentWeek.map((date) => {
              const dateKey = formatDate(date)
              return (
                <DayColumn
                  key={dateKey}
                  date={date}
                  tasks={tasks[dateKey] || []}
                  notes={notes[dateKey]}
                  onCreateTask={createTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  onToggleTask={toggleTask}
                  onSaveNotes={saveNotes}
                  highlightedTaskId={highlightedTask}
                  showCompleted={showCompleted}
                  expandedNotes={expandedNotes[dateKey] || false}
                  onToggleNotes={() => {
                    setExpandedNotes(prev => ({
                      ...prev,
                      [dateKey]: !prev[dateKey]
                    }))
                  }}
                />
              )
            })}
          </div>
        </DndContext>
      </main>

      {/* Search Modal */}
      <Search
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateToDate}
      />

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-card border border-border rounded p-2 opacity-75">
        <div>Press / to search</div>
        <div>Press n to toggle today&apos;s notes</div>
        <div>Press c to toggle completed tasks</div>
        <div>Press [ / ] to navigate weeks</div>
      </div>
    </div>
  )
}
                