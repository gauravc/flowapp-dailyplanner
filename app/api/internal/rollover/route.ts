import { NextRequest, NextResponse } from 'next/server'
import { performRolloverForAllUsers } from '@/lib/rollover'

export async function POST(request: NextRequest) {
  try {
    // This endpoint would typically be called by a cron job
    // In a real application, you'd want to add authentication/authorization
    
    const results = await performRolloverForAllUsers()
    
    const totalTasksRolled = results.reduce((sum, result) => sum + result.tasksRolled, 0)
    
    console.log(`Rollover completed: ${totalTasksRolled} tasks rolled for ${results.length} users`)
    
    return NextResponse.json({
      success: true,
      usersProcessed: results.length,
      totalTasksRolled,
      results,
    })
  } catch (error) {
    console.error('Rollover failed:', error)
    return NextResponse.json(
      { error: 'Rollover failed' },
      { status: 500 }
    )
  }
}