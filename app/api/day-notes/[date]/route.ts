import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseDate } from '@/lib/dates'

export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { contentText } = body
    const date = parseDate(params.date)
    const userId = session.user.id

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