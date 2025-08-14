# FlowApp Daily Planner - Deployment Guide

## Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation Steps

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd flowapp-dailyplanner
   npm install
   ```

2. **Set up the database**
   ```bash
   # Initialize the database
   npx prisma db push
   
   # Seed with sample data
   npm run db:seed
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

### Important Notes for Production

⚠️ **Database Configuration Required**: This app currently uses SQLite which cannot be deployed to Vercel. For production deployment, you need to:

1. **Update Prisma Schema**: Change from SQLite to a cloud database (PostgreSQL, MySQL, etc.)
2. **Update Environment Variables**: Set `DATABASE_URL` in Vercel dashboard
3. **Update Database Configuration**: Modify `lib/db.ts` for production

### Deployment Steps

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect repository in Vercel dashboard
   - Set environment variables

2. **Required Environment Variables**
   ```env
   DATABASE_URL="your-production-database-url"
   NODE_ENV="production"
   ```

3. **Database Migration**
   ```bash
   npx prisma db push --accept-data-loss
   npx prisma generate
   ```

### Current Configuration Files

- ✅ `next.config.js` - Next.js configuration
- ✅ `tailwind.config.js` - Tailwind CSS configuration  
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `prisma/schema.prisma` - Database schema

### Build Commands

- `npm run build` - Production build
- `npm run dev` - Development server
- `npm run lint` - Code linting
- `npm run db:push` - Database schema push
- `npm run db:seed` - Seed database with sample data

## Issues Fixed

1. ✅ Fixed naming conflicts in components (Badge, Label)
2. ✅ Corrected file naming conventions (next.config.js, tailwind.config.js, postcss.config.js)
3. ✅ Fixed Prisma schema file extension
4. ✅ Removed invalid @radix-ui/react-textarea dependency
5. ✅ Fixed unescaped HTML entities in components
6. ✅ Fixed Prisma search API TypeScript errors
7. ✅ Database setup and seeding working

## Current Status

- ✅ **Local Development**: Fully functional
- ✅ **Build Process**: Successful compilation
- ✅ **Database**: SQLite working locally
- ⚠️ **Vercel Deployment**: Requires database migration to cloud database
- ✅ **Code Quality**: ESLint passing with minor warnings
- ✅ **Dependencies**: All packages installed and compatible

## Next Steps for Production

1. Migrate from SQLite to PostgreSQL/MySQL
2. Update Prisma schema for production database
3. Configure environment variables in Vercel
4. Test production deployment
5. Set up database backups and monitoring
