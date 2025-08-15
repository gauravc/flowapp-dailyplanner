import { format, startOfDay, addDays, subDays, isToday, isWeekend, parseISO, startOfWeek, isValid } from 'date-fns'

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

export function safeFormatDate(date: Date): string {
  if (!isValidDate(date)) {
    console.error('Invalid date passed to safeFormatDate:', date)
    return 'Invalid Date'
  }
  try {
    return format(date, 'yyyy-MM-dd')
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return 'Invalid Date'
  }
}

export function formatDate(date: Date): string {
  if (!isValidDate(date)) {
    console.error('Invalid date passed to formatDate:', date)
    return 'Invalid Date'
  }
  return format(date, 'yyyy-MM-dd')
}

export function formatDisplayDate(date: Date): string {
  if (!isValidDate(date)) {
    console.error('Invalid date passed to formatDisplayDate:', date)
    return 'Invalid Date'
  }
  return format(date, 'EEE dd')
}

export function formatDayName(date: Date): string {
  if (!isValidDate(date)) {
    console.error('Invalid date passed to formatDayName:', date)
    return 'Invalid Date'
  }
  return format(date, 'EEEE')
}

export function getToday(): Date {
  const now = new Date()
  console.log('🔍 getToday() - now:', now, 'isValid:', !isNaN(now.getTime()))
  
  // Create a new date with local midnight to avoid timezone issues
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  console.log('🔍 getToday() - today created:', today, 'isValid:', !isNaN(today.getTime()))
  
  // Validate the created date
  if (!isValidDate(today)) {
    console.error('getToday() created invalid date:', today)
    // Fallback to current date
    return new Date()
  }
  
  return today
}

export function getTodayString(): string {
  return formatDate(getToday())
}

export function getWeekDays(centerDate: Date = getToday()): Date[] {
  console.log('🔍 getWeekDays called with centerDate:', centerDate, 'isValid:', !isNaN(centerDate.getTime()))
  
  // Validate input date
  if (!isValidDate(centerDate)) {
    console.error('getWeekDays() received invalid centerDate:', centerDate)
    centerDate = getToday()
  }
  
  const days: Date[] = []
  // Get Monday to Sunday (7 days)
  const monday = startOfWeek(centerDate, { weekStartsOn: 1 })
  console.log('🔍 Monday calculated:', monday, 'isValid:', !isNaN(monday.getTime()))
  
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i)
    console.log(`🔍 Day ${i} created:`, day, 'isValid:', !isNaN(day.getTime()))
    // Validate each day
    if (!isValidDate(day)) {
      console.error('getWeekDays() created invalid day:', day)
      continue
    }
    days.push(day)
  }
  
  console.log('🔍 Total days created:', days.length)
  
  // Ensure we have 7 valid days
  if (days.length !== 7) {
    console.error('getWeekDays() did not create 7 valid days:', days)
    // Fallback: create a simple week from today
    const today = getToday()
    const mondayFallback = startOfWeek(today, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(mondayFallback, i))
  }
  
  return days
}

export function parseDate(dateString: string): Date {
  // Parse the date string and create a local date without timezone conversion
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isDateToday(date: Date): boolean {
  return isToday(date)
}

export function isDateWeekend(date: Date): boolean {
  return isWeekend(date)
}

export function getDateKey(date: Date): string {
  return formatDate(date)
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days)
}

export function subtractDaysFromDate(date: Date, days: number): Date {
  return subDays(date, days)
}

// Timezone-aware date operations
export function getLocalMidnight(timezone: string = 'UTC'): Date {
  const now = new Date()
  const localTime = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(now)
  
  const year = parseInt(localTime.find(p => p.type === 'year')?.value || '0')
  const month = parseInt(localTime.find(p => p.type === 'month')?.value || '0')
  const day = parseInt(localTime.find(p => p.type === 'day')?.value || '0')
  
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function isTimeForRollover(timezone: string = 'UTC'): boolean {
  const now = new Date()
  const localTime = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now)
  
  const hour = parseInt(localTime.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(localTime.find(p => p.type === 'minute')?.value || '0')
  
  // Rollover window: 00:00 - 00:10 (first 10 minutes after midnight)
  return hour === 0 && minute < 10
}