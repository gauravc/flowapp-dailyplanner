import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDate } from '@/lib/dates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      scheduledFor, 
      dueDate, 
      priority, 
      tags, 
      userId 
    } = body

    if (!title || !scheduledFor || !userId) {
      return NextResponse.json(
        { error: 'Title, scheduledFor, and userId are required' },
        { status: 400 }
      )
    }

    // Get the highest position index for this day
    const maxPosition = await db.task.aggregate({
      where: {
        userId,
        scheduledFor: parseDate(scheduledFor),
      },
      _max: {
        positionIndex: true,
      },
    })

    const positionIndex = (maxPosition._max.positionIndex ?? -1) + 1

    // Create the task
    const task = await db.task.create({
      data: {
        userId,
        title,
        description: description || null,
        scheduledFor: parseDate(scheduledFor),
        dueDate: dueDate ? parseDate(dueDate) : null,
        priority: priority || null,
        positionIndex,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Handle tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const cleanTagName = tagName.trim().toLowerCase()
        if (cleanTagName) {
          // Find or create tag
          let tag = await db.tag.findFirst({
            where: {
              userId,
              name: cleanTagName,
            },
          })

          if (!tag) {
            tag = await db.tag.create({
              data: {
                userId,
                name: cleanTagName,
              },
            })
          }

          // Link task to tag
          await db.taskTag.create({
            data: {
              taskId: task.id,
              tagId: tag.id,
            },
          })
        }
      }

      // Refetch task with tags
      const taskWithTags = await db.task.findUnique({
        where: { id: task.id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })

      return NextResponse.json(taskWithTags)
    }

    // Create task history
    await db.taskHistory.create({
      data: {
        taskId: task.id,
        type: 'create',
        meta: JSON.stringify({ scheduledFor }),
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}