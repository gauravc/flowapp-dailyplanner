import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseDate } from '@/lib/dates'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const taskId = params.id

    console.log('API received body:', body)
    console.log('dueDate type:', typeof body.dueDate)
    console.log('dueDate value:', body.dueDate)
    if (body.dueDate instanceof Date) {
      console.log('dueDate is Date, isValid:', !isNaN(body.dueDate.getTime()))
    }

    // Get the existing task
    const existingTask = await db.task.findUnique({
      where: { id: taskId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user owns this task
    if (existingTask.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.positionIndex !== undefined) updateData.positionIndex = body.positionIndex
    
    if (body.scheduledFor !== undefined) {
      console.log('Processing scheduledFor:', body.scheduledFor)
      
      // When sent via fetch, Date objects become strings, so we need to handle both cases
      if (body.scheduledFor && typeof body.scheduledFor === 'string') {
        // Handle both ISO strings and YYYY-MM-DD format
        let parsedDate: Date
        
        if (body.scheduledFor.includes('T')) {
          // ISO string format (e.g., '2025-08-14T07:00:00.000Z')
          console.log('Detected ISO string format, parsing with new Date()')
          parsedDate = new Date(body.scheduledFor)
          console.log('Parsed result:', parsedDate, 'Valid:', !isNaN(parsedDate.getTime()))
        } else {
          // YYYY-MM-DD format
          console.log('Detected YYYY-MM-DD format, parsing with parseDate()')
          parsedDate = parseDate(body.scheduledFor)
          console.log('Parsed result:', parsedDate, 'Valid:', !isNaN(parsedDate.getTime()))
        }
        
        if (!isNaN(parsedDate.getTime())) {
          console.log('Successfully parsed scheduledFor to Date:', parsedDate)
          updateData.scheduledFor = parsedDate
        } else {
          console.log('Failed to parse scheduledFor to Date, setting to null')
          updateData.scheduledFor = null
        }
      } else if (body.scheduledFor && body.scheduledFor instanceof Date && !isNaN(body.scheduledFor.getTime())) {
        console.log('Using scheduledFor Date object directly')
        updateData.scheduledFor = body.scheduledFor
      } else {
        console.log('Setting scheduledFor to null')
        updateData.scheduledFor = null
      }
    }
    
    if (body.dueDate !== undefined) {
      console.log('Processing dueDate:', body.dueDate)
      
      // When sent via fetch, Date objects become strings, so we need to handle both cases
      if (body.dueDate && typeof body.dueDate === 'string') {
        // Parse the date string and create a local date without timezone conversion
        const [year, month, day] = body.dueDate.split('-').map(Number)
        const parsedDate = new Date(year, month - 1, day)
        if (!isNaN(parsedDate.getTime())) {
          console.log('Successfully parsed string to Date:', parsedDate)
          updateData.dueDate = parsedDate
        } else {
          console.log('Failed to parse string to Date, setting to null')
          updateData.dueDate = null
        }
      } else if (body.dueDate && body.dueDate instanceof Date && !isNaN(body.dueDate.getTime())) {
        console.log('Using Date object directly')
        updateData.dueDate = body.dueDate
      } else {
        console.log('Setting dueDate to null')
        updateData.dueDate = null
      }
    }

    console.log('Final updateData:', updateData)

    // Final validation: ensure no invalid dates are sent to Prisma
    if (updateData.dueDate && updateData.dueDate instanceof Date && isNaN(updateData.dueDate.getTime())) {
      console.log('Invalid dueDate detected, setting to null')
      updateData.dueDate = null
    }
    
    if (updateData.scheduledFor && updateData.scheduledFor instanceof Date && isNaN(updateData.scheduledFor.getTime())) {
      console.log('Invalid scheduledFor detected, setting to null')
      updateData.scheduledFor = null
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Create history entry
    const historyType = body.status !== undefined 
      ? (body.status === 'done' ? 'complete' : 'reopen')
      : 'edit'
    
    await db.taskHistory.create({
      data: {
        taskId: updatedTask.id,
        type: historyType,
        meta: JSON.stringify(body),
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const taskId = params.id

    // Check if task exists
    const existingTask = await db.task.findUnique({
      where: { id: taskId },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user owns this task
    if (existingTask.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the task (cascades will handle related records)
    await db.task.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}