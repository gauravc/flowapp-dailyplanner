'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { ChevronLeft, ChevronRight, Calendar, User, LogOut, MoreHorizontal, CheckSquare, Square } from 'lucide-react'
import { DayColumn } from '@/components/DayColumn'
import { Search } from '@/components/Search'
import { getWeekDays, getToday, formatDate, formatDayName, formatDisplayDate } from '@/lib/dates'
import { Task } from '@/components/TaskItem'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [currentWeek, setCurrentWeek] = useState<Date[]>([])
  const [currentView, setCurrentView] = useState<'today' | 'week'>('week')
  const [showCompleted, setShowCompleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | undefined>(undefined)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  // Mobile day navigation state
  const [mobileCurrentDayIndex, setMobileCurrentDayIndex] = useState(0)

  // Mobile day navigation functions
  const goToPreviousDay = () => {
    setMobileCurrentDayIndex(prev => Math.max(0, prev - 1))
  }

  const goToNextDay = () => {
    setMobileCurrentDayIndex(prev => Math.min(currentWeek.length - 1, prev + 1))
  }

  const goToDay = (dayIndex: number) => {
    setMobileCurrentDayIndex(Math.max(0, Math.min(currentWeek.length - 1, dayIndex)))
  }

  // Get the current day for mobile view
  const getMobileCurrentDay = () => {
    return currentWeek[mobileCurrentDayIndex] || currentWeek[0] || new Date()
  }

  // Touch swipe support
  const mainContentRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu && !(event.target as Element).closest('.profile-menu')) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu])

  // Debug logging
  console.log('🔍 HomePage Debug:', { 
    status, 
    hasSession: !!session, 
    sessionData: session,
    sessionKeys: session ? Object.keys(session) : [],
    userData: session?.user ? Object.keys(session.user) : []
  })

  // Session timeout handling
  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => {
        console.log('⚠️ Session loading timeout - forcing refresh')
        setSessionError('Session loading timeout. Please try again.')
      }, 15000) // 15 second timeout
      
      return () => clearTimeout(timer)
    }
  }, [status])

  // Manual session check
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      console.log('🔍 Manual session check:', data)
      if (data.user) {
        window.location.reload()
      }
    } catch (error) {
      console.error('❌ Session check failed:', error)
    }
  }

  // Initialize current week and mobile day
  useEffect(() => {
    const today = getToday()
    const weekDays = getWeekDays(today)
    setCurrentWeek(weekDays)
    
    // Find today's index in the week
    const todayIndex = weekDays.findIndex(date => 
      date.toDateString() === today.toDateString()
    )
    setMobileCurrentDayIndex(todayIndex >= 0 ? todayIndex : 0)
  }, [])

  const loadWeekData = useCallback(async () => {
    if (!session?.user?.id || currentWeek.length === 0) return

    try {
      const startDate = currentWeek[0]
      const endDate = currentWeek[currentWeek.length - 1]
      
      const response = await fetch(`/api/days?start=${formatDate(startDate)}&end=${formatDate(endDate)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        const newTasks: { [dateKey: string]: Task[] } = {}
        
        data.days.forEach((day: any) => {
          newTasks[day.date] = day.tasks || []
        })
        
        setTasks(newTasks)
      }
    } catch (error) {
      console.error('Error loading week data:', error)
    }
  }, [session?.user?.id, currentWeek])

  // Load week data when currentWeek changes
  useEffect(() => {
    if (currentWeek.length > 0) {
      console.log('🔍 Loading data for week:', currentWeek.map(d => d.toDateString()))
      loadWeekData()
    }
  }, [currentWeek, loadWeekData])

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      if (currentView === 'today') {
        const newDate = new Date(prev[0])
        if (direction === 'next') {
          newDate.setDate(newDate.getDate() + 1)
        } else {
          newDate.setDate(newDate.getDate() - 1)
        }
        // Validate the new date
        if (isNaN(newDate.getTime())) {
          console.error('Invalid date created during navigation:', newDate)
          return prev // Return previous state if invalid
        }
        return [newDate]
      } else {
        // Week view navigation
        const newWeek = prev.map(date => {
          const newDate = new Date(date)
          if (direction === 'next') {
            newDate.setDate(newDate.getDate() + 7)
          } else {
            newDate.setDate(newDate.getDate() - 7)
          }
          // Validate the new date
          if (isNaN(newDate.getTime())) {
            console.error('Invalid date created during week navigation:', newDate)
            return date // Return original date if invalid
          }
          return newDate
        })
        return newWeek
      }
    })
  }, [currentView])

  const toggleView = useCallback(() => {
    if (currentView === 'today') {
      // Switch to week view
      const today = getToday()
      const weekDays = getWeekDays(today)
      setCurrentWeek(weekDays)
      setCurrentView('week')
    } else {
      // Switch to today view
      const today = getToday()
      setCurrentWeek([today])
      setCurrentView('today')
    }
  }, [currentView])

  const resetToToday = useCallback(() => {
    const today = getToday()
    if (currentView === 'today') {
      setCurrentWeek([today])
    } else {
      const weekDays = getWeekDays(today)
      setCurrentWeek(weekDays)
    }
  }, [currentView])

  // Touch swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && mobileCurrentDayIndex < currentWeek.length - 1) {
      // Swipe left = next day (if not at the end)
      goToNextDay()
    } else if (isRightSwipe && mobileCurrentDayIndex > 0) {
      // Swipe right = previous day (if not at the beginning)
      goToPreviousDay()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const createTask = useCallback(async (title: string, scheduledFor: Date, tags: string[] = []) => {
    console.log('🔍 createTask called with:', { title, scheduledFor, tags })
    console.log('🔍 scheduledFor isValid:', !isNaN(scheduledFor.getTime()))
    
    if (!session?.user?.id) {
      console.error('❌ No session user ID')
      return
    }

    try {
      console.log('🔍 Making API request to /api/tasks')
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scheduledFor: formatDate(scheduledFor), // Send as string, not Date object
          tags
        })
      })

      console.log('🔍 API response status:', response.status)
      
      if (response.ok) {
        const newTask = await response.json()
        console.log('🔍 New task created:', newTask)
        const dateKey = formatDate(scheduledFor)
        console.log('🔍 Date key for task:', dateKey)
        
        setTasks(prev => {
          const newTasks = { ...prev }
          const currentTasks = newTasks[dateKey] || []
          newTasks[dateKey] = [...currentTasks, newTask]
          console.log('🔍 Updated tasks for date:', dateKey, newTasks[dateKey])
          return newTasks
        })
      } else {
        const errorData = await response.text()
        console.error('❌ API error:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ Error creating task:', error)
    }
  }, [session?.user?.id])

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const updatedTask = await response.json()
        
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
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }, [session?.user?.id])

  const deleteTask = useCallback(async (taskId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTasks(prev => {
          const newTasks = { ...prev }
          Object.keys(newTasks).forEach(dateKey => {
            newTasks[dateKey] = newTasks[dateKey].filter(t => t.id !== taskId)
          })
          return newTasks
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }, [session?.user?.id])

  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? 'done' : 'open' })
  }, [updateTask])

  if (status === 'loading') {
    console.log('🔄 Status is loading, showing loading screen')
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading your tasks...</p>
          
          {sessionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">{sessionError}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Force Refresh
            </button>
            
            <button
              onClick={checkSession}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-2"
            >
              Check Session
            </button>
            
            <div className="text-xs text-gray-500 mt-2">
              Session status: {status}
            </div>
            
            <div className="text-xs text-gray-400 mt-1">
              <a href="/auth/signin" className="text-blue-600 hover:underline">
                Try signing in directly
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    console.log('❌ No session, showing unauthenticated screen')
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to FlowApp</h1>
          <p className="text-gray-600 mb-8">
            Your personal daily planner with smart task management and beautiful organization.
          </p>
          <div className="space-y-4">
            <a
              href="/auth/signin"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/auth/signup"
              className="block w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    )
  }

  console.log('✅ Session found, rendering main app')

  const today = getToday()
  const todayKey = formatDate(today)
  const todayTasks = tasks[todayKey] || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Title and View Toggle */}
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-gray-900">FlowApp</h1>
            <button
              onClick={toggleView}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{currentView === 'today' ? 'Today' : 'Week'}</span>
            </button>
          </div>

          {/* Right side - User menu and actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              title={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
            >
              {showCompleted ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
            </button>
            
            <div className="relative profile-menu">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="User menu"
              >
                <User className="h-5 w-5" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-50">
                  <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">
                    {session.user.email}
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      signOut()
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation and Today Button */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              title="Previous day/week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={resetToToday}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
            >
              Today
            </button>
            
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              title="Next day/week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <Search
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onTaskHighlight={setHighlightedTaskId}
        />
      </div>

      {/* Main Content with Touch Support */}
      <div 
        ref={mainContentRef}
        className="flex-1 p-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {currentView === 'today' ? (
          /* Today View - Single Column for Mobile */
          <div className="lg:hidden max-w-md mx-auto">
            <DayColumn
              date={currentWeek[0]}
              tasks={todayTasks}
              onCreateTask={createTask}
              onToggleTask={toggleTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              showCompleted={showCompleted}
              highlightedTaskId={highlightedTaskId}
              className="w-full"
            />
          </div>
        ) : (
          /* Week View - Single Day for Mobile with Sliding Animation */
          <div className="block lg:hidden">
            {/* Mobile Day Header */}
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-gray-900">
                {formatDayName(getMobileCurrentDay())} - {formatDisplayDate(getMobileCurrentDay())}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Swipe left/right to navigate days
              </div>
            </div>
            
            <div className="max-w-md mx-auto overflow-hidden">
              <div 
                className="transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${mobileCurrentDayIndex * 100}%)` }}
              >
                <div className="flex">
                  {currentWeek.map((date, index) => (
                    <div key={date.toISOString()} className="w-full flex-shrink-0">
                      <DayColumn
                        date={date}
                        tasks={tasks[formatDate(date)] || []}
                        onCreateTask={createTask}
                        onToggleTask={toggleTask}
                        onUpdateTask={updateTask}
                        onDeleteTask={deleteTask}
                        showCompleted={showCompleted}
                        highlightedTaskId={highlightedTaskId}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Week View - Full Width Grid with Notes Columns */}
        {currentView === 'week' && (
          <div className="hidden lg:block lg:px-6 lg:pb-4">
            <div className="grid grid-cols-7 gap-4">
              {currentWeek.map((date, index) => (
                <DayColumn
                  key={date.toISOString()}
                  date={date}
                  tasks={tasks[formatDate(date)] || []}
                  onCreateTask={createTask}
                  onToggleTask={toggleTask}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                  showCompleted={showCompleted}
                  highlightedTaskId={highlightedTaskId}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Week Navigation Dots */}
      {currentView === 'week' && (
        <div className="lg:hidden flex justify-center space-x-3 py-4 bg-white border-t border-gray-200">
          {currentWeek.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString()
            const isCurrent = index === mobileCurrentDayIndex // Current mobile day
            return (
              <button
                key={index}
                onClick={() => goToDay(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  isToday ? "bg-blue-600" : isCurrent ? "bg-gray-500" : "bg-gray-300"
                )}
                title={`${formatDayName(date)} - ${formatDisplayDate(date)}${isToday ? ' (Today)' : ''}`}
              />
            )
          })}
        </div>
      )}

      {/* Swipe Instructions for Mobile */}
      <div className="lg:hidden text-center text-xs text-gray-500 py-2 border-t border-gray-200">
        <span>Swipe left/right to navigate days</span>
      </div>
    </div>
  )
}
                