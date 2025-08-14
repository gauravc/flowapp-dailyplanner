import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDate } from '@/lib/dates'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Prepare update data
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.positionIndex !== undefined) updateData.positionIndex = body.positionIndex
    
    if (body.scheduledFor !== undefined) {
      updateData.scheduledFor = typeof body.scheduledFor === 'string' 
        ? parseDate(body.scheduledFor) 
        : body.scheduledFor
    }
    
    if (body.dueDate !== undefined) {
      console.log('Processing dueDate:', body.dueDate)
      
      // When sent via fetch, Date objects become strings, so we need to handle both cases
      if (body.dueDate && typeof body.dueDate === 'string') {
        // Try to parse the string to a Date
        // HTML date inputs return YYYY-MM-DD format, which should work with Date constructor
        const parsedDate = new Date(body.dueDate + 'T00:00:00.000Z')
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
      console.log('Invalid date detected, setting to null')
      updateData.dueDate = null
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