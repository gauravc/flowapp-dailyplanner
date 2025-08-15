import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test environment variables
    const envVars = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      databaseUrl: process.env.DATABASE_URL ? '***SET***' : 'NOT SET',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? '***SET***' : 'NOT SET',
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET'
    }

    // Test database connection
    let dbTest = 'Not attempted'
    try {
      await prisma.$connect()
      dbTest = 'Connected successfully'
      await prisma.$disconnect()
    } catch (dbError) {
      dbTest = `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envVars,
      databaseTest: dbTest
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
