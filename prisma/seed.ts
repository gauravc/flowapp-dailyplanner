import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })
  
  if (!existingUser) {
    console.log('👤 Creating test user...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      },
    })
    
    console.log('✅ Test user created:', testUser.email)
  } else {
    console.log('👤 Test user already exists:', existingUser.email)
  }
  
  console.log('🚀 Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })