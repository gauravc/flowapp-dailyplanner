import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseDate } from '@/lib/dates'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    const startDate = parseDate(start)
    const endDate = parseDate(end)

    // Get tasks for the date range
    const tasks = await db.task.findMany({
      where: {
        userId: session.user.id,
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [
        { scheduledFor: 'asc' },
        { positionIndex: 'asc' },
      ],
    })

    // Get notes for the date range
    const notes = await db.dayNote.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Group data by date
    const days: { [dateKey: string]: any } = {}
    
    // Initialize all days in range
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      days[dateKey] = {
        date: dateKey,
        tasks: [],
        note: null,
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Add tasks to days
    tasks.forEach(task => {
      const dateKey = task.scheduledFor.toISOString().split('T')[0]
      if (days[dateKey]) {
        days[dateKey].tasks.push({
          ...task,
          scheduledFor: task.scheduledFor,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        })
      }
    })

    // Add notes to days
    notes.forEach(note => {
      const dateKey = note.date.toISOString().split('T')[0]
      if (days[dateKey]) {
        days[dateKey].note = note
      }
    })

    return NextResponse.json({
      days: Object.values(days),
    })
  } catch (error) {
    console.error('Error fetching days:', error)
    return NextResponse.json(
      { error: 'Failed to fetch days' },
      { status: 500 }
    )
  }
}