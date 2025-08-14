# FlowApp Daily Planner

A TeuxDeux-style daily planner with Franklin-Covey task rollover, built with Next.js, React, Tailwind CSS, and Prisma.

## Features

- 🗓️ **Horizontal Day Columns**: TeuxDeux-inspired weekly view with Today centered
- ✅ **Task Management**: Create, complete, edit, and delete tasks with drag & drop
- 🔄 **Auto-Rollover**: Incomplete tasks automatically move to the next day at local midnight
- 🏷️ **Tags & Priority**: Organize tasks with tags (A/B/C priority system)
- 📝 **Daily Notes**: Expandable notes panel for each day with auto-save
- 🔍 **Global Search**: Search across all tasks and notes with date navigation
- ⌨️ **Keyboard Shortcuts**: Fast navigation and actions
- 📱 **Responsive**: Works on desktop and mobile
- ♿ **Accessible**: ARIA labels and keyboard navigation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Drag & Drop**: @dnd-kit
- **Date Handling**: date-fns
- **Deployment**: Vercel (with Cron jobs for rollover)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flowapp-daily-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Initialize the database
   npx prisma db push
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Management

### Prisma Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Reset database (careful!)
npx prisma db push --force-reset

# Generate Prisma client (if needed)
npx prisma generate

# Re-seed the database
npm run db:seed
```

### Database Schema

The app uses SQLite with the following main models:

- **User**: Basic user info with timezone
- **Task**: Tasks with status, priority, dates, tags
- **Tag**: User-specific tags for organization
- **DayNote**: Free-form notes per day
- **TaskHistory**: Audit trail for task changes

## Keyboard Shortcuts

- `/` - Open global search
- `n` - Toggle today's notes panel
- `c` - Toggle completed tasks visibility
- `[` / `]` - Navigate to previous/next week
- `Escape` - Close modals/search
- `Enter` - Create task or search
- `Ctrl/Cmd + Enter` - Save task edits

## API Endpoints

### Tasks
- `GET /api/days?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get days with tasks & notes
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Notes
- `PUT /api/day-notes/[date]` - Save/update day notes

### Search
- `GET /api/search?q=query` - Search tasks and notes

### Rollover (Internal)
- `POST /api/internal/rollover` - Manual rollover trigger

## Franklin-Covey Rollover System

The app implements automatic task rollover:

1. **Scheduled Job**: Runs daily at 00:05 local time for each user timezone
2. **Idempotent**: Safe to run multiple times
3. **Backfill**: Catches up on missed rollovers when user returns
4. **Audit Trail**: Maintains history of all rollover operations

### Rollover Logic

```typescript
// At midnight for each timezone:
// 1. Find incomplete tasks from yesterday
// 2. Move to today with rollover count increment
// 3. Create history record
// 4. Handle idempotency to prevent duplicates
```

## Deployment

### Vercel Deployment

1. **Push to GitHub/GitLab**

2. **Connect to Vercel**
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Environment Setup**
   - Database will be created automatically with Prisma
   - Vercel Cron will handle rollover jobs

4. **Post-deployment**
   ```bash
   # SSH into Vercel or use Vercel CLI to seed
   vercel env pull .env.local
   npx prisma db seed
   ```

### Vercel Cron Configuration

The `vercel.json` file configures automatic rollover:

```json
{
  "crons": [
    {
      "path": "/api/internal/rollover",
      "schedule": "5 0 * * *"
    }
  ]
}
```

This runs the rollover job at 00:05 UTC daily. The job handles timezone-specific rollover internally.

### Environment Variables

No additional environment variables needed for basic deployment. Prisma will use the default SQLite database.

For production, consider:

```bash
# Optional: Custom database URL
DATABASE_URL="file:./prod.db"

# Optional: Different timezone default
DEFAULT_TIMEZONE="America/New_York"
```

## Development

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── DayColumn.tsx     # Day column component
│   ├── TaskItem.tsx      # Individual task
│   ├── QuickAdd.tsx      # Quick task creation
│   ├── Search.tsx        # Global search
│   └── NotesPanel.tsx    # Daily notes
├── lib/                   # Utility libraries
│   ├── db.ts             # Prisma client
│   ├── dates.ts          # Date utilities
│   ├── rollover.ts       # Rollover logic
│   └── utils.ts          # General utilities
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
└── public/               # Static assets
```

### Adding Features

1. **New Components**: Add to `components/` directory
2. **API Routes**: Add to `app/api/` directory
3. **Database Changes**: Update `prisma/schema.prisma` and run `npx prisma db push`
4. **Styling**: Use Tailwind classes and shadcn/ui components

### Testing

```bash
# Run type checking
npx tsc --noEmit

# Check for linting issues
npm run lint

# Test rollover functionality
curl -X POST http://localhost:3000/api/internal/rollover
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [TeuxDeux](https://teuxdeux.com/) for the horizontal day layout
- Franklin-Covey methodology for the rollover system
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Prisma](https://prisma.io/) for the amazing database toolkit

## Support

If you encounter any issues:

1. Check the [GitHub Issues](../../issues)
2. Review the console for error messages
3. Ensure your database is properly seeded
4. Verify all dependencies are installed correctly

---

Built with ❤️ using Next.js and modern web technologies.