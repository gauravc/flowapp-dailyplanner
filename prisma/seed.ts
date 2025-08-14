import { PrismaClient } from '@prisma/client'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'demo@flowapp.com' },
    update: {},
    create: {
      id: 'user_1',
      email: 'demo@flowapp.com',
      timezone: 'America/New_York',
    },
  })

  console.log('👤 Created user:', user.email)

  // Create some tags
  const workTag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: 'work' } },
    update: {},
    create: {
      userId: user.id,
      name: 'work',
    },
  })

  const personalTag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: 'personal' } },
    update: {},
    create: {
      userId: user.id,
      name: 'personal',
    },
  })

  const urgentTag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: 'urgent' } },
    update: {},
    create: {
      userId: user.id,
      name: 'urgent',
    },
  })

  console.log('🏷️ Created tags: work, personal, urgent')

  // Generate tasks for the past 7 days and next 7 days (14 days total)
  const today = new Date()
  const tasks = []

  for (let i = -7; i <= 7; i++) {
    const date = addDays(today, i)
    const isToday = i === 0
    const isPast = i < 0
    const isFuture = i > 0

    // Create 2-4 tasks per day
    const numTasks = Math.floor(Math.random() * 3) + 2

    for (let j = 0; j < numTasks; j++) {
      const taskTemplates = [
        { title: 'Review project proposal', priority: 'A', tags: [workTag] },
        { title: 'Call dentist for appointment', priority: 'B', tags: [personalTag] },
        { title: 'Prepare presentation slides', priority: 'A', tags: [workTag] },
        { title: 'Buy groceries', priority: 'C', tags: [personalTag] },
        { title: 'Fix bug in user authentication', priority: 'A', tags: [workTag, urgentTag] },
        { title: 'Schedule team meeting', priority: 'B', tags: [workTag] },
        { title: 'Update resume', priority: 'C', tags: [personalTag] },
        { title: 'Plan weekend trip', priority: 'C', tags: [personalTag] },
        { title: 'Send quarterly report', priority: 'A', tags: [workTag] },
        { title: 'Exercise for 30 minutes', priority: 'B', tags: [personalTag] },
        { title: 'Read chapter 3 of ML book', priority: 'C', tags: [personalTag] },
        { title: 'Deploy hotfix to production', priority: 'A', tags: [workTag, urgentTag] },
        { title: 'Water plants', priority: 'C', tags: [personalTag] },
        { title: 'Review code PR #123', priority: 'B', tags: [workTag] },
        { title: 'Book flight tickets', priority: 'B', tags: [personalTag] },
      ]

      const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)]
      
      // Some past tasks should be completed
      const isCompleted = isPast && Math.random() > 0.3

      // Some tasks have due dates
      const hasDueDate = Math.random() > 0.6
      const dueDate = hasDueDate ? addDays(date, Math.floor(Math.random() * 5) + 1) : null

      // Some tasks have descriptions
      const hasDescription = Math.random() > 0.7
      const description = hasDescription ? 'Additional details about this task...' : null

      const task = await prisma.task.create({
        data: {
          userId: user.id,
          title: template.title,
          description,
          status: isCompleted ? 'done' : 'open',
          priority: template.priority,
          scheduledFor: date,
          dueDate,
          positionIndex: j,
          rolloverCount: isPast && !isCompleted ? Math.floor(Math.random() * 3) : 0,
        },
      })

      // Add tags to task
      for (const tag of template.tags) {
        await prisma.taskTag.create({
          data: {
            taskId: task.id,
            tagId: tag.id,
          },
        })
      }

      // Create task history
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          type: 'create',
          meta: JSON.stringify({ scheduledFor: date.toISOString() }),
        },
      })

      if (isCompleted) {
        await prisma.taskHistory.create({
          data: {
            taskId: task.id,
            type: 'complete',
            at: addDays(date, Math.floor(Math.random() * 1)),
          },
        })
      }

      tasks.push(task)
    }

    // Add notes for some days
    if (Math.random() > 0.5) {
      const noteContents = [
        'Had a productive day working on the new feature. Team collaboration was excellent.',
        'Feeling a bit overwhelmed with deadlines. Need to prioritize better tomorrow.',
        'Great meeting with the client today. They loved the prototype!',
        'Reminder: Follow up on the budget approval by Friday.',
        'Personal note: Remember to call mom this weekend.',
        'Team retrospective went well. Key takeaway: improve our code review process.',
        'Market research shows positive trends. Worth exploring further.',
        'Need to schedule 1:1s with team members next week.',
      ]

      await prisma.dayNote.create({
        data: {
          userId: user.id,
          date,
          contentText: noteContents[Math.floor(Math.random() * noteContents.length)],
        },
      })
    }
  }

  console.log(`✅ Created ${tasks.length} tasks across 14 days`)

  // Create some rollover history for demonstration
  const yesterdayTasks = tasks.filter(t => 
    t.scheduledFor.toDateString() === subDays(today, 1).toDateString() &&
    t.status === 'open'
  )

  for (const task of yesterdayTasks.slice(0, 2)) {
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        type: 'rollover',
        meta: JSON.stringify({
          from: subDays(today, 2).toISOString().split('T')[0],
          to: subDays(today, 1).toISOString().split('T')[0],
          rolloverCount: 1,
        }),
      },
    })
  }

  console.log('🔄 Created rollover history examples')
  console.log('🎉 Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })