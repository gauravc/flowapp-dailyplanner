import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseDate } from '@/lib/dates'

export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const body = await request.json()
    const { contentText, userId } = body
    const date = parseDate(params.date)

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Upsert the note
    const note = await db.dayNote.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        contentText,
      },
      create: {
        userId,
        date,
        contentText,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error saving note:', error)
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    )
  }
}