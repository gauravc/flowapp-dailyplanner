import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const queryTrimmed = query.trim()
    const isTagSearch = queryTrimmed.startsWith('#')
    const searchTerm = isTagSearch ? queryTrimmed.substring(1) : queryTrimmed

    // Search tasks
    const tasks = await db.task.findMany({
      where: {
        userId: session.user.id,
        OR: isTagSearch ? [
          {
            tags: {
              some: {
                tag: {
                  name: { contains: searchTerm }
                }
              }
            }
          }
        ] : [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'desc',
      },
      take: 20,
    })

    // Search notes
    const notes = await db.dayNote.findMany({
      where: {
        userId: session.user.id,
        contentText: { contains: query.trim() },
      },
      orderBy: {
        date: 'desc',
      },
      take: 20,
    })

    // Format results
    const taskResults = tasks.map(task => ({
      id: task.id,
      type: 'task' as const,
      date: task.scheduledFor.toISOString().split('T')[0],
      content: task.title,
      snippet: task.description || task.title,
    }))

    const noteResults = notes.map(note => {
      // Create a snippet highlighting the search term
      const content = note.contentText
      const queryLower = query.toLowerCase()
      const contentLower = content.toLowerCase()
      const index = contentLower.indexOf(queryLower)
      
      let snippet = content
      if (index >= 0) {
        const start = Math.max(0, index - 50)
        const end = Math.min(content.length, index + query.length + 50)
        snippet = (start > 0 ? '...' : '') + 
                 content.slice(start, end) + 
                 (end < content.length ? '...' : '')
      }

      return {
        id: note.id,
        type: 'note' as const,
        date: note.date.toISOString().split('T')[0],
        content: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
        snippet,
      }
    })

    // Combine and sort results by date (most recent first)
    const allResults = [...taskResults, ...noteResults].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json({
      results: allResults.slice(0, 15), // Limit total results
    })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}