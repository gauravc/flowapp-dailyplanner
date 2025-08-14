'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import { Search as SearchIcon, Filter, Eye, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react'
import { getWeekDays, getTodayString, formatDate, parseDate } from '@/lib/dates'
import { DayColumn } from '@/components/DayColumn'
import { Search } from '@/components/Search'
import { Task } from '@/components/TaskItem'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DayNotes {
  [dateKey: string]: string
}

interface ExpandedNotes {
  [dateKey: string]: boolean
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Always start with today's week to prevent date shifting
    const today = new Date()
    return getWeekDays(today)
  })
  const [tasks, setTasks] = useState<{ [dateKey: string]: Task[] }>({})
  const [notes, setNotes] = useState<DayNotes>({})
  const [expandedNotes, setExpandedNotes] = useState<ExpandedNotes>({})
  const [showCompleted, setShowCompleted] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [highlightedTask, setHighlightedTask] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string>()

  // Note: Automatic redirect removed to prevent infinite loading
  // Users will see the sign-in prompt below when not authenticated
  
  // Note: Timeout mechanism removed for simplicity

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Load initial data
  useEffect(() => {
    console.log('Session changed:', { session, userId: session?.user?.id })
    if (session?.user?.id) {
      loadWeekData()
    } else {
      console.log('No session or user ID, skipping data load')
    }
  }, [currentWeek, session?.user?.id])

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

  // Define all functions before any conditional returns
  const loadWeekData = useCallback(async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    try {
      const startDate = formatDate(currentWeek[0])
      const endDate = formatDate(currentWeek[currentWeek.length - 1])
      
      const response = await fetch(`/api/days?start=${startDate}&end=${endDate}`, {
        credentials: 'include', // Include cookies for authentication
      })
      const data = await response.json()
      
      const tasksByDate: { [dateKey: string]: Task[] } = {}
      const notesByDate: DayNotes = {}
      
      console.log('Loading week data:', { startDate, endDate, data })
      
      data.days.forEach((day: any) => {
        const dateKey = formatDate(parseDate(day.date))
        console.log(`Processing day ${day.date} -> dateKey: ${dateKey}`)
        tasksByDate[dateKey] = day.tasks || []
        if (day.note?.contentText) {
          notesByDate[dateKey] = day.note.contentText
        }
      })
      
      console.log('Final tasksByDate:', tasksByDate)
      setTasks(tasksByDate)
      setNotes(notesByDate)
    } catch (error) {
      console.error('Failed to load week data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentWeek, session?.user?.id])

  const navigateWeek = useCallback((direction: number) => {
    const newWeek = getWeekDays(new Date(currentWeek[3].getTime() + (direction * 7 * 24 * 60 * 60 * 1000)))
    setCurrentWeek(newWeek)
  }, [currentWeek])

  const resetToToday = useCallback(() => {
    const today = new Date()
    setCurrentWeek(getWeekDays(today))
  }, [])

  const navigateToDate = useCallback((dateString: string, taskId?: string) => {
    const targetDate = parseDate(dateString)
    const newWeek = getWeekDays(targetDate)
    setCurrentWeek(newWeek)
    
    if (taskId) {
      setHighlightedTask(taskId)
      setTimeout(() => setHighlightedTask(undefined), 3000)
    }
  }, [])

  const toggleTodayNotes = useCallback(() => {
    const todayKey = getTodayString()
    setExpandedNotes(prev => ({
      ...prev,
      [todayKey]: !prev[todayKey]
    }))
  }, [])

  const createTask = useCallback(async (title: string, date: Date, tags?: string[]) => {
    try {
      const dateKey = formatDate(date)
      console.log('=== TASK CREATION DEBUG ===')
      console.log('Creating task:', { title, date, formattedDate: dateKey })
      console.log('Current week dates:', currentWeek.map(d => formatDate(d)))
      console.log('Current tasks state keys:', Object.keys(tasks))
      console.log('Target date key:', dateKey)
      console.log('Tasks for target date before creation:', tasks[dateKey] || [])
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          title,
          scheduledFor: dateKey,
          tags: tags || [],
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Task creation failed:', errorData)
        throw new Error(`Failed to create task: ${errorData.error || 'Unknown error'}`)
      }
      
      const newTask = await response.json()
      console.log('Task created successfully:', newTask)
      
      // Ensure the task has the proper structure
      const taskWithDefaults = {
        ...newTask,
        scheduledFor: new Date(newTask.scheduledFor), // Convert string to Date
        tags: newTask.tags || [],
        rolloverCount: newTask.rolloverCount || 0,
        positionIndex: newTask.positionIndex || 0,
        status: newTask.status || 'open'
      }
      
      console.log('Task with defaults:', taskWithDefaults)
      
      setTasks(prev => {
        const newTasks = { ...prev }
        const currentTasks = newTasks[dateKey] || []
        
        // Check if task already exists to prevent duplicates
        const taskExists = currentTasks.some(t => t.id === taskWithDefaults.id)
        if (taskExists) {
          console.warn('Task already exists, skipping duplicate addition:', taskWithDefaults.id)
          return prev
        }
        
        newTasks[dateKey] = [...currentTasks, taskWithDefaults]
        console.log('=== STATE UPDATE DEBUG ===')
        console.log('Previous state keys:', Object.keys(prev))
        console.log('New state keys:', Object.keys(newTasks))
        console.log('Tasks for target date after update:', newTasks[dateKey])
        console.log('Full updated state:', newTasks)
        return newTasks
      })
      
      console.log('=== TASK CREATION COMPLETE ===')
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }, [tasks]) // Add tasks dependency to prevent stale state issues

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('=== UPDATE TASK DEBUG ===')
      console.log('Task ID:', taskId)
      console.log('Updates:', updates)
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(updates),
      })
      
      const updatedTask = await response.json()
      console.log('API response:', updatedTask)
      
      // Ensure the updated task has the proper structure with correct scheduledFor
      const updatedTaskWithDefaults = {
        ...updatedTask,
        scheduledFor: new Date(updatedTask.scheduledFor), // Convert string to Date
        tags: updatedTask.tags || [],
        rolloverCount: updatedTask.rolloverCount || 0,
        positionIndex: updatedTask.positionIndex || 0,
        status: updatedTask.status || 'open'
      }
      
      console.log('Updated task with defaults:', updatedTaskWithDefaults)
      
      // Update task in current tasks state
      setTasks(prev => {
        const newTasks = { ...prev }
        console.log('Previous tasks state:', prev)
        
        // Find the current task to compare dates
        let currentTask: Task | undefined
        let currentDateKey: string | undefined
        
        for (const [dateKey, tasks] of Object.entries(newTasks)) {
          const task = tasks.find(t => t.id === taskId)
          if (task) {
            currentTask = task
            currentDateKey = dateKey
            break
          }
        }
        
        console.log('Current task found:', currentTask)
        console.log('Current date key:', currentDateKey)
        
        // Check if scheduledFor actually changed
        const scheduledForChanged = updates.scheduledFor !== undefined
        
        console.log('ScheduledFor changed?', scheduledForChanged)
        console.log('Old date:', currentTask?.scheduledFor)
        console.log('New date:', updates.scheduledFor)
        console.log('Old date formatted:', currentTask ? formatDate(currentTask.scheduledFor) : 'N/A')
        console.log('New date formatted:', updates.scheduledFor ? formatDate(updates.scheduledFor) : 'N/A')
        console.log('Date comparison result:', currentTask && updates.scheduledFor ? formatDate(updates.scheduledFor) !== formatDate(currentTask.scheduledFor) : 'N/A')
        
        if (scheduledForChanged && currentDateKey && updates.scheduledFor) {
          console.log('Moving task from', currentDateKey, 'to', formatDate(updates.scheduledFor))
          
          // Remove from old date
          newTasks[currentDateKey] = newTasks[currentDateKey].filter(t => t.id !== taskId)
          
          // Add to new date
          const newDateKey = formatDate(updates.scheduledFor)
          if (!newTasks[newDateKey]) {
            newTasks[newDateKey] = []
          }
          
          // Check if task already exists in the new date to prevent duplicates
          const taskExistsInNewDate = newTasks[newDateKey].some(t => t.id === taskId)
          if (!taskExistsInNewDate) {
            newTasks[newDateKey].push(updatedTaskWithDefaults)
          } else {
            console.warn('Task already exists in new date, skipping duplicate addition:', taskId)
          }
          
          console.log('Task moved successfully')
        } else {
          console.log('No date change, updating in place')
          // No scheduledFor change, just update in place
          Object.keys(newTasks).forEach(dateKey => {
            const taskIndex = newTasks[dateKey].findIndex(t => t.id === taskId)
            if (taskIndex >= 0) {
              newTasks[dateKey][taskIndex] = updatedTaskWithDefaults
            }
          })
        }
        
        console.log('Final tasks state:', newTasks)
        return newTasks
      })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }, [])

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
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
  }, [])

  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? 'done' : 'open' })
  }, [updateTask])

  const saveNotes = useCallback(async (date: Date, content: string) => {
    try {
      await fetch(`/api/day-notes/${formatDate(date)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          contentText: content,
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
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id.toString())
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    if (activeId !== overId) {
      // Find the date key for the active task
      const activeDateKey = Object.keys(tasks).find(key => 
        tasks[key]?.some(task => task.id === activeId)
      )
      
      // Find the date key for the over task
      const overDateKey = Object.keys(tasks).find(key => 
        tasks[key]?.some(task => task.id === overId)
      )

      if (activeDateKey && overDateKey) {
        const activeTask = tasks[activeDateKey]?.find(task => task.id === activeId)
        const overTask = tasks[overDateKey]?.find(task => task.id === overId)

        if (activeTask && overTask) {
          const activeDateKeyFormatted = formatDate(activeTask.scheduledFor)
          const overDateKeyFormatted = formatDate(overTask.scheduledFor)

          if (activeDateKeyFormatted !== overDateKeyFormatted) {
            // Move task to different day
            setTasks(prev => {
              const newTasks = { ...prev }
              
              // Remove from old day
              if (newTasks[activeDateKeyFormatted]) {
                newTasks[activeDateKeyFormatted] = newTasks[activeDateKeyFormatted].filter(t => t.id !== activeId)
              }
              
              // Add to new day
              if (!newTasks[overDateKeyFormatted]) {
                newTasks[overDateKeyFormatted] = []
              }
              newTasks[overDateKeyFormatted].push({ ...activeTask, scheduledFor: overTask.scheduledFor })
              
              return newTasks
            })

            // Update on server
            updateTask(activeId, { scheduledFor: overTask.scheduledFor })
          }
        }
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(undefined)

    if (!over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    if (activeId !== overId) {
      // Find the date key for the active task
      const sourceDateKey = Object.keys(tasks).find(key => 
        tasks[key]?.some(task => task.id === activeId)
      )

      if (sourceDateKey) {
        const activeTask = tasks[sourceDateKey]?.find(task => task.id === activeId)
        
        if (activeTask) {
          const dayTasks = tasks[sourceDateKey] || []
          
          const oldIndex = dayTasks.findIndex(task => task.id === activeId)
          const newIndex = dayTasks.findIndex(task => task.id === overId)
          
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
    }
  }

  // Show loading while checking authentication (brief loading state)
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">F</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to FlowApp</h1>
            <div className="text-xl text-gray-600 leading-relaxed">
              Your personal daily planner with Franklin-Covey task rollover
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-lg text-gray-600 mb-4">Checking authentication...</div>
                <div className="text-sm text-gray-500">This may take a moment</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>© 2024 FlowApp. All rights reserved.</p>
          </div>
        </div>
      </div>
    )
  }

    // Show sign in prompt if not authenticated - Updated
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
              <span className="text-3xl font-bold text-white">F</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to FlowApp</h1>
            <div className="text-xl text-gray-600 leading-relaxed">
              Your personal daily planner with Franklin-Covey task rollover
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="space-y-6">
              <a 
                href="/auth/signin" 
                className="inline-flex items-center justify-center w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
              >
                Sign In to Your Account
              </a>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-4">
                  Don&apos;t have an account?
                </div>
                <a 
                  href="/auth/signup" 
                  className="inline-flex items-center justify-center w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Create New Account
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>© 2024 FlowApp. All rights reserved.</p>
          </div>
        </div>
      </div>
    )
  }





  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-4">
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
                  onClick={resetToToday}
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

              {/* User Menu */}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                <span className="text-sm text-muted-foreground">
                  {session.user?.name || session.user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ 
                  callbackUrl: `${window.location.origin}/auth/signin` 
                })}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
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
      
      {/* Authentication notice */}
      <div className="fixed bottom-4 left-4 text-xs text-muted-foreground bg-card border border-border rounded p-2 opacity-75 max-w-xs">
        <div className="font-medium mb-1">💡 Task Creation</div>
        <div>Sign in to create and manage tasks. Tasks are saved to your personal account.</div>
      </div>
    </div>
  )
}
                