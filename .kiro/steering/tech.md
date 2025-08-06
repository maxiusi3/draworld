# Technology Stack & Build System

## Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development and production builds)
- **Styling**: TailwindCSS with custom theme for brand colors
- **Routing**: React Router DOM v6
- **State Management**: React Context (useAuth hook)
- **UI Components**: Radix UI primitives + custom components
- **Form Handling**: React Hook Form with Zod validation
- **Image Processing**: React Image Crop, React Dropzone, html2canvas
- **Icons**: Heroicons, Lucide React

## Backend Stack
- **Platform**: Firebase (Google Cloud)
- **Authentication**: Firebase Auth (email + Google OAuth)
- **Database**: Firestore (NoSQL document database)
- **Storage**: Firebase Storage (file uploads)
- **Functions**: Firebase Cloud Functions (Node.js 18)
- **Hosting**: Firebase Hosting
- **AI Service**: Dreamina API (ByteDance) for image-to-video generation

## Development Tools
- **Package Manager**: pnpm (preferred over npm/yarn)
- **TypeScript**: Strict mode enabled with path aliases (@/* -> src/*)
- **Linting**: ESLint with React and TypeScript rules
- **Testing**: Jest + React Testing Library + Playwright (E2E)
- **Code Quality**: Coverage thresholds set at 50%

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start Firebase emulators
firebase emulators:start

# Build and watch Functions
cd functions && npm run build:watch
```

### Testing
```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Building & Deployment
```bash
# Build for production
pnpm build

# Build Functions
cd functions && npm run build

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
```

### Code Quality
```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check
```

## Configuration Notes
- **Path Aliases**: Use `@/` for src imports (configured in tsconfig.json and vite.config.ts)
- **Environment**: Firebase config is in src/config/firebase.ts
- **Styling**: Custom Tailwind theme with brand colors (cream, sky, warm, rose palettes)
- **Functions Config**: Use `firebase functions:config:set` for API keys
- **Build Modes**: `BUILD_MODE=prod` for production builds (disables source info plugin)