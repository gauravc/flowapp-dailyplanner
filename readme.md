# FlowApp Daily Planner

A beautiful, minimalist daily planner app built with Next.js, React, and Prisma.

## 🚀 Quick Start

### Local Development (SQLite)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flowapp-dailyplanner.git
   cd flowapp-dailyplanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up local environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local settings
   ```

4. **Start local development with SQLite**
   ```bash
   npm run dev:local
   ```

5. **Set up local database**
   ```bash
   npm run db:push:local
   npm run db:seed
   ```

### Production Deployment (PostgreSQL)

1. **Set environment variables on Vercel:**
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=your_random_secret_key
   NEXTAUTH_URL=https://your-app-url.vercel.app
   ```

2. **Deploy to Vercel:**
   - Push to main branch
   - Vercel will automatically build and deploy
   - The production schema uses PostgreSQL

## 🔧 Database Setup

- **Local**: Uses SQLite (`prisma/schema.local.prisma`)
- **Production**: Uses PostgreSQL (`prisma/schema.prisma`)

## 📱 Features

- **Mobile-First Design**: Responsive layout with touch gestures
- **Day-by-Day Navigation**: Smooth sliding between days on mobile
- **Week View**: Full 7-day grid on desktop
- **Task Management**: Create, edit, and organize tasks
- **Notes Panel**: Daily notes for each day
- **User Authentication**: Secure login/signup system
- **Drag & Drop**: Reorder tasks (desktop)
- **Search**: Find tasks by text or tags