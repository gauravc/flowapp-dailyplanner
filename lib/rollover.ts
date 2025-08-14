import { db } from './db'
import { formatDate, getLocalMidnight, subtractDaysFromDate } from './dates'

export interface RolloverResult {
  userId: string
  tasksRolled: number
  fromDate: string
  toDate: string
}

export async function rolloverTasksForUser(userId: string, timezone: string): Promise<RolloverResult> {
  const today = getLocalMidnight(timezone)
  const yesterday = subtractDaysFromDate(today, 1)
  
  const todayString = formatDate(today)
  const yesterdayString = formatDate(yesterday)
  
  // Find tasks that need to be rolled over
  const tasksToRoll = await db.task.findMany({
    where: {
      userId,
      status: 'open',
      scheduledFor: yesterday,
    },
  })
  
  let rolledCount = 0
  
  // Use a transaction to ensure consistency
  await db.$transaction(async (tx) => {
    for (const task of tasksToRoll) {
      // Check if already rolled over (idempotency)
      const existingRollover = await tx.taskHistory.findFirst({
        where: {
          taskId: task.id,
          type: 'rollover',
          meta: {
            contains: `"to":"${todayString}"`
          }
        }
      })
      
      if (existingRollover) {
        continue // Skip if already rolled over
      }
      
      // Update task
      await tx.task.update({
        where: { id: task.id },
        data: {
          scheduledFor: today,
          rolloverCount: {
            increment: 1
          }
        }
      })
      
      // Create history record
      await tx.taskHistory.create({
        data: {
          taskId: task.id,
          type: 'rollover',
          meta: JSON.stringify({
            from: yesterdayString,
            to: todayString,
            rolloverCount: task.rolloverCount + 1
          })
        }
      })
      
      rolledCount++
    }
  })
  
  return {
    userId,
    tasksRolled: rolledCount,
    fromDate: yesterdayString,
    toDate: todayString
  }
}

export async function performRolloverForAllUsers(): Promise<RolloverResult[]> {
  // Get all users with their timezones
  const users = await db.user.findMany({
    select: {
      id: true,
      timezone: true
    }
  })
  
  const results: RolloverResult[] = []
  
  for (const user of users) {
    try {
      const result = await rolloverTasksForUser(user.id, user.timezone)
      results.push(result)
    } catch (error) {
      console.error(`Failed to rollover tasks for user ${user.id}:`, error)
    }
  }
  
  return results
}

export async function backfillRollovers(userId: string, timezone: string, daysMissed: number): Promise<RolloverResult[]> {
  const results: RolloverResult[] = []
  
  for (let i = daysMissed; i > 0; i--) {
    const targetDate = subtractDaysFromDate(getLocalMidnight(timezone), i - 1)
    const previousDate = subtractDaysFromDate(targetDate, 1)
    
    // Manually rollover for this specific date
    const tasksToRoll = await db.task.findMany({
      where: {
        userId,
        status: 'open',
        scheduledFor: previousDate,
      },
    })
    
    let rolledCount = 0
    
    await db.$transaction(async (tx) => {
      for (const task of tasksToRoll) {
        const targetDateString = formatDate(targetDate)
        
        // Check idempotency
        const existingRollover = await tx.taskHistory.findFirst({
          where: {
            taskId: task.id,
            type: 'rollover',
            meta: {
              contains: `"to":"${targetDateString}"`
            }
          }
        })
        
        if (existingRollover) continue
        
        await tx.task.update({
          where: { id: task.id },
          data: {
            scheduledFor: targetDate,
            rolloverCount: { increment: 1 }
          }
        })
        
        await tx.taskHistory.create({
          data: {
            taskId: task.id,
            type: 'rollover',
            meta: JSON.stringify({
              from: formatDate(previousDate),
              to: targetDateString,
              rolloverCount: task.rolloverCount + 1,
              backfill: true
            })
          }
        })
        
        rolledCount++
      }
    })
    
    results.push({
      userId,
      tasksRolled: rolledCount,
      fromDate: formatDate(previousDate),
      toDate: formatDate(targetDate)
    })
  }
  
  return results
}