import { format, startOfDay, addDays, subDays, isToday, isWeekend, parseISO, startOfWeek } from 'date-fns'

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'EEE dd')
}

export function formatDayName(date: Date): string {
  return format(date, 'EEEE')
}

export function getToday(): Date {
  const now = new Date()
  // Create a new date with local midnight to avoid timezone issues
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function getTodayString(): string {
  return formatDate(getToday())
}

export function getWeekDays(centerDate: Date = getToday()): Date[] {
  const days: Date[] = []
  // Get Monday to Sunday (7 days)
  const monday = startOfWeek(centerDate, { weekStartsOn: 1 })
  for (let i = 0; i < 7; i++) {
    days.push(addDays(monday, i))
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