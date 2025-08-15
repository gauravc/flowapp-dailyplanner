import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setupDatabase() {
  console.log('🚀 Starting database setup...')

  // Test connection
  await prisma.$connect()
  console.log('✅ Database connected')

  // Check if tables exist by trying to query them
  try {
    await prisma.user.findMany({ take: 1 })
    console.log('✅ User table exists')
  } catch (error) {
    console.log('❌ User table does not exist, creating schema...')
    // This will fail if schema doesn't exist, which is expected
  }

  // Create test user if it doesn't exist
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })

  if (!existingUser) {
    console.log('👤 Creating test user...')
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        timezone: 'UTC'
      }
    })
    console.log('✅ Test user created:', user.email)
  } else {
    console.log('ℹ️ Test user already exists:', existingUser.email)
  }

  // Test a simple query
  const userCount = await prisma.user.count()
  console.log(`📊 Total users in database: ${userCount}`)

  await prisma.$disconnect()

  return {
    success: true,
    message: 'Database setup completed successfully',
    userCount,
    timestamp: new Date().toISOString()
  }
}

export async function GET() {
  try {
    const result = await setupDatabase()
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Database setup error:', error)
    
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Failed to disconnect:', disconnectError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const result = await setupDatabase()
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Database setup error:', error)
    
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Failed to disconnect:', disconnectError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
