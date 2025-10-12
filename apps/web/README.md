# @ai-cleanup/web

Next.js 14 web application for AI-powered file deduplication.

## Features

- 🔐 **Authentication** - Login with test credentials
- 📤 **File Upload** - Drag-and-drop interface with progress tracking
- 🔍 **Smart Detection** - AI-powered duplicate detection
- 📊 **Review Interface** - Browse and select duplicates to remove
- 💾 **ZIP Export** - Download cleaned files as a single archive

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** @ai-cleanup/ui (shadcn/ui based)
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Backend API running on `http://localhost:3001`

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=AI File Cleanup
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### Development

```bash
# Install dependencies (from project root)
pnpm install

# Start development server
pnpm --filter @ai-cleanup/web dev

# Open http://localhost:3000
```

### Building

```bash
# Build for production
pnpm --filter @ai-cleanup/web build

# Start production server
pnpm --filter @ai-cleanup/web start
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Homepage (redirects to /upload)
│   │   ├── login/              # Login page
│   │   ├── upload/             # File upload page
│   │   └── review/             # Duplicate review page
│   ├── components/             # React components
│   │   └── header.tsx          # Navigation header
│   ├── lib/                    # Utilities
│   │   ├── api-client.ts       # API client wrapper
│   │   └── store.ts            # Zustand stores
│   └── app/globals.css         # Global styles
├── public/                     # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Pages

### `/login`
- Email/password authentication
- Test credentials displayed
- Redirects to `/upload` on success

### `/upload`
- Drag-and-drop file upload
- Multiple file selection
- Progress tracking
- Supported formats: images, PDFs, text files
- Max file size: 10MB per file

### `/review`
- View duplicate groups
- Select files for removal
- Statistics dashboard (groups, duplicates, space saved)
- Quick actions (select all, deselect all)
- Download cleaned files as ZIP

## API Integration

The app connects to the backend API at `NEXT_PUBLIC_API_URL` with the following endpoints:

- `POST /auth/login` - User authentication
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `POST /dedupe/preview` - Upload files and get duplicates
- `POST /dedupe/zip` - Download cleaned files

## State Management

### Auth Store
- User authentication state
- Login/logout actions
- Persisted in memory (not localStorage for security)

### Upload Store
- Current upload ID
- Uploaded files list
- Selected files for removal
- File selection actions

## Features

### Authentication
- Simple email/password login
- Session-based (HTTP-only cookies)
- Test credentials for demo

### File Upload
- Drag-and-drop or click to browse
- Multiple file selection
- File type validation
- Size validation (10MB max)
- Upload progress tracking
- Visual feedback

### Duplicate Review
- Grouped duplicate display
- Expandable accordion groups
- File details (name, size, type, hash)
- Visual distinction (keep vs remove)
- Batch selection
- Download as ZIP

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel deploy

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://your-api.com
```

### Docker
```bash
# Build Docker image
docker build -t ai-cleanup-web .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  ai-cleanup-web
```

## Test Credentials

For development and testing:

- **Email:** test@example.com
- **Password:** password123

Additional test users (if seeded):
- demo@example.com / demo123
- admin@example.com / admin123

## Development Notes

### TypeScript
- Strict mode enabled
- All components fully typed
- API responses validated

### Styling
- Tailwind CSS utility-first approach
- Dark mode support (via class toggle)
- Responsive design (mobile-first)
- Consistent spacing and colors

### Performance
- Static generation where possible
- Image optimization (Next.js)
- Code splitting (automatic)
- React Query caching

## Troubleshooting

### Module not found errors
```bash
# Rebuild UI package
pnpm --filter @ai-cleanup/ui build

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
pnpm install
```

### API connection issues
- Ensure backend API is running
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS settings in API

### Build errors
```bash
# Check TypeScript errors
pnpm --filter @ai-cleanup/web typecheck

# Check ESLint
pnpm --filter @ai-cleanup/web lint
```

## License

Private - Part of AI File Cleanup System

